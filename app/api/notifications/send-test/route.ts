import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// VAPID 키 설정 (환경변수에서 가져오거나 기본값 사용)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@gameplaza.co.kr'
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

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
    const { 
      title = '📢 게임플라자 테스트 알림',
      message = '푸시 알림이 정상적으로 작동합니다!',
      targetEmail = session.user.email // 기본값은 본인
    } = body;

    console.log('테스트 푸시 알림 발송 요청:', { 
      from: session.user.email,
      to: targetEmail,
      title,
      message 
    });

    // VAPID 키 확인
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      console.error('VAPID 키가 설정되지 않았습니다.');
      return NextResponse.json(
        { 
          error: 'VAPID 키가 설정되지 않았습니다. 환경변수를 확인해주세요.',
          missingKeys: {
            publicKey: !vapidKeys.publicKey,
            privateKey: !vapidKeys.privateKey
          }
        },
        { status: 500 }
      );
    }

    // 대상 사용자의 활성화된 푸시 구독 정보 조회
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_email', targetEmail)
      .eq('enabled', true);

    if (error) {
      console.error('구독 정보 조회 오류:', error);
      return NextResponse.json(
        { error: '구독 정보를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { 
          error: '활성화된 푸시 구독이 없습니다.',
          suggestion: '먼저 푸시 알림을 활성화해주세요.'
        },
        { status: 404 }
      );
    }

    // 알림 페이로드 생성
    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        url: '/',
        timestamp: new Date().toISOString(),
        type: 'test'
      },
      actions: [
        {
          action: 'open',
          title: '확인'
        }
      ],
      requireInteraction: true,
      tag: 'test-notification'
    });

    const sendResults = [];

    // 모든 활성 구독에 알림 발송
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        
        sendResults.push({
          subscription_id: subscription.id,
          status: 'success',
          user_agent: subscription.user_agent
        });

        console.log('푸시 알림 발송 성공:', subscription.id);

      } catch (sendError: any) {
        console.error('푸시 알림 발송 실패:', sendError);
        
        sendResults.push({
          subscription_id: subscription.id,
          status: 'failed',
          error: sendError.message,
          user_agent: subscription.user_agent
        });

        // 410 Gone: 구독이 만료된 경우 비활성화
        if (sendError.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ enabled: false })
            .eq('id', subscription.id);
          
          console.log('만료된 구독 비활성화:', subscription.id);
        }
      }
    }

    const successCount = sendResults.filter(r => r.status === 'success').length;
    const totalCount = sendResults.length;

    return NextResponse.json({
      success: successCount > 0,
      message: `${successCount}/${totalCount}개의 구독에 알림을 발송했습니다.`,
      results: sendResults,
      payload: {
        title,
        message,
        targetEmail
      }
    });

  } catch (error) {
    console.error('테스트 푸시 알림 발송 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}