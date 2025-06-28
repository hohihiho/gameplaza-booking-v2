import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 개별 기기 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 기기 상태 확인
    const { data: device, error: fetchError } = await supabase
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
    const { error: deleteError } = await supabase
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