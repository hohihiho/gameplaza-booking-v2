import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// 개별 기기 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceTypeId = searchParams.get('deviceTypeId')

    if (!deviceTypeId) {
      return NextResponse.json({ error: 'deviceTypeId is required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient();
  const { data: devicesData } = await supabaseAdmin.from('devices')
      .select('*')
      .eq('device_type_id', deviceTypeId)
      .order('device_number', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  }
}

// 기기 상태 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    const updateData: any = { status }
    if (notes !== undefined) updateData.notes = notes

    const supabaseAdmin = createAdminClient();
  const { data: devicesData2 } = await supabaseAdmin.from('devices')
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

// 새 기기 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { device_type_id, device_number } = body

    const supabaseAdmin = createAdminClient();
  const { data: devicesData3 } = await supabaseAdmin.from('devices')
      .insert({ device_type_id, device_number, status: 'available' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
  }
}