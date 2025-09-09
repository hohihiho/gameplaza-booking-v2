import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PushSubscriptionsRepository } from '@/lib/d1/repositories/push-subscriptions';
import { UsersRepository } from '@/lib/d1/repositories/users';

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
      const pushRepo = new PushSubscriptionsRepository();
      const existingSubscriptions = await pushRepo.findByUserEmail(session.user.email, false);
      const existingSubscription = existingSubscriptions.find(
        sub => sub.endpoint === subscription.endpoint
      );

      if (existingSubscription) {
        // 기존 구독 업데이트
        const updated = await pushRepo.update(existingSubscription.id, subscriptionData);
        
        if (!updated) {
          console.error('구독 업데이트 실패');
          return NextResponse.json(
            { error: '구독 업데이트에 실패했습니다.' },
            { status: 500 }
          );
        }
      } else {
        // 새 구독 생성
        const created = await pushRepo.create({
          ...subscriptionData,
          created_at: new Date().toISOString()
        });

        if (!created) {
          console.error('구독 생성 실패');
          return NextResponse.json(
            { error: '구독 등록에 실패했습니다.' },
            { status: 500 }
          );
        }
      }
    }

    // users 테이블의 push_notifications_enabled 필드 업데이트
    if (typeof enabled === 'boolean') {
      const usersRepo = new UsersRepository();
      const user = await usersRepo.findByEmail(session.user.email);
      
      if (user) {
        const updated = await usersRepo.update(user.id, {
          push_notifications_enabled: enabled,
          updated_at: new Date().toISOString()
        });
        
        if (!updated) {
          console.error('사용자 알림 설정 업데이트 실패');
          return NextResponse.json(
            { error: '알림 설정 변경에 실패했습니다.' },
            { status: 500 }
          );
        }
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
    const usersRepo = new UsersRepository();
    const user = await usersRepo.findByEmail(session.user.email);

    if (!user) {
      console.error('사용자를 찾을 수 없음');
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