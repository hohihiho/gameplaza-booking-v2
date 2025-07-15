import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    console.log('회원탈퇴 요청:', session.user.email);

    // 1. 사용자 정보 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      console.log('사용자 정보 없음');
      // 사용자 정보가 없어도 에러로 처리하지 않고 성공으로 처리
      return NextResponse.json({ 
        success: true,
        message: '회원탈퇴가 완료되었습니다' 
      });
    }

    const userId = user.id;
    console.log('탈퇴할 사용자 ID:', userId);

    // 2. 관련 데이터 삭제 (CASCADE 설정이 없는 경우 수동 삭제)
    // 예약 데이터 삭제
    const { error: reservationError } = await supabaseAdmin
      .from('reservations')
      .delete()
      .eq('user_id', userId);

    if (reservationError) {
      console.error('예약 데이터 삭제 실패:', reservationError);
    }

    // 3. admins 테이블에서 삭제 (관리자인 경우)
    const { error: adminError } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('user_id', userId);

    if (adminError) {
      console.error('관리자 데이터 삭제 실패:', adminError);
    }

    // 4. 사용자 정보 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('사용자 삭제 실패:', deleteError);
      return NextResponse.json(
        { error: '회원탈퇴 처리 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    console.log('회원탈퇴 완료:', session.user.email);

    return NextResponse.json({ 
      success: true,
      message: '회원탈퇴가 완료되었습니다' 
    });

  } catch (error) {
    console.error('회원탈퇴 처리 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}