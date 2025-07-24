# 시드 데이터 관리

## 개요
이 디렉토리는 광주 게임플라자 예약 시스템의 초기 데이터를 설정하기 위한 시드 스크립트를 포함합니다.

## 슈퍼관리자 시드

### 기본 슈퍼관리자 계정
- **이메일**: ndz5496@gmail.com
- **이메일**: leejinseok94@gmail.com
- **초기 비밀번호**: superadmin123! (운영 환경에서는 반드시 변경)

### 실행 방법

#### 1. 모든 시드 데이터 생성
```bash
npm run seed
```

#### 2. 슈퍼관리자만 생성
```bash
npm run seed:superadmin
```

### 환경 설정
시드 스크립트를 실행하기 전에 `.env.local` 파일에 다음 환경변수가 설정되어 있어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (선택사항)
```

### 주의사항
1. **데이터베이스 마이그레이션**: 시드 데이터를 실행하기 전에 `admins` 테이블이 생성되어 있어야 합니다.
2. **중복 실행**: 시드 스크립트는 중복 실행을 방지하도록 설계되어 있습니다.
3. **비밀번호 변경**: 운영 환경에서는 반드시 초기 비밀번호를 변경해야 합니다.

### 시드 데이터 제거
테스트 환경에서 시드 데이터를 제거해야 하는 경우:

```typescript
import { removeSuperAdminSeeds } from './superadmin.seed'

// Supabase 클라이언트와 함께 실행
await removeSuperAdminSeeds(supabase)
```

## 추가 시드 데이터
향후 다음과 같은 시드 데이터가 추가될 수 있습니다:
- 기기 정보 (PlayStation, PC 등)
- 대여 설정 (가격, 시간 제한 등)
- 테스트 사용자
- 샘플 예약 데이터