import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription, enabled } = body;

    console.log('푸시 알림 구독 요청:', { 
      email: session.user.email, 
      enabled,
      subscription: subscription ? 'received' : 'not provided' 
    });

    // subscription이 있을 경우 (구독 등록/해제)
    if (subscription) {
      // push_subscriptions 테이블에 구독 정보 저장/업데이트
      const subscriptionData = {
        user_email: session.user.email,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        user_agent: request.headers.get('user-agent') || null,
        enabled: enabled ?? true,
        updated_at: new Date().toISOString()
      };

      // 기존 구독이 있는지 확인
      const { data: existingSubscription } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_email', session.user.email)
        .eq('endpoint', subscription.endpoint)
        .single();

      if (existingSubscription) {
        // 기존 구독 업데이트
        const { error } = await supabase
          .from('push_subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id);

        if (error) {
          console.error('구독 업데이트 오류:', error);
          return NextResponse.json(
            { error: '구독 업데이트에 실패했습니다.' },
            { status: 500 }
          );
        }
      } else {
        // 새 구독 생성
        const { error } = await supabase
          .from('push_subscriptions')
          .insert({
            ...subscriptionData,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('구독 생성 오류:', error);
          return NextResponse.json(
            { error: '구독 등록에 실패했습니다.' },
            { status: 500 }
          );
        }
      }
    }

    // users 테이블의 push_notifications_enabled 필드 업데이트
    if (typeof enabled === 'boolean') {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ 
          push_notifications_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('email', session.user.email);

      if (userUpdateError) {
        console.error('사용자 알림 설정 업데이트 오류:', userUpdateError);
        return NextResponse.json(
          { error: '알림 설정 변경에 실패했습니다.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: enabled 
        ? '푸시 알림이 활성화되었습니다.' 
        : '푸시 알림이 비활성화되었습니다.'
    });

  } catch (error) {
    console.error('푸시 알림 구독 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자의 현재 푸시 알림 설정 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('push_notifications_enabled')
      .eq('email', session.user.email)
      .single();

    if (error) {
      console.error('사용자 알림 설정 조회 오류:', error);
      return NextResponse.json(
        { error: '설정 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      push_notifications_enabled: user.push_notifications_enabled || false
    });

  } catch (error) {
    console.error('푸시 알림 설정 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}