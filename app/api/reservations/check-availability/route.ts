import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const body = await request.json();
    const { date, device_type_id: deviceTypeId } = body;

    if (!date || !deviceTypeId) {
      return NextResponse.json(
        { error: '날짜와 기기 타입을 지정해주세요' },
        { status: 400 }
      );
    }

    // 1. 해당 기기 타입의 시간대 정보 가져오기
    const { data: timeSlots, error: slotsError } = await supabaseAdmin.from('rental_time_slots')
      .select('*')
      .eq('device_type_id', deviceTypeId)
      .order('start_time');

    if (slotsError) {
      console.error('시간대 조회 오류:', slotsError);
      return NextResponse.json(
        { error: '시간대 조회에 실패했습니다' },
        { status: 500 }
      );
    }
    
    console.log('등록된 시간대:', timeSlots?.map(ts => ({
      slot_type: ts.slot_type,
      start_time: ts.start_time,
      end_time: ts.end_time
    })))

    // 2. 해당 날짜의 예약 조회
    const { data: reservations, error: reservationsError } = await supabaseAdmin.from('reservations')
      .select(`
        id,
        device_id,
        start_time,
        end_time,
        status,
        devices!inner(
          id,
          device_number,
          device_type_id
        )
      `)
      .eq('date', date)
      .eq('devices.device_type_id', deviceTypeId)
      .in('status', ['pending', 'approved', 'checked_in']);

    if (reservationsError) {
      console.error('예약 조회 오류:', reservationsError);
      return NextResponse.json(
        { error: '예약 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    // 3. 기기 타입 정보 가져오기 (max_rental_units 확인용)
    const { data: deviceType, error: typeError } = await supabaseAdmin.from('device_types')
      .select('name, rental_settings')
      .eq('id', deviceTypeId)
      .single();

    if (typeError) {
      console.error('기기 타입 조회 오류:', typeError);
      return NextResponse.json(
        { error: '기기 타입 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    const maxRentalUnits = deviceType?.rental_settings?.max_rental_units || null;

    // 4. 기기 정보 가져오기 (available과 in_use 상태만)
    const { data: devices, error: devicesError } = await supabaseAdmin.from('devices')
      .select('*')
      .eq('device_type_id', deviceTypeId)
      .in('status', ['available', 'in_use'])
      .order('device_number');

    if (devicesError) {
      console.error('기기 조회 오류:', devicesError);
      return NextResponse.json(
        { error: '기기 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    // 5. 각 시간대별로 사용 가능한 기기 수 계산
    const availability = (timeSlots || []).map(slot => {
      // 해당 시간대에 예약된 기기들 찾기
      const reservedDeviceIds = (reservations || [])
        .filter(reservation => {
          const reservationStart = reservation.start_time;
          const reservationEnd = reservation.end_time;
          const slotStart = slot.start_time;
          const slotEnd = slot.end_time;
          
          // 시간대 겹침 확인
          return reservationStart < slotEnd && reservationEnd > slotStart;
        })
        .map(r => r.device_id);

      // 사용 가능한 기기들 찾기
      const availableDevices = (devices || []).filter(device => 
        !reservedDeviceIds.includes(device.id)
      );

      // 동시 예약 가능 대수 계산
      const totalAvailable = availableDevices.length;
      const maxBookable = maxRentalUnits ? Math.min(totalAvailable, maxRentalUnits) : totalAvailable;

      return {
        ...slot,
        total_devices: devices?.length || 0,
        available_count: totalAvailable,
        max_bookable: maxBookable,
        available_devices: availableDevices.map(d => ({
          id: d.id,
          device_number: d.device_number,
          location: d.location
        })),
        is_available: totalAvailable > 0
      };
    });

    console.log('가용성 계산 결과:', availability.map(a => ({
      time: `${a.start_time} - ${a.end_time}`,
      available: a.available_count,
      max: a.max_bookable
    })));

    return NextResponse.json({
      availability,
      time_slots: timeSlots,
      device_type: {
        id: deviceTypeId,
        name: deviceType?.name,
        max_rental_units: maxRentalUnits
      }
    });

  } catch (error) {
    console.error('가용성 체크 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}