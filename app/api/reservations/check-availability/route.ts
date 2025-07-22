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
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('rental_time_slots')
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
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
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
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_types')
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
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('devices')
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

    // 5. 각 시간대별로 예약 가능한 기기 확인
    const slots = timeSlots?.map(slot => {
      // 해당 시간대에 예약된 기기 번호들
      const reservedDeviceNumbers = reservations
        ?.filter(res => {
          const resStart = res.start_time;
          const resEnd = res.end_time;
          const slotStart = slot.start_time;
          const slotEnd = slot.end_time;
          
          // 시간 겹침 확인
          return !(resEnd <= slotStart || resStart >= slotEnd);
        })
        .map((res: any) => res.devices?.device_number) || [];

      // 예약되지 않은 모든 기기
      const unreservedDevices = devices
        ?.filter(device => !reservedDeviceNumbers.includes(device.device_number)) || [];

      // max_rental_units 제한 적용
      let availableDevices = unreservedDevices.map(d => d.device_number);
      
      // 이미 예약된 기기 수 확인
      const alreadyReservedCount = reservedDeviceNumbers.length;
      
      // max_rental_units가 설정되어 있고, 이미 최대 대여 수에 도달한 경우
      if (maxRentalUnits && alreadyReservedCount >= maxRentalUnits) {
        // 이미 최대 대여 수에 도달한 경우 예약 불가
        availableDevices = [];
      }
      // 그 외의 경우는 모든 예약되지 않은 기기를 표시

      return {
        id: slot.id,
        date: date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        device_type_id: deviceTypeId,
        max_devices: devices?.length || 0,
        available_devices: availableDevices,
        is_available: availableDevices.length > 0,
        slot_type: slot.slot_type,
        credit_options: slot.credit_options,
        enable_2p: slot.enable_2p,
        price_2p_extra: slot.price_2p_extra,
        is_youth_time: slot.is_youth_time
      };
    }) || [];

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}