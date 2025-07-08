import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';
import { checkKoreanProfanity } from '@/lib/utils/korean-filter';
import { checkEnglishProfanity, checkSpamPatterns } from '@/lib/utils/english-filter';

// 향상된 패턴 기반 비속어 검사
async function checkWithPatterns(text: string): Promise<{
  flagged: boolean;
  categories: string[];
  reason?: string;
}> {
  const lowerText = text.toLowerCase();
  
  // 비속어 패턴 검사
  const profanityPatterns = [
    // 한국어 비속어 패턴 (변형 포함)
    /[시씨쉬쒸][\s]*[발팔벌빨뻘]/gi,
    /[ㅅㅆ][\s]*[ㅂㅃ]/gi,
    /개[\s]*[새세쉐쎄][\s]*[끼키까꺄]/gi,
    /[병븅빙뷍][\s]*[신싄쉰씬]/gi,
    /[좆좃죶좄]/gi,
    /[지즤쥐][\s]*[랄럴롤]/gi,
    /[니년놈][어얼엉]/gi,
    /[섹셱쎅][\s]*[스쓰]/gi,
    /[야얄][\s]*[동똥]/gi,
    
    // 영어 비속어 패턴 (변형 포함)
    /f+[\s]*[u@]+[\s]*[c(]+[\s]*k+/gi,
    /s+[\s]*h+[\s]*[i!1]+[\s]*t+/gi,
    /b+[\s]*[i!1]+[\s]*t+[\s]*c+[\s]*h+/gi,
    /a+[\s]*s+[\s]*s+[\s]*h+[\s]*o+[\s]*l+[\s]*e+/gi,
    /d+[\s]*[i!1]+[\s]*c+[\s]*k+/gi,
    /p+[\s]*u+[\s]*s+[\s]*s+[\s]*y+/gi,
    /c+[\s]*o+[\s]*c+[\s]*k+/gi,
    /w+[\s]*h+[\s]*o+[\s]*r+[\s]*e+/gi,
    
    // 특수문자 변형 패턴
    /[씨c]{1}[1!|]{1}[발8]{1}/gi,
    /[개9]{1}[새5]{1}[끼7]{1}/gi,
  ];

  // 공격적 표현 패턴
  const offensivePatterns = [
    /죽[어여]/gi,
    /[디뒤][\s]*[져저]/gi,
    /[꺼거][\s]*[져저]/gi,
    /[닥덕][\s]*[쳐처]/gi,
    /[재쟤][\s]*[수숫][\s]*[없업]/gi,
    /[찐쪽][\s]*[따따]/gi,
    /[멍몽][\s]*[청충]/gi,
    /[똥뚱][\s]*[개게]/gi,
    
    // 영어 공격적 표현
    /k+[\s]*i+[\s]*l+[\s]*l+[\s]*y+o+u+r+s+e+l+f+/gi,
    /g+o+[\s]*t+o+[\s]*h+e+l+l+/gi,
    /s+t+u+p+i+d+/gi,
    /i+d+i+o+t+/gi,
    /l+o+s+e+r+/gi,
  ];

  // 성적 표현 패턴
  const sexualPatterns = [
    /[보뽀][\s]*[지즤]/gi,
    /[자쟈][\s]*[지즤]/gi,
    /[따땃][\s]*[먹멋]/gi,
    /[박밖][\s]*[아앗]/gi,
    /[조좆][\s]*[까꺄]/gi,
    /[페페][\s]*[티티]/gi,
    /[젖젗]/gi,
    /[음읍][\s]*[경겅]/gi,
  ];

  const categories = [];
  let flagged = false;

  // 각 패턴 그룹 검사
  for (const pattern of profanityPatterns) {
    if (pattern.test(lowerText)) {
      flagged = true;
      if (!categories.includes('profanity')) categories.push('profanity');
      break;
    }
  }

  for (const pattern of offensivePatterns) {
    if (pattern.test(lowerText)) {
      flagged = true;
      if (!categories.includes('offensive')) categories.push('offensive');
      break;
    }
  }

  for (const pattern of sexualPatterns) {
    if (pattern.test(lowerText)) {
      flagged = true;
      if (!categories.includes('sexual')) categories.push('sexual');
      break;
    }
  }

  if (flagged) {
    const categoryNames = {
      profanity: '비속어',
      offensive: '공격적 표현',
      sexual: '성적 표현'
    };
    
    const reason = categories
      .map(cat => categoryNames[cat as keyof typeof categoryNames])
      .join(', ');
    
    return {
      flagged: true,
      categories,
      reason: `${reason}이 포함되어 있습니다`
    };
  }

  return { flagged: false, categories: [] };
}

// 커스텀 금지어 체크
async function checkCustomBannedWords(text: string): Promise<{
  flagged: boolean;
  word?: string;
  severity?: number;
}> {
  // 금지어 목록 조회
  const { data: bannedWords } = await supabaseAdmin
    .from('banned_words')
    .select('word, severity')
    .eq('is_active', true);

  if (!bannedWords || bannedWords.length === 0) {
    return { flagged: false };
  }

  const lowerText = text.toLowerCase();
  
  for (const { word, severity } of bannedWords) {
    // 단어 경계를 고려한 검사
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b|${word.toLowerCase()}`, 'gi');
    if (regex.test(lowerText)) {
      return { flagged: true, word, severity };
    }
  }

  return { flagged: false };
}


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { text, context = 'nickname' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '검사할 텍스트를 입력해주세요' },
        { status: 400 }
      );
    }

    // 길이 체크
    if (context === 'nickname') {
      if (text.length < 2 || text.length > 8) {
        return NextResponse.json({
          valid: false,
          reason: '닉네임은 2-8자 사이여야 합니다'
        });
      }
    }

    // 1. 한국어 특화 비속어 체크
    const koreanCheck = checkKoreanProfanity(text);
    if (koreanCheck.found) {
      const severity = koreanCheck.severity;
      if (severity >= 3) {
        return NextResponse.json({
          valid: false,
          reason: '사용할 수 없는 표현이 포함되어 있습니다',
          severity: 'block'
        });
      } else if (severity >= 2) {
        return NextResponse.json({
          valid: false,
          reason: '부적절한 표현이 포함되어 있습니다',
          severity: 'warn'
        });
      }
    }

    // 2. 영어 특화 비속어 체크
    const englishCheck = checkEnglishProfanity(text);
    if (englishCheck.found) {
      const severity = englishCheck.severity;
      if (severity >= 3) {
        return NextResponse.json({
          valid: false,
          reason: '사용할 수 없는 표현이 포함되어 있습니다',
          severity: 'block'
        });
      } else if (severity >= 2) {
        return NextResponse.json({
          valid: false,
          reason: '부적절한 표현이 포함되어 있습니다',
          severity: 'warn'
        });
      }
    }

    // 3. 스팸/광고 패턴 체크
    if (checkSpamPatterns(text)) {
      return NextResponse.json({
        valid: false,
        reason: '링크, 이메일, 전화번호 등은 사용할 수 없습니다',
        severity: 'block'
      });
    }

    // 4. 패턴 기반 비속어 체크 (백업)
    const patternCheck = await checkWithPatterns(text);
    if (patternCheck.flagged) {
      return NextResponse.json({
        valid: false,
        reason: patternCheck.reason || '부적절한 내용이 포함되어 있습니다',
        categories: patternCheck.categories
      });
    }

    // 5. 커스텀 금지어 체크
    const customCheck = await checkCustomBannedWords(text);
    if (customCheck.flagged) {
      if (customCheck.severity === 2) {
        return NextResponse.json({
          valid: false,
          reason: '사용할 수 없는 단어가 포함되어 있습니다',
          severity: 'block'
        });
      } else {
        return NextResponse.json({
          valid: true,
          warning: '일부 단어가 부적절할 수 있습니다',
          severity: 'warn'
        });
      }
    }


    // 6. 특수 문자 및 형식 체크
    if (context === 'nickname') {
      // 닉네임에 허용된 문자만 체크 (한글, 영문, 숫자, 일부 특수문자) - 공백 제외
      const validPattern = /^[가-힣a-zA-Z0-9_\-]+$/;
      if (!validPattern.test(text)) {
        return NextResponse.json({
          valid: false,
          reason: '닉네임은 한글, 영문, 숫자, _, - 만 사용 가능합니다 (공백 사용 불가)'
        });
      }
      
      // 7. 닉네임 중복 체크
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('nickname', text)
        .neq('email', session.user.email) // 자기 자신은 제외
        .single();
      
      if (existingUser) {
        return NextResponse.json({
          valid: false,
          reason: '이미 사용 중인 닉네임입니다'
        });
      }
    }

    return NextResponse.json({
      valid: true,
      message: '사용 가능합니다'
    });

  } catch (error) {
    console.error('Moderation check error:', error);
    return NextResponse.json(
      { error: '검사 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}