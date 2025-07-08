// 영어 비속어 필터링 유틸리티

// 문자 치환 매핑 (leetspeak 및 변형)
const CHAR_SUBSTITUTIONS: { [key: string]: string[] } = {
  'a': ['@', '4', 'á', 'à', 'ä', 'â', 'ã', 'å', 'ā'],
  'e': ['3', '€', 'é', 'è', 'ë', 'ê', 'ē', 'ė', 'ę'],
  'i': ['1', '!', '|', 'í', 'ì', 'ï', 'î', 'ī', 'į'],
  'o': ['0', 'ó', 'ò', 'ö', 'ô', 'õ', 'ø', 'ō'],
  'u': ['ú', 'ù', 'ü', 'û', 'ū', 'ų'],
  's': ['5', '$', 'z', 'ś', 'š'],
  'g': ['9', '6'],
  'b': ['8'],
  'l': ['1', '|'],
  't': ['7', '+'],
  'c': ['(', '<', 'k', 'ć', 'č'],
  'k': ['c'],
  'z': ['s'],
  'n': ['ñ', 'ń'],
  'y': ['ý', 'ÿ'],
};

// 역방향 매핑 생성
const REVERSE_SUBSTITUTIONS: { [key: string]: string } = {};
for (const [original, substitutes] of Object.entries(CHAR_SUBSTITUTIONS)) {
  for (const sub of substitutes) {
    REVERSE_SUBSTITUTIONS[sub] = original;
  }
}

// 텍스트 정규화 (leetspeak 및 특수문자 복원)
export function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  // 특수문자를 원래 문자로 변환
  for (const [sub, original] of Object.entries(REVERSE_SUBSTITUTIONS)) {
    normalized = normalized.replace(new RegExp(escapeRegExp(sub), 'g'), original);
  }
  
  // 반복 문자 제거 (예: fuuuuck -> fuck)
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
  
  // 공백 및 특수문자 제거
  normalized = normalized.replace(/[\s\-_.]/g, '');
  
  return normalized;
}

// 정규식 특수문자 이스케이프
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 영어 비속어 패턴 목록
export const ENGLISH_PROFANITY_PATTERNS = [
  // 심각한 비속어 (severity: 3)
  { pattern: 'fuck', severity: 3 },
  { pattern: 'shit', severity: 3 },
  { pattern: 'bitch', severity: 3 },
  { pattern: 'cunt', severity: 3 },
  { pattern: 'dick', severity: 3 },
  { pattern: 'cock', severity: 3 },
  { pattern: 'pussy', severity: 3 },
  { pattern: 'asshole', severity: 3 },
  { pattern: 'bastard', severity: 3 },
  { pattern: 'whore', severity: 3 },
  { pattern: 'slut', severity: 3 },
  { pattern: 'nigger', severity: 3 },
  { pattern: 'nigga', severity: 3 },
  { pattern: 'faggot', severity: 3 },
  { pattern: 'fag', severity: 3 },
  
  // 중간 정도의 비속어 (severity: 2)
  { pattern: 'ass', severity: 2 },
  { pattern: 'damn', severity: 2 },
  { pattern: 'hell', severity: 2 },
  { pattern: 'piss', severity: 2 },
  { pattern: 'crap', severity: 2 },
  { pattern: 'screw', severity: 2 },
  { pattern: 'suck', severity: 2 },
  { pattern: 'jerk', severity: 2 },
  { pattern: 'douche', severity: 2 },
  { pattern: 'prick', severity: 2 },
  { pattern: 'retard', severity: 2 },
  { pattern: 'moron', severity: 2 },
  
  // 경미한 비속어 (severity: 1)
  { pattern: 'stupid', severity: 1 },
  { pattern: 'idiot', severity: 1 },
  { pattern: 'dumb', severity: 1 },
  { pattern: 'fool', severity: 1 },
  { pattern: 'loser', severity: 1 },
  { pattern: 'lame', severity: 1 },
  { pattern: 'sucks', severity: 1 },
  
  // 성적 표현
  { pattern: 'sex', severity: 2 },
  { pattern: 'porn', severity: 2 },
  { pattern: 'nude', severity: 2 },
  { pattern: 'naked', severity: 2 },
  { pattern: 'boob', severity: 2 },
  { pattern: 'tit', severity: 2 },
  { pattern: 'penis', severity: 2 },
  { pattern: 'vagina', severity: 2 },
  { pattern: 'anal', severity: 2 },
  { pattern: 'oral', severity: 2 },
  { pattern: 'cum', severity: 3 },
  { pattern: 'jizz', severity: 3 },
  
  // 폭력적 표현
  { pattern: 'kill', severity: 2 },
  { pattern: 'murder', severity: 2 },
  { pattern: 'rape', severity: 3 },
  { pattern: 'die', severity: 2 },
  { pattern: 'dead', severity: 1 },
  { pattern: 'shoot', severity: 2 },
  { pattern: 'stab', severity: 2 },
  { pattern: 'punch', severity: 1 },
  { pattern: 'beat', severity: 2 },
  
  // 약물 관련
  { pattern: 'drug', severity: 2 },
  { pattern: 'weed', severity: 2 },
  { pattern: 'cocaine', severity: 2 },
  { pattern: 'meth', severity: 2 },
  { pattern: 'heroin', severity: 2 },
  { pattern: 'crack', severity: 2 },
];

// 영어 비속어 변형 패턴
const PROFANITY_VARIATIONS: { [key: string]: string[] } = {
  'fuck': ['fk', 'fuk', 'fuc', 'fuq', 'fvck', 'fcuk', 'phuck', 'fook', 'fawk'],
  'shit': ['sht', 'sh1t', 'shyt', 'sh!t', 'shjt', 'shiet'],
  'bitch': ['b1tch', 'b!tch', 'btch', 'beech', 'biatch', 'biotch'],
  'ass': ['a$$', 'azz', '@ss', 'arse'],
  'dick': ['d1ck', 'd!ck', 'dik', 'dic'],
  'cock': ['c0ck', 'cok', 'cawk'],
  'pussy': ['pu$$y', 'p*ssy', 'pussi'],
  'nigger': ['n1gger', 'n!gger', 'nigg3r'],
  'faggot': ['f@ggot', 'f4ggot', 'fagget'],
};

// 컨텍스트 기반 검사 (단어 경계 확인)
function checkWordBoundary(text: string, word: string, position: number): boolean {
  const before = position > 0 ? text[position - 1] : ' ';
  const after = position + word.length < text.length ? text[position + word.length] : ' ';
  
  // 단어 경계 문자 확인
  const boundaryChars = /[^a-zA-Z0-9]/;
  return boundaryChars.test(before) && boundaryChars.test(after);
}

// 영어 비속어 검사
export function checkEnglishProfanity(text: string): {
  found: boolean;
  matches: string[];
  severity: number;
} {
  const normalized = normalizeText(text);
  const lowerText = text.toLowerCase();
  const matches = new Set<string>();
  let maxSeverity = 0;
  
  for (const { pattern, severity } of ENGLISH_PROFANITY_PATTERNS) {
    // 정규화된 텍스트에서 검사
    if (normalized.includes(pattern)) {
      matches.add(pattern);
      maxSeverity = Math.max(maxSeverity, severity);
      continue;
    }
    
    // 원본 텍스트에서 단어 경계 검사
    let index = lowerText.indexOf(pattern);
    while (index !== -1) {
      if (checkWordBoundary(lowerText, pattern, index)) {
        matches.add(pattern);
        maxSeverity = Math.max(maxSeverity, severity);
        break;
      }
      index = lowerText.indexOf(pattern, index + 1);
    }
    
    // 변형 패턴 검사
    const variations = PROFANITY_VARIATIONS[pattern];
    if (variations) {
      for (const variation of variations) {
        if (lowerText.includes(variation) || normalized.includes(variation)) {
          matches.add(pattern);
          maxSeverity = Math.max(maxSeverity, severity);
          break;
        }
      }
    }
  }
  
  return {
    found: matches.size > 0,
    matches: Array.from(matches),
    severity: maxSeverity
  };
}

// 스팸/광고 패턴 검사
export function checkSpamPatterns(text: string): boolean {
  const spamPatterns = [
    // URL 패턴
    /https?:\/\//i,
    /www\./i,
    /\.com|\.net|\.org|\.io|\.co/i,
    
    // 이메일 패턴
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
    
    // 전화번호 패턴
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\+\d{1,3}\s?\d{2,}/,
    
    // 소셜미디어 핸들
    /@[a-zA-Z0-9_]{3,}/,
    
    // 반복적인 대문자 (광고성)
    /[A-Z]{5,}/,
    
    // 특수문자 남발
    /[!?]{3,}/,
    /[$%]{2,}/,
  ];
  
  return spamPatterns.some(pattern => pattern.test(text));
}