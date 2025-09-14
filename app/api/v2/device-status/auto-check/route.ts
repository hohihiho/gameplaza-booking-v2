// 자동 기기 상태 관리 시스템 테스트 및 상태 조회 API
// 비전공자 설명: 자동으로 만료된 예약을 확인하고 기기 상태를 업데이트하는 시스템을 
// 수동으로 실행하거나 현재 상태를 확인할 수 있는 API입니다.

import { NextRequest, NextResponse } from 'next/server';
import { autoCheckDeviceStatus, forceCheckDeviceStatus, getStatusInfo } from '@/lib/device-status-manager';
import { auth } from '@/lib/auth';
import { d1ListUserRoles } from '@/lib/db/d1'

// GET: 현재 자동 상태 관리 시스템 정보 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인 (관리자만 접근 가능)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인 (super_admin 기준)
    const roles = await d1ListUserRoles(session.user.id)
    const isSuperAdmin = Array.isArray(roles) && roles.some((r: any) => r.role_type === 'super_admin')
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // 현재 상태 정보 조회
    const statusInfo = await getStatusInfo();

    if (!statusInfo) {
      return NextResponse.json(
        { error: '상태 정보를 가져올 수 없습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      statusInfo,
      message: '자동 상태 관리 시스템 정보 조회 완료'
    });

  } catch (error) {
    console.error('Status info retrieval error:', error);
    return NextResponse.json(
      { 
        error: '상태 정보 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: 자동 상태 체크 강제 실행
export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (관리자만 접근 가능)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const roles = await d1ListUserRoles(session.user.id)
    const isSuperAdmin = Array.isArray(roles) && roles.some((r: any) => r.role_type === 'super_admin')
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { force = false } = body;

    // 자동 체크 실행 (force=true면 강제 실행)
    const result = force ? 
      await forceCheckDeviceStatus() : 
      await autoCheckDeviceStatus();

    // 실행 후 최신 상태 정보 조회
    const statusInfo = await getStatusInfo();

    return NextResponse.json({
      success: true,
      executed: result.executed,
      results: {
        expiredReservations: result.expiredCount,
        startedReservations: result.startedCount,
        errors: result.errors
      },
      statusInfo,
      message: force ? '강제 상태 체크 완료' : '자동 상태 체크 완료'
    });

  } catch (error) {
    console.error('Auto check execution error:', error);
    return NextResponse.json(
      { 
        error: '자동 상태 체크 실행 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
