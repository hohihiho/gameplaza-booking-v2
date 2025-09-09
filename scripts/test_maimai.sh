#!/bin/bash

echo "=== 마이마이 DX 최대 대여 대수 테스트 ==="
echo "마이마이 DX는 시간대별로 최대 3대까지 예약 가능해야 합니다."
echo ""

# 조기 시간대 테스트 (7-21시)
echo "1. 첫 번째 예약 (조기 시간대 8-9시)"
curl -X POST http://localhost:3000/api/v2/test/create-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "8d8bf85c-43a0-4b2b-a60a-8c5243178eb9",
    "date": "2025-08-06",
    "start_hour": 8,
    "end_hour": 9,
    "user_notes": "마이마이 테스트 1"
  }' -s 

echo ""
echo "2. 두 번째 예약 (조기 시간대 10-11시)"
curl -X POST http://localhost:3000/api/v2/test/create-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "699b80fd-1556-4087-9390-7071c0b178cd",
    "date": "2025-08-06", 
    "start_hour": 10,
    "end_hour": 11,
    "user_notes": "마이마이 테스트 2"
  }' -s

echo ""
echo "3. 세 번째 예약 (조기 시간대 12-13시)"
curl -X POST http://localhost:3000/api/v2/test/create-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "9a16a629-8d91-4157-ad87-724dd5b6439d",
    "date": "2025-08-06",
    "start_hour": 12,
    "end_hour": 13,
    "user_notes": "마이마이 테스트 3"
  }' -s

echo ""
echo "4. 네 번째 예약 시도 (조기 시간대 14-15시) - 실패해야 함"
curl -X POST http://localhost:3000/api/v2/test/create-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "14258d24-5619-401d-9739-9a3e14de5724",
    "date": "2025-08-06",
    "start_hour": 14,
    "end_hour": 15,
    "user_notes": "마이마이 테스트 4 - 실패해야 함"
  }' -s