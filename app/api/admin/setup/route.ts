import { createAdminClient } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * 관리자 설정 API - 개발 환경에서만 사용
 * 임시로 관리자 권한을 부여하기 위한 엔드포인트
 */
export async function POST() {
  // 개발 환경에서만 작동
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    import { getDB, supabase } from '@/lib/db';
    
    // 첫 번째 사용자를 관리자로 설정
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(1)
    
    if (userError) {
      console.error('User fetch error:', userError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }
    
    const user = users[0]
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // 사용자 role을 admin으로 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('User update error:', updateError)
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }
    
    // admins 테이블에 추가 (이미 있으면 무시)
    const { error: adminError } = await supabase
      .from('admins')
      .upsert({
        user_id: user?.id || '',
        is_super_admin: true,
        permissions: {
          reservations: true,
          users: true,
          devices: true,
          cms: true,
          analytics: true
        }
      }, {
        onConflict: 'user_id'
      })
    
    if (adminError) {
      console.log('Admin insert error (might be expected):', adminError)
      // admins 테이블이 없을 수도 있으므로 에러를 무시
    }
    
    return NextResponse.json({
      success: true,
      message: `User ${user?.email || ''} has been granted admin privileges`,
      user: {
        id: user?.id || '',
        email: user?.email || '',
        name: user?.name || '',
        role: 'admin'
      }
    })
    
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}