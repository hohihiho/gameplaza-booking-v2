import { NextRequest, NextResponse } from 'next/server'
import { d1ListDeviceCategories, d1CreateDeviceCategory, d1UpdateDeviceCategory, d1DeleteDeviceCategory } from '@/lib/db/d1'

// 카테고리 목록 조회
export async function GET() {
  try {
    const data = await d1ListDeviceCategories()
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
    const data = await d1CreateDeviceCategory({ name, display_order })
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
    const data = await d1UpdateDeviceCategory(Number(id), { name })
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
    // 순차 업데이트 (D1)
    for (const cat of categories) {
      await d1UpdateDeviceCategory(Number(cat.id), { display_order: Number(cat.display_order) })
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
    await d1DeleteDeviceCategory(Number(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
