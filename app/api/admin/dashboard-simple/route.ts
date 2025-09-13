import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'

/**
 * 단순화된 관리자 대시보드 API - 디버깅용
 */
export async function GET() {
  try {
    console.log('Simple dashboard API: Starting request')
    
    const supabase = createAdminClient()
    console.log('Simple dashboard API: Created Supabase client')
    
    // 간단한 쿼리 테스트
    const { count: deviceCount, error: deviceError } = await supabase
      .from('devices')
      .count()

    console.log('Device count query result:', { count: deviceCount, error: deviceError })

    const { count: userCount, error: userError } = await supabase
      .from('users')
      .count()

    console.log('User count query result:', { count: userCount, error: userError })
    
    return NextResponse.json({
      message: 'Simple dashboard API working',
      devices: deviceCount || 0,
      users: userCount || 0,
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