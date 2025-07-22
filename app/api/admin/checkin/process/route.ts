import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
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

    // 요청 데이터 파싱
    const body = await request.json();
    const { reservationId, additionalNotes } = body;

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    // 예약 정보 조회
    
  const { data: reservationsData } = await supabaseAdmin.from('reservations')
      .select('*, users:user_id(name, nickname)')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // 체크인 업데이트 데이터
    const updateData: any = {
      status: 'checked_in',
      check_in_at: new Date().toISOString(),
      check_in_by: userData.id,
      actual_start_time: new Date().toISOString(),
      payment_status: 'pending' // 모든 결제는 수동 확인 필요
    };

    // 추가 메모가 있으면 저장 (기존 메모 덮어쓰기)
    if (additionalNotes) {
      updateData.admin_notes = additionalNotes;
    }

    // 예약 상태 업데이트
    
  const { data: reservationsData2 } = await supabaseAdmin.from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('Reservation update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update reservation',
        details: updateError.message 
      }, { status: 500 });
    }

    // 기기 상태 업데이트
    if (reservation.device_id) {
      console.log('기기 상태 업데이트 시작 (device_id 사용):', {
        device_id: reservation.device_id,
        assigned_device_number: reservation.assigned_device_number
      });
      
      // device_id를 사용하여 정확한 기기 업데이트
      
  const { data: devicesData } = await supabaseAdmin.from('devices')
        .update({ status: 'in_use' })
        .eq('id', reservation.device_id)
        .select();
        
      if (deviceError) {
        console.error('Device update by ID failed:', deviceError);
      } else {
        console.log('Device update by ID success:', deviceData);
      }
    } else if (reservation.assigned_device_number && reservation.device_type_id) {
      // device_id가 없는 경우 device_number와 device_type_id로 시도
      console.log('기기 상태 업데이트 시작 (device_number + device_type_id 사용):', {
        assigned_device_number: reservation.assigned_device_number,
        device_type_id: reservation.device_type_id
      });

  const { data: devicesData2 } = await supabaseAdmin.from('devices')
        .update({ status: 'in_use' })
        .eq('device_number', reservation.assigned_device_number)
        .eq('device_type_id', reservation.device_type_id)
        .select();
        
      if (deviceError) {
        console.error('Device update by number+type failed:', deviceError);
      } else {
        console.log('Device update by number+type success:', deviceData);
      }
    } else {
      console.log('device_id와 device_type_id가 모두 없어서 기기 상태 업데이트 건너뜀');
    }

    return NextResponse.json({ 
      success: true,
      data: updatedReservation 
    });

  } catch (error: any) {
    console.error('Checkin process error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}