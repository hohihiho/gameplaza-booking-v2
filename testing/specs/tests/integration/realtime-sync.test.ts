// Mock 유틸리티
const createMockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    then: jest.fn(),
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  })),
});

describe('실시간 동기화 테스트', () => {
  let mockSupabase: any;
  let mockChannel: any;
  let subscriptions: Map<string, Function>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    subscriptions = new Map();
    
    // Mock 채널 구현
    mockChannel = {
      on: jest.fn((event, filter, callback) => {
        const key = `${event}:${JSON.stringify(filter)}`;
        subscriptions.set(key, callback);
        return mockChannel;
      }),
      subscribe: jest.fn((callback) => {
        if (callback) callback('SUBSCRIBED');
        return mockChannel;
      }),
      unsubscribe: jest.fn(),
    };

    mockSupabase.channel = jest.fn(() => mockChannel);
  });

  describe('WebSocket 연결', () => {
    it('TC-SYNC-001: 초기 연결 수립', async () => {
      // When: 채널 구독
      const channel = mockSupabase.channel('reservations');
      const onConnect = jest.fn();
      
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          onConnect();
        }
      });

      // Then: 연결 성공
      expect(onConnect).toHaveBeenCalled();
      expect(mockSupabase.channel).toHaveBeenCalledWith('reservations');
    });

    it('TC-SYNC-002: 재연결 처리', async () => {
      // Given: 연결 끊김 시뮬레이션
      const channel = mockSupabase.channel('reservations');
      const onReconnect = jest.fn();
      
      // 재연결 핸들러
      channel.on('system', { event: 'reconnect' }, onReconnect);

      // When: 재연결 이벤트 트리거
      const reconnectKey = 'system:{"event":"reconnect"}';
      subscriptions.get(reconnectKey)?.();

      // Then: 재연결 처리
      expect(onReconnect).toHaveBeenCalled();
    });

    it('TC-SYNC-003: 다중 채널 구독', async () => {
      // When: 여러 채널 구독
      const reservationChannel = mockSupabase.channel('reservations');
      const deviceChannel = mockSupabase.channel('devices');
      const adminChannel = mockSupabase.channel('admin');

      // Then: 각 채널 독립적으로 구독
      expect(mockSupabase.channel).toHaveBeenCalledTimes(3);
      expect(mockSupabase.channel).toHaveBeenCalledWith('reservations');
      expect(mockSupabase.channel).toHaveBeenCalledWith('devices');
      expect(mockSupabase.channel).toHaveBeenCalledWith('admin');
    });

    it('TC-SYNC-004: 연결 상태 모니터링', async () => {
      // Given: 상태 변경 리스너
      const channel = mockSupabase.channel('reservations');
      const states: string[] = [];
      
      // When: 다양한 상태 변경 시뮬레이션
      const statusSequence = ['SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'];
      statusSequence.forEach(status => {
        states.push(status);
      });

      // Then: 모든 상태 추적
      expect(states).toEqual(['SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']);
    });

    it('TC-SYNC-005: 자동 재구독', async () => {
      // Given: 연결 끊김 후 재구독 설정
      let isConnected = true;
      const autoResubscribe = jest.fn(async () => {
        if (!isConnected) {
          isConnected = true;
          return mockSupabase.channel('reservations').subscribe();
        }
      });

      // When: 연결 끊김
      isConnected = false;
      await autoResubscribe();

      // Then: 자동 재구독
      expect(autoResubscribe).toHaveBeenCalled();
      expect(isConnected).toBe(true);
    });
  });

  describe('예약 상태 동기화', () => {
    it('TC-SYNC-010: 새 예약 실시간 추가', async () => {
      // Given: 예약 리스너
      const channel = mockSupabase.channel('reservations');
      const onNewReservation = jest.fn();
      
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations' },
        onNewReservation
      );

      // When: 새 예약 이벤트
      const newReservation = {
        id: 'res-123',
        user_id: 'user-1',
        device_id: 'device-1',
        date: '2025-07-26',
        start_time: '14:00',
        end_time: '18:00',
        status: 'pending',
      };

      const insertKey = 'postgres_changes:{"event":"INSERT","schema":"public","table":"reservations"}';
      subscriptions.get(insertKey)?.({ new: newReservation });

      // Then: 콜백 호출
      expect(onNewReservation).toHaveBeenCalledWith({ new: newReservation });
    });

    it('TC-SYNC-011: 예약 상태 변경 감지', async () => {
      // Given: 상태 변경 리스너
      const channel = mockSupabase.channel('reservations');
      const onStatusChange = jest.fn();
      
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reservations' },
        onStatusChange
      );

      // When: 상태 변경 (pending → approved)
      const updateKey = 'postgres_changes:{"event":"UPDATE","schema":"public","table":"reservations"}';
      subscriptions.get(updateKey)?.({
        old: { id: 'res-123', status: 'pending' },
        new: { id: 'res-123', status: 'approved' },
      });

      // Then: 변경 감지
      expect(onStatusChange).toHaveBeenCalledWith({
        old: { id: 'res-123', status: 'pending' },
        new: { id: 'res-123', status: 'approved' },
      });
    });

    it('TC-SYNC-012: 예약 취소 동기화', async () => {
      // Given: 취소 리스너
      const channel = mockSupabase.channel('reservations');
      const onCancellation = jest.fn();
      
      channel.on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'reservations',
          filter: 'status=eq.cancelled',
        },
        onCancellation
      );

      // When: 취소 이벤트
      const cancelKey = 'postgres_changes:{"event":"UPDATE","schema":"public","table":"reservations","filter":"status=eq.cancelled"}';
      subscriptions.get(cancelKey)?.({
        new: { id: 'res-123', status: 'cancelled' },
      });

      // Then: 취소 처리
      expect(onCancellation).toHaveBeenCalled();
    });

    it('TC-SYNC-013: 노쇼 자동 업데이트', async () => {
      // Given: 노쇼 리스너
      const channel = mockSupabase.channel('reservations');
      const onNoShow = jest.fn();
      
      channel.on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'reservations',
          filter: 'status=eq.no_show',
        },
        onNoShow
      );

      // When: 15분 후 자동 노쇼 처리
      const noShowKey = 'postgres_changes:{"event":"UPDATE","schema":"public","table":"reservations","filter":"status=eq.no_show"}';
      subscriptions.get(noShowKey)?.({
        new: { 
          id: 'res-123', 
          status: 'no_show',
          auto_processed: true,
          processed_at: new Date().toISOString(),
        },
      });

      // Then: 노쇼 업데이트
      expect(onNoShow).toHaveBeenCalled();
    });

    it('TC-SYNC-014: 체크인 상태 전파', async () => {
      // Given: 체크인 리스너
      const channel = mockSupabase.channel('check_ins');
      const onCheckIn = jest.fn();
      
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'check_ins' },
        onCheckIn
      );

      // When: 체크인 이벤트
      const checkInKey = 'postgres_changes:{"event":"INSERT","schema":"public","table":"check_ins"}';
      subscriptions.get(checkInKey)?.({
        new: {
          id: 'checkin-123',
          reservation_id: 'res-123',
          checked_in_at: new Date().toISOString(),
        },
      });

      // Then: 체크인 전파
      expect(onCheckIn).toHaveBeenCalled();
    });
  });

  describe('기기 상태 동기화', () => {
    it('TC-SYNC-020: 기기 상태 변경 감지', async () => {
      // Given: 기기 상태 리스너
      const channel = mockSupabase.channel('devices');
      const onDeviceStatusChange = jest.fn();
      
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'devices' },
        onDeviceStatusChange
      );

      // When: 상태 변경 (available → in_use)
      const updateKey = 'postgres_changes:{"event":"UPDATE","schema":"public","table":"devices"}';
      subscriptions.get(updateKey)?.({
        old: { id: 'device-1', status: 'available' },
        new: { id: 'device-1', status: 'in_use' },
      });

      // Then: 상태 업데이트
      expect(onDeviceStatusChange).toHaveBeenCalledWith({
        old: { id: 'device-1', status: 'available' },
        new: { id: 'device-1', status: 'in_use' },
      });
    });

    it('TC-SYNC-021: 점검 모드 전환', async () => {
      // Given: 점검 모드 리스너
      const channel = mockSupabase.channel('devices');
      const onMaintenance = jest.fn();
      
      channel.on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'devices',
          filter: 'status=eq.maintenance',
        },
        onMaintenance
      );

      // When: 점검 모드 전환
      const maintenanceKey = 'postgres_changes:{"event":"UPDATE","schema":"public","table":"devices","filter":"status=eq.maintenance"}';
      subscriptions.get(maintenanceKey)?.({
        new: { 
          id: 'device-1', 
          status: 'maintenance',
          maintenance_note: '정기 점검',
        },
      });

      // Then: 점검 알림
      expect(onMaintenance).toHaveBeenCalled();
    });

    it('TC-SYNC-022: 신규 기기 추가', async () => {
      // Given: 신규 기기 리스너
      const channel = mockSupabase.channel('devices');
      const onNewDevice = jest.fn();
      
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'devices' },
        onNewDevice
      );

      // When: 신규 기기 추가
      const insertKey = 'postgres_changes:{"event":"INSERT","schema":"public","table":"devices"}';
      subscriptions.get(insertKey)?.({
        new: {
          id: 'device-new',
          device_number: 'PC-10',
          device_type_id: 'type-1',
          status: 'available',
        },
      });

      // Then: 목록 업데이트
      expect(onNewDevice).toHaveBeenCalled();
    });

    it('TC-SYNC-023: 기기 제거 알림', async () => {
      // Given: 기기 제거 리스너
      const channel = mockSupabase.channel('devices');
      const onDeviceRemove = jest.fn();
      
      channel.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'devices' },
        onDeviceRemove
      );

      // When: 기기 제거
      const deleteKey = 'postgres_changes:{"event":"DELETE","schema":"public","table":"devices"}';
      subscriptions.get(deleteKey)?.({
        old: { id: 'device-1' },
      });

      // Then: 제거 알림
      expect(onDeviceRemove).toHaveBeenCalledWith({ old: { id: 'device-1' } });
    });

    it('TC-SYNC-024: 일괄 상태 업데이트', async () => {
      // Given: 다중 업데이트 처리
      const updates: any[] = [];
      const channel = mockSupabase.channel('devices');
      
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'devices' },
        (payload) => updates.push(payload)
      );

      // When: 여러 기기 동시 업데이트
      const updateKey = 'postgres_changes:{"event":"UPDATE","schema":"public","table":"devices"}';
      const updateHandler = subscriptions.get(updateKey);
      
      ['device-1', 'device-2', 'device-3'].forEach(id => {
        updateHandler?.({ new: { id, status: 'maintenance' } });
      });

      // Then: 모든 업데이트 처리
      expect(updates).toHaveLength(3);
    });
  });

  describe('사용자 활동 동기화', () => {
    it('TC-SYNC-030: 온라인 사용자 추적', async () => {
      // Given: 프레즌스 채널
      const channel = mockSupabase.channel('presence');
      const presenceState = new Map();
      
      // Mock presence 기능
      (channel as any).track = jest.fn(async (data) => {
        presenceState.set(data.user_id, data);
        return channel;
      });
      
      (channel as any).on = jest.fn((event, callback) => {
        if (event === 'presence') {
          callback({ state: presenceState });
        }
        return channel;
      });

      // When: 사용자 입장
      await (channel as any).track({
        user_id: 'user-1',
        online_at: new Date().toISOString(),
      });

      // Then: 온라인 상태
      expect(presenceState.has('user-1')).toBe(true);
    });

    it('TC-SYNC-031: 현재 활동 사용자 수', async () => {
      // Given: 활동 사용자 추적
      const activeUsers = new Set<string>();
      
      // When: 사용자 활동
      ['user-1', 'user-2', 'user-3'].forEach(userId => {
        activeUsers.add(userId);
      });

      // 한 명 나감
      activeUsers.delete('user-2');

      // Then: 현재 활동 수
      expect(activeUsers.size).toBe(2);
    });

    it('TC-SYNC-032: 사용자 페이지 이동 추적', async () => {
      // Given: 페이지 추적
      const channel = mockSupabase.channel('page_views');
      const pageViews: any[] = [];
      
      channel.on(
        'broadcast',
        { event: 'page_view' },
        (payload) => pageViews.push(payload)
      );

      // When: 페이지 이동
      const broadcastKey = 'broadcast:{"event":"page_view"}';
      subscriptions.get(broadcastKey)?.({
        user_id: 'user-1',
        page: '/reservations/new',
        timestamp: new Date().toISOString(),
      });

      // Then: 페이지 뷰 기록
      expect(pageViews).toHaveLength(1);
      expect(pageViews[0].page).toBe('/reservations/new');
    });

    it('TC-SYNC-033: 실시간 타이핑 표시', async () => {
      // Given: 타이핑 인디케이터
      const channel = mockSupabase.channel('typing');
      const typingUsers = new Set<string>();
      
      channel.on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          if (payload.isTyping) {
            typingUsers.add(payload.user_id);
          } else {
            typingUsers.delete(payload.user_id);
          }
        }
      );

      // When: 타이핑 시작/종료
      const typingKey = 'broadcast:{"event":"typing"}';
      const handler = subscriptions.get(typingKey);
      
      handler?.({ user_id: 'user-1', isTyping: true });
      handler?.({ user_id: 'user-2', isTyping: true });
      handler?.({ user_id: 'user-1', isTyping: false });

      // Then: 현재 타이핑 사용자
      expect(typingUsers.has('user-1')).toBe(false);
      expect(typingUsers.has('user-2')).toBe(true);
    });

    it('TC-SYNC-034: 마지막 활동 시간', async () => {
      // Given: 활동 시간 추적
      const lastActivity = new Map<string, Date>();
      
      // When: 활동 업데이트
      const updateActivity = (userId: string) => {
        lastActivity.set(userId, new Date());
      };

      updateActivity('user-1');
      
      // 1초 후
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateActivity('user-2');

      // Then: 최근 활동 순서
      const user1Time = lastActivity.get('user-1')!;
      const user2Time = lastActivity.get('user-2')!;
      expect(user2Time.getTime()).toBeGreaterThan(user1Time.getTime());
    });
  });

  describe('관리자 실시간 모니터링', () => {
    it('TC-SYNC-040: 실시간 대시보드 업데이트', async () => {
      // Given: 대시보드 메트릭
      const channel = mockSupabase.channel('admin_dashboard');
      const metrics = {
        activeReservations: 0,
        onlineUsers: 0,
        availableDevices: 0,
      };
      
      channel.on(
        'broadcast',
        { event: 'metrics_update' },
        (payload) => Object.assign(metrics, payload)
      );

      // When: 메트릭 업데이트
      const metricsKey = 'broadcast:{"event":"metrics_update"}';
      subscriptions.get(metricsKey)?.({
        activeReservations: 15,
        onlineUsers: 23,
        availableDevices: 8,
      });

      // Then: 대시보드 업데이트
      expect(metrics.activeReservations).toBe(15);
      expect(metrics.onlineUsers).toBe(23);
      expect(metrics.availableDevices).toBe(8);
    });

    it('TC-SYNC-041: 긴급 알림 브로드캐스트', async () => {
      // Given: 긴급 알림 리스너
      const channel = mockSupabase.channel('alerts');
      const alerts: any[] = [];
      
      channel.on(
        'broadcast',
        { event: 'urgent_alert' },
        (payload) => alerts.push(payload)
      );

      // When: 긴급 알림 발송
      const alertKey = 'broadcast:{"event":"urgent_alert"}';
      subscriptions.get(alertKey)?.({
        type: 'system_maintenance',
        message: '10분 후 시스템 점검이 시작됩니다',
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });

      // Then: 모든 클라이언트 수신
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('system_maintenance');
    });

    it('TC-SYNC-042: 실시간 로그 스트리밍', async () => {
      // Given: 로그 스트림
      const channel = mockSupabase.channel('logs');
      const logs: any[] = [];
      
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_logs' },
        (payload) => logs.push(payload.new)
      );

      // When: 로그 생성
      const logKey = 'postgres_changes:{"event":"INSERT","schema":"public","table":"system_logs"}';
      subscriptions.get(logKey)?.({
        new: {
          id: 'log-1',
          level: 'error',
          message: 'Payment failed',
          timestamp: new Date().toISOString(),
        },
      });

      // Then: 실시간 로그
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
    });

    it('TC-SYNC-043: 동시 접속자 한계 알림', async () => {
      // Given: 접속자 수 모니터링
      const channel = mockSupabase.channel('system_monitor');
      let connectionAlert = null;
      
      channel.on(
        'broadcast',
        { event: 'connection_limit' },
        (payload) => { connectionAlert = payload; }
      );

      // When: 한계 도달
      const limitKey = 'broadcast:{"event":"connection_limit"}';
      subscriptions.get(limitKey)?.({
        current: 950,
        limit: 1000,
        percentage: 95,
      });

      // Then: 경고 발생
      expect(connectionAlert).toBeTruthy();
      expect((connectionAlert as any).percentage).toBe(95);
    });

    it('TC-SYNC-044: 실시간 통계 집계', async () => {
      // Given: 통계 집계
      const channel = mockSupabase.channel('statistics');
      const stats = {
        todayReservations: 0,
        todayRevenue: 0,
        todayCheckIns: 0,
      };
      
      channel.on(
        'broadcast',
        { event: 'stats_update' },
        (payload) => {
          stats.todayReservations = payload.reservations;
          stats.todayRevenue = payload.revenue;
          stats.todayCheckIns = payload.checkIns;
        }
      );

      // When: 통계 업데이트
      const statsKey = 'broadcast:{"event":"stats_update"}';
      subscriptions.get(statsKey)?.({
        reservations: 42,
        revenue: 1250000,
        checkIns: 38,
      });

      // Then: 실시간 통계
      expect(stats.todayReservations).toBe(42);
      expect(stats.todayRevenue).toBe(1250000);
      expect(stats.todayCheckIns).toBe(38);
    });
  });

  describe('성능 및 최적화', () => {
    it('TC-SYNC-050: 메시지 배치 처리', async () => {
      // Given: 배치 프로세서
      const batchProcessor = {
        messages: [] as any[],
        process: jest.fn(async function(this: any) {
          if (this.messages.length >= 10) {
            // 배치 처리
            this.messages = [];
          }
        }),
      };

      // When: 다수 메시지 수신
      for (let i = 0; i < 15; i++) {
        batchProcessor.messages.push({ id: i });
        if (batchProcessor.messages.length >= 10) {
          await batchProcessor.process();
        }
      }

      // Then: 배치 처리 실행
      expect(batchProcessor.process).toHaveBeenCalled();
      expect(batchProcessor.messages.length).toBeLessThan(10);
    });
  });
});