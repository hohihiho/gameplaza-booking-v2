import { TimeSlotTemplate, CreditOption } from '../time-slot-template'
import { TimeSlot } from '../../value-objects/time-slot'

describe('TimeSlotTemplate', () => {
  const validProps = {
    id: 'test-id',
    name: '조기대여',
    description: '오전 시간대 대여',
    type: 'early' as const,
    timeSlot: TimeSlot.create(10, 14),
    creditOptions: [
      {
        type: 'fixed' as const,
        hours: [4],
        prices: { 4: 25000 },
        fixedCredits: 100
      },
      {
        type: 'freeplay' as const,
        hours: [4],
        prices: { 4: 30000 }
      }
    ],
    enable2P: true,
    price2PExtra: 10000,
    isYouthTime: true,
    priority: 1,
    isActive: true
  }

  describe('create', () => {
    it('유효한 속성으로 템플릿을 생성할 수 있다', () => {
      const template = TimeSlotTemplate.create(validProps)

      expect(template.id).toBe(validProps.id)
      expect(template.name).toBe(validProps.name)
      expect(template.type).toBe(validProps.type)
      expect(template.timeSlot).toEqual(validProps.timeSlot)
      expect(template.creditOptions).toEqual(validProps.creditOptions)
      expect(template.enable2P).toBe(true)
      expect(template.price2PExtra).toBe(10000)
      expect(template.isYouthTime).toBe(true)
    })

    it('크레딧 옵션이 없으면 에러를 발생시킨다', () => {
      const props = { ...validProps, creditOptions: [] }
      
      expect(() => TimeSlotTemplate.create(props))
        .toThrow('최소 하나 이상의 크레딧 옵션이 필요합니다')
    })

    it('2인 플레이가 활성화되었지만 추가 요금이 없으면 에러를 발생시킨다', () => {
      const props = { ...validProps, enable2P: true, price2PExtra: undefined }
      
      expect(() => TimeSlotTemplate.create(props))
        .toThrow('2인 플레이가 활성화된 경우 추가 요금을 설정해야 합니다')
    })

    it('청소년 시간대가 범위를 벗어나면 에러를 발생시킨다', () => {
      const props = { 
        ...validProps, 
        timeSlot: TimeSlot.create(22, 26), // 22시-02시
        isYouthTime: true 
      }
      
      expect(() => TimeSlotTemplate.create(props))
        .toThrow('청소년 시간대는 오전 9시부터 오후 10시 사이여야 합니다')
    })

    it('고정크레딧 옵션에 크레딧 수가 없으면 에러를 발생시킨다', () => {
      const props = {
        ...validProps,
        creditOptions: [{
          type: 'fixed' as const,
          hours: [4],
          prices: { 4: 25000 },
          fixedCredits: undefined
        }]
      }
      
      expect(() => TimeSlotTemplate.create(props))
        .toThrow('고정크레딧 옵션은 크레딧 수를 설정해야 합니다')
    })
  })

  describe('getPrice', () => {
    it('특정 크레딧 타입과 시간에 대한 가격을 반환한다', () => {
      const template = TimeSlotTemplate.create(validProps)

      const price = template.getPrice('fixed', 4, false)
      expect(price).toBe(25000)
    })

    it('2인 플레이 시 추가 요금을 포함한 가격을 반환한다', () => {
      const template = TimeSlotTemplate.create(validProps)

      const price = template.getPrice('freeplay', 4, true)
      expect(price).toBe(40000) // 30000 + 10000
    })

    it('존재하지 않는 크레딧 타입은 null을 반환한다', () => {
      const template = TimeSlotTemplate.create(validProps)

      const price = template.getPrice('unlimited', 4, false)
      expect(price).toBeNull()
    })

    it('존재하지 않는 시간은 null을 반환한다', () => {
      const template = TimeSlotTemplate.create(validProps)

      const price = template.getPrice('fixed', 5, false)
      expect(price).toBeNull()
    })
  })

  describe('getAvailableHours', () => {
    it('특정 크레딧 타입의 사용 가능한 시간 옵션을 반환한다', () => {
      const template = TimeSlotTemplate.create(validProps)

      const hours = template.getAvailableHours('fixed')
      expect(hours).toEqual([4])
    })

    it('존재하지 않는 크레딧 타입은 빈 배열을 반환한다', () => {
      const template = TimeSlotTemplate.create(validProps)

      const hours = template.getAvailableHours('unlimited')
      expect(hours).toEqual([])
    })
  })

  describe('conflictsWith', () => {
    it('시간대가 겹치는 같은 타입의 템플릿과 충돌한다', () => {
      const template1 = TimeSlotTemplate.create(validProps)
      const template2 = TimeSlotTemplate.create({
        ...validProps,
        id: 'test-id-2',
        name: '조기대여2',
        timeSlot: TimeSlot.create(12, 16)
      })

      expect(template1.conflictsWith(template2)).toBe(true)
    })

    it('시간대가 겹치지 않으면 충돌하지 않는다', () => {
      const template1 = TimeSlotTemplate.create(validProps)
      const template2 = TimeSlotTemplate.create({
        ...validProps,
        id: 'test-id-2',
        name: '오후대여',
        timeSlot: TimeSlot.create(14, 18)
      })

      expect(template1.conflictsWith(template2)).toBe(false)
    })

    it('다른 타입끼리는 시간대가 겹쳐도 충돌하지 않는다', () => {
      const template1 = TimeSlotTemplate.create(validProps)
      const template2 = TimeSlotTemplate.create({
        ...validProps,
        id: 'test-id-2',
        name: '밤샘대여',
        type: 'overnight',
        timeSlot: TimeSlot.create(10, 14)
      })

      expect(template1.conflictsWith(template2)).toBe(false)
    })

    it('비활성화된 템플릿과는 충돌하지 않는다', () => {
      const template1 = TimeSlotTemplate.create(validProps)
      const template2 = TimeSlotTemplate.create({
        ...validProps,
        id: 'test-id-2',
        name: '조기대여2',
        timeSlot: TimeSlot.create(12, 16),
        isActive: false
      })

      expect(template1.conflictsWith(template2)).toBe(false)
    })
  })

  describe('update', () => {
    it('템플릿 정보를 업데이트할 수 있다', () => {
      const template = TimeSlotTemplate.create(validProps)
      const updated = template.update({
        name: '새로운 이름',
        priority: 2
      })

      expect(updated.name).toBe('새로운 이름')
      expect(updated.priority).toBe(2)
      expect(updated.id).toBe(template.id) // ID는 변경되지 않음
    })

    it('업데이트 시 검증 규칙이 적용된다', () => {
      const template = TimeSlotTemplate.create(validProps)
      
      expect(() => template.update({
        creditOptions: []
      })).toThrow('최소 하나 이상의 크레딧 옵션이 필요합니다')
    })
  })

  describe('toggleActive', () => {
    it('활성화 상태를 토글할 수 있다', () => {
      const template = TimeSlotTemplate.create(validProps)
      const toggled = template.toggleActive()

      expect(toggled.isActive).toBe(false)
      
      const toggledAgain = toggled.toggleActive()
      expect(toggledAgain.isActive).toBe(true)
    })
  })
})