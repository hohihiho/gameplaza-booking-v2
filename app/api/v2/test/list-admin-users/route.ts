import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// 관리자 계정 목록 확인
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    
    // 관리자 계정 조회
    const { data: admins, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // 전체 사용자 중 일부 확인
    const allUsers = await supabase
      .from('users')
      .select('*')
      .limit(20)
    
    return NextResponse.json({ 
      admins: admins || [],
      adminCount: admins?.length || 0,
      allUsers: allUsers.data || [],
      message: 'ndz5496를 찾고 있다면, phone_number 필드를 확인하세요'
    })
    
  } catch (error: any) {
    console.error('사용자 조회 오류:', error)
    return NextResponse.json(
      { error: error.message || '사용자 조회 실패' },
      { status: 400 }
    )
  }
}