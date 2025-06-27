# Supabase 데이터베이스 설정 가이드

## 개요
게임플라자 예약 시스템의 기기 관리 테이블을 생성하고 초기 데이터를 설정하는 가이드입니다.

## 설정 방법

### 방법 1: Supabase Dashboard 사용 (권장)

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. 새 쿼리 생성
5. `/complete_migration.sql` 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭하여 실행

### 방법 2: 개별 마이그레이션 실행

순서대로 실행해야 합니다:

1. `ready_to_execute_002_device_management.sql` - 테이블 구조 생성
2. `ready_to_execute_003_device_seed_data.sql` - 초기 데이터 삽입

### 실행 확인

마이그레이션 실행 후 `check_migration.sql` 파일의 쿼리를 실행하여 다음을 확인하세요:

- 6개 테이블이 생성되었는지 확인
- 기기 카테고리가 제대로 입력되었는지 확인  
- 대여 가능한 기기 목록 확인
- 각 기기의 현재 상태 확인

## 생성되는 테이블

1. **device_categories** - 기기 제조사/카테고리 (SEGA, KONAMI 등)
2. **device_types** - 기기 종류 (마이마이 DX, 사운드 볼텍스 등)
3. **play_modes** - 플레이 모드 및 가격
4. **rental_settings** - 대여 설정 (가격, 크레딧 타입 등)
5. **devices** - 개별 기기 정보 및 상태
6. **rental_time_slots** - 대여 시간대 관리

## 초기 데이터

- 4개 카테고리 (SEGA, KONAMI, BANDAI NAMCO, 기타)
- 10개 기기 타입
- 6개 대여 가능 기기 타입
- 총 18개 개별 기기
- 각 기기별 플레이 모드 및 가격 설정

## 주의사항

- 모든 테이블에 RLS(Row Level Security)가 활성화되어 있음
- 현재는 읽기 권한만 설정되어 있음 (관리자 권한은 추후 구현)
- 테이블 간 외래키 제약이 설정되어 있으므로 삭제 시 순서에 주의

## 문제 해결

### 테이블이 이미 존재하는 경우
`CREATE TABLE IF NOT EXISTS` 구문을 사용하므로 안전하게 재실행 가능합니다.

### 데이터 중복 삽입 방지
`ON CONFLICT DO NOTHING` 구문으로 중복 데이터 삽입을 방지합니다.

### 권한 오류 발생 시
Service Role Key를 사용하거나 Supabase Dashboard에서 직접 실행하세요.