import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db';

// 금지어 목록 (욕설, 비속어, 부적절한 단어)
const BANNED_WORDS = [
  // 욕설 및 비속어
  '시발', '씨발', '씨빨', '개새끼', '개새', '새끼', '병신', '장애인', '애자',
  '좆', '좇', '존나', '졸라', '지랄', '미친', '또라이', '돌아이', '뻐큐',
  '엿', '개같', '썅', '시바', '시팔', '씹', '느금마', '니엄마', '니애미',
  
  // 성적 표현
  '섹스', '성관계', '자위', '딸딸이', '정액', '사정', '발기', '음경', '음부',
  '가슴', '젖가슴', '유두', '보지', '자지', '고추', '조개', '야동', '포르노',
  
  // 정치적/사회적 민감 표현
  '일베', '메갈', '한남', '한녀', '급식충', '틀딱', '꼰대',
  
  // 폭력적 표현
  '죽여', '죽이', '살인', '자살', '패죽', '뒤지', '디지',
  
  // 차별적 표현
  '흑인', '짱깨', '짱꼴라', '쪽바리', '원숭이',
  
  // 광고성/스팸
  'bit.ly', 'tinyurl', '카톡', '텔레그램', '디스코드', '광고', '홍보'
];

// 의심스러운 패턴 (경고만)
const WARNING_PATTERNS = [
  /[ㅅㅂ]/,           // ㅅㅂ
  /[ㅈㄹ]/,           // ㅈㄹ  
  /[ㅂㅅ]/,           // ㅂㅅ
  /18\+/,             // 18+
  /19\+/,             // 19+
  /\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/, // 전화번호 패턴
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // 이메일 패턴
];

// 닉네임 중복 체크
async function checkNicknameDuplicate(nickname: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('users')
    .select('nickname')
    .eq('nickname', nickname)
    .maybeSingle(); // single() 대신 maybeSingle() 사용 (데이터가 없어도 에러 안남)
  
  return !!data; // 데이터가 있으면 중복
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, context = 'general' } = body;

    if (!text) {
      return NextResponse.json(
        { valid: false, reason: '텍스트를 입력해주세요' },
        { status: 400 }
      );
    }

    const lowerText = text.toLowerCase();
    const noSpaceText = text.replace(/\s/g, '').toLowerCase();

    // 1. 길이 체크
    if (context === 'nickname') {
      if (text.length < 2) {
        return NextResponse.json({
          valid: false,
          reason: '닉네임은 2자 이상이어야 합니다'
        });
      }
      
      if (text.length > 8) {
        return NextResponse.json({
          valid: false,
          reason: '닉네임은 8자 이하여야 합니다'
        });
      }

      // 특수문자 체크 (한글, 영문, 숫자만 허용)
      const validPattern = /^[가-힣a-zA-Z0-9]+$/;
      if (!validPattern.test(text)) {
        return NextResponse.json({
          valid: false,
          reason: '닉네임은 한글, 영문, 숫자만 사용 가능합니다'
        });
      }

      // 닉네임 중복 체크
      const isDuplicate = await checkNicknameDuplicate(text);
      if (isDuplicate) {
        return NextResponse.json({
          valid: false,
          reason: '이미 사용 중인 닉네임입니다'
        });
      }
    }

    // 2. 금지어 체크
    for (const word of BANNED_WORDS) {
      if (lowerText.includes(word) || noSpaceText.includes(word.replace(/\s/g, ''))) {
        return NextResponse.json({
          valid: false,
          reason: '사용할 수 없는 단어가 포함되어 있습니다'
        });
      }
    }

    // 3. 변형 체크 (숫자/특수문자로 대체한 욕설)
    // const variations: { [key: string]: string[] } = {
    //   '시': ['ㅅ', 'si', '$!', 'c', 'ㅆ'],
    //   '발': ['ㅂ', 'bal', '8', 'ㅃ'],
    //   '새': ['ㅅ', 'sae', '$'],
    //   '끼': ['ㄲ', 'kki', 'ㅋ']
    // };

    // 변형된 욕설 패턴 체크
    const checkVariations = (text: string) => {
      // 시발 변형
      if (/[ㅅs$c][ㅣi1!][ㅂb8][ㅏa@]/.test(text)) return true;
      // 병신 변형
      if (/[ㅂb][ㅕyeo0][ㅇng][ㅅs$][ㅣi1!][ㄴn]/.test(text)) return true;
      
      return false;
    };

    if (checkVariations(noSpaceText)) {
      return NextResponse.json({
        valid: false,
        reason: '사용할 수 없는 표현이 포함되어 있습니다'
      });
    }

    // 4. 경고 패턴 체크
    let warning = null;
    for (const pattern of WARNING_PATTERNS) {
      if (pattern.test(text)) {
        warning = '개인정보나 부적절한 내용이 포함되어 있을 수 있습니다';
        break;
      }
    }

    // 5. 연속된 문자 체크 (도배 방지)
    if (context === 'comment' || context === 'notes') {
      const hasRepeatedChars = /(.)\1{4,}/.test(text); // 같은 문자 5번 이상 반복
      if (hasRepeatedChars) {
        return NextResponse.json({
          valid: false,
          reason: '같은 문자를 과도하게 반복할 수 없습니다'
        });
      }
    }

    // 6. 관리자 사칭 체크
    const adminKeywords = ['admin', '관리자', '운영자', 'gm', 'gamemaster'];
    for (const keyword of adminKeywords) {
      if (lowerText.includes(keyword)) {
        if (context === 'nickname') {
          return NextResponse.json({
            valid: false,
            reason: '관리자를 사칭하는 닉네임은 사용할 수 없습니다'
          });
        }
        warning = '관리자 사칭 의심 내용이 포함되어 있습니다';
      }
    }

    return NextResponse.json({
      valid: true,
      warning
    });

  } catch (error) {
    console.error('Moderation check error:', error);
    return NextResponse.json(
      { valid: false, reason: '검증 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}