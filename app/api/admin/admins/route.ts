import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

// 권한 확인 헬퍼 함수
async function checkSuperAdmin(email: string): Promise<boolean> {
  try {
    // 사용자 ID 찾기
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!userData) return false;

    // 슈퍼관리자 권한 확인
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .eq('is_super_admin', true)
      .single();

    return !!adminData;
  } catch {
    return false;
  }
}

// 관리자 목록 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 슈퍼관리자 권한 확인
    const isSuperAdmin = await checkSuperAdmin(session.user.email);
    
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 관리자 목록 조회
    const { data: admins, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 사용자 이메일 정보 추가
    const userIds = admins?.map(admin => admin.user_id) || [];
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const adminsWithEmail = admins?.map(admin => ({
      ...admin,
      email: users?.find(u => u.id === admin.user_id)?.email || '알 수 없음',
      role: admin.is_super_admin ? 'super_admin' : 'admin'
    })) || [];

    return NextResponse.json({ admins: adminsWithEmail });

  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 관리자 추가
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 슈퍼관리자 권한 확인
    const isSuperAdmin = await checkSuperAdmin(session.user.email);
    
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요' }, { status: 400 });
    }

    // 이메일로 사용자 찾기
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ 
        error: '해당 이메일로 가입한 사용자를 찾을 수 없습니다' 
      }, { status: 404 });
    }

    // 이미 관리자인지 확인
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('user_id', userData.id)
      .single();

    if (existingAdmin) {
      return NextResponse.json({ 
        error: '이미 관리자로 등록된 사용자입니다' 
      }, { status: 400 });
    }

    // 관리자 추가
    const { error: insertError } = await supabaseAdmin
      .from('admins')
      .insert({ 
        user_id: userData.id,
        is_super_admin: false,
        permissions: {
          cms: true,
          users: true,
          devices: true,
          reservations: true
        }
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Add admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}