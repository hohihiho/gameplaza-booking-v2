import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname, phone } = body;

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임을 입력해주세요' },
        { status: 400 }
      );
    }

    // 전화번호가 입력된 경우에만 형식 검증
    if (phone && phone.length > 0 && phone.replace(/-/g, '').length < 10) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식을 입력해주세요' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 가져오기
    const supabaseAdmin = createAdminClient();
  const { data: data, error: fetchError } = await supabaseAdmin.from('users')
      .select('phone, phone_changed_at')
      .eq('email', session.user.email)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const phoneWithoutHyphen = phone ? phone.replace(/-/g, '') : null;
    const isPhoneChanged = phone !== null && currentUser.phone !== phoneWithoutHyphen;

    // 전화번호 변경 제한 확인
    if (isPhoneChanged && currentUser.phone_changed_at) {
      const lastChanged = new Date(currentUser.phone_changed_at);
      const nextChangeDate = new Date(lastChanged);
      nextChangeDate.setMonth(nextChangeDate.getMonth() + 1);
      
      if (nextChangeDate > new Date()) {
        return NextResponse.json(
          { 
            error: `전화번호는 한 달에 한 번만 변경할 수 있습니다. 다음 변경 가능일: ${nextChangeDate.toLocaleDateString('ko-KR')}` 
          },
          { status: 400 }
        );
      }
    }

    // 업데이트할 데이터 준비
    const updateData: any = {
      nickname,
      phone: phoneWithoutHyphen,
      updated_at: new Date().toISOString()
    };

    // 전화번호가 변경된 경우 변경 시간 기록
    if (isPhoneChanged) {
      updateData.phone_changed_at = new Date().toISOString();
    }

    // 프로필 업데이트
    
  const { data: updatedUser, error: updateError } = await supabaseAdmin.from('users')
      .update(updateData)
      .eq('email', session.user.email)
      .select()
      .single();

    if (updateError) {
      console.error('프로필 업데이트 오류:', updateError);
      return NextResponse.json(
        { error: '프로필 수정에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      user: data,
      message: isPhoneChanged 
        ? '프로필이 수정되었습니다. 전화번호가 변경되었습니다.' 
        : '프로필이 수정되었습니다'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}