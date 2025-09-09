import { NextRequest, NextResponse } from 'next/server';
import { getWorkerData, postWorkerData, putWorkerData } from '@/lib/cloudflare-worker';
import { checkAdminAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authCheck = await checkAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    // Worker API를 통해 비즈니스 정보 조회
    const result = await getWorkerData('/api/admin/cms/business-info');
    return NextResponse.json(result);

  } catch (error) {
    console.error('비즈니스 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '비즈니스 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authCheck = await checkAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await request.json();

    // Worker API를 통해 비즈니스 정보 업데이트
    const result = await putWorkerData('/api/admin/cms/business-info', body);
    return NextResponse.json(result);

  } catch (error) {
    console.error('비즈니스 정보 업데이트 오류:', error);
    return NextResponse.json(
      { error: '비즈니스 정보 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}