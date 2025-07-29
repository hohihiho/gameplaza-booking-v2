import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    console.log('고객 분석 API - 세션 확인:', {
      hasSession: !!session,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.email) {
      console.log('고객 분석 API - 인증 실패: 세션 없음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
  const { data: userData, error: userError } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    console.log('고객 분석 API - 사용자 데이터 조회:', {
      hasUserData: !!userData,
      userId: userData?.id,
      userError
    });

    if (!userData) {
      console.log('고객 분석 API - 사용자 찾을 수 없음:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

  const { data: adminData, error: adminError } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    console.log('고객 분석 API - 관리자 데이터 조회:', {
      hasAdminData: !!adminData,
      isAdmin: !!adminData,
      adminError
    });

    if (!adminData) {
      console.log('고객 분석 API - 관리자 권한 없음:', userData.id);
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
        case '12months':
          // 12개월 전부터
          startDate.setMonth(startDate.getMonth() - 12);
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
          // 기본값: 지난 30일
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    console.log('고객 분석 API - 날짜 범위:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      range 
    });

    // 고객 통계 조회 - 모든 상태의 예약 포함 (rejected, cancelled 제외)
    
  const { data: allReservations, error: reservationsError } = await supabaseAdmin.from('reservations')
      .select(`
        id,
        created_at,
        user_id,
        status,
        users(id, email, created_at)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    console.log('고객 분석 - 전체 예약 데이터:', {
      count: allReservations?.length || 0,
      statuses: allReservations?.map(r => r.status),
      sampleData: allReservations?.slice(0, 3)
    });

    // 고객 분석에 포함할 예약들 (거절되거나 취소된 것 제외)
    const reservations = (allReservations || []).filter(r => 
      r.status !== 'rejected' && r.status !== 'cancelled'
    );

    console.log('고객 분석용 예약:', {
      total: reservations.length,
      filteredFromTotal: allReservations?.length || 0
    });

    if (reservationsError) {
      console.error('고객 데이터 조회 오류:', reservationsError);
      console.error('고객 API - 상세 에러:', {
        message: reservationsError.message,
        details: reservationsError.details,
        hint: reservationsError.hint,
        code: reservationsError.code
      });
      return NextResponse.json({ 
        error: 'Failed to fetch customer data',
        details: reservationsError.message 
      }, { status: 500 });
    }

    // 고객별 통계 계산
    const customerMap = new Map();
    const userFirstReservations = new Map();

    reservations?.forEach(reservation => {
      const userId = reservation.user_id;
      const userCreatedAt = new Date((reservation.users as any).created_at);
      const reservationDate = new Date(reservation.created_at);

      // 고객별 예약 수 계산
      if (customerMap.has(userId)) {
        customerMap.set(userId, {
          ...customerMap.get(userId),
          reservationCount: customerMap.get(userId).reservationCount + 1
        });
      } else {
        customerMap.set(userId, {
          userId,
          email: (reservation.users as any).email,
          userCreatedAt,
          reservationCount: 1,
          isNewCustomer: userCreatedAt >= startDate
        });
      }

      // 첫 번째 예약 날짜 추적
      if (!userFirstReservations.has(userId) || reservationDate < userFirstReservations.get(userId)) {
        userFirstReservations.set(userId, reservationDate);
      }
    });

    const customers = Array.from(customerMap.values());
    
    // 기본 통계
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => c.isNewCustomer).length;
    const returningCustomers = customers.filter(c => c.reservationCount > 1).length;

    // 이전 기간 데이터 (비교용)
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(endDate);
    const periodLength = endDate.getTime() - startDate.getTime();
    prevStartDate.setTime(startDate.getTime() - periodLength);
    prevEndDate.setTime(endDate.getTime() - periodLength);

  const { data: prevAllReservations } = await supabaseAdmin.from('reservations')
      .select('user_id, status, users(created_at)')
      .gte('created_at', prevStartDate.toISOString())
      .lte('created_at', prevEndDate.toISOString());

    const prevReservations = (prevAllReservations || []).filter((r: any) => 
      r.status !== 'rejected' && r.status !== 'cancelled'
    );

    const prevCustomerMap = new Map();
    prevReservations?.forEach((reservation: any) => {
      const userId = reservation.user_id;
      if (prevCustomerMap.has(userId)) {
        prevCustomerMap.set(userId, prevCustomerMap.get(userId) + 1);
      } else {
        prevCustomerMap.set(userId, 1);
      }
    });

    const previousTotalCustomers = prevCustomerMap.size;
    const customerGrowthRate = previousTotalCustomers > 0 
      ? ((totalCustomers - previousTotalCustomers) / previousTotalCustomers) * 100 
      : 0;

    // 일별 고객 데이터 생성
    const dailyCustomerData = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(daysDiff, 30); i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayReservations = reservations?.filter(r => {
        const resDate = new Date(r.created_at);
        return resDate >= dayStart && resDate <= dayEnd;
      }) || [];

      const dayCustomers = new Set(dayReservations.map(r => r.user_id));
      const dayNewCustomers = dayReservations.filter(r => {
        const userCreated = new Date((r.users as any).created_at);
        return userCreated >= dayStart && userCreated <= dayEnd;
      }).length;

      dailyCustomerData.push({
        date: date.toISOString().split('T')[0],
        totalCustomers: dayCustomers.size,
        newCustomers: dayNewCustomers,
        returningCustomers: dayCustomers.size - dayNewCustomers
      });
    }

    // 고객 세그먼트 분석
    const segments = {
      vip: customers.filter(c => c.reservationCount >= 10).length,
      regular: customers.filter(c => c.reservationCount >= 3 && c.reservationCount < 10).length,
      occasional: customers.filter(c => c.reservationCount >= 2 && c.reservationCount < 3).length,
      newCustomer: customers.filter(c => c.reservationCount === 1).length
    };

    // 시간대별 고객 활동 (더미 데이터 - 실제로는 reservation 시간 기반으로 계산)
    const hourlyActivity = Array.from({ length: 6 }, (_, i) => {
      const startHour = 10 + (i * 2);
      const endHour = startHour + 2;
      const customers = Math.floor(Math.random() * 100) + 50;
      return {
        hour: `${startHour}-${endHour}`,
        customers,
        percentage: Math.floor((customers / 600) * 100)
      };
    });

    // 응답 데이터
    const responseData = {
      summary: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        growthRate: Number(customerGrowthRate.toFixed(1)),
        avgReservationsPerCustomer: Number((totalCustomers > 0 ? (reservations?.length || 0) / totalCustomers : 0).toFixed(1)),
        topCustomerReservations: Math.max(...customers.map(c => c.reservationCount), 0)
      },
      dailyData: dailyCustomerData,
      segments: {
        vip: { count: segments.vip, percentage: Number(((segments.vip / totalCustomers) * 100).toFixed(1)) },
        regular: { count: segments.regular, percentage: Number(((segments.regular / totalCustomers) * 100).toFixed(1)) },
        occasional: { count: segments.occasional, percentage: Number(((segments.occasional / totalCustomers) * 100).toFixed(1)) },
        newCustomer: { count: segments.newCustomer, percentage: Number(((segments.newCustomer / totalCustomers) * 100).toFixed(1)) }
      },
      hourlyActivity,
      retentionData: [
        { period: '1주 후', rate: 65 },
        { period: '2주 후', rate: 48 },
        { period: '1개월 후', rate: 35 },
        { period: '2개월 후', rate: 28 },
        { period: '3개월 후', rate: 22 }
      ]
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('고객 분석 API 오류:', error);
    console.error('고객 분석 API 오류 스택:', (error as Error).stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as Error).message 
    }, { status: 500 });
  }
}