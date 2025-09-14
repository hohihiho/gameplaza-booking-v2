import { NextResponse } from 'next/server'
import { d1CountDevices, d1CountUsers } from '@/lib/db/d1'

/**
 * 단순화된 관리자 대시보드 API - 디버깅용
 */
export async function GET() {
  try {
    console.log('Simple dashboard API: Starting request')
    
    // D1 집계
    const deviceCount = await d1CountDevices()
    const userCount = await d1CountUsers()
    
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
