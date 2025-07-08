import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';
// Firebase Admin은 전화번호 인증 토큰 생성을 지원하지 않으므로 클라이언트에서 처리


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

    // +82로 시작하는 국제 형식 또는 010으로 시작하는 국내 형식 모두 허용
    const isInternationalFormat = /^\+82\d{9,10}$/.test(phone);
    const isDomesticFormat = /^010\d{7,8}$/.test(phone);
    
    if (!phone || (!isInternationalFormat && !isDomesticFormat)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다' },
        { status: 400 }
      );
    }

    // SMS 발송 한도 체크 - 일단 비활성화 (테이블이 없음)
    // TODO: sms_limits 테이블 생성 후 활성화
    const phoneNumber = phone.replace(/-/g, '');
    
    /*
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

    // SMS 발송 기록 저장 (Firebase는 클라이언트에서 발송하므로 여기서는 제한만 체크)
    await supabaseAdmin
      .from('sms_limits')
      .insert({
        phone: phoneNumber,
        purpose: 'verification'
      });
    */

    return NextResponse.json({ 
      success: true,
      message: 'SMS 발송 가능합니다'
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}