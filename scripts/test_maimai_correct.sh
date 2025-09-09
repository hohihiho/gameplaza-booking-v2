#!/bin/bash

echo "=== 마이마이 DX 최대 대여 대수 테스트 (올바른 기기) ==="
echo "마이마이 DX는 시간대별로 최대 3대까지 예약 가능해야 합니다."
echo ""

# 먼저 이전 테스트 예약들 정리
echo "이전 테스트 예약 정리 중..."
echo ""

# 조기 시간대 테스트 (7-21시) - 2025-08-07 날짜로 테스트
echo "1. 첫 번째 예약 (조기 시간대 8-9시) - 마이마이 DX #1"
curl -X POST http://localhost:3000/api/v2/test/create-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "8d8bf85c-43a0-4b2b-a60a-8c5243178eb9",
    "date": "2025-08-07",
    "start_hour": 8,
    "end_hour": 9,
    "user_notes": "마이마이 DX 테스트 1"
  }' -s
echo -e "\n"

echo "2. 두 번째 예약 (조기 시간대 10-11시) - 마이마이 DX #2"
curl -X POST http://localhost:3000/api/v2/test/create-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "162c1275-8612-447e-a263-699ef6cff68b",
    "date": "2025-08-07", 
    "start_hour": 10,
    "end_hour": 11,
    "user_notes": "마이마이 DX 테스트 2"
  }' -s
echo -e "\n"

echo "3. 세 번째 예약 (조기 시간대 12-13시) - 마이마이 DX #3"
curl -X POST http://localhost:3000/api/v2/test/create-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "1b0cea6a-68f0-4f40-b16d-ff306704e131",
    "date": "2025-08-07",
    "start_hour": 12,
    "end_hour": 13,
    "user_notes": "마이마이 DX 테스트 3"
  }' -s
echo -e "\n"

echo "4. 네 번째 예약 시도 (조기 시간대 14-15시) - 마이마이 DX #4 - 실패해야 함!"
curl -X POST http://localhost:3000/api/v2/test/create-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "5734f369-ba86-4f49-9af1-08f5589d85e5",
    "date": "2025-08-07",
    "start_hour": 14,
    "end_hour": 15,
    "user_notes": "마이마이 DX 테스트 4 - 실패해야 함"
  }' -s
echo -e "\n"