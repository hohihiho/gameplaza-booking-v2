import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 기기 타입 목록 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('device_types')
      .select(`
        *,
        devices(
          id,
          device_number,
          location,
          status,
          is_active
        )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    // 카테고리 필터링
    if (category) {
      query = query.eq('category', category)
    }

    const { data: deviceTypes, error } = await query

    if (error) {
      console.error('Device types error:', error)
      return NextResponse.json({ error: '기기 목록을 불러올 수 없습니다' }, { status: 500 })
    }

    // 각 기기 타입별로 활성 기기 수 계산
    const deviceTypesWithCount = deviceTypes.map(type => ({
      ...type,
      active_device_count: type.devices.filter((d: any) => d.is_active && d.status === 'available').length,
      total_device_count: type.devices.filter((d: any) => d.is_active).length
    }))

    return NextResponse.json({ deviceTypes: deviceTypesWithCount })

  } catch (error) {
    console.error('Device types API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 관리자용: 기기 타입 생성
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      category,
      description,
      basePrice,
      priceMultiplier2p = 1.5,
      maxPlayers = 1,
      requiresApproval = true,
      imageUrl,
      displayOrder = 0
    } = body

    // 기기 타입 생성
    const { data: deviceType, error } = await supabase
      .from('device_types')
      .insert({
        name,
        category,
        description,
        base_price: basePrice,
        price_multiplier_2p: priceMultiplier2p,
        max_players: maxPlayers,
        requires_approval: requiresApproval,
        image_url: imageUrl,
        display_order: displayOrder,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Create device type error:', error)
      return NextResponse.json({ error: '기기 타입 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      deviceType,
      message: '기기 타입이 생성되었습니다'
    })

  } catch (error) {
    console.error('Device type API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}