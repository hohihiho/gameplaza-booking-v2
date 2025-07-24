/**
 * v2 API 데이터 검증 테스트
 * QA Engineer Agent 작성
 * 
 * 테스트 범위:
 * - 입력 데이터 형식 검증
 * - 필드 길이 제한
 * - 특수문자 처리
 * - SQL Injection 방지
 * - XSS 방지
 */

import {
  validateRequiredFields,
  validateDateFormat,
  validateTimeFormat,
  validateEmail,
  validatePhone,
  sanitizeInput
} from '@/lib/api/validation'

describe('Data Validation Tests', () => {
  describe('필수 필드 검증', () => {
    it('모든 필수 필드가 있을 때', () => {
      const data = {
        date: '2025-07-25',
        startTime: '14:00',
        endTime: '16:00',
        deviceId: 'device-1'
      }

      expect(() => 
        validateRequiredFields(data, ['date', 'startTime', 'endTime', 'deviceId'])
      ).not.toThrow()
    })

    it('필수 필드가 누락된 경우', () => {
      const data = {
        date: '2025-07-25',
        startTime: '14:00'
        // endTime, deviceId 누락
      }

      expect(() => 
        validateRequiredFields(data, ['date', 'startTime', 'endTime', 'deviceId'])
      ).toThrow('endTime')
    })

    it('null 값 처리', () => {
      const data = {
        date: null,
        startTime: '14:00',
        endTime: '16:00',
        deviceId: 'device-1'
      }

      expect(() => 
        validateRequiredFields(data, ['date', 'startTime', 'endTime', 'deviceId'])
      ).toThrow('date')
    })

    it('빈 문자열 처리', () => {
      const data = {
        date: '',
        startTime: '14:00',
        endTime: '16:00',
        deviceId: 'device-1'
      }

      expect(() => 
        validateRequiredFields(data, ['date', 'startTime', 'endTime', 'deviceId'])
      ).toThrow('date')
    })
  })

  describe('날짜 형식 검증', () => {
    it('정상 형식 (YYYY-MM-DD)', () => {
      expect(validateDateFormat('2025-07-25')).toBe('2025-07-25')
      expect(validateDateFormat('2025-01-01')).toBe('2025-01-01')
      expect(validateDateFormat('2025-12-31')).toBe('2025-12-31')
    })

    it('잘못된 형식', () => {
      expect(() => validateDateFormat('2025/07/25')).toThrow()
      expect(() => validateDateFormat('25-07-2025')).toThrow()
      expect(() => validateDateFormat('2025-7-25')).toThrow()
      expect(() => validateDateFormat('2025-13-01')).toThrow() // 잘못된 월
      expect(() => validateDateFormat('2025-07-32')).toThrow() // 잘못된 일
    })

    it('경계값 테스트', () => {
      expect(validateDateFormat('2025-02-28')).toBe('2025-02-28')
      expect(() => validateDateFormat('2025-02-30')).toThrow() // 2월 30일
      expect(validateDateFormat('2024-02-29')).toBe('2024-02-29') // 윤년
      expect(() => validateDateFormat('2025-02-29')).toThrow() // 평년
    })
  })

  describe('시간 형식 검증', () => {
    it('정상 형식 (HH:mm)', () => {
      expect(validateTimeFormat('14:00')).toBe('14:00')
      expect(validateTimeFormat('00:00')).toBe('00:00')
      expect(validateTimeFormat('23:59')).toBe('23:59')
      expect(validateTimeFormat('09:30')).toBe('09:30')
    })

    it('잘못된 형식', () => {
      expect(() => validateTimeFormat('14시')).toThrow()
      expect(() => validateTimeFormat('2:00')).toThrow() // 한 자리 수
      expect(() => validateTimeFormat('14:0')).toThrow() // 한 자리 분
      expect(() => validateTimeFormat('24:00')).toThrow() // 24시는 00시로
      expect(() => validateTimeFormat('14:60')).toThrow() // 잘못된 분
      expect(() => validateTimeFormat('25:00')).toThrow() // 잘못된 시간
    })

    it('특수 경우', () => {
      expect(() => validateTimeFormat('')).toThrow()
      expect(() => validateTimeFormat('14:')).toThrow()
      expect(() => validateTimeFormat(':30')).toThrow()
      expect(() => validateTimeFormat('14:00:00')).toThrow() // 초는 허용 안함
    })
  })

  describe('이메일 형식 검증', () => {
    it('정상 이메일', () => {
      expect(validateEmail('user@example.com')).toBe('user@example.com')
      expect(validateEmail('test.user@example.co.kr')).toBe('test.user@example.co.kr')
      expect(validateEmail('user+tag@example.com')).toBe('user+tag@example.com')
      expect(validateEmail('123@example.com')).toBe('123@example.com')
    })

    it('잘못된 이메일', () => {
      expect(() => validateEmail('user@')).toThrow()
      expect(() => validateEmail('@example.com')).toThrow()
      expect(() => validateEmail('user@example')).toThrow()
      expect(() => validateEmail('user example@example.com')).toThrow()
      expect(() => validateEmail('user@example@com')).toThrow()
    })
  })

  describe('전화번호 형식 검증', () => {
    it('정상 전화번호', () => {
      expect(validatePhone('010-1234-5678')).toBe('010-1234-5678')
      expect(validatePhone('01012345678')).toBe('010-1234-5678') // 자동 포맷팅
      expect(validatePhone('010 1234 5678')).toBe('010-1234-5678') // 공백 처리
      expect(validatePhone('02-123-4567')).toBe('02-123-4567') // 지역번호
    })

    it('잘못된 전화번호', () => {
      expect(() => validatePhone('1234-5678')).toThrow() // 지역번호 누락
      expect(() => validatePhone('010-12345-678')).toThrow() // 잘못된 자릿수
      expect(() => validatePhone('010-1234-567')).toThrow() // 지리수 부족
      expect(() => validatePhone('123-1234-5678')).toThrow() // 잘못된 지역번호
    })

    it('빈 값 허용 (선택사항)', () => {
      expect(validatePhone('')).toBe('')
      expect(validatePhone(null)).toBe('')
      expect(validatePhone(undefined)).toBe('')
    })
  })

  describe('입력값 새니타이징', () => {
    it('HTML 태그 제거', () => {
      expect(sanitizeInput('<script>alert("XSS")</script>'))
        .toBe('alert("XSS")')
      expect(sanitizeInput('<div>Hello</div>'))
        .toBe('Hello')
      expect(sanitizeInput('Hello <b>World</b>'))
        .toBe('Hello World')
    })

    it('SQL Injection 방지', () => {
      expect(sanitizeInput("'; DROP TABLE users; --"))
        .toBe(' DROP TABLE users ')
      expect(sanitizeInput('" OR 1=1 --'))
        .toBe(' OR 11 ')
      expect(sanitizeInput("admin' --"))
        .toBe('admin ')
    })

    it('특수문자 처리', () => {
      expect(sanitizeInput('Hello\nWorld')).toBe('Hello World')
      expect(sanitizeInput('Hello\tWorld')).toBe('Hello World')
      expect(sanitizeInput('Hello\rWorld')).toBe('Hello World')
      expect(sanitizeInput('Hello\x00World')).toBe('HelloWorld') // null byte
    })

    it('길이 제한', () => {
      const longString = 'a'.repeat(1001)
      const result = sanitizeInput(longString, { maxLength: 1000 })
      expect(result.length).toBe(1000)
    })

    it('유니코드 처리', () => {
      expect(sanitizeInput('한글 테스트')).toBe('한글 테스트')
      expect(sanitizeInput('😀😁😂')).toBe('😀😁😂') // 이모지
      expect(sanitizeInput('中文测试')).toBe('中文测试') // 중국어
    })
  })

  describe('필드별 길이 제한', () => {
    it('사용자 메모', () => {
      const maxLength = 500
      const validNote = 'a'.repeat(maxLength)
      const invalidNote = 'a'.repeat(maxLength + 1)

      expect(sanitizeInput(validNote, { maxLength })).toBe(validNote)
      expect(sanitizeInput(invalidNote, { maxLength }).length).toBe(maxLength)
    })

    it('예약번호 형식', () => {
      const validNumbers = [
        'GP-20250725-0001',
        'GP-20250725-9999',
        'GP-20251231-1234'
      ]

      const invalidNumbers = [
        'GP-2025-07-25-0001', // 잘못된 형식
        'GP-20250725-00001',  // 자릿수 초과
        'gp-20250725-0001',   // 소문자
        'GP-20250725-ABCD'    // 숫자가 아님
      ]

      validNumbers.forEach(num => {
        expect(() => validateReservationNumber(num)).not.toThrow()
      })

      invalidNumbers.forEach(num => {
        expect(() => validateReservationNumber(num)).toThrow()
      })
    })
  })

  describe('복합 검증 시나리오', () => {
    it('예약 생성 데이터 전체 검증', () => {
      const validReservation = {
        date: '2025-07-25',
        start_time: '14:00',
        end_time: '16:00',
        device_id: 'device-123',
        player_count: 2,
        total_amount: 20000,
        user_notes: '테스트 예약입니다.',
        credit_type: 'freeplay'
      }

      // 모든 검증 통과
      expect(() => validateReservationData(validReservation)).not.toThrow()
    })

    it('악의적인 데이터 거부', () => {
      const maliciousData = {
        date: "'; DROP TABLE reservations; --",
        start_time: '<script>alert(1)</script>',
        end_time: '16:00',
        device_id: 'device-123',
        player_count: -1, // 음수
        total_amount: 999999999, // 비현실적인 금액
        user_notes: 'a'.repeat(10000), // 너무 긴 텍스트
        credit_type: 'invalid_type'
      }

      expect(() => validateReservationData(maliciousData)).toThrow()
    })
  })
})

// Mock validation functions (실제로는 /lib/api/validation에 구현)
function validateReservationNumber(num: string): void {
  const pattern = /^GP-\d{8}-\d{4}$/
  if (!pattern.test(num)) {
    throw new Error('Invalid reservation number format')
  }
}

function validateReservationData(data: any): void {
  validateRequiredFields(data, ['date', 'start_time', 'end_time', 'device_id'])
  validateDateFormat(data.date)
  validateTimeFormat(data.start_time)
  validateTimeFormat(data.end_time)
  
  if (data.player_count && (data.player_count < 1 || data.player_count > 4)) {
    throw new Error('Invalid player count')
  }
  
  if (data.total_amount && (data.total_amount < 0 || data.total_amount > 1000000)) {
    throw new Error('Invalid amount')
  }
  
  if (data.credit_type && !['fixed', 'freeplay', 'unlimited'].includes(data.credit_type)) {
    throw new Error('Invalid credit type')
  }
}