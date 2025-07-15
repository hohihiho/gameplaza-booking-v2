# 크론잡 설정 가이드

## 만료된 대여 자동 체크

### 목적
체크인된 예약의 종료 시간이 지나면 자동으로:
1. 예약 상태를 'completed'로 변경
2. 기기 상태를 'available'로 변경

### 실행 주기
- **권장**: 5분마다
- **최소**: 10분마다

### 설정 방법

#### 1. Supabase Dashboard에서 설정
1. Supabase Dashboard 접속
2. Database → Functions 메뉴로 이동
3. `check_expired_rentals` 함수 확인
4. Cron Jobs 탭에서 새 크론잡 추가:
   ```
   이름: check-expired-rentals
   Schedule: */5 * * * * (5분마다)
   Command: SELECT check_expired_rentals();
   ```

#### 2. 외부 크론 서비스 사용 (무료)
- [cron-job.org](https://cron-job.org) 사용 예시:
  1. 회원가입 후 로그인
  2. Create Cronjob 클릭
  3. 설정:
     - URL: `https://omczibnzjqodumcabvwb.supabase.co/functions/v1/check-expired-rentals`
     - Schedule: Every 5 minutes
     - HTTP Method: GET
     - Request Headers:
       ```
       Authorization: Bearer [YOUR_ANON_KEY]
       Content-Type: application/json
       ```

#### 3. GitHub Actions 사용
`.github/workflows/check-expired-rentals.yml` 파일 생성:
```yaml
name: Check Expired Rentals

on:
  schedule:
    - cron: '*/5 * * * *'  # 5분마다 실행
  workflow_dispatch:  # 수동 실행 가능

jobs:
  check-rentals:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            https://omczibnzjqodumcabvwb.supabase.co/functions/v1/check-expired-rentals \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

### 테스트 방법
1. 관리자 페이지에서 체크인 처리
2. 해당 기기가 '대여중' 상태로 변경되는지 확인
3. 예약 종료 시간 이후 크론잡 실행
4. 기기가 '사용가능' 상태로 돌아오는지 확인

### 주의사항
- 크론잡이 실행되지 않으면 기기가 계속 '대여중' 상태로 남을 수 있음
- 백업 방안으로 관리자가 수동으로 상태를 변경할 수 있는 기능 필요
- 로그를 주기적으로 확인하여 정상 작동 여부 모니터링