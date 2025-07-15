// 개인 예약 통계 API
// 비전공자 설명: 사용자의 개인 예약 데이터를 분석해서 통계를 제공하는 API입니다
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@/lib/supabase/server';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 개인 통계 API 호출 시작 ===');
    
    // 세션 확인
    const session = await getServerSession(authOptions);
    console.log('세션 확인:', !!session, session?.user?.email);
    
    if (!session?.user?.email) {
      console.log('세션 없음 - 401 반환');
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range') || '30days';
    console.log('요청 파라미터:', { dateRange });
    
    const supabase = await createClient();
    console.log('Supabase 클라이언트 생성 완료');

    // 사용자 정보 조회 (이메일 기반)
    console.log('사용자 정보 조회 시작:', session.user.email);
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();


    if (profileError || !profile) {
      console.log('사용자 정보 없음 - 빈 통계 반환');
      return NextResponse.json({ 
        success: true, 
        stats: {
          totalReservations: 0,
          completedReservations: 0,
          avgSessionTime: 0,
          totalSpent: 0,
          favoriteDevice: '데이터 없음',
          monthlyData: [],
          deviceUsage: [],
          preferredHours: [],
          weekdayPattern: []
        },
        dateRange,
        period: `데이터 없음`
      });
    }

    // 날짜 범위 계산
    const now = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '12months':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    console.log('날짜 범위 계산 완료:', { 
      startDate: startDate.toISOString().split('T')[0], 
      endDate: now.toISOString().split('T')[0],
      profileId: profile.id 
    });

    // 완료된 예약만 조회 (RLS 정책으로 자동 필터링)
    console.log('완료된 예약 데이터 조회 시작');
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        *,
        devices (
          device_number,
          device_types (
            id,
            name,
            model_name
          )
        )
      `)
      .eq('user_id', profile.id)
      .eq('status', 'completed')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    console.log('예약 데이터 조회 결과:', { 
      reservationsCount: reservations?.length || 0, 
      reservationsError,
      sampleReservation: reservations?.[0]
    });

    if (reservationsError) {
      console.error('예약 데이터 조회 오류:', reservationsError);
      return NextResponse.json(
        { error: '예약 데이터를 불러올 수 없습니다' },
        { status: 500 }
      );
    }

    const reservationList = reservations || [];

    // 기본 통계 계산
    const totalReservations = reservationList.length;
    const totalSpent = reservationList.reduce((sum, r) => sum + (r.total_amount || 0), 0);

    // 평균 이용시간 계산
    let avgSessionTime = 0;
    const validTimeReservations = reservationList.filter(r => r.start_time && r.end_time);
    
    if (validTimeReservations.length > 0) {
      const totalHours = validTimeReservations.reduce((sum, r) => {
        const start = new Date(`2024-01-01 ${r.start_time}`);
        const end = new Date(`2024-01-01 ${r.end_time}`);
        let diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        if (diffHours < 0) {
          diffHours += 24;
        }
        
        return sum + diffHours;
      }, 0);
      
      avgSessionTime = Math.round((totalHours / validTimeReservations.length) * 10) / 10;
    }

    // 월별 데이터 (12개월 기간일 때만)
    const monthlyData = [];
    if (dateRange === '12months') {
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthReservations = reservationList.filter(r => {
          const reservationDate = new Date(r.date);
          return reservationDate >= monthStart && reservationDate <= monthEnd;
        });
        
        monthlyData.push({
          month: date.toLocaleDateString('ko-KR', { month: 'short' }),
          completed: monthReservations.length,
          cancelled: 0
        });
      }
    }

    // 기기별 이용 현황
    const deviceUsageMap = new Map();
    
    reservationList.forEach(r => {
      if (r.devices?.device_types?.name) {
        const deviceName = r.devices.device_types.name;
        const existing = deviceUsageMap.get(deviceName) || { 
          device: deviceName, 
          count: 0, 
          totalTime: 0, 
          completedCount: 0 
        };
        
        existing.count++;
        
        if (r.start_time && r.end_time) {
          existing.completedCount++;
          const start = new Date(`2024-01-01 ${r.start_time}`);
          const end = new Date(`2024-01-01 ${r.end_time}`);
          let diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (diffHours < 0) diffHours += 24;
          existing.totalTime += diffHours;
        }
        
        deviceUsageMap.set(deviceName, existing);
      }
    });

    const deviceUsage = Array.from(deviceUsageMap.values())
      .map(device => ({
        device: device.device,
        count: device.count,
        percentage: totalReservations > 0 ? Math.round((device.count / totalReservations) * 100) : 0,
        avgTime: device.completedCount > 0 ? Math.round((device.totalTime / device.completedCount) * 10) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // 등록된 시간대 조회
    const { data: timeSlots } = await supabase
      .from('rental_time_slots')
      .select('start_time, end_time, slot_type')
      .order('start_time');

    // 시간대별 예약 매핑
    const timeSlotMap = new Map();
    
    reservationList.forEach(r => {
      if (r.start_time && timeSlots) {
        // 예약 시작 시간과 매칭되는 시간대 찾기
        const matchingSlot = timeSlots.find(slot => 
          slot.start_time === r.start_time || 
          (r.start_time >= slot.start_time && r.start_time < slot.end_time)
        );
        
        if (matchingSlot) {
          const timeSlotKey = `${matchingSlot.start_time.substring(0, 5)}-${matchingSlot.end_time.substring(0, 5)}`;
          timeSlotMap.set(timeSlotKey, (timeSlotMap.get(timeSlotKey) || 0) + 1);
        }
      }
    });

    // 등록된 시간대 기반으로 선호 시간대 생성
    const uniqueTimeSlots = timeSlots ? [...new Set(timeSlots.map(slot => 
      `${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`
    ))].sort() : [];

    const preferredHours = uniqueTimeSlots.map(timeSlot => ({
      hour: timeSlot,
      count: timeSlotMap.get(timeSlot) || 0,
      percentage: totalReservations > 0 ? Math.round(((timeSlotMap.get(timeSlot) || 0) / totalReservations) * 100) : 0
    }));

    // 요일별 패턴
    const weekdayMap = new Map();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    
    reservationList.forEach(r => {
      const date = new Date(r.date);
      const dayIndex = date.getDay();
      const dayName = weekdays[dayIndex];
      weekdayMap.set(dayName, (weekdayMap.get(dayName) || 0) + 1);
    });

    const weekdayPattern = weekdays.map(day => ({
      day,
      count: weekdayMap.get(day) || 0,
      percentage: totalReservations > 0 ? Math.round(((weekdayMap.get(day) || 0) / totalReservations) * 100) : 0
    }));

    // 선호 기기 찾기
    const favoriteDevice = deviceUsage.length > 0 ? deviceUsage[0].device : '데이터 없음';

    const stats = {
      totalReservations,
      completedReservations: totalReservations,
      avgSessionTime,
      totalSpent,
      favoriteDevice,
      monthlyData,
      deviceUsage,
      preferredHours,
      weekdayPattern
    };

    return NextResponse.json({ 
      success: true, 
      stats,
      dateRange,
      period: `${startDate.toLocaleDateString('ko-KR')} ~ ${now.toLocaleDateString('ko-KR')}`
    });

  } catch (error) {
    console.error('=== 개인 통계 API 오류 ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    
    return NextResponse.json(
      { 
        error: '통계 데이터를 불러오는 중 오류가 발생했습니다',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}