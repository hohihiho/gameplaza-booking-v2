import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';

// Firebase 클라이언트 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Firebase 앱 초기화
function initializeFirebase() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  
  // Firebase 설정이 없으면 초기화하지 않음
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.warn('Firebase configuration is missing. Phone authentication will not work.');
    return null;
  }
  
  return initializeApp(firebaseConfig);
}

const app = initializeFirebase();
export const auth = app ? getAuth(app) : null;

// 디버깅용 - Firebase 설정 확인
if (typeof window !== 'undefined') {
  console.log('Firebase 프로젝트 ID:', firebaseConfig.projectId);
  console.log('Firebase Auth 초기화:', !!auth);
}

// RecaptchaVerifier 인스턴스 저장
let recaptchaVerifier: RecaptchaVerifier | null = null;
let recaptchaWidgetId: number | null = null;

// Recaptcha 설정
export function setupRecaptcha(buttonId: string): RecaptchaVerifier | null {
  if (!auth) {
    console.warn('Firebase Auth is not initialized');
    return null;
  }
  
  // 기존 reCAPTCHA가 있으면 정리
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.log('기존 reCAPTCHA 정리 중 오류:', e);
    }
    recaptchaVerifier = null;
  }
  
  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA 해결됨');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA 만료됨');
        recaptchaVerifier = null;
      }
    });
    
    console.log('reCAPTCHA 설정 완료');
    return recaptchaVerifier;
  } catch (error) {
    console.error('reCAPTCHA 설정 오류:', error);
    return null;
  }
}

// Recaptcha 정리
export function clearRecaptcha() {
  // grecaptcha 전역 객체를 사용한 정리
  if (recaptchaWidgetId !== null && typeof (window as any).grecaptcha !== 'undefined') {
    try {
      (window as any).grecaptcha.reset(recaptchaWidgetId);
    } catch (e) {
      console.log('grecaptcha reset 오류:', e);
    }
  }
  
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.log('reCAPTCHA 정리 중 오류:', e);
    }
    recaptchaVerifier = null;
  }
  
  recaptchaWidgetId = null;
  
  // DOM에서 reCAPTCHA 엘리먼트 제거
  const recaptchaContainer = document.getElementById('recaptcha-container');
  if (recaptchaContainer) {
    // 모든 자식 요소 제거
    while (recaptchaContainer.firstChild) {
      recaptchaContainer.removeChild(recaptchaContainer.firstChild);
    }
  }
}

// 전화번호로 인증 코드 발송
export async function sendVerificationCode(
  phoneNumber: string,
  recaptchaContainerId: string
): Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string }> {
  try {
    if (!auth) {
      return { success: false, error: 'Firebase Auth가 초기화되지 않았습니다' };
    }
    
    // 개발 환경에서 테스트 번호 자동 처리
    if (process.env.NODE_ENV === 'development') {
      const testNumbers = ['+821011112222', '+821022221111'];
      const formattedPhone = '+82' + phoneNumber.replace(/-/g, '').substring(1);
      
      if (testNumbers.includes(formattedPhone)) {
        console.log('개발 환경: 테스트 전화번호 감지됨');
        // 가짜 confirmationResult 생성
        (window as any).confirmationResult = {
          confirm: async (code: string) => {
            const testCodes: { [key: string]: string } = {
              '+821011112222': '123456',
              '+821022221111': '234567'
            };
            
            if (code === testCodes[formattedPhone]) {
              return { 
                user: { 
                  getIdToken: async () => 'test-id-token-' + Date.now(),
                  phoneNumber: formattedPhone
                } 
              };
            }
            throw new Error('인증번호가 일치하지 않습니다');
          }
        };
        
        return { success: true, confirmationResult: (window as any).confirmationResult };
      }
    }
    
    // 한국 전화번호 형식으로 변환 (010-1234-5678 → +821012345678)
    const formattedPhone = '+82' + phoneNumber.replace(/-/g, '').substring(1);
    console.log('전화번호 형식 변환:', phoneNumber, '→', formattedPhone);
    
    // 재발송 시 기존 reCAPTCHA 정리
    clearRecaptcha();
    
    // 잠시 대기 (DOM 정리를 위해)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Recaptcha 설정
    const appVerifier = setupRecaptcha(recaptchaContainerId);
    
    if (!appVerifier) {
      return { success: false, error: 'reCAPTCHA 설정에 실패했습니다' };
    }
    
    try {
      // SMS 발송
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      if (!confirmationResult) {
        throw new Error('SMS 발송에 실패했습니다. 다시 시도해주세요.');
      }
      
      // 결과를 window 객체에 저장 (나중에 사용)
      (window as any).confirmationResult = confirmationResult;
      console.log('SMS 발송 성공, confirmationResult 저장됨:', !!confirmationResult);
      console.log('confirmationResult 타입:', typeof confirmationResult);
      console.log('confirmationResult 메소드:', Object.getOwnPropertyNames(confirmationResult));
      
      return { success: true, confirmationResult };
    } catch (signInError: any) {
      console.error('signInWithPhoneNumber 에러:', signInError);
      throw signInError;
    }
  } catch (error: any) {
    console.error('SMS 발송 오류:', error);
    
    // 에러 메시지 처리
    let errorMessage = 'SMS 발송에 실패했습니다';
    
    if (error.code === 'auth/invalid-phone-number') {
      errorMessage = '유효하지 않은 전화번호입니다';
    } else if (error.code === 'auth/missing-phone-number') {
      errorMessage = '전화번호를 입력해주세요';
    } else if (error.code === 'auth/quota-exceeded') {
      errorMessage = 'SMS 발송 한도를 초과했습니다';
    } else if (error.code === 'auth/captcha-check-failed') {
      errorMessage = 'reCAPTCHA 검증에 실패했습니다';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '너무 많은 요청입니다. 잠시 후 다시 시도해주세요';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = '이 전화번호는 사용할 수 없습니다';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = '전화번호 인증이 비활성화되어 있습니다. Firebase Console에서 Phone 인증을 활성화하고, 테스트 번호를 설정해주세요.';
    }
    
    clearRecaptcha();
    return { success: false, error: errorMessage };
  }
}

// 인증 코드 확인
export async function verifyCode(
  verificationCode: string
): Promise<{ success: boolean; idToken?: string; error?: string }> {
  try {
    const confirmationResult = (window as any).confirmationResult;
    console.log('인증 코드 확인 시작, confirmationResult 존재:', !!confirmationResult);
    
    if (!confirmationResult) {
      console.error('confirmationResult가 없습니다. window 객체:', Object.keys(window));
      return { success: false, error: '인증 세션이 만료되었습니다. 다시 시도해주세요' };
    }
    
    // 인증 코드 확인
    const result = await confirmationResult.confirm(verificationCode);
    
    // ID 토큰 가져오기
    const idToken = await result.user.getIdToken();
    
    // 인증 성공 후 정리
    delete (window as any).confirmationResult;
    clearRecaptcha();
    
    return { success: true, idToken };
  } catch (error: any) {
    console.error('인증 코드 확인 오류:', error);
    
    let errorMessage = '인증에 실패했습니다';
    
    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = '인증번호가 일치하지 않습니다';
    } else if (error.code === 'auth/code-expired') {
      errorMessage = '인증번호가 만료되었습니다';
    }
    
    return { success: false, error: errorMessage };
  }
}

// Firebase Auth에서 로그아웃
export async function signOutFirebase() {
  try {
    if (auth) {
      await auth.signOut();
    }
    clearRecaptcha();
  } catch (error) {
    console.error('Firebase 로그아웃 오류:', error);
  }
}