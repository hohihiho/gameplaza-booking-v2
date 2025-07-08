// 한국어 자음/모음 분리 및 변형 감지 유틸리티

// 한글 유니코드 상수
const HANGUL_START = 0xAC00;
const CHO_BASE = 588;
const JUNG_BASE = 28;

// 초성
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 중성
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];

// 종성
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 한글 분해
export function decomposeHangul(char: string): { cho: string; jung: string; jong: string } | null {
  const code = char.charCodeAt(0);
  
  if (code < HANGUL_START || code > HANGUL_START + 11171) {
    return null;
  }
  
  const base = code - HANGUL_START;
  const choIndex = Math.floor(base / CHO_BASE);
  const jungIndex = Math.floor((base % CHO_BASE) / JUNG_BASE);
  const jongIndex = base % JUNG_BASE;
  
  return {
    cho: CHO[choIndex],
    jung: JUNG[jungIndex],
    jong: JONG[jongIndex]
  };
}

// 문자열을 자음/모음으로 분해
export function decomposeString(str: string): string {
  return str.split('').map(char => {
    const decomposed = decomposeHangul(char);
    if (decomposed) {
      return decomposed.cho + decomposed.jung + decomposed.jong;
    }
    return char;
  }).join('');
}

// 유사 발음 매핑
const SIMILAR_SOUNDS: { [key: string]: string[] } = {
  // 초성 유사음
  'ㅅ': ['ㅆ', 'ㅊ', 'ㅈ', 'ㅉ'],
  'ㅆ': ['ㅅ', 'ㅊ', 'ㅈ', 'ㅉ'],
  'ㅂ': ['ㅃ', 'ㅍ'],
  'ㅃ': ['ㅂ', 'ㅍ'],
  'ㄱ': ['ㄲ', 'ㅋ'],
  'ㄲ': ['ㄱ', 'ㅋ'],
  'ㄷ': ['ㄸ', 'ㅌ'],
  'ㄸ': ['ㄷ', 'ㅌ'],
  
  // 중성 유사음
  'ㅏ': ['ㅑ', 'ㅓ'],
  'ㅓ': ['ㅏ', 'ㅕ'],
  'ㅗ': ['ㅛ', 'ㅜ'],
  'ㅜ': ['ㅗ', 'ㅠ'],
  'ㅣ': ['ㅡ', 'ㅢ'],
  'ㅡ': ['ㅣ', 'ㅢ'],
};

// 유사 발음으로 변형된 텍스트 생성
export function generateSimilarPatterns(word: string): string[] {
  const patterns = new Set<string>([word]);
  const decomposed = decomposeString(word);
  
  // 자음/모음 치환 패턴 생성
  for (let i = 0; i < decomposed.length; i++) {
    const char = decomposed[i];
    const similar = SIMILAR_SOUNDS[char];
    
    if (similar) {
      for (const replacement of similar) {
        const newPattern = decomposed.substring(0, i) + replacement + decomposed.substring(i + 1);
        patterns.add(newPattern);
      }
    }
  }
  
  // 띄어쓰기 변형 패턴
  const noSpace = word.replace(/\s/g, '');
  patterns.add(noSpace);
  
  // 문자 사이 띄어쓰기 추가
  const spaced = word.split('').join(' ');
  patterns.add(spaced);
  
  return Array.from(patterns);
}

// 강화된 비속어 패턴 목록
export const KOREAN_PROFANITY_PATTERNS = [
  // 기본 비속어
  { pattern: '시발', severity: 3 },
  { pattern: '씨발', severity: 3 },
  { pattern: '개새끼', severity: 3 },
  { pattern: '병신', severity: 3 },
  { pattern: '지랄', severity: 2 },
  { pattern: '좆', severity: 3 },
  { pattern: '닥쳐', severity: 2 },
  { pattern: '꺼져', severity: 2 },
  { pattern: '쓰레기', severity: 2 },
  { pattern: '멍청이', severity: 1 },
  { pattern: '바보', severity: 1 },
  { pattern: '미친', severity: 2 },
  { pattern: '또라이', severity: 2 },
  { pattern: '새끼', severity: 2 },
  { pattern: '놈', severity: 1 },
  { pattern: '년', severity: 2 },
  
  // 성적 표현
  { pattern: '섹스', severity: 2 },
  { pattern: '야동', severity: 2 },
  { pattern: '보지', severity: 3 },
  { pattern: '자지', severity: 3 },
  { pattern: '젖', severity: 2 },
  { pattern: '가슴', severity: 1 },
  { pattern: '음경', severity: 2 },
  { pattern: '성기', severity: 2 },
  
  // 폭력적 표현
  { pattern: '죽어', severity: 3 },
  { pattern: '죽여', severity: 3 },
  { pattern: '때려', severity: 2 },
  { pattern: '패', severity: 2 },
];

// 텍스트에서 비속어 검사
export function checkKoreanProfanity(text: string): {
  found: boolean;
  matches: string[];
  severity: number;
} {
  const lowerText = text.toLowerCase();
  const decomposed = decomposeString(lowerText);
  const matches = new Set<string>();
  let maxSeverity = 0;
  
  for (const { pattern, severity } of KOREAN_PROFANITY_PATTERNS) {
    // 원본 패턴 검사
    if (lowerText.includes(pattern)) {
      matches.add(pattern);
      maxSeverity = Math.max(maxSeverity, severity);
    }
    
    // 분해된 패턴 검사
    const decomposedPattern = decomposeString(pattern);
    if (decomposed.includes(decomposedPattern)) {
      matches.add(pattern);
      maxSeverity = Math.max(maxSeverity, severity);
    }
    
    // 유사 패턴 검사
    const similarPatterns = generateSimilarPatterns(pattern);
    for (const similar of similarPatterns) {
      if (lowerText.includes(similar) || decomposed.includes(decomposeString(similar))) {
        matches.add(pattern);
        maxSeverity = Math.max(maxSeverity, severity);
        break;
      }
    }
  }
  
  return {
    found: matches.size > 0,
    matches: Array.from(matches),
    severity: maxSeverity
  };
}