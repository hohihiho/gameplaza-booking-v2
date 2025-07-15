-- 예약 테이블에 조정된 금액 필드 추가
-- 비전공자 설명: 원래 금액과 다르게 조정된 최종 금액을 저장하는 필드입니다

-- adjusted_amount 필드 추가 (없는 경우에만)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS adjusted_amount INTEGER;

-- 필드 설명 추가
COMMENT ON COLUMN reservations.adjusted_amount IS '조정된 최종 금액 (시간 조정이나 금액 조정 후의 금액)';

-- 기존 예약들의 adjusted_amount를 total_price로 초기화
UPDATE reservations 
SET adjusted_amount = total_price 
WHERE adjusted_amount IS NULL;