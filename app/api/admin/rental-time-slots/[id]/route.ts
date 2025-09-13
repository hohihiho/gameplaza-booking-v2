import { getDB, supabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'

// 시간대 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { slot_type, start_time, end_time, credit_options, enable_2p, price_2p_extra, is_youth_time } = body

    // 필수 필드 검증
    if (!slot_type || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 크레딧 옵션이 최소 1개는 있어야 함
    if (!credit_options || credit_options.length === 0) {
      return NextResponse.json({ error: 'At least one credit option is required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from('rental_time_slots')
      .update({
        slot_type,
        start_time,
        end_time,
        credit_options,
        enable_2p,
        price_2p_extra: enable_2p ? price_2p_extra : null,
        is_youth_time: is_youth_time || false
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating time slot:', error)
    return NextResponse.json({ error: 'Failed to update time slot' }, { status: 500 })
  }
}

// 시간대 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from('rental_time_slots')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting time slot:', error)
    return NextResponse.json({ error: 'Failed to delete time slot' }, { status: 500 })
  }
}