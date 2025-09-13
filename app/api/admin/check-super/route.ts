import { getDB, supabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { createAdminClient } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 ID 조회
    const supabaseAdmin = createAdminClient();
  const { data: userData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ isSuperAdmin: false });
    }

    // 슈퍼관리자 여부 확인
    
  const { data: adminData } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    return NextResponse.json({ 
      isSuperAdmin: adminData?.is_super_admin || false 
    });

  } catch (error) {
    console.error('Check super admin error:', error);
    return NextResponse.json({ isSuperAdmin: false });
  }
}