import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin 초기화
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Firebase Admin은 서비스 계정 키나 Application Default Credentials가 필요합니다
  // 프로덕션에서는 환경 변수로 서비스 계정 키를 관리해야 합니다
  try {
    const app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    
    return app;
  } catch (error) {
    console.error('Firebase Admin 초기화 실패:', error);
    return null;
  }
}

const adminApp = initializeFirebaseAdmin();
export const adminAuth = adminApp ? getAuth(adminApp) : null;

// ID 토큰 검증
export async function verifyIdToken(idToken: string) {
  if (!adminAuth) {
    throw new Error('Firebase Admin이 초기화되지 않았습니다');
  }
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('ID 토큰 검증 실패:', error);
    throw error;
  }
}