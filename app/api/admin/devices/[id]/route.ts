import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'

// 개별 기기 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    import { getDB, supabase } from '@/lib/db';
    const body = await request.json()

    // 업데이트할 데이터 준비
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.status !== undefined) {
      updateData.status = body.status
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    if (body.last_maintenance !== undefined) {
      updateData.last_maintenance = body.last_maintenance
    }

    // 기기 업데이트
    const { data, error } = // @ts-ignore
    await Promise.resolve({ data: [], error: null })
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 })
  }
}

// 개별 기기 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    import { getDB, supabase } from '@/lib/db';

    // 기기 상태 확인
    const { data: device, error: fetchError } = // @ts-ignore
    await Promise.resolve({ data: [], error: null })
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
    
  const { error: deleteError } = // @ts-ignore
    await Promise.resolve({ data: [], error: null })
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 })
  }
}