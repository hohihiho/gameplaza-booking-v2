# 🏷️ 게임플라자 릴리즈 버전 관리 가이드

> 작성일: 2025-07-24  
> 버전: 1.0.0

## 📌 개요

이 문서는 게임플라자 예약 시스템의 릴리즈 버전 관리 규칙을 정의합니다. 웹 애플리케이션 특성상 사용자에게는 버전이 노출되지 않지만, 개발팀 내부적으로 일관된 버전 관리를 통해 배포 이력을 추적하고 롤백 시나리오에 대비합니다.

## 🎯 버전 체계: Semantic Versioning

### 기본 형식
```
MAJOR.MINOR.PATCH(-PRERELEASE)(+BUILD)
```

예시: `2.1.3`, `2.1.3-beta.1`, `2.1.3-rc.1+20250724`

### 버전 구성 요소

#### MAJOR (주 버전)
- **증가 시점**: 하위 호환성이 깨지는 변경
- **예시**:
  - API 응답 형식 대규모 변경
  - 데이터베이스 스키마 주요 변경
  - 인증 방식 전면 변경
  - UI/UX 전면 개편

#### MINOR (부 버전)
- **증가 시점**: 하위 호환성을 유지하면서 기능 추가
- **예시**:
  - 새로운 예약 옵션 추가
  - 관리자 기능 추가
  - 새로운 결제 수단 추가
  - 성능 개선

#### PATCH (패치 버전)
- **증가 시점**: 하위 호환성을 유지하면서 버그 수정
- **예시**:
  - 예약 시간 계산 버그 수정
  - UI 깨짐 수정
  - 타입 오류 수정
  - 보안 패치

### Pre-release 버전
```
X.Y.Z-<pre-release>
```

- **alpha**: 내부 테스트 버전 (예: `2.0.0-alpha.1`)
- **beta**: 외부 테스트 버전 (예: `2.0.0-beta.1`)
- **rc**: 릴리즈 후보 (예: `2.0.0-rc.1`)

### Build 메타데이터
```
X.Y.Z+<build>
```

- 빌드 날짜: `2.1.3+20250724`
- 커밋 해시: `2.1.3+a1b2c3d`
- CI 빌드 번호: `2.1.3+build.123`

## 📊 릴리즈 주기

### 정기 릴리즈
- **주간 릴리즈**: 매주 수요일 오후 2시
- **버전**: PATCH 또는 MINOR 증가
- **내용**: 버그 수정, 작은 기능 개선

### 긴급 패치
- **핫픽스**: 필요시 즉시
- **버전**: PATCH 증가
- **태그**: `hotfix-X.Y.Z`

### 메이저 릴리즈
- **분기별**: 3개월마다 (3, 6, 9, 12월)
- **버전**: MAJOR 증가
- **준비 기간**: 2주간의 RC 기간

## 🏷️ Git 태그 규칙

### 태그 형식
```bash
# 정식 릴리즈
v2.1.3

# Pre-release
v2.1.3-beta.1

# 핫픽스
hotfix-v2.1.3
```

### 태그 생성 명령어
```bash
# 태그 생성
git tag -a v2.1.3 -m "Release version 2.1.3"

# 태그 푸시
git push origin v2.1.3

# 모든 태그 푸시
git push origin --tags
```

## 📝 버전 관리 위치

### package.json
```json
{
  "name": "gameplaza-v2",
  "version": "2.1.3",
  "description": "광주 게임플라자 예약 시스템"
}
```

### 환경 변수
```bash
# .env.production
NEXT_PUBLIC_APP_VERSION=2.1.3
NEXT_PUBLIC_BUILD_DATE=2025-07-24
NEXT_PUBLIC_BUILD_COMMIT=a1b2c3d
```

### 버전 표시 (관리자용)
```typescript
// app/admin/layout.tsx
export default function AdminLayout() {
  return (
    <footer className="text-xs text-gray-500">
      v{process.env.NEXT_PUBLIC_APP_VERSION} 
      ({process.env.NEXT_PUBLIC_BUILD_DATE})
    </footer>
  );
}
```

## 📋 릴리즈 체크리스트

### 릴리즈 전
- [ ] 모든 테스트 통과
- [ ] CHANGELOG.md 업데이트
- [ ] package.json 버전 업데이트
- [ ] 환경 변수 업데이트
- [ ] 마이그레이션 스크립트 준비

### 릴리즈 과정
- [ ] Git 태그 생성
- [ ] GitHub Release 생성
- [ ] Vercel 배포 트리거
- [ ] 배포 확인

### 릴리즈 후
- [ ] 모니터링 확인
- [ ] 롤백 계획 준비
- [ ] 팀 공지

## 📑 CHANGELOG 형식

### CHANGELOG.md 예시
```markdown
# Changelog

## [2.1.3] - 2025-07-24

### Fixed
- 예약 시간 계산 오류 수정 (#123)
- 모바일 UI 깨짐 현상 수정 (#124)

### Security
- 인증 토큰 검증 강화

## [2.1.0] - 2025-07-17

### Added
- 예약 알림 기능 추가 (#110)
- 관리자 통계 대시보드 (#111)

### Changed
- 예약 취소 정책 변경 (24시간 → 12시간)

### Deprecated
- 구 버전 API 엔드포인트 (/api/v1/*)
```

## 🔄 버전 업그레이드 시나리오

### 시나리오 1: 버그 수정
```
현재: 2.1.3
수정: 예약 시간 버그
다음: 2.1.4
```

### 시나리오 2: 기능 추가
```
현재: 2.1.3
추가: 카카오페이 결제
다음: 2.2.0
```

### 시나리오 3: 대규모 변경
```
현재: 2.1.3
변경: v2 API 전면 전환
다음: 3.0.0
```

## 🚨 롤백 전략

### 버전별 롤백
```bash
# Vercel에서 이전 배포로 롤백
vercel rollback

# Git에서 이전 버전으로 롤백
git checkout v2.1.2
git tag -a v2.1.4 -m "Rollback to v2.1.2"
git push origin v2.1.4
```

### 데이터베이스 롤백
```sql
-- 마이그레이션 롤백 스크립트
-- /supabase/rollback/v2.1.3_rollback.sql
```

## 🤝 팀 규칙

1. **버전 결정권**: 팀 리더 또는 배포 담당자
2. **태그 생성**: main 브랜치에서만
3. **문서 업데이트**: 버전 변경 시 필수
4. **공지**: 메이저/마이너 변경 시 팀 전체 공지

## 📊 버전 이력 추적

### GitHub Releases
- 모든 정식 릴리즈는 GitHub Release로 생성
- 릴리즈 노트 포함
- 주요 변경사항 하이라이트

### Vercel 배포 이력
- 각 배포에 Git 태그 연결
- 배포 URL에 버전 정보 포함
- 롤백 가능한 배포 유지

---

**참고**: 이 가이드는 팀의 성장과 프로젝트 요구사항에 따라 지속적으로 업데이트됩니다.