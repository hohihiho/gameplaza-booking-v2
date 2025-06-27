import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// 기기 타입 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { is_rentable } = body

    // 기기 타입 업데이트
    const { data, error } = await supabaseAdmin
      .from('device_types')
      .update({ is_rentable })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating device type:', error)
    return NextResponse.json({ error: 'Failed to update device type' }, { status: 500 })
  }
}

// 기기 타입 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('device_types')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting device type:', error)
    return NextResponse.json({ error: 'Failed to delete device type' }, { status: 500 })
  }
}