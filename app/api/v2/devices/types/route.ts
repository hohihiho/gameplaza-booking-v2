import { NextRequest, NextResponse } from 'next/server';
import { getD1Database, D1RepositoryFactory } from '@/lib/repositories/d1';

// GET /api/v2/devices/types - 기기 타입 목록 조회
export async function GET(request: NextRequest) {
  try {
    const db = getD1Database(request);
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    const deviceTypes = await repos.deviceTypes.findAll();
    
    // 각 타입별 기기 수 계산
    const typesWithCounts = await Promise.all(
      deviceTypes.map(async (type) => {
        const devices = await repos.devices.findByTypeId(type.id);
        const activeDevices = devices.filter(d => d.status === 'available');
        
        return {
          ...type,
          device_count: devices.length,
          active_count: activeDevices.length
        };
      })
    );

    return NextResponse.json(typesWithCounts);
  } catch (error) {
    console.error('Error fetching device types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch device types' },
      { status: 500 }
    );
  }
}

// POST /api/v2/devices/types - 새 기기 타입 생성
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
    const { name, description, category, max_units, display_order } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    const deviceType = await repos.deviceTypes.create({
      name,
      description,
      category,
      max_units: max_units || 1,
      display_order: display_order || 0,
      is_active: 1
    });

    return NextResponse.json(deviceType, { status: 201 });
  } catch (error) {
    console.error('Error creating device type:', error);
    return NextResponse.json(
      { error: 'Failed to create device type' },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/devices/types - 기기 타입 수정
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    const deviceType = await repos.deviceTypes.update(id, updateData);

    return NextResponse.json(deviceType);
  } catch (error) {
    console.error('Error updating device type:', error);
    return NextResponse.json(
      { error: 'Failed to update device type' },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/devices/types - 기기 타입 삭제 (비활성화)
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

    const repos = new D1RepositoryFactory(db);
    
    // 비활성화 처리
    await repos.deviceTypes.update(id, { is_active: 0 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting device type:', error);
    return NextResponse.json(
      { error: 'Failed to delete device type' },
      { status: 500 }
    );
  }
}