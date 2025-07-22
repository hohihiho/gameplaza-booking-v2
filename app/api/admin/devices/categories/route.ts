import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// 카테고리 목록 조회
export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, display_order } = body

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_categories')
      .insert({ name, display_order })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// 카테고리 수정
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name } = body

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// 카테고리 순서 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { categories } = body // [{id, display_order}, ...]

    // 트랜잭션처럼 처리
    const updates = categories.map((cat: any) => 
      supabaseAdmin
        .from('device_categories')
        .update({ display_order: cat.display_order })
        .eq('id', cat.id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some(r => r.error)

    if (hasError) {
      throw new Error('Failed to update some categories')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating categories:', error)
    return NextResponse.json({ error: 'Failed to update categories' }, { status: 500 })
  }
}

// 카테고리 삭제
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const supabaseAdmin = createAdminClient();
  const { error$1 } = await supabaseAdmin.from('device_categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}