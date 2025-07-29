import { NextResponse } from 'next/server';
import { auth } from '@/auth';

import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
    const { data: userData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: adminData } = await supabaseAdmin.from('admins')
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
      endDate = new Date(parseInt(endYear!), parseInt(endMonth!), 0); // 해당 월의 마지막 날
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
          // 12개월 전부터
          startDate.setMonth(startDate.getMonth() - 11);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          // 이번달 마지막 날까지 (미래 예약 포함)
          endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'year':
          // 이번 년도 1월 1일부터
          startDate = new Date(startDate.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          // 이번 년도 12월 31일까지
          endDate = new Date(startDate.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'all':
          // 2025년 1월 1일부터 (서비스 시작)
          startDate = new Date(2025, 0, 1);
          startDate.setHours(0, 0, 0, 0);
          // 현재까지
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // 1. 요약 통계 - 모든 상태를 포함해서 가져옴
    const { data: allReservations, error: allReservationsError } = await supabaseAdmin.from('reservations')
      .select('status, created_at')
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    console.log('All reservations query result:', {
      count: allReservations?.length,
      error: allReservationsError,
      byStatus: allReservations?.reduce((acc: Record<string, number>, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
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
      
      const { data: lastMonthReservations } = await supabaseAdmin.from('reservations')
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
    const { data: hourlyData } = await supabaseAdmin.from('reservations')
      .select('start_time, end_time')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .in('status', ['approved', 'checked_in', 'completed', 'no_show']);

    // 3. 기기별 통계 - device_id가 있는 경우와 없는 경우 모두 처리
    const { data: deviceData } = await supabaseAdmin.from('reservations')
      .select(`
        id,
        status,
        device_id,
        devices (
          device_types (
            id,
            name,
            model_name
          )
        )
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .in('status', ['approved', 'checked_in', 'completed', 'no_show']);

    // 이 데이터로 기기별 분포 계산
    const deviceStats = new Map();
    
    deviceData?.forEach((reservation: any) => {
      if (reservation.devices?.device_types) {
        const deviceType = reservation.devices.device_types;
        const key = deviceType.id;
        
        if (!deviceStats.has(key)) {
          deviceStats.set(key, {
            id: deviceType.id,
            name: deviceType.name,
            model_name: deviceType.model_name,
            count: 0
          });
        }
        
        deviceStats.get(key).count++;
      }
    });

    // 4. 재방문율 (같은 이메일로 2회 이상 예약)
    const { data: userReservations } = await supabaseAdmin.from('reservations')
      .select('user_id')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .in('status', ['approved', 'checked_in', 'completed', 'no_show']);

    const userCounts = new Map();
    userReservations?.forEach(r => {
      if (r.user_id) {
        userCounts.set(r.user_id, (userCounts.get(r.user_id) || 0) + 1);
      }
    });

    const repeatCustomers = Array.from(userCounts.values()).filter(count => count >= 2).length;
    const totalCustomers = userCounts.size;
    const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100) : 0;

    // 5. 예약 리드타임 (예약일로부터 이용일까지)
    const { data: leadTimeData } = await supabaseAdmin.from('reservations')
      .select('created_at, date')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .in('status', ['approved', 'checked_in', 'completed', 'no_show']);

    let totalLeadTime = 0;
    let leadTimeCount = 0;
    
    leadTimeData?.forEach(r => {
      const createdDate = new Date(r.created_at);
      const reservationDate = new Date(r.date);
      const leadTime = (reservationDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      if (leadTime >= 0) {
        totalLeadTime += leadTime;
        leadTimeCount++;
      }
    });

    const avgLeadTime = leadTimeCount > 0 ? totalLeadTime / leadTimeCount : 0;

    // 6. 일별/주별/월별 예약 추이
    const dailyReservations: any[] = [];
    
    if (range === 'week' || range === 'month') {
      // 일별 집계
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        
        const { data: dayData } = await supabaseAdmin.from('reservations')
          .select('status, start_time')
          .eq('date', dateStr);
        
        const total = dayData?.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)).length || 0;
        const completed = dayData?.filter(r => r.status === 'completed').length || 0;
        const earlyBird = dayData?.filter(r => {
          const hour = parseInt(r.start_time.split(':')[0]);
          return hour >= 0 && hour < 12 && !['pending', 'rejected', 'cancelled'].includes(r.status);
        }).length || 0;
        const lateBird = dayData?.filter(r => {
          const hour = parseInt(r.start_time.split(':')[0]);
          return hour >= 20 && !['pending', 'rejected', 'cancelled'].includes(r.status);
        }).length || 0;
        
        dailyReservations.push({
          date: dateStr,
          total,
          completed,
          earlyBird,
          lateBird
        });
        
        current.setDate(current.getDate() + 1);
      }
    } else if (range === 'quarter' || range === '6months' || range === '12months' || range === 'year' || range === 'all') {
      // 월별 집계
      const monthlyData = new Map();
      
      const current = new Date(startDate);
      while (current <= endDate) {
        const year = current.getFullYear();
        const month = current.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0);
          
          const { data: monthData } = await supabaseAdmin.from('reservations')
            .select('status')
            .gte('date', monthStart.toISOString().split('T')[0])
            .lte('date', monthEnd.toISOString().split('T')[0]);
          
          const total = monthData?.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)).length || 0;
          const completed = monthData?.filter(r => r.status === 'completed').length || 0;
          
          monthlyData.set(monthKey, {
            date: monthKey,
            total,
            completed
          });
        }
        
        current.setMonth(current.getMonth() + 1);
      }
      
      dailyReservations.push(...Array.from(monthlyData.values()));
    } else if (range === 'custom' && yearParam) {
      // 년도별 커스텀 - 분기별 집계
      const year = parseInt(yearParam);
      const quarters = [
        { name: 'Q1', months: [0, 1, 2] },
        { name: 'Q2', months: [3, 4, 5] },
        { name: 'Q3', months: [6, 7, 8] },
        { name: 'Q4', months: [9, 10, 11] }
      ];
      
      for (const quarter of quarters) {
        const quarterStart = new Date(year, quarter.months[0] || 0, 1);
        const quarterEnd = new Date(year, (quarter.months[2] || 0) + 1, 0);
        
        const { data: quarterData } = await supabaseAdmin.from('reservations')
          .select('status')
          .gte('date', quarterStart.toISOString().split('T')[0])
          .lte('date', quarterEnd.toISOString().split('T')[0]);
        
        const total = quarterData?.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)).length || 0;
        const completed = quarterData?.filter(r => r.status === 'completed').length || 0;
        
        dailyReservations.push({
          date: `${year} ${quarter.name}`,
          total,
          completed
        });
      }
    }

    // 7. 시간대별 분포 (실제 등록된 시간대 기준)
    const { data: timeSlots } = await supabaseAdmin.from('rental_time_slots')
      .select('start_time, end_time')
      .order('start_time');

    const hourlyDistribution: any[] = [];
    const hourCounts = new Map();

    // 시간대별로 예약 집계
    hourlyData?.forEach(reservation => {
      const startHour = parseInt(reservation.start_time.split(':')[0]);
      const endHour = parseInt(reservation.end_time.split(':')[0]);
      
      // 시작 시간부터 종료 시간까지 각 시간대에 카운트
      for (let hour = startHour; hour < endHour; hour++) {
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    });

    // 타임슬롯 기준으로 정렬된 결과 생성
    timeSlots?.forEach(slot => {
      const hour = parseInt(slot.start_time.split(':')[0]);
      const count = hourCounts.get(hour) || 0;
      
      hourlyDistribution.push({
        hour,
        count,
        label: slot.start_time.substring(0, 5),
        percentage: 0
      });
    });

    // 퍼센트 계산
    const totalHourly = hourlyData?.length || 0;
    hourlyDistribution.forEach(h => {
      h.percentage = totalHourly > 0 ? Math.round((h.count / totalHourly) * 100) : 0;
    });

    // 피크 시간대 찾기
    let peakHour = '-';
    if (hourlyDistribution.length > 0) {
      const peak = hourlyDistribution.reduce((max, h) => h.count > max.count ? h : max);
      if (peak.count > 0) {
        peakHour = peak.label;
      }
    }

    // 8. 기기별 분포 - 실제 대여 가능한 기종들도 포함
    const { data: rentableTypes } = await supabaseAdmin.from('device_types')
      .select('id, name')
      .eq('is_rentable', true);

    console.log('Rentable device types:', {
      rentableTypes: rentableTypes?.length,
      types: rentableTypes?.map(t => t.name)
    });

    const deviceDistribution: any[] = [];
    
    // 모든 대여 가능한 기종에 대해 초기값 설정
    rentableTypes?.forEach(type => {
      const stats = deviceStats.get(type.id);
      deviceDistribution.push({
        name: type.name,
        value: stats?.count || 0,
        percentage: 0
      });
    });

    // 퍼센트 계산 및 인기 기기 찾기
    const totalDeviceReservations = deviceDistribution.reduce((sum, d) => sum + d.value, 0);
    let popularDevice = '-';
    let maxCount = 0;

    deviceDistribution.forEach(d => {
      d.percentage = totalDeviceReservations > 0 ? Math.round((d.value / totalDeviceReservations) * 100) : 0;
      if (d.value > maxCount) {
        maxCount = d.value;
        popularDevice = d.name;
      }
    });

    // 9. 요일별 패턴 (pending 제외) - 영업시간 기준 (해당 날짜 영업)
    const { data: weekdayData } = await supabaseAdmin.from('reservations')
      .select('date')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .in('status', ['approved', 'checked_in', 'completed', 'no_show']);

    const weekdayPattern = [
      { day: '월', count: 0, percentage: 0 },
      { day: '화', count: 0, percentage: 0 },
      { day: '수', count: 0, percentage: 0 },
      { day: '목', count: 0, percentage: 0 },
      { day: '금', count: 0, percentage: 0 },
      { day: '토', count: 0, percentage: 0 },
      { day: '일', count: 0, percentage: 0 }
    ];

    weekdayData?.forEach((r: any) => {
      const date = new Date(r.date);
      const dayIndex = date.getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // 월요일을 0으로
      if (weekdayPattern[adjustedIndex]) {
        weekdayPattern[adjustedIndex].count++;
      }
    });

    const totalWeekday = weekdayPattern.reduce((sum, d) => sum + d.count, 0);
    weekdayPattern.forEach(d => {
      d.percentage = totalWeekday > 0 ? Math.round((d.count / totalWeekday) * 100) : 0;
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