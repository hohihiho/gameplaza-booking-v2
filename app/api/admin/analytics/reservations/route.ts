import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // URL 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const yearParam = searchParams.get('year');
    const startMonthParam = searchParams.get('startMonth');
    const endMonthParam = searchParams.get('endMonth');

    // 날짜 범위 계산
    let startDate: Date;
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    if (range === 'custom' && yearParam) {
      // 커스텀 기간 선택 - 년도별
      const year = parseInt(yearParam);
      startDate = new Date(year, 0, 1); // 1월 1일
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(year, 11, 31); // 12월 31일
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'custom' && startMonthParam && endMonthParam) {
      // 기존 월 선택 방식 (fallback)
      startDate = new Date(startMonthParam + '-01');
      const [endYear, endMonth] = endMonthParam.split('-');
      endDate = new Date(parseInt(endYear), parseInt(endMonth), 0); // 해당 월의 마지막 날
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      switch (range) {
        case 'week':
        // 이번주 월요일부터
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        // 이번주 일요일까지
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // 이번달 1일부터
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        // 이번달 마지막 날까지 (미래 예약 포함)
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        // 이번 년도 1월 1일부터 (전체 분기 표시)
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        // 종료일은 이번 년도 12월 31일
        endDate = new Date(startDate.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '6months':
        // 이번 년도 1월 1일부터 (전체 반기 표시)
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        // 종료일은 이번 년도 12월 31일
        endDate = new Date(startDate.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '12months':
        // 이번 년도 1월 1일부터
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        // 종료일은 이번 년도 12월 31일
        endDate = new Date(startDate.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 3); // 최근 3년간 데이터
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
        default: // month
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log('Analytics date range:', { 
      range, 
      startDate: startDateStr, 
      endDate: endDateStr,
      yearParam,
      now: new Date().toISOString()
    });

    // 1. 요약 통계 - 모든 상태를 포함해서 가져옴
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('status, created_at')
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    console.log('All reservations query result:', {
      count: allReservations?.length,
      error: allReservationsError,
      byStatus: allReservations?.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {}),
      dateRange: { startDateStr, endDateStr }
    });

    // 전체 예약 수 (대기, 거절 제외)
    const pendingReservations = allReservations?.filter(r => r.status === 'pending').length || 0;
    const rejectedReservations = allReservations?.filter(r => r.status === 'rejected').length || 0;
    const cancelledReservations = allReservations?.filter(r => r.status === 'cancelled').length || 0;
    const completedReservations = allReservations?.filter(r => r.status === 'completed').length || 0;
    const approvedReservations = allReservations?.filter(r => r.status === 'approved').length || 0;
    const noShowReservations = allReservations?.filter(r => r.status === 'no_show').length || 0;
    
    // 전체 예약 수 (대기, 거절, 취소 제외) - 승인/체크인/완료/노쇼만 포함
    const totalReservations = (allReservations?.length || 0) - pendingReservations - rejectedReservations - cancelledReservations;
    
    // 완료율은 전체 예약 대비 완료 비율
    const completionRate = totalReservations > 0 ? (completedReservations / totalReservations * 100) : 0;
    
    // 취소율은 전체 예약(취소 포함) 대비 취소 비율 - 참고용으로만 계산
    const allReservationsCount = (allReservations?.length || 0) - pendingReservations - rejectedReservations;
    const cancellationRate = allReservationsCount > 0 ? (cancelledReservations / allReservationsCount * 100) : 0;

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgReservationsPerDay = totalReservations / days;

    // 전월 대비 증감률 계산 (이번달 vs 전월)
    let reservationGrowthRate = 0;
    let completionRateChange = 0;
    
    if (range === 'month') {
      // 전월 데이터 조회
      const lastMonth = new Date(startDate);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      
      const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
        .select('status')
        .gte('date', lastMonthStart.toISOString().split('T')[0])
        .lte('date', lastMonthEnd.toISOString().split('T')[0]);
      
      if (lastMonthReservations && lastMonthReservations.length > 0) {
        const lastMonthTotal = lastMonthReservations.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)).length;
        const lastMonthCompleted = lastMonthReservations.filter(r => r.status === 'completed').length;
        const lastMonthCompletionRate = lastMonthTotal > 0 ? (lastMonthCompleted / lastMonthTotal * 100) : 0;
        
        reservationGrowthRate = lastMonthTotal > 0 ? ((totalReservations - lastMonthTotal) / lastMonthTotal * 100) : 0;
        completionRateChange = lastMonthCompletionRate > 0 ? (completionRate - lastMonthCompletionRate) : 0;
      }
    }

    // 2. 시간대별 분포 (취소/거절 제외) - start_time과 end_time 모두 가져옴
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('start_time, end_time')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .not('status', 'in', '("pending","cancelled","rejected")');

    // 가장 인기있는 시간대 찾기는 나중에 시간대별 분포에서 계산
    let peakHour = '';
    let maxCount = 0;

    // 3. 기기별 통계 - device_id가 있는 경우와 없는 경우 모두 처리
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select(`
        device_id,
        devices(
          id,
          device_number,
          device_type_id,
          device_types(
            id,
            name
          )
        )
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .not('status', 'in', '("cancelled","rejected")')
      .not('device_id', 'is', null); // device_id가 null이 아닌 것만

    console.log('Device data query result:', { 
      deviceData: deviceData?.length, 
      error: deviceError,
      sample: deviceData?.[0],
      startDate: startDateStr,
      endDate: endDateStr
    });

    const deviceMap = new Map<string, number>();
    deviceData?.forEach(r => {
      if (r.devices && r.devices.device_types && r.devices.device_types.name) {
        const deviceName = r.devices.device_types.name;
        deviceMap.set(deviceName, (deviceMap.get(deviceName) || 0) + 1);
      }
    });

    console.log('Device map:', Array.from(deviceMap.entries()));
    

    // 가장 인기있는 기기
    let popularDevice = '';
    let maxDeviceCount = 0;
    deviceMap.forEach((count, device) => {
      if (count > maxDeviceCount) {
        maxDeviceCount = count;
        popularDevice = device;
      }
    });

    // 4. 재방문율 (같은 이메일로 2회 이상 예약)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('user_id')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .not('status', 'in', '("pending","cancelled","rejected")');

    const userCountMap = new Map<string, number>();
    userReservations?.forEach(r => {
      if (r.user_id) {
        userCountMap.set(r.user_id, (userCountMap.get(r.user_id) || 0) + 1);
      }
    });

    let repeatUsers = 0;
    userCountMap.forEach(count => {
      if (count > 1) repeatUsers++;
    });
    const repeatCustomerRate = userCountMap.size > 0 ? (repeatUsers / userCountMap.size * 100) : 0;

    // 5. 예약 리드타임 (예약일로부터 이용일까지)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('created_at, date')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .not('status', 'in', '("pending","cancelled","rejected")');

    let totalLeadTime = 0;
    let leadTimeCount = 0;
    leadTimeData?.forEach(r => {
      const createdDate = new Date(r.created_at);
      const reservationDate = new Date(r.date);
      const leadDays = Math.ceil((reservationDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      if (leadDays >= 0) {
        totalLeadTime += leadDays;
        leadTimeCount++;
      }
    });
    const avgLeadTime = leadTimeCount > 0 ? (totalLeadTime / leadTimeCount) : 0;

    // 6. 일별/주별/월별 예약 추이
    const dailyReservations = [];
    
    if (range === 'week') {
      // 이번주: 월~일 순서로 정확히 계산
      const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
      
      // 이번주 월요일 정확히 계산 (KST 기준)
      const today = new Date();
      // KST 기준으로 오늘 날짜 계산
      const kstToday = new Date(today.getTime() + (9 * 60 * 60 * 1000)); // UTC + 9시간
      const currentDay = kstToday.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // 일요일이면 6, 나머지는 -1
      const monday = new Date(kstToday);
      monday.setDate(kstToday.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      
      
      // 월~일 순서로 데이터 생성 (정확히 7일)
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        // KST 기준 날짜 문자열 생성
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // 실제 데이터 조회
        let count = 0;
        let cancelled = 0;
        let completed = 0;
        
        // 해당 날짜의 모든 예약 조회 (단순하게)
        const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
          .select('status, start_time')
          .eq('date', dateStr);
        
        // 승인/체크인/완료/노쇼 예약만 카운트 (취소/거절/대기 제외)
        const validReservations = (dayData || []).filter(r => 
          ['approved', 'checked_in', 'completed', 'no_show'].includes(r.status)
        );
        
        count = validReservations.length;
        cancelled = 0; // 취소건은 통계에서 제외
        completed = validReservations.filter(r => r.status === 'completed').length;

        // 실제 날짜의 요일 계산
        const actualDayOfWeek = currentDate.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
        const dayName = ['일', '월', '화', '수', '목', '금', '토'][actualDayOfWeek];
        
        
        dailyReservations.push({
          date: `${currentDate.getMonth() + 1}/${currentDate.getDate()}(${dayName})`,
          count,
          cancelled,
          completed
        });
      }
    } else if (range === 'month') {
      // 이번달: 4~5주차까지 미리 생성
      const monthStart = new Date(startDate);
      const monthEnd = new Date(endDate);
      
      // 이번달의 주차 계산
      const weeks = [];
      let current = new Date(monthStart);
      let weekNum = 1;
      
      while (weekNum <= 5 && current.getMonth() === monthStart.getMonth()) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // 주의 끝이 다음달로 넘어가면 월말로 조정
        if (weekEnd.getMonth() !== monthStart.getMonth()) {
          weekEnd.setMonth(monthStart.getMonth() + 1);
          weekEnd.setDate(0); // 이번달 마지막 날
        }
        
        weeks.push({
          weekNum,
          start: weekStart,
          end: weekEnd
        });
        
        current.setDate(current.getDate() + 7);
        weekNum++;
      }
      
      // 각 주차별로 데이터 조회
      for (const week of weeks) {
        const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
          .select('status')
          .gte('date', week.start.toISOString().split('T')[0])
          .lte('date', week.end.toISOString().split('T')[0]);

        // 대기, 거절, 취소된 예약은 제외
        const validPeriodData = periodData?.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)) || [];
        const count = validPeriodData.length;
        const cancelled = 0;
        const completed = validPeriodData.filter(r => r.status === 'completed').length;

        dailyReservations.push({
          date: `${week.weekNum}주차`,
          count,
          cancelled,
          completed
        });
      }
    } else if (range === 'quarter') {
      // 분기별: 1~4분기 모두 표시
      const currentYear = new Date().getFullYear();
      const quarters = [
        { quarter: 1, months: [0, 1, 2], label: '1분기' },
        { quarter: 2, months: [3, 4, 5], label: '2분기' },
        { quarter: 3, months: [6, 7, 8], label: '3분기' },
        { quarter: 4, months: [9, 10, 11], label: '4분기' }
      ];
      
      for (const q of quarters) {
        let count = 0;
        let cancelled = 0;
        let completed = 0;
        
        // 해당 분기의 각 월 데이터 조회
        for (const month of q.months) {
          const monthStart = new Date(currentYear, month, 1);
          const monthEnd = new Date(currentYear, month + 1, 0);
          
          const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
            .select('status')
            .gte('date', monthStart.toISOString().split('T')[0])
            .lte('date', monthEnd.toISOString().split('T')[0]);

          // 대기, 거절, 취소된 예약은 제외
          const validMonthData = monthData?.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)) || [];
          count += validMonthData.length;
          cancelled += 0;
          completed += validMonthData.filter(r => r.status === 'completed').length;
        }
        
        dailyReservations.push({
          date: q.label,
          count,
          cancelled,
          completed
        });
      }
    } else if (range === '6months') {
      // 반기별: 상반기, 하반기
      const currentYear = new Date().getFullYear();
      const halfYears = [
        { months: [0, 1, 2, 3, 4, 5], label: '상반기' },
        { months: [6, 7, 8, 9, 10, 11], label: '하반기' }
      ];
      
      for (const half of halfYears) {
        let count = 0;
        let cancelled = 0;
        let completed = 0;
        
        // 해당 반기의 각 월 데이터 조회
        for (const month of half.months) {
          const monthStart = new Date(currentYear, month, 1);
          const monthEnd = new Date(currentYear, month + 1, 0);
          
          const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
            .select('status')
            .gte('date', monthStart.toISOString().split('T')[0])
            .lte('date', monthEnd.toISOString().split('T')[0]);

          // 대기, 거절, 취소된 예약은 제외
          const validMonthData = monthData?.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)) || [];
          count += validMonthData.length;
          cancelled += 0;
          completed += validMonthData.filter(r => r.status === 'completed').length;
        }
        
        dailyReservations.push({
          date: half.label,
          count,
          cancelled,
          completed
        });
      }
    } else if (range === '12months') {
      // 12개월: 이번 년도 1~12월 모두 표시
      const currentYear = new Date().getFullYear();
      
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(currentYear, i, 1);
        const monthEnd = new Date(currentYear, i + 1, 0);
        
        const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
          .select('status')
          .gte('date', monthStart.toISOString().split('T')[0])
          .lte('date', monthEnd.toISOString().split('T')[0]);

        // 대기, 거절, 취소된 예약은 제외
        const validMonthData = monthData?.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)) || [];
        const count = validMonthData.length;
        const cancelled = 0;
        const completed = validMonthData.filter(r => r.status === 'completed').length;

        dailyReservations.push({
          date: `${i + 1}월`,
          count,
          cancelled,
          completed
        });
      }
    } else if (range === 'yearly') {
      // 년도별 추이
      const current = new Date(startDate);
      current.setMonth(0);
      current.setDate(1);
      
      while (current <= endDate) {
        const yearStart = new Date(current);
        const yearEnd = new Date(current.getFullYear(), 11, 31);
        
        if (yearEnd > endDate) yearEnd.setTime(endDate.getTime());
        
        const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
          .select('status')
          .gte('date', yearStart.toISOString().split('T')[0])
          .lte('date', yearEnd.toISOString().split('T')[0]);

        // 대기, 거절, 취소된 예약은 제외
        const validYearData = yearData?.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)) || [];
        const count = validYearData.length;
        const cancelled = 0;
        const completed = validYearData.filter(r => r.status === 'completed').length;

        dailyReservations.push({
          date: `${current.getFullYear()}년`,
          count,
          cancelled,
          completed
        });

        current.setFullYear(current.getFullYear() + 1);
      }
    } else if (range === 'custom' && yearParam) {
      // 커스텀 기간 선택 - 년도별: 1~12월 모두 표시
      const year = parseInt(yearParam);
      
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(year, i, 1);
        const monthEnd = new Date(year, i + 1, 0);
        
        const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
          .select('status')
          .gte('date', monthStart.toISOString().split('T')[0])
          .lte('date', monthEnd.toISOString().split('T')[0]);

        // 대기, 거절, 취소된 예약은 제외
        const validMonthData = monthData?.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)) || [];
        const count = validMonthData.length;
        const cancelled = 0;
        const completed = validMonthData.filter(r => r.status === 'completed').length;

        dailyReservations.push({
          date: `${i + 1}월`,
          count,
          cancelled,
          completed
        });
      }
    } else if (range === 'custom' && startMonthParam && endMonthParam) {
      // 기존 월 선택 방식 (fallback)
      const isSameMonth = startMonthParam === endMonthParam;
      
      if (isSameMonth) {
        // 같은 달 선택: 주별로 표시
        const [year, month] = startMonthParam.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        let current = new Date(firstDay);
        let weekNum = 1;
        
        while (current <= lastDay) {
          const weekStart = new Date(current);
          const weekEnd = new Date(current);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          // 주의 끝이 다음달로 넘어가면 월말로 조정
          if (weekEnd > lastDay) {
            weekEnd.setTime(lastDay.getTime());
          }
          
          const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
            .select('status')
            .gte('date', weekStart.toISOString().split('T')[0])
            .lte('date', weekEnd.toISOString().split('T')[0]);

          const count = periodData?.length || 0;
          const cancelled = periodData?.filter(r => r.status === 'cancelled').length || 0;
          const completed = periodData?.filter(r => r.status === 'completed').length || 0;

          dailyReservations.push({
            date: `${weekNum}주차`,
            count,
            cancelled,
            completed
          });

          current.setDate(current.getDate() + 7);
          weekNum++;
          
          // 다음 주가 다음달로 넘어가면 중단
          if (current.getMonth() !== month - 1) break;
        }
      } else {
        // 다른 달 선택: 월별로 표시
        const current = new Date(startDate);
        current.setDate(1);
        
        while (current <= endDate) {
          const monthStart = new Date(current);
          const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          
          if (monthEnd > endDate) monthEnd.setTime(endDate.getTime());
          
          const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
            .select('status')
            .gte('date', monthStart.toISOString().split('T')[0])
            .lte('date', monthEnd.toISOString().split('T')[0]);

          const count = monthData?.length || 0;
          const cancelled = monthData?.filter(r => r.status === 'cancelled').length || 0;
          const completed = monthData?.filter(r => r.status === 'completed').length || 0;

          dailyReservations.push({
            date: `${current.getFullYear()}년 ${current.getMonth() + 1}월`,
            count,
            cancelled,
            completed
          });

          current.setMonth(current.getMonth() + 1);
        }
      }
    }

    // 7. 시간대별 분포 (실제 등록된 시간대 기준)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('rental_time_slots')
      .select('start_time, end_time')
      .order('start_time');

    const hourlyDistribution = [];
    const totalHourly = hourlyData?.length || 0;
    
    // 등록된 시간대별로 집계 (시간대별로만 중복 제거)
    const uniqueTimeSlots = new Map<string, {start_time: string, end_time: string}>();
    
    // 등록된 시간대가 있으면 사용
    if (registeredTimeSlots && registeredTimeSlots.length > 0) {
      registeredTimeSlots.forEach(slot => {
        const key = `${slot.start_time}-${slot.end_time}`;
        if (!uniqueTimeSlots.has(key)) {
          uniqueTimeSlots.set(key, {
            start_time: slot.start_time,
            end_time: slot.end_time
          });
        }
      });
    }
    
    // 정렬된 시간대별로 통계 생성
    const sortedSlots = Array.from(uniqueTimeSlots.values())
      .sort((a, b) => {
        // 시작 시간 기준으로 정렬 (24시간 형식 고려)
        const aStart = parseInt(a.start_time.split(':')[0]);
        const bStart = parseInt(b.start_time.split(':')[0]);
        
        // 0-5시는 24-29시로 간주하여 정렬
        const aSort = aStart < 6 ? aStart + 24 : aStart;
        const bSort = bStart < 6 ? bStart + 24 : bStart;
        
        // 시작 시간이 같으면 종료 시간으로 정렬
        if (aSort === bSort) {
          const aEnd = parseInt(a.end_time.split(':')[0]);
          const bEnd = parseInt(b.end_time.split(':')[0]);
          const aEndSort = aEnd < 6 ? aEnd + 24 : aEnd;
          const bEndSort = bEnd < 6 ? bEnd + 24 : bEnd;
          return aEndSort - bEndSort;
        }
        
        return aSort - bSort;
      });
      
    sortedSlots.forEach(slot => {
        const startHour = parseInt(slot.start_time.split(':')[0]);
        const endHour = parseInt(slot.end_time.split(':')[0]);
        
        // 예약 데이터에서 해당 시간대의 예약 수 집계
        // 예약의 start_time과 end_time이 슬롯과 정확히 일치하는 경우만 카운트
        let count = 0;
        hourlyData?.forEach(r => {
          if (r.start_time === slot.start_time && r.end_time === slot.end_time) {
            count++;
          }
        });
        
        // 시간 표시 포맷 (0-5시는 24-29시로 표시)
        const displayStart = startHour < 6 ? startHour + 24 : startHour;
        const displayEnd = endHour < 6 ? endHour + 24 : endHour;
        
        // 이미 같은 시간대가 있는지 확인
        const existingSlot = hourlyDistribution.find(h => h.hour === `${displayStart}-${displayEnd}`);
        if (!existingSlot) {
          hourlyDistribution.push({
            hour: `${displayStart}-${displayEnd}`,
            count,
            percentage: totalHourly > 0 ? (count / totalHourly * 100) : 0,
            slot_type: displayStart < 12 ? 'early' : 'overnight'  // 12시 이전은 조기, 이후는 밤샘
          });
          
          // 가장 인기있는 시간대 업데이트
          if (count > maxCount) {
            maxCount = count;
            peakHour = `${displayStart}-${displayEnd}시`;
          }
        }
      });

    // 8. 기기별 분포 - 실제 대여 가능한 기종들도 포함
    // 먼저 대여 가능한 모든 기종 가져오기
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_types')
      .select('id, name')
      .eq('is_rentable', true);

    console.log('Rentable types query:', { 
      rentableTypes: rentableTypes?.length, 
      error: rentableError,
      types: rentableTypes?.map(t => t.name)
    });

    const deviceDistribution = [];
    const totalDevices = Array.from(deviceMap.values()).reduce((a, b) => a + b, 0);
    
    // 색상 매핑을 더 동적으로 처리
    const colorPool = [
      'bg-pink-500',
      'bg-blue-500', 
      'bg-purple-500',
      'bg-indigo-500',
      'bg-orange-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-cyan-500'
    ];

    // 기종이 없을 경우 기본값 사용 (실제 DB 데이터와 일치)
    const defaultTypes = [
      '마이마이 DX (PRISM)', 
      'CHUNITHM (VERSE)', 
      '사운드 볼텍스 (VALKYRIE MODEL)', 
      'BEATMANIA IIDX (LIGHTNING MODEL)'
    ];
    const typesToUse = rentableTypes && rentableTypes.length > 0 ? rentableTypes : defaultTypes.map(name => ({ name }));

    // 대여 가능한 모든 기종에 대해 통계 생성
    typesToUse.forEach((type, index) => {
      const count = deviceMap.get(type.name) || 0;
      deviceDistribution.push({
        name: type.name,
        count,
        percentage: totalDevices > 0 ? (count / totalDevices * 100) : 0,
        color: colorPool[index % colorPool.length]
      });
    });

    // 정렬 (많은 순)
    deviceDistribution.sort((a, b) => b.count - a.count);

    // 9. 요일별 패턴 (pending 제외) - 영업시간 기준 (해당 날짜 영업)
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
      .select('date')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .not('status', 'in', '("pending","cancelled","rejected")');

    // 월요일부터 시작하도록 순서 변경
    const weekdayPattern = ['월', '화', '수', '목', '금', '토', '일'].map((day) => {
      const dayIndex = ['일', '월', '화', '수', '목', '금', '토'].indexOf(day);
      const dayReservations = weekdayData?.filter(r => {
        const date = new Date(r.date + 'T00:00:00');
        return date.getDay() === dayIndex;
      }) || [];
      
      const weekCount = Math.ceil(days / 7);
      const avg = weekCount > 0 ? dayReservations.length / weekCount : 0;

      return {
        day,
        count: dayReservations.length,
        avg: Math.round(avg * 10) / 10
      };
    });

    // 10. 예약 상태별 통계
    const statusStats = {
      pending: pendingReservations,
      approved: approvedReservations,
      completed: completedReservations,
      cancelled: cancelledReservations,
      rejected: rejectedReservations,
      noShow: noShowReservations
    };

    const responseData = {
      summaryStats: {
        totalReservations,
        completionRate: Math.round(completionRate * 10) / 10,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        avgReservationsPerDay: Math.round(avgReservationsPerDay * 10) / 10,
        peakHour: peakHour || '-',
        popularDevice: popularDevice || '-',
        avgLeadTime: Math.round(avgLeadTime * 10) / 10,
        repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
        reservationGrowthRate: Math.round(reservationGrowthRate * 10) / 10,
        completionRateChange: Math.round(completionRateChange * 10) / 10
      },
      dailyReservations: dailyReservations.length > 0 ? dailyReservations : [],
      hourlyDistribution: hourlyDistribution.length > 0 ? hourlyDistribution : [],
      deviceDistribution: deviceDistribution.length > 0 ? deviceDistribution : [],
      weekdayPattern: weekdayPattern.length > 0 ? weekdayPattern : [],
      statusStats
    };
    
    console.log('Analytics response summary:', {
      totalReservations,
      dailyReservationsCount: dailyReservations.length,
      deviceDistributionCount: deviceDistribution.length,
      hourlyDistributionCount: hourlyDistribution.length,
      hourlyDistribution: hourlyDistribution.map(h => `${h.hour}시: ${h.count}건`)
    });
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}