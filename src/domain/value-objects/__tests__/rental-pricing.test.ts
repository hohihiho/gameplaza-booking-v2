import { RentalPricing } from '../rental-pricing'

describe('RentalPricing', () => {
  describe('생성', () => {
    it('시간당 가격 설정을 생성할 수 있다', () => {
      const pricing = RentalPricing.create({
        name: '평일 가격',
        type: 'hourly',
        basePrice: 5000,
        priority: 1
      })

      expect(pricing.name).toBe('평일 가격')
      expect(pricing.type).toBe('hourly')
      expect(pricing.basePrice).toBe(5000)
      expect(pricing.priority).toBe(1)
    })

    it('정액 가격 설정을 생성할 수 있다', () => {
      const pricing = RentalPricing.create({
        name: '밤샘 가격',
        type: 'flat',
        basePrice: 25000,
        startHour: 22,
        endHour: 29,
        priority: 2
      })

      expect(pricing.type).toBe('flat')
      expect(pricing.basePrice).toBe(25000)
    })

    it('세션 기반 가격 설정을 생성할 수 있다', () => {
      const pricing = RentalPricing.create({
        name: '세션 가격',
        type: 'session',
        basePrice: 3000,
        sessionMinutes: 60,
        priority: 1
      })

      expect(pricing.type).toBe('session')
    })

    it('음수 가격은 허용하지 않는다', () => {
      expect(() => RentalPricing.create({
        name: '잘못된 가격',
        type: 'hourly',
        basePrice: -1000,
        priority: 1
      })).toThrow('기본 가격은 0원 이상이어야 합니다')
    })

    it('세션 설정에 세션 시간이 없으면 에러가 발생한다', () => {
      expect(() => RentalPricing.create({
        name: '세션 가격',
        type: 'session',
        basePrice: 3000,
        priority: 1
      })).toThrow('세션 기반 가격은 세션 시간이 필요합니다')
    })
  })

  describe('조건 적용 여부', () => {
    it('조건이 없으면 항상 적용된다', () => {
      const pricing = RentalPricing.create({
        name: '평일 가격',
        type: 'hourly',
        basePrice: 5000,
        priority: 1
      })

      expect(pricing.appliesTo(0, 10)).toBe(true)
      expect(pricing.appliesTo(3, 15)).toBe(true)
      expect(pricing.appliesTo(6, 22)).toBe(true)
    })

    it('요일 조건을 확인한다', () => {
      const pricing = RentalPricing.create({
        name: '주말 가격',
        type: 'hourly',
        basePrice: 6000,
        dayOfWeek: [0, 6], // 일요일, 토요일
        priority: 2
      })

      expect(pricing.appliesTo(0, 15)).toBe(true)  // 일요일
      expect(pricing.appliesTo(6, 15)).toBe(true)  // 토요일
      expect(pricing.appliesTo(3, 15)).toBe(false) // 수요일
    })

    it('시간 조건을 확인한다', () => {
      const pricing = RentalPricing.create({
        name: '밤샘 가격',
        type: 'flat',
        basePrice: 25000,
        startHour: 22,
        endHour: 29,
        priority: 2
      })

      expect(pricing.appliesTo(1, 22)).toBe(true)
      expect(pricing.appliesTo(1, 25)).toBe(true)
      expect(pricing.appliesTo(1, 28)).toBe(true)
      expect(pricing.appliesTo(1, 21)).toBe(false)
    })

    it('플레이 모드 조건을 확인한다', () => {
      const pricing = RentalPricing.create({
        name: 'DX 특별 가격',
        type: 'hourly',
        basePrice: 7000,
        playMode: 'dx',
        priority: 3
      })

      expect(pricing.appliesTo(1, 15, 'dx')).toBe(true)
      expect(pricing.appliesTo(1, 15, 'standard')).toBe(false)
      expect(pricing.appliesTo(1, 15)).toBe(false)
    })
  })

  describe('가격 계산', () => {
    it('시간당 가격을 계산한다', () => {
      const pricing = RentalPricing.create({
        name: '평일 가격',
        type: 'hourly',
        basePrice: 5000,
        priority: 1
      })

      expect(pricing.calculatePrice(14, 18, 1)).toBe(20000) // 4시간
      expect(pricing.calculatePrice(10, 13, 1)).toBe(15000) // 3시간
    })

    it('정액 가격을 계산한다', () => {
      const pricing = RentalPricing.create({
        name: '밤샘 가격',
        type: 'flat',
        basePrice: 25000,
        priority: 2
      })

      expect(pricing.calculatePrice(22, 26, 1)).toBe(25000)
      expect(pricing.calculatePrice(22, 29, 1)).toBe(25000) // 시간과 무관
    })

    it('세션 기반 가격을 계산한다', () => {
      const pricing = RentalPricing.create({
        name: '세션 가격',
        type: 'session',
        basePrice: 3000,
        sessionMinutes: 60,
        priority: 1
      })

      expect(pricing.calculatePrice(10, 12, 1)).toBe(6000)  // 2시간 = 2세션
      expect(pricing.calculatePrice(10, 13, 1)).toBe(9000)  // 3시간 = 3세션
      expect(pricing.calculatePrice(10, 11, 1)).toBe(3000)  // 1시간 = 1세션
    })

    it('플레이어별 추가 가격을 계산한다', () => {
      const pricing = RentalPricing.create({
        name: '다인플레이 가격',
        type: 'hourly',
        basePrice: 5000,
        perPlayerPrice: 2000,
        priority: 1
      })

      expect(pricing.calculatePrice(10, 12, 1)).toBe(10000) // 2시간, 1인
      expect(pricing.calculatePrice(10, 12, 2)).toBe(12000) // 2시간, 2인
      expect(pricing.calculatePrice(10, 12, 3)).toBe(14000) // 2시간, 3인
    })

    it('최소/최대 가격을 적용한다', () => {
      const pricing = RentalPricing.create({
        name: '제한 가격',
        type: 'hourly',
        basePrice: 5000,
        minPrice: 10000,
        maxPrice: 30000,
        priority: 1
      })

      expect(pricing.calculatePrice(10, 11, 1)).toBe(10000) // 최소 적용
      expect(pricing.calculatePrice(10, 14, 1)).toBe(20000) // 정상 계산
      expect(pricing.calculatePrice(10, 18, 1)).toBe(30000) // 최대 적용
    })

    it('새벽 시간대를 올바르게 계산한다', () => {
      const pricing = RentalPricing.create({
        name: '심야 가격',
        type: 'hourly',
        basePrice: 5000,
        priority: 1
      })

      expect(pricing.calculatePrice(22, 26, 1)).toBe(20000) // 4시간
    })
  })

  describe('가격 설정 설명', () => {
    it('시간당 가격 설명을 생성한다', () => {
      const pricing = RentalPricing.create({
        name: '평일 가격',
        type: 'hourly',
        basePrice: 5000,
        priority: 1
      })

      expect(pricing.getDescription()).toBe('평일 가격 시간당 5,000원')
    })

    it('조건이 있는 가격 설명을 생성한다', () => {
      const pricing = RentalPricing.create({
        name: '주말 밤샘',
        type: 'flat',
        basePrice: 25000,
        dayOfWeek: [0, 6],
        startHour: 22,
        endHour: 29,
        priority: 2
      })

      expect(pricing.getDescription()).toBe('주말 밤샘 (일, 토) 22시-29시 정액 25,000원')
    })

    it('플레이 모드가 있는 가격 설명을 생성한다', () => {
      const pricing = RentalPricing.create({
        name: 'DX 특별',
        type: 'hourly',
        basePrice: 7000,
        playMode: 'dx',
        priority: 3
      })

      expect(pricing.getDescription()).toBe('DX 특별 [dx] 시간당 7,000원')
    })
  })
})