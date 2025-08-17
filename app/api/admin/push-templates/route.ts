import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase';

// 푸시 메시지 템플릿 목록 조회
export async function GET(req: NextRequest) {
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
      .select('id')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: templates, error } = await supabaseAdmin
      .from('push_message_templates')
      .select('*')
      .order('template_key', { ascending: true });

    if (error) {
      console.error('푸시 메시지 템플릿 조회 오류:', error);
      return NextResponse.json(
        { error: '템플릿을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templates: templates || []
    });

  } catch (error) {
    console.error('푸시 템플릿 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 푸시 메시지 템플릿 업데이트
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { template_key, title, body: messageBody, is_active } = body;

    if (!template_key || !title || !messageBody) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
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
      .select('id')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('push_message_templates')
      .update({
        title,
        body: messageBody,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('template_key', template_key)
      .select()
      .single();

    if (error) {
      console.error('푸시 메시지 템플릿 업데이트 오류:', error);
      return NextResponse.json(
        { error: '템플릿 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: data,
      message: '템플릿이 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('푸시 템플릿 업데이트 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}