import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { usersService } from '@/lib/services/db';
import Database from 'better-sqlite3';
import path from 'path';

// 데이터베이스 연결
const dbPath = path.join(process.cwd(), 'dev.db');
const db = new Database(dbPath);

// 관리자 권한 확인
async function checkAdminAuth() {
  
  }

  const userData = await usersService.findByEmail(session.user.email);
  if (!userData) {
    return { error: '사용자를 찾을 수 없습니다', status: 404 };
  }

  const isAdmin = await usersService.isAdmin(userData.id);
  if (!isAdmin) {
    return { error: '관리자 권한이 필요합니다', status: 403 };
  }

  return { success: true, adminId: userData.id };
}

// 관리자가 사용자 닉네임 강제 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkAdminAuth();
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = params;
    const body = await request.json();
    const { newNickname, reason } = body;

    if (!newNickname || newNickname.trim().length === 0) {
      return NextResponse.json(
        { error: '새 닉네임을 입력해주세요' },
        { status: 400 }
      );
    }

    // 닉네임 길이 체크
    if (newNickname.length < 2 || newNickname.length > 20) {
      return NextResponse.json(
        { error: '닉네임은 2자 이상 20자 이하여야 합니다' },
        { status: 400 }
      );
    }

    // 대상 사용자 찾기
    const targetUser = await usersService.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { error: '대상 사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 기존 닉네임 백업
    const oldNickname = targetUser.name;

    // 닉네임 업데이트
    const updatedUser = await usersService.update(id, {
      name: newNickname.trim()
    });

    // 닉네임 변경 로그 기록
    try {
      const logStmt = db.prepare(`
        INSERT INTO nickname_change_logs 
        (user_id, old_nickname, new_nickname, changed_by, reason, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `);
      
      logStmt.run(
        id,
        oldNickname,
        newNickname.trim(),
        authCheck.adminId,
        reason || '관리자에 의한 강제 변경'
      );
    } catch (logError) {
      console.error('닉네임 변경 로그 기록 오류:', logError);
      // 로그 실패해도 닉네임 변경은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      message: '닉네임이 성공적으로 변경되었습니다',
      data: {
        userId: id,
        oldNickname,
        newNickname: newNickname.trim(),
        changedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('닉네임 강제 변경 오류:', error);
    return NextResponse.json(
      { error: '닉네임 변경 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}