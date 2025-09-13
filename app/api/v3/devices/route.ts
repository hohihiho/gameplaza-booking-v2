import { NextRequest, NextResponse } from 'next/server'
import { listDevices } from '@/lib/db/adapter'
import { auth } from '@/lib/auth'

// GET /api/v3/devices
export async function GET(req: NextRequest) {
  try {
    // Better Auth 세션 체크
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: '로그인이 필요합니다'
      }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    // 기기 목록 조회
    const devices = await listDevices({
      category,
      includeInactive
    })
    
    // 카테고리별로 그룹화
    const groupedDevices = devices.reduce((acc, device) => {
      const category = device.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(device)
      return acc
    }, {} as Record<string, typeof devices>)
    
    return NextResponse.json({
      success: true,
      devices,
      grouped: groupedDevices,
      total: devices.length
    })
  } catch (error) {
    console.error('GET /api/v3/devices error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}