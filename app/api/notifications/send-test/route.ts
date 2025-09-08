import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import webpush from 'web-push';

// VAPID 키 유효성 검증 함수
function isValidVapidPublicKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  
  // URL safe Base64는 A-Z, a-z, 0-9, -, _ 만 포함하고 = 패딩 없음
  const urlSafeBase64Regex = /^[A-Za-z0-9_-]+$/;
  return urlSafeBase64Regex.test(key) && key.length >= 43; // VAPID 공개 키는 일반적으로 87-88자
}

function isValidVapidPrivateKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  
  // URL safe Base64 형식 검증
  const urlSafeBase64Regex = /^[A-Za-z0-9_-]+$/;
  return urlSafeBase64Regex.test(key) && key.length >= 43; // VAPID 개인 키는 일반적으로 43자
}

// VAPID 키 설정 (환경변수에서 가져오기)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@gameplaza.co.kr'
};

// VAPID 키가 유효한 경우에만 설정 (빌드 시점 오류 방지)
let vapidConfigured = false;
if (vapidKeys.publicKey && 
    vapidKeys.privateKey && 
    isValidVapidPublicKey(vapidKeys.publicKey) && 
    isValidVapidPrivateKey(vapidKeys.privateKey)) {
  try {
    webpush.setVapidDetails(
      vapidKeys.subject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    vapidConfigured = true;
    console.log('VAPID 키 설정 완료');
  } catch (error) {
    console.error('VAPID 키 설정 실패:', error);
  }
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
    if (!vapidConfigured) {
      console.error('VAPID 키가 설정되지 않았거나 유효하지 않습니다.');
      return NextResponse.json(
        { 
          error: 'VAPID 키가 설정되지 않았거나 유효하지 않습니다. 환경변수를 확인해주세요.',
          details: {
            publicKeyExists: !!vapidKeys.publicKey,
            privateKeyExists: !!vapidKeys.privateKey,
            publicKeyValid: vapidKeys.publicKey ? isValidVapidPublicKey(vapidKeys.publicKey) : false,
            privateKeyValid: vapidKeys.privateKey ? isValidVapidPrivateKey(vapidKeys.privateKey) : false,
            configured: vapidConfigured
          },
          help: 'VAPID 키는 URL safe Base64 형식이어야 하며 "=" 패딩을 포함하지 않아야 합니다.'
        },
        { status: 500 }
      );
    }

    // 대상 사용자의 활성화된 푸시 구독 정보 조회
    let subscriptions;
    try {
      subscriptions = query.getPushSubscriptions(targetEmail);
    } catch (error) {
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
          try {
            query.updatePushSubscriptionStatus(subscription.id, false);
            console.log('만료된 구독 비활성화:', subscription.id);
          } catch (updateError) {
            console.error('구독 상태 업데이트 실패:', updateError);
          }
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