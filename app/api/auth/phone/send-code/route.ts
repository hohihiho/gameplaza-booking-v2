import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';
import { createPhoneVerificationToken } from '@/lib/firebase/admin';

// 인증 코드 생성
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { phone } = await request.json();

    if (!phone || !/^010-\d{4}-\d{4}$/.test(phone)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다' },
        { status: 400 }
      );
    }

    // SMS 발송 한도 체크
    const phoneNumber = phone.replace(/-/g, '');
    const { data: limitCheck } = await supabaseAdmin
      .rpc('check_sms_limit', { 
        p_phone: phoneNumber,
        p_daily_limit: 5,
        p_hourly_limit: 2
      });
    
    if (!limitCheck) {
      return NextResponse.json(
        { error: 'SMS 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요' },
        { status: 429 }
      );
    }

    // Firebase용 전화번호 검증
    const result = await createPhoneVerificationToken(phone);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '전화번호 검증에 실패했습니다' },
        { status: 500 }
      );
    }

    // SMS 발송 기록 저장 (Firebase는 클라이언트에서 발송하므로 여기서는 기록만)
    await supabaseAdmin
      .from('sms_limits')
      .insert({
        phone: phoneNumber,
        purpose: 'verification'
      });

    return NextResponse.json({ 
      success: true,
      phoneNumber: result.phoneNumber,
      message: 'Firebase 클라이언트에서 SMS를 발송해주세요'
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}