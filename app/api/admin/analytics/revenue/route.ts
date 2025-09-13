import { getDB, supabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { createAdminClient } from '@/lib/db';

export async function GET(request: Request) {
  try {
    console.log('매출 API 시작');
    
    const session = await auth();
    console.log('세션 확인:', !!session, session?.user?.email);
    
    if (!session?.user?.email) {
      console.log('인증 실패: 세션 없음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    console.log('사용자 조회 중:', session.user.email);
    const supabaseAdmin = createAdminClient();
    const { data: userData, error: userError } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    console.log('사용자 데이터:', userData, userError);

    if (!userData) {
      console.log('사용자 찾을 수 없음');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('관리자 확인 중:', userData.id);
    
    const { data: adminData, error: adminError } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    console.log('관리자 데이터:', adminData, adminError);

    if (!adminData) {
      console.log('관리자 권한 없음');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // URL 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const yearParam = searchParams.get('year');

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
    } else {
      startDate = new Date();
      switch (range) {
        case 'week':
          // 이번주 월요일부터 (완전히 새로운 접근법)
          const now = new Date();
          const currentDayOfWeek = now.getDay(); // 0=일요일, 1=월요일, 2=화요일, 3=수요일...
          
          // 월요일까지의 날짜 차이 계산
          const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
          
          // 월요일 날짜 계산 (새로운 Date 객체 생성)
          const mondayTime = now.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000);
          const mondayDate = new Date(mondayTime);
          mondayDate.setHours(0, 0, 0, 0);
          
          // 일요일 날짜 계산 (새로운 Date 객체 생성)
          const sundayTime = mondayTime + (6 * 24 * 60 * 60 * 1000);
          const sundayDate = new Date(sundayTime);
          sundayDate.setHours(23, 59, 59, 999);
          
          startDate = mondayDate;
          endDate = sundayDate;
          
          console.log('밀리초 기반 주간 날짜 계산:', {
            today: now.toISOString().split('T')[0],
            currentDayOfWeek: currentDayOfWeek,
            daysToSubtract: daysToSubtract,
            calculatedMonday: startDate.toISOString().split('T')[0],
            calculatedSunday: endDate.toISOString().split('T')[0]
          });
          break;
        case 'month':
          // 이번달 1일부터
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          // 이번달 마지막 날까지
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'quarter':
          // 이번 분기 시작일부터
          const quarter = Math.floor(startDate.getMonth() / 3);
          startDate = new Date(startDate.getFullYear(), quarter * 3, 1);
          startDate.setHours(0, 0, 0, 0);
          // 이번 분기 마지막 날까지
          endDate = new Date(startDate.getFullYear(), (quarter + 1) * 3, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case '6months':
          // 6개월 전부터
          startDate.setMonth(startDate.getMonth() - 6);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          // 이번 년도 1월 1일부터
          startDate = new Date(startDate.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          // 기본값: 이번달
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('매출 API - 날짜 범위:', { startDateStr, endDateStr, range });

    // 우선 모든 예약 데이터 조회해서 상태 확인 (time_end 추가)
    
    const { data: allReservations, error: allReservationsError } = await supabaseAdmin.from('reservations')
      .select(`
        id,
        total_amount,
        date,
        created_at,
        status,
        start_time,
        end_time,
        payment_method,
        device_id,
        devices(
          device_types(name, category_id)
        )
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    console.log('전체 예약 데이터:', {
      count: allReservations?.length || 0,
      statuses: allReservations?.map(r => r.status),
      sampleData: allReservations?.slice(0, 3)
    });

    if (allReservationsError) {
      console.error('매출 데이터 조회 오류:', allReservationsError);
      console.error('매출 API - 상세 에러:', {
        message: allReservationsError.message,
        details: allReservationsError.details,
        hint: allReservationsError.hint,
        code: allReservationsError.code
      });
      return NextResponse.json({ 
        error: 'Failed to fetch revenue data',
        details: allReservationsError.message 
      }, { status: 500 });
    }

    // 매출로 계산할 예약들 - 승인되었거나 완료된 예약들
    const reservations = (allReservations || []).filter(r => 
      r.status === 'approved' || 
      r.status === 'completed' || 
      r.status === 'checked_in'
    );

    console.log('매출 계산용 예약:', {
      total: reservations.length,
      totalPrice: reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0),
      samplePrices: reservations.slice(0, 5).map(r => r.total_amount),
      dateRange: reservations.map(r => r.date).sort()
    });

    // 화요일, 금요일 데이터 특별 확인
    const tuesdayData = allReservations?.filter(r => r.date === '2025-07-15') || [];
    const fridayData = allReservations?.filter(r => r.date === '2025-07-18') || [];
    
    console.log('화요일 (2025-07-15) 전체 예약:', {
      count: tuesdayData.length,
      statuses: tuesdayData.map(r => r.status),
      amounts: tuesdayData.map(r => r.total_amount)
    });
    
    console.log('금요일 (2025-07-18) 전체 예약:', {
      count: fridayData.length,
      statuses: fridayData.map(r => r.status),
      amounts: fridayData.map(r => r.total_amount)
    });

    // 이전 기간 데이터 (비교용)
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(endDate);
    const periodLength = endDate.getTime() - startDate.getTime();
    prevStartDate.setTime(startDate.getTime() - periodLength);
    prevEndDate.setTime(endDate.getTime() - periodLength);

    const { data: prevAllReservations } = await supabaseAdmin.from('reservations')
      .select('total_amount, status')
      .gte('date', prevStartDate.toISOString().split('T')[0])
      .lte('date', prevEndDate.toISOString().split('T')[0]);

    const prevReservations = (prevAllReservations || []).filter(r => 
      r.status === 'approved' || 
      r.status === 'completed' || 
      r.status === 'checked_in'
    );

    // 매출 통계 계산
    const totalRevenue = reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalRentals = reservations.length;
    const avgRentalValue = totalRentals > 0 ? Math.floor(totalRevenue / totalRentals) : 0;

    const previousRevenue = (prevReservations || []).reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const growthRate = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // 기간별 차트 데이터 생성
    const dailyRevenueData = [];
    
    if (range === 'week') {
      // 이번주: 월화수목금토일
      const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
      const monday = new Date(startDate);
      
      console.log('주간 데이터 생성:', { 
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        monday: monday.toISOString().split('T')[0],
        today: new Date().toISOString().split('T')[0],
        todayDayOfWeek: new Date().getDay()
      });
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayReservations = reservations.filter(r => r.date === dateStr);
        const dayRevenue = dayReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const dayCount = dayReservations.length;

        console.log(`${weekDays[i]}요일 (${dateStr}):`, {
          reservationCount: dayCount,
          totalRevenue: dayRevenue,
          reservations: dayReservations.map(r => ({
            date: r.date,
            amount: r.total_amount,
            status: r.status
          }))
        });

        dailyRevenueData.push({
          date: `${date.getMonth() + 1}/${date.getDate()}(${weekDays[i]})`,
          revenue: dayRevenue,
          count: dayCount,
          avgPerRental: dayCount > 0 ? Math.floor(dayRevenue / dayCount) : 0
        });
      }
    } else if (range === 'month') {
      // 이번달: 주별로 (1주차, 2주차, 3주차, 4주차, 5주차)
      const firstDay = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      let weekNum = 1;
      const currentWeekStart = new Date(firstDay);
      
      while (currentWeekStart <= lastDay) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
        
        const weekReservations = reservations.filter(r => {
          const rDate = new Date(r.date);
          return rDate >= currentWeekStart && rDate <= weekEnd;
        });
        
        const weekRevenue = weekReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const weekCount = weekReservations.length;
        
        dailyRevenueData.push({
          date: `${weekNum}주차`,
          revenue: weekRevenue,
          count: weekCount,
          avgPerRental: weekCount > 0 ? Math.floor(weekRevenue / weekCount) : 0
        });
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNum++;
      }
    } else if (range === 'quarter') {
      // 분기별: 1, 2, 3, 4분기 (현재 연도 기준)
      const currentYear = new Date().getFullYear();
      
      console.log('분기별 데이터 생성:', { currentYear, startDate, endDate });
      
      for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterStartMonth = (quarter - 1) * 3; // 0, 3, 6, 9
        const quarterStart = new Date(currentYear, quarterStartMonth, 1);
        const quarterEnd = new Date(currentYear, quarterStartMonth + 3, 0); // 마지막 날
        
        console.log(`${quarter}분기 범위:`, {
          quarterStart: quarterStart.toISOString().split('T')[0],
          quarterEnd: quarterEnd.toISOString().split('T')[0]
        });
        
        const quarterReservations = reservations.filter(r => {
          const rDate = new Date(r.date);
          const isInRange = rDate >= quarterStart && rDate <= quarterEnd;
          if (quarter <= 2) { // 1,2분기 디버깅
            console.log(`${quarter}분기 예약 체크:`, {
              date: r.date,
              rDate: rDate.toISOString().split('T')[0],
              isInRange,
              amount: r.total_amount
            });
          }
          return isInRange;
        });
        
        const quarterRevenue = quarterReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const quarterCount = quarterReservations.length;
        
        console.log(`${quarter}분기 결과:`, {
          reservationCount: quarterCount,
          totalRevenue: quarterRevenue,
          reservations: quarterReservations.slice(0, 3) // 처음 3개만 로그
        });
        
        dailyRevenueData.push({
          date: `${quarter}분기`,
          revenue: quarterRevenue,
          count: quarterCount,
          avgPerRental: quarterCount > 0 ? Math.floor(quarterRevenue / quarterCount) : 0
        });
      }
    } else if (range === '6months') {
      // 반기별: 상반기, 하반기
      const currentYear = startDate.getFullYear();
      
      // 상반기 (1~6월)
      const firstHalfStart = new Date(currentYear, 0, 1);
      const firstHalfEnd = new Date(currentYear, 6, 0);
      const firstHalfReservations = reservations.filter(r => {
        const rDate = new Date(r.date);
        return rDate >= firstHalfStart && rDate <= firstHalfEnd;
      });
      const firstHalfRevenue = firstHalfReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const firstHalfCount = firstHalfReservations.length;
      
      dailyRevenueData.push({
        date: '상반기',
        revenue: firstHalfRevenue,
        count: firstHalfCount,
        avgPerRental: firstHalfCount > 0 ? Math.floor(firstHalfRevenue / firstHalfCount) : 0
      });
      
      // 하반기 (7~12월)
      const secondHalfStart = new Date(currentYear, 6, 1);
      const secondHalfEnd = new Date(currentYear, 12, 0);
      const secondHalfReservations = reservations.filter(r => {
        const rDate = new Date(r.date);
        return rDate >= secondHalfStart && rDate <= secondHalfEnd;
      });
      const secondHalfRevenue = secondHalfReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const secondHalfCount = secondHalfReservations.length;
      
      dailyRevenueData.push({
        date: '하반기',
        revenue: secondHalfRevenue,
        count: secondHalfCount,
        avgPerRental: secondHalfCount > 0 ? Math.floor(secondHalfRevenue / secondHalfCount) : 0
      });
    } else if (range === 'yearly' || range === 'custom') {
      // 년도별: 1~12월까지 월별로 / 기간 선택: 년도 선택 월별로
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(startDate.getFullYear(), i, 1);
        const monthEnd = new Date(startDate.getFullYear(), i + 1, 0);
        
        const monthReservations = reservations.filter(r => {
          const rDate = new Date(r.date);
          return rDate >= monthStart && rDate <= monthEnd;
        });
        
        const monthRevenue = monthReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const monthCount = monthReservations.length;
        
        dailyRevenueData.push({
          date: `${i + 1}월`,
          revenue: monthRevenue,
          count: monthCount,
          avgPerRental: monthCount > 0 ? Math.floor(monthRevenue / monthCount) : 0
        });
      }
    } else {
      // 기본값: 일별 (최근 30일)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i < Math.min(daysDiff, 30); i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayReservations = reservations.filter(r => r.date === dateStr);
        const dayRevenue = dayReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const dayCount = dayReservations.length;

        dailyRevenueData.push({
          date: dateStr,
          revenue: dayRevenue,
          count: dayCount,
          avgPerRental: dayCount > 0 ? Math.floor(dayRevenue / dayCount) : 0
        });
      }
    }

    // 월별 매출 데이터 (최근 4개월)
    const monthlyRevenueData = [];
    for (let i = 3; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthReservations = reservations.filter(r => {
        const rDate = new Date(r.date);
        return rDate >= monthStart && rDate <= monthEnd;
      });

      const monthRevenue = monthReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      
      // 이전 달과 비교
      const prevMonth = new Date(monthDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
      const prevMonthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);

      const { data: prevMonthAllData } = await supabaseAdmin.from('reservations')
        .select('total_amount, status')
        .gte('date', prevMonthStart.toISOString().split('T')[0])
        .lte('date', prevMonthEnd.toISOString().split('T')[0]);

      const prevMonthData = (prevMonthAllData || []).filter(r => 
        r.status === 'approved' || 
        r.status === 'completed' || 
        r.status === 'checked_in'
      );
      const prevMonthRevenue = prevMonthData.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const monthGrowth = prevMonthRevenue > 0 
        ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 0;

      monthlyRevenueData.push({
        month: monthDate.toLocaleDateString('ko-KR', { month: 'long' }),
        revenue: monthRevenue,
        growth: Number(monthGrowth.toFixed(1))
      });
    }

    // 기기별 매출 분포
    const deviceRevenueMap = new Map();
    reservations.forEach((r: any) => {
      const deviceName = r.devices?.device_types?.name || '기타';
      const revenue = r.total_amount || 0;
      
      if (deviceRevenueMap.has(deviceName)) {
        const existing = deviceRevenueMap.get(deviceName);
        deviceRevenueMap.set(deviceName, {
          revenue: existing.revenue + revenue,
          count: existing.count + 1
        });
      } else {
        deviceRevenueMap.set(deviceName, { revenue, count: 1 });
      }
    });

    const deviceRevenue = Array.from(deviceRevenueMap.entries())
      .map(([name, data]: any) => ({
        name,
        revenue: data.revenue,
        count: data.count,
        percentage: Number(((data.revenue / totalRevenue) * 100).toFixed(1))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 시간대별 매출 (rental_time_slots 테이블 기준)
    
    const { data: timeSlots } = await supabaseAdmin.from('rental_time_slots')
      .select('start_time, end_time, slot_type')
      .order('start_time');

    const hourlyRevenueMap = new Map();
    
    reservations.forEach(r => {
      if (r.start_time && r.end_time) {
        const reservationStartTime = r.start_time; // "00:00:00" 형태
        const reservationEndTime = r.end_time; // "04:00:00" 또는 "05:00:00" 형태
        
        // 예약 시간과 정확히 매칭되는 시간대 슬롯 찾기
        const matchingSlot = timeSlots?.find(slot => {
          return slot.start_time === reservationStartTime && slot.end_time === reservationEndTime;
        });
        
        if (matchingSlot) {
          const startTime = matchingSlot.start_time;
          const endTime = matchingSlot.end_time;
          
          // 시간 표시 포맷 (0-5시는 24-29시로 표시)
          const startHour = parseInt(startTime.split(':')[0]);
          const endHour = parseInt(endTime.split(':')[0]);
          const displayStart = startHour < 6 ? startHour + 24 : startHour;
          const displayEnd = endHour < 6 ? endHour + 24 : endHour;
          
          const timeSlot = `${displayStart}-${displayEnd}`;
          const revenue = r.total_amount || 0;
          
          if (hourlyRevenueMap.has(timeSlot)) {
            hourlyRevenueMap.set(timeSlot, hourlyRevenueMap.get(timeSlot) + revenue);
          } else {
            hourlyRevenueMap.set(timeSlot, revenue);
          }
        }
      }
    });
    
    // 중복 제거된 시간대 목록 생성 (정렬 개선)
    const uniqueTimeSlots = new Set();
    timeSlots?.forEach(slot => {
      const startHour = parseInt(slot.start_time.split(':')[0]);
      const endHour = parseInt(slot.end_time.split(':')[0]);
      const displayStart = startHour < 6 ? startHour + 24 : startHour;
      const displayEnd = endHour < 6 ? endHour + 24 : endHour;
      uniqueTimeSlots.add(`${displayStart}-${displayEnd}`);
    });
    
    const hourlyRevenue = Array.from(uniqueTimeSlots)
      .map(timeSlot => ({
        hour: timeSlot,
        revenue: hourlyRevenueMap.get(timeSlot) || 0,
        percentage: totalRevenue > 0 ? Number(((hourlyRevenueMap.get(timeSlot) || 0) / totalRevenue * 100).toFixed(1)) : 0
      }))
      .sort((a: any, b: any) => {
        const aStart = parseInt(a.hour.split('-')[0]);
        const bStart = parseInt(b.hour.split('-')[0]);
        const aEnd = parseInt(a.hour.split('-')[1]);
        const bEnd = parseInt(b.hour.split('-')[1]);
        
        // 시작 시간이 같으면 종료 시간으로 정렬 (24-28이 24-29보다 먼저)
        if (aStart === bStart) {
          return aEnd - bEnd;
        }
        return aStart - bStart;
      });

    // 결제 방식별 매출 (실제 데이터 기반)
    const paymentMethodMap = new Map();
    reservations.forEach(r => {
      const method = r.payment_method || 'unknown';
      const revenue = r.total_amount || 0;
      
      if (paymentMethodMap.has(method)) {
        paymentMethodMap.set(method, paymentMethodMap.get(method) + revenue);
      } else {
        paymentMethodMap.set(method, revenue);
      }
    });

    const paymentMethodRevenue = Array.from(paymentMethodMap.entries())
      .map(([method, revenue]: any) => ({
        method: method === 'cash' ? '현금' : method === 'transfer' ? '계좌이체' : method,
        revenue,
        percentage: Number(((revenue / totalRevenue) * 100).toFixed(1)),
        color: method === 'cash' ? 'bg-green-500' : 'bg-blue-500'
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 최고 매출일 찾기
    const bestDay = dailyRevenueData.reduce((best: any, current: any) => 
      current.revenue > best.revenue ? current : best, 
      { date: '', revenue: 0, count: 0, avgPerRental: 0 }
    );

    const avgDailyRevenue = dailyRevenueData.length > 0 
      ? Math.floor(dailyRevenueData.reduce((sum, d) => sum + d.revenue, 0) / dailyRevenueData.length)
      : 0;

    // 응답 데이터
    const responseData = {
      summary: {
        totalRevenue,
        previousPeriodRevenue: previousRevenue,
        growthRate: Number(growthRate.toFixed(1)),
        avgDailyRevenue,
        avgRentalValue,
        totalRentals,
        peakDay: bestDay.date,
        peakDayRevenue: bestDay.revenue
      },
      dailyRevenue: dailyRevenueData,
      monthlyRevenue: monthlyRevenueData,
      deviceRevenue,
      hourlyRevenue,
      paymentMethodRevenue
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('매출 분석 API 오류:', error);
    console.error('매출 분석 API 오류 스택:', (error as Error).stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as Error).message 
    }, { status: 500 });
  }
}