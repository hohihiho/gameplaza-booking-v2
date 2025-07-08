import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin SDK 초기화
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // 서비스 계정 키 (환경 변수에서 가져오기)
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
  };

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

// Firebase Admin 인스턴스
const adminApp = initializeFirebaseAdmin();
export const adminAuth = getAuth(adminApp);

// 전화번호 인증 토큰 생성
export async function createPhoneVerificationToken(phoneNumber: string) {
  try {
    // Firebase는 실제로 SMS를 보내지 않고, 클라이언트에서 처리
    // 여기서는 사용자 확인 및 보안을 위한 추가 로직만 구현
    
    // 한국 전화번호 형식으로 변환 (010-1234-5678 → +821012345678)
    const formattedPhone = '+82' + phoneNumber.replace(/-/g, '').substring(1);
    
    // 사용자가 이미 존재하는지 확인
    try {
      const user = await adminAuth.getUserByPhoneNumber(formattedPhone);
      console.log('기존 사용자:', user.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('새로운 전화번호');
      }
    }
    
    return { success: true, phoneNumber: formattedPhone };
  } catch (error) {
    console.error('전화번호 검증 오류:', error);
    return { success: false, error: '전화번호 검증에 실패했습니다' };
  }
}

// 인증 토큰 검증
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { success: true, uid: decodedToken.uid, phoneNumber: decodedToken.phone_number };
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return { success: false, error: '인증 토큰이 유효하지 않습니다' };
  }
}