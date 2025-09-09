import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UsersRepository } from '@/lib/d1/repositories/users';
import { AdminsRepository } from '@/lib/d1/repositories/admins';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 사용자 프로필 조회
    const usersRepo = new UsersRepository();
    const profile = await usersRepo.findByEmail(session.user.email);

    // 프로필이 없는 경우
    if (!profile) {
      return NextResponse.json(
        { 
          exists: false,
          incomplete: true,
          profile: null,
          isAdmin: false
        },
        { status: 200 }
      );
    }

    // 관리자 권한 확인
    let isAdmin = false;
    if (profile?.id) {
      const adminsRepo = new AdminsRepository();
      const adminData = await adminsRepo.findByUserId(profile.id);
      
      isAdmin = !!adminData?.is_super_admin;
    }

    // 프로필이 불완전한 경우 (닉네임만 필수)
    if (!profile.nickname) {
      return NextResponse.json(
        { 
          exists: true,
          incomplete: true,
          profile: profile,
          isAdmin
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ 
      exists: true,
      incomplete: false,
      profile,
      isAdmin
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname } = body;

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임을 입력해주세요' },
        { status: 400 }
      );
    }

    // 프로필 업데이트
    const usersRepo = new UsersRepository();
    
    // 먼저 사용자를 찾기
    const user = await usersRepo.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 프로필 업데이트
    const updatedProfile = await usersRepo.update(user.id, {
      nickname,
      updated_at: new Date().toISOString()
    });

    if (!updatedProfile) {
      return NextResponse.json(
        { error: '프로필 업데이트 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile PUT API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}