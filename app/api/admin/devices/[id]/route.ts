import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// 개별 기기 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 기기 상태 확인
    const { data: device, error: fetchError } = await supabaseAdmin
      .from('devices')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // available 상태인 기기만 삭제 가능
    if (device.status !== 'available') {
      return NextResponse.json(
        { error: 'Only available devices can be deleted' },
        { status: 400 }
      )
    }

    // 기기 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('devices')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 })
  }
}