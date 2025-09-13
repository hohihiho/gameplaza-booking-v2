// 기기 상태 자동 관리 시스템
// 비전공자 설명: 사용자가 API를 호출할 때마다 자동으로 만료된 예약을 확인하고
// 기기 상태를 업데이트하는 시스템입니다. 크론잡 대신 사용자 액션으로 작동합니다.

import { createClient } from '@/lib/db';
import { createAdminClient } from '@/lib/db';

// 마지막 체크 시간을 메모리에 저장 (서버리스 환경에서는 재시작 시 초기화됨)
let lastCheckTime: number = 0;
const CHECK_INTERVAL = 60 * 1000; // 1분 (밀리초)

// 로그 인터페이스
interface StatusUpdateLog {
  timestamp: string;
  action: 'reservation_expired' | 'rental_started';
  reservation_id: string;
  device_id?: string;
  success: boolean;
  error?: string;
}

/**
 * 중복 체크 방지를 위한 함수
 * 1분 이내에 중복 실행되지 않도록 합니다
 */
function shouldSkipCheck(): boolean {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_INTERVAL) {
    return true; // 1분 이내이므로 스킵
  }
  lastCheckTime = now;
  return false;
}

/**
 * KST 시간 기준으로 현재 시간을 반환
 */
function getCurrentKSTTime(): Date {
  const now = new Date();
  // KST는 UTC+9
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return kstTime;
}

/**
 * 현재 시간을 HH:MM 형식으로 반환 (KST 기준)
 */
function getCurrentTimeString(): string {
  const now = getCurrentKSTTime();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (KST 기준)
 */
function getTodayDateString(): string {
  const now = getCurrentKSTTime();
  return now.toISOString().split('T')[0];
}

/**
 * 만료된 예약들을 완료 처리하고 기기 상태를 available로 변경
 */
async function processExpiredReservations(): Promise<StatusUpdateLog[]> {
  const logs: StatusUpdateLog[] = [];
  const supabase = createAdminClient();
  
  try {
    // 현재 KST 시간 기준으로 종료되어야 할 예약들 찾기
    const nowISO = getCurrentKSTTime().toISOString();
    
    const { data: expiredReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('id, device_id, status, end_time, date')
      .eq('status', 'checked_in')
      .lt('end_time', nowISO);
    
    if (fetchError) {
      console.error('Error fetching expired reservations:', fetchError);
      return logs;
    }
    
    // 각 만료된 예약 처리
    for (const reservation of expiredReservations || []) {
      const log: StatusUpdateLog = {
        timestamp: nowISO,
        action: 'reservation_expired',
        reservation_id: reservation.id,
        device_id: reservation.device_id,
        success: false
      };
      
      try {
        // 1. 예약 상태를 completed로 변경
        const { error: reservationError } = await supabase
          .from('reservations')
          .update({ 
            status: 'completed',
            updated_at: nowISO
          })
          .eq('id', reservation.id);
        
        if (reservationError) {
          log.error = `Failed to update reservation: ${reservationError.message}`;
          logs.push(log);
          continue;
        }
        
        // 2. 기기가 할당된 경우 기기 상태를 available로 변경
        if (reservation.device_id) {
          const { error: deviceError } = await supabase
            .from('devices')
            .update({ 
              status: 'available',
              updated_at: nowISO
            })
            .eq('id', reservation.device_id)
            .eq('status', 'in_use'); // in_use 상태인 경우만 변경
          
          if (deviceError) {
            log.error = `Failed to update device: ${deviceError.message}`;
            logs.push(log);
            continue;
          }
        }
        
        log.success = true;
        logs.push(log);
        
        console.log(`✅ Expired reservation processed: ${reservation.id}`);
        
      } catch (error) {
        log.error = error instanceof Error ? error.message : 'Unknown error';
        logs.push(log);
        console.error(`❌ Error processing expired reservation ${reservation.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in processExpiredReservations:', error);
  }
  
  return logs;
}

/**
 * 예약 시작 시간이 된 체크인 예약들의 기기 상태를 in_use로 변경
 */
async function processRentalStartTimes(): Promise<StatusUpdateLog[]> {
  const logs: StatusUpdateLog[] = [];
  const supabase = createAdminClient();
  
  try {
    const currentTime = getCurrentTimeString();
    const today = getTodayDateString();
    const nowISO = getCurrentKSTTime().toISOString();
    
    // 예약 시간이 되었지만 아직 실제 시작되지 않은 체크인 예약들 찾기
    const { data: startingReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('id, device_id, start_time')
      .eq('status', 'checked_in')
      .eq('date', today)
      .lte('start_time', currentTime)
      .is('actual_start_time', null);
    
    if (fetchError) {
      console.error('Error fetching starting reservations:', fetchError);
      return logs;
    }
    
    // 각 시작되어야 할 예약 처리
    for (const reservation of startingReservations || []) {
      const log: StatusUpdateLog = {
        timestamp: nowISO,
        action: 'rental_started',
        reservation_id: reservation.id,
        device_id: reservation.device_id,
        success: false
      };
      
      try {
        // 1. 예약에 실제 시작 시간 기록
        const { error: reservationError } = await supabase
          .from('reservations')
          .update({ 
            actual_start_time: nowISO,
            updated_at: nowISO
          })
          .eq('id', reservation.id);
        
        if (reservationError) {
          log.error = `Failed to update reservation start time: ${reservationError.message}`;
          logs.push(log);
          continue;
        }
        
        // 2. 기기 상태를 in_use로 변경
        if (reservation.device_id) {
          const { error: deviceError } = await supabase
            .from('devices')
            .update({ 
              status: 'in_use',
              updated_at: nowISO
            })
            .eq('id', reservation.device_id);
          
          if (deviceError) {
            log.error = `Failed to update device to in_use: ${deviceError.message}`;
            logs.push(log);
            continue;
          }
        }
        
        log.success = true;
        logs.push(log);
        
        console.log(`✅ Rental started: ${reservation.id}`);
        
      } catch (error) {
        log.error = error instanceof Error ? error.message : 'Unknown error';
        logs.push(log);
        console.error(`❌ Error processing rental start ${reservation.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in processRentalStartTimes:', error);
  }
  
  return logs;
}

/**
 * 메인 자동 체크 함수
 * API 호출 시마다 실행되어 만료된 예약과 시작되어야 할 예약을 처리합니다
 */
export async function autoCheckDeviceStatus(): Promise<{
  executed: boolean;
  expiredCount: number;
  startedCount: number;
  errors: string[];
}> {
  // 중복 실행 방지
  if (shouldSkipCheck()) {
    return {
      executed: false,
      expiredCount: 0,
      startedCount: 0,
      errors: []
    };
  }
  
  console.log('🔄 Starting automatic device status check...');
  
  try {
    // 1. 만료된 예약 처리
    const expiredLogs = await processExpiredReservations();
    
    // 2. 시작되어야 할 예약 처리
    const startedLogs = await processRentalStartTimes();
    
    // 결과 집계
    const expiredCount = expiredLogs.filter(log => log.success).length;
    const startedCount = startedLogs.filter(log => log.success).length;
    const errors = [
      ...expiredLogs.filter(log => !log.success).map(log => log.error || 'Unknown error'),
      ...startedLogs.filter(log => !log.success).map(log => log.error || 'Unknown error')
    ];
    
    console.log(`✅ Auto check completed - Expired: ${expiredCount}, Started: ${startedCount}, Errors: ${errors.length}`);
    
    return {
      executed: true,
      expiredCount,
      startedCount,
      errors
    };
    
  } catch (error) {
    console.error('❌ Critical error in autoCheckDeviceStatus:', error);
    return {
      executed: true,
      expiredCount: 0,
      startedCount: 0,
      errors: [error instanceof Error ? error.message : 'Critical error']
    };
  }
}

/**
 * 강제로 즉시 체크 실행 (테스트용)
 */
export async function forceCheckDeviceStatus() {
  // 마지막 체크 시간 초기화하여 강제 실행
  lastCheckTime = 0;
  return await autoCheckDeviceStatus();
}

/**
 * 현재 상태 정보 조회
 */
export async function getStatusInfo() {
  const supabase = createAdminClient();
  const nowISO = getCurrentKSTTime().toISOString();
  const currentTime = getCurrentTimeString();
  const today = getTodayDateString();
  
  try {
    // 만료된 예약 수
    const { count: expiredCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'checked_in')
      .lt('end_time', nowISO);
    
    // 시작되어야 할 예약 수
    const { count: pendingStartCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'checked_in')
      .eq('date', today)
      .lte('start_time', currentTime)
      .is('actual_start_time', null);
    
    return {
      currentTime: nowISO,
      kstTime: currentTime,
      today,
      expiredReservations: expiredCount || 0,
      pendingStartReservations: pendingStartCount || 0,
      lastCheckTime: new Date(lastCheckTime).toISOString(),
      nextCheckAvailable: lastCheckTime + CHECK_INTERVAL <= Date.now()
    };
    
  } catch (error) {
    console.error('Error getting status info:', error);
    return null;
  }
}