import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// 플레이 모드 업데이트 (전체 교체)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceTypeId } = await params
    const { play_modes } = await request.json()

    // 기존 플레이 모드 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('play_modes')
      .delete()
      .eq('device_type_id', deviceTypeId)

    if (deleteError) throw deleteError

    // 새 플레이 모드 추가
    if (play_modes && play_modes.length > 0) {
      const modesData = play_modes.map((mode: any, index: number) => ({
        device_type_id: deviceTypeId,
        name: mode.name,
        price: mode.price,
        display_order: index + 1
      }))

      const { error: insertError } = await supabaseAdmin
        .from('play_modes')
        .insert(modesData)

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating play modes:', error)
    return NextResponse.json({ error: 'Failed to update play modes' }, { status: 500 })
  }
}