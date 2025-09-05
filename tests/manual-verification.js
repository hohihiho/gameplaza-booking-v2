// iPhone UI 개선사항 수동 검증 스크립트
// 브라우저 콘솔에서 실행하여 개선사항 확인

console.log('🔍 iPhone UI 개선사항 검증 시작...');

// 1. Dynamic Island 호환 네비게이션 확인
const dynamicIslandNav = document.querySelector('nav[class*="dynamic-island-compatible"]');
if (dynamicIslandNav) {
  console.log('✅ Dynamic Island 호환 네비게이션 발견');
  const styles = window.getComputedStyle(dynamicIslandNav);
  console.log('   - 배경색:', styles.backgroundColor);
  console.log('   - 블러 효과:', styles.backdropFilter || styles.webkitBackdropFilter);
  console.log('   - 클래스:', dynamicIslandNav.className);
} else {
  console.log('❌ Dynamic Island 호환 네비게이션을 찾을 수 없음');
}

// 2. 하단 탭바 안전 영역 확인
const bottomTabBar = document.querySelector('.bottom-tab-safe');
if (bottomTabBar) {
  console.log('✅ 하단 탭바 안전 영역 발견');
  const styles = window.getComputedStyle(bottomTabBar);
  console.log('   - padding-bottom:', styles.paddingBottom);
  console.log('   - position:', styles.position);
  console.log('   - z-index:', styles.zIndex);
  console.log('   - 클래스:', bottomTabBar.className);
} else {
  console.log('❌ 하단 탭바 안전 영역을 찾을 수 없음');
}

// 3. 고정 하단 모바일 요소 확인
const fixedBottomMobile = document.querySelector('.fixed-bottom-mobile');
if (fixedBottomMobile) {
  console.log('✅ 고정 하단 모바일 요소 발견');
  const styles = window.getComputedStyle(fixedBottomMobile);
  console.log('   - padding-bottom:', styles.paddingBottom);
  console.log('   - position:', styles.position);
  console.log('   - bottom:', styles.bottom);
} else {
  console.log('❌ 고정 하단 모바일 요소를 찾을 수 없음');
}

// 4. 터치 타겟 크기 확인
const touchTargets = document.querySelectorAll('.touch-target, [data-testid="mobile-menu-toggle"], button');
console.log(`🎯 터치 타겟 ${touchTargets.length}개 검증 중...`);
touchTargets.forEach((target, index) => {
  const rect = target.getBoundingClientRect();
  const isValid = rect.width >= 44 && rect.height >= 44;
  console.log(`   ${index + 1}. ${isValid ? '✅' : '❌'} ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}px - ${target.tagName}${target.className ? '.' + target.className.split(' ')[0] : ''}`);
});

// 5. CSS 변수 확인
const rootStyles = window.getComputedStyle(document.documentElement);
console.log('🎨 CSS 변수 확인:');
console.log('   - 포커스 링 색상:', rootStyles.getPropertyValue('--color-focus-ring'));
console.log('   - 포커스 링 너비:', rootStyles.getPropertyValue('--focus-ring-width'));

// 6. 다크 모드 지원 확인
const isDarkMode = document.documentElement.classList.contains('dark');
console.log(`🌙 현재 모드: ${isDarkMode ? '다크' : '라이트'}`);

// 7. 뷰포트 메타 태그 확인
const viewportMeta = document.querySelector('meta[name="viewport"]');
if (viewportMeta) {
  console.log('✅ 뷰포트 메타 태그:', viewportMeta.content);
} else {
  console.log('❌ 뷰포트 메타 태그를 찾을 수 없음');
}

// 8. Safe area inset 지원 확인
const supportsEnv = CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)');
console.log(`📱 Safe area inset 지원: ${supportsEnv ? '✅' : '❌'}`);

// 9. iOS Safari 특화 최적화 확인
const supportsWebkit = CSS.supports('-webkit-touch-callout', 'none');
console.log(`🍎 WebKit 최적화 지원: ${supportsWebkit ? '✅' : '❌'}`);

console.log('🏁 iPhone UI 개선사항 검증 완료');

// 검증 결과 요약
const summary = {
  dynamicIsland: !!dynamicIslandNav,
  bottomTabSafe: !!bottomTabBar,
  fixedBottomMobile: !!fixedBottomMobile,
  touchTargets: Array.from(touchTargets).filter(t => {
    const r = t.getBoundingClientRect();
    return r.width >= 44 && r.height >= 44;
  }).length,
  totalTargets: touchTargets.length,
  safeAreaSupport: supportsEnv,
  webkitSupport: supportsWebkit
};

console.log('📊 검증 요약:', summary);
return summary;