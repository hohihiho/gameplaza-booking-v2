#!/bin/bash

# 테스트용 JWT 토큰 생성 (실제로는 로그인을 통해 얻어야 함)
# 여기서는 서비스 키를 사용한 테스트

curl -X POST http://localhost:3000/api/v2/reservations \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=test-session" \
  -d '{
    "device_id": "3d116ca1-774a-4de8-b0f5-94cd0cca6e03",
    "date": "2025-08-05",
    "start_hour": 9,
    "end_hour": 10,
    "credit_type": "fixed",
    "player_count": 1,
    "user_notes": "최대 예약 대수 테스트"
  }' -v