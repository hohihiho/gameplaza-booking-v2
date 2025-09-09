import { NextRequest, NextResponse } from 'next/server';
import { getD1Database } from '@/lib/repositories/d1';
import { v4 as uuidv4 } from 'uuid';

// 카테고리는 D1에서 device_types의 category 필드로 관리
// 중복 제거하여 고유한 카테고리 목록 반환

// GET /api/v2/devices/categories - 카테고리 목록 조회
export async function GET(request: NextRequest) {
  try {
    const db = getD1Database(request);
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // device_types에서 고유한 카테고리 추출
    const result = await db
      .prepare(`
        SELECT DISTINCT category as name, 
               MIN(display_order) as display_order,
               COUNT(*) as type_count
        FROM device_types 
        WHERE category IS NOT NULL 
          AND is_active = 1
        GROUP BY category
        ORDER BY display_order, category
      `)
      .all();

    // ID 생성 (카테고리명 기반)
    const categories = result.results.map((cat: any, index) => ({
      id: cat.name.toLowerCase().replace(/\s+/g, '-'),
      name: cat.name,
      display_order: cat.display_order || index,
      type_count: cat.type_count
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/v2/devices/categories - 카테고리 생성 (실제로는 device_type 생성)
export async function POST(request: NextRequest) {
  try {
    const db = getD1Database(request);
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, display_order } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // 카테고리 생성은 실제로 첫 번째 device_type을 생성
    const typeId = uuidv4();
    await db
      .prepare(`
        INSERT INTO device_types (id, name, category, display_order, is_active)
        VALUES (?, ?, ?, ?, 1)
      `)
      .bind(typeId, `${name} 기본`, name, display_order || 0)
      .run();

    return NextResponse.json({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      display_order: display_order || 0
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/devices/categories - 카테고리 수정
export async function PATCH(request: NextRequest) {
  try {
    const db = getD1Database(request);
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    // 기존 카테고리명 찾기
    const oldName = id.replace(/-/g, ' ');
    
    // 해당 카테고리의 모든 device_types 업데이트
    await db
      .prepare(`
        UPDATE device_types 
        SET category = ?
        WHERE LOWER(REPLACE(category, ' ', '-')) = ?
      `)
      .bind(name, id)
      .run();

    return NextResponse.json({ id, name });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/devices/categories - 카테고리 삭제 (해당 타입들 비활성화)
export async function DELETE(request: NextRequest) {
  try {
    const db = getD1Database(request);
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // 해당 카테고리의 모든 device_types 비활성화
    await db
      .prepare(`
        UPDATE device_types 
        SET is_active = 0
        WHERE LOWER(REPLACE(category, ' ', '-')) = ?
      `)
      .bind(id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

// PUT /api/v2/devices/categories/reorder - 카테고리 순서 변경
export async function PUT(request: NextRequest) {
  try {
    const db = getD1Database(request);
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Categories array is required' },
        { status: 400 }
      );
    }

    // 각 카테고리의 display_order 업데이트
    for (const [index, category] of categories.entries()) {
      await db
        .prepare(`
          UPDATE device_types 
          SET display_order = ?
          WHERE LOWER(REPLACE(category, ' ', '-')) = ?
        `)
        .bind(index, category.id)
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json(
      { error: 'Failed to reorder categories' },
      { status: 500 }
    );
  }
}