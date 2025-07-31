import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * 단순화된 관리자 대시보드 API - 디버깅용
 */
export async function GET() {
  try {
    console.log('Simple dashboard API: Starting request')
    
    const supabase = createServiceRoleClient()
    console.log('Simple dashboard API: Created Supabase client')
    
    // 간단한 쿼리 테스트
    const { data: deviceCount, error: deviceError } = await supabase
      .from('devices')
      .select('id', { count: 'exact' })
    
    console.log('Device count query result:', { count: deviceCount?.length, error: deviceError })
    
    const { data: userCount, error: userError } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
    
    console.log('User count query result:', { count: userCount?.length, error: userError })
    
    return NextResponse.json({
      message: 'Simple dashboard API working',
      devices: deviceCount?.length || 0,
      users: userCount?.length || 0,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Simple dashboard API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      },
      { status: 500 }
    )
  }
}