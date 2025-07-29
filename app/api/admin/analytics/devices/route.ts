import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    console.log('기종 분석 API 시작');
    
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
    // const deviceTypeId = searchParams.get('deviceType'); // 특정 기종 필터링 - 사용하지 않음

    // 날짜 범위 계산
    let startDate: Date;
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    if (range === 'custom' && yearParam) {
      const year = parseInt(yearParam);
      startDate = new Date(year, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(year, 11, 31);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      switch (range) {
        case 'week':
          const day = startDate.getDay();
          const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
          startDate.setDate(diff);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'quarter':
          const quarter = Math.floor(startDate.getMonth() / 3);
          startDate = new Date(startDate.getFullYear(), quarter * 3, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), (quarter + 1) * 3, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '12months':
          startDate.setMonth(startDate.getMonth() - 12);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // 기종별 예약 데이터 조회 - deviceFilter는 현재 사용하지 않음

    const { data: reservations, error: reservationsError } = await supabaseAdmin.from('reservations')
      .select(`
        id,
        date,
        time_start,
        time_end,
        total_amount,
        status,
        refund_amount,
        device_id,
        credit_type,
        devices!inner(
          id,
          device_number,
          device_type_id,
          device_types!inner(
            id,
            name,
            category_id
          )
        )
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (reservationsError) {
      console.error('기종 분석 데이터 조회 오류:', reservationsError);
      console.error('기종 분석 API - 상세 에러:', {
        message: reservationsError.message,
        details: reservationsError.details,
        hint: reservationsError.hint,
        code: reservationsError.code
      });
      return NextResponse.json({ 
        error: 'Failed to fetch device analytics data',
        details: reservationsError.message 
      }, { status: 500 });
    }

    console.log('기종 분석 - 예약 데이터:', {
      total: reservations?.length || 0,
      sample: reservations?.slice(0, 3)
    });

    // 모든 기종 목록 조회
    
    const { data: deviceTypes } = await supabaseAdmin.from('device_types')
      .select('id, name, category_id')
      .order('name');

    // 기종별 분석 데이터 생성
    const deviceAnalytics: any = {};

    deviceTypes?.forEach((deviceType: any) => {
      const deviceReservations = reservations?.filter((r: any) => 
        r.devices.device_types.id === deviceType.id
      ) || [];

      // 기본 통계
      const totalReservations = deviceReservations.length;
      const completedReservations = deviceReservations.filter((r: any) => 
        r.status === 'approved' || r.status === 'completed' || r.status === 'checked_in'
      );
      const cancelledReservations = deviceReservations.filter((r: any) => r.status === 'cancelled');
      const noShowReservations = deviceReservations.filter((r: any) => r.status === 'no_show');
      
      const totalRevenue = completedReservations.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);
      const totalRefunds = deviceReservations.reduce((sum: number, r: any) => sum + (r.refund_amount || 0), 0);

      // 시간대별 분석
      const hourlyBookings: any = {};
      deviceReservations.forEach((r: any) => {
        if (r.time_start) {
          const hour = parseInt(r.time_start.split(':')[0]);
          const timeSlot = `${hour}-${hour + 2}`;
          hourlyBookings[timeSlot] = (hourlyBookings[timeSlot] || 0) + 1;
        }
      });

      // 기기 번호별 사용 빈도
      const deviceUsage: any = {};
      deviceReservations.forEach((r: any) => {
        const deviceNumber = r.devices.device_number;
        deviceUsage[deviceNumber] = (deviceUsage[deviceNumber] || 0) + 1;
      });

      // 크레딧 옵션별 분석
      const creditOptions: any = {
        freeplay: { count: 0, revenue: 0 },
        fixed: { count: 0, revenue: 0 },
        unlimited: { count: 0, revenue: 0 }
      };

      deviceReservations.forEach((r: any) => {
        const creditType = r.credit_type || 'freeplay';
        const isCompleted = r.status === 'approved' || r.status === 'completed' || r.status === 'checked_in';
        
        if (creditOptions[creditType]) {
          creditOptions[creditType].count += 1;
          if (isCompleted) {
            creditOptions[creditType].revenue += (r.total_amount || 0);
          }
        }
      });

      // 크레딧 옵션별 백분율 계산
      const creditAnalysis = Object.entries(creditOptions).map(([type, data]: any) => {
        const creditData = data as { count: number; revenue: number };
        return {
          type,
          count: creditData.count,
          revenue: creditData.revenue,
          percentage: totalReservations > 0 ? Math.round((creditData.count / totalReservations) * 100) : 0
        };
      });

      // 상태별 비율 계산
      const statusRates = {
        completion: totalReservations > 0 ? (completedReservations.length / totalReservations) * 100 : 0,
        cancellation: totalReservations > 0 ? (cancelledReservations.length / totalReservations) * 100 : 0,
        noShow: totalReservations > 0 ? (noShowReservations.length / totalReservations) * 100 : 0
      };

      deviceAnalytics[deviceType.id] = {
        deviceType: {
          id: deviceType.id,
          name: deviceType.name,
          category_id: deviceType.category_id
        },
        summary: {
          totalReservations,
          completedReservations: completedReservations.length,
          totalRevenue,
          totalRefunds,
          avgRevenuePerReservation: completedReservations.length > 0 
            ? Math.floor(totalRevenue / completedReservations.length) : 0
        },
        statusRates,
        hourlyBookings: Object.entries(hourlyBookings)
          .map(([timeSlot, count]: any) => ({
            timeSlot,
            count: count as number,
            percentage: totalReservations > 0 ? Math.round((count as number / totalReservations) * 100) : 0
          }))
          .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)),
        deviceUsage: Object.entries(deviceUsage)
          .map(([deviceNumber, count]: any) => ({
            deviceNumber: parseInt(deviceNumber as string),
            count: count as number,
            percentage: totalReservations > 0 ? Math.round((count as number / totalReservations) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count), // 사용 빈도 순으로 정렬
        creditAnalysis: creditAnalysis.sort((a, b) => b.count - a.count) // 사용량 순으로 정렬
      };
    });

    // 전체 기종 비교 데이터
    const overallSummary = {
      totalDeviceTypes: deviceTypes?.length || 0,
      totalReservations: reservations?.length || 0,
      totalRevenue: Object.values(deviceAnalytics).reduce((sum: number, data: any) => 
        sum + data.summary.totalRevenue, 0),
      mostPopularDevice: Object.values(deviceAnalytics).reduce((max: any, current: any) => 
        current.summary.totalReservations > (max?.summary?.totalReservations || 0) ? current : max, null),
      leastPopularDevice: Object.values(deviceAnalytics).reduce((min: any, current: any) => 
        current.summary.totalReservations < (min?.summary?.totalReservations || Infinity) ? current : min, null)
    };

    const responseData = {
      summary: overallSummary,
      deviceAnalytics,
      deviceTypes: deviceTypes?.map(dt => ({
        id: dt.id,
        name: dt.name,
        category_id: dt.category_id
      })) || []
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('기종 분석 API 오류:', error);
    console.error('기종 분석 API 오류 스택:', (error as Error).stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as Error).message 
    }, { status: 500 });
  }
}