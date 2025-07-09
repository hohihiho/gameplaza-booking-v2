// 닉네임 필터 테스트
const text = "호히후";

// 한글 분해 테스트
const HANGUL_START = 0xAC00;
const CHO_BASE = 588;
const JUNG_BASE = 28;

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function decomposeHangul(char) {
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

function decomposeString(str) {
  return str.split('').map(char => {
    const decomposed = decomposeHangul(char);
    if (decomposed) {
      return decomposed.cho + decomposed.jung + decomposed.jong;
    }
    return char;
  }).join('');
}

console.log('원본:', text);
console.log('소문자:', text.toLowerCase());
console.log('분해:', decomposeString(text));

// 각 글자 분해
text.split('').forEach(char => {
  const decomposed = decomposeHangul(char);
  if (decomposed) {
    console.log(`${char} → 초성:${decomposed.cho}, 중성:${decomposed.jung}, 종성:${decomposed.jong}`);
  }
});

// 패턴 매칭 테스트
const patterns = ['호', '히', '후', '호히', '히후', '호히후'];
patterns.forEach(pattern => {
  console.log(`"${pattern}" 포함 여부:`, text.includes(pattern));
});