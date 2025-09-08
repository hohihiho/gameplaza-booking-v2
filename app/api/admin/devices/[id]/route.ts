import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// 개별 기기 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const body = await request.json()

    // 기존 기기 조회
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id)
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // 업데이트 쿼리 동적 생성
    const updates: string[] = []
    const values: any[] = []

    if (body.status !== undefined) {
      updates.push('status = ?')
      values.push(body.status)
    }

    if (body.notes !== undefined) {
      updates.push('notes = ?')
      values.push(body.notes)
    }

    if (body.last_maintenance !== undefined) {
      updates.push('last_maintenance = ?')
      values.push(body.last_maintenance)
    }

    // updated_at 항상 업데이트
    updates.push('updated_at = datetime("now")')

    // 업데이트할 내용이 없으면 기존 데이터 반환
    if (updates.length === 1) { // updated_at만 있는 경우
      return NextResponse.json(device)
    }

    // 기기 업데이트
    values.push(id)
    const updateQuery = `UPDATE devices SET ${updates.join(', ')} WHERE id = ?`
    db.prepare(updateQuery).run(...values)

    // 업데이트된 기기 조회
    const updatedDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(id)

    return NextResponse.json(updatedDevice)
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
    const db = getDb()

    // 기기 상태 확인
    const device = db.prepare('SELECT status FROM devices WHERE id = ?').get(id) as any

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // available 상태인 기기만 삭제 가능
    if (device.status !== 'available') {
      return NextResponse.json(
        { error: 'Only available devices can be deleted' },
        { status: 400 }
      )
    }

    // 기기 삭제
    db.prepare('DELETE FROM devices WHERE id = ?').run(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 })
  }
}