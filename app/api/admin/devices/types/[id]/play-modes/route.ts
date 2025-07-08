import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// 플레이 모드 업데이트 (전체 교체)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceTypeId } = await params
    const body = await request.json()
    console.log('[Play modes API] 받은 데이터:', body)
    const { play_modes } = body

    // 기존 플레이 모드 삭제
    console.log('[Play modes API] 기존 모드 삭제 - device_type_id:', deviceTypeId)
    const { error: deleteError } = await supabaseAdmin
      .from('play_modes')
      .delete()
      .eq('device_type_id', deviceTypeId)

    if (deleteError) {
      console.error('[Play modes API] 삭제 오류:', deleteError)
      throw deleteError
    }

    // 새 플레이 모드 추가
    if (play_modes && play_modes.length > 0) {
      const modesData = play_modes.map((mode: any, index: number) => ({
        device_type_id: deviceTypeId,
        name: mode.name,
        price: mode.price,
        display_order: index + 1
      }))
      
      console.log('[Play modes API] 추가할 모드 데이터:', modesData)

      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('play_modes')
        .insert(modesData)
        .select()

      if (insertError) {
        console.error('[Play modes API] 추가 오류:', insertError)
        throw insertError
      }
      
      console.log('[Play modes API] 추가 성공:', insertedData)
      return NextResponse.json({ success: true, data: insertedData })
    }

    console.log('[Play modes API] 모드가 없어 추가하지 않음')
    return NextResponse.json({ success: true, data: [] })
  } catch (error) {
    console.error('Error updating play modes:', error)
    return NextResponse.json({ error: 'Failed to update play modes' }, { status: 500 })
  }
}