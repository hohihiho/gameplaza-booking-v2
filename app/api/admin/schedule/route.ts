import { createAdminClient } from '@/lib/supabase';
import { auth } from "@/auth"
import { NextResponse } from 'next/server';
// GET: 일정 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    // NextAuth 세션 확인
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 데이터베이스에서 관리자 권한 확인
    const { data: userData } = await supabase.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const { data: adminData } = await supabase.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: '관리자 권한이 없습니다' }, { status: 403 });
    }

    let query = supabase
      .from('schedule_events')
      .select('*, is_auto_generated, source_type')
      .order('date', { ascending: true });

    // 년월 필터링
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      query = query
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('일정 조회 오류:', error);
      return NextResponse.json({ error: '일정 조회에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('일정 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST: 새 일정 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // NextAuth 세션 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 데이터베이스에서 관리자 권한 확인
    const { data: userData } = await supabase.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const { data: adminData } = await supabase.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: '관리자 권한이 없습니다' }, { status: 403 });
    }

    // 필수 필드 검증
    if (!body.date || !body.type || !body.title) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다' }, { status: 400 });
    }

    // 일정 생성
    const insertData = {
      date: body.date,
      end_date: body.endDate || null,
      title: body.title,
      type: body.type,
      description: body.description || null,
      start_time: body.startTime && body.startTime !== '' ? body.startTime : null,
      end_time: body.endTime && body.endTime !== '' ? body.endTime : null,
      is_recurring: body.isRecurring || false,
      recurring_type: body.recurringType || null,
      affects_reservation: body.type === 'reservation_block' ? true : (body.affectsReservation ?? false),
      block_type: body.blockType || null,
      created_by: null
    };

    const { data: event, error } = await supabase.from('schedule_events')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('일정 생성 오류:', error);
      return NextResponse.json({ error: '일정 생성에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('일정 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PATCH: 일정 수정
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    // NextAuth 세션 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 데이터베이스에서 관리자 권한 확인
    const { data: userData } = await supabase.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const { data: adminData } = await supabase.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: '관리자 권한이 없습니다' }, { status: 403 });
    }

    if (!body.id) {
      return NextResponse.json({ error: '일정 ID가 필요합니다' }, { status: 400 });
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    if (body.date !== undefined) updateData.date = body.date;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startTime !== undefined) updateData.start_time = body.startTime === '' ? null : body.startTime;
    if (body.endTime !== undefined) updateData.end_time = body.endTime === '' ? null : body.endTime;
    if (body.isRecurring !== undefined) updateData.is_recurring = body.isRecurring;
    if (body.recurringType !== undefined) updateData.recurring_type = body.recurringType;
    if (body.affectsReservation !== undefined) updateData.affects_reservation = body.affectsReservation;
    if (body.blockType !== undefined) updateData.block_type = body.blockType;

    const { data: event, error } = await supabase.from('schedule_events')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('일정 수정 오류:', error);
      return NextResponse.json({ error: '일정 수정에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('일정 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// DELETE: 일정 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '일정 ID가 필요합니다' }, { status: 400 });
    }
    
    // NextAuth 세션 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 데이터베이스에서 관리자 권한 확인
    const { data: userData } = await supabase.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const { data: adminData } = await supabase.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: '관리자 권한이 없습니다' }, { status: 403 });
    }

    const { error } = await supabase.from('schedule_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('일정 삭제 오류:', error);
      return NextResponse.json({ error: '일정 삭제에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('일정 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}