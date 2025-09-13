import { d1GetTimeSlotById, d1GetDevicePricing } from '@/lib/db/d1'

export type CreditOptionType = 'fixed' | 'freeplay' | 'unlimited'

// 가격 정보 타입 정의
type DevicePricingRecord = {
  id: number
  device_type_id: number
  option_type: string
  price: number
  price_2p_extra?: number | null
  enable_extra_people: number | boolean
  extra_per_person?: number | null
  created_at: string
  updated_at: string
}

// 가격 계산 결과 타입
export type PricingResult = {
  base: number
  extra_2p?: number
  extra_people?: number
  extra_fee?: number
  total: number
}

// 시간대 가격 계산 결과 타입 
export type SlotPricingResult = {
  base: number
  extra: number
  total: number
}

type Slot = {
  id: number
  slot_type: 'early' | 'overnight' | string
  credit_options: string | { options: Array<{ type: CreditOptionType; price: number; fixed_credits?: number }> }
  enable_2p?: number
  price_2p_extra?: number | null
}

// 유틸리티 함수들
function isValidDeviceTypeId(id: any): id is number {
  return typeof id === 'number' && Number.isInteger(id) && id > 0
}

function isValidCreditOptionType(type: any): type is CreditOptionType {
  return typeof type === 'string' && ['fixed', 'freeplay', 'unlimited'].includes(type)
}

function safeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value)
  return Number.isNaN(num) ? defaultValue : Math.max(0, num)
}

function parseCreditOptions(slot: Slot): Array<{ type: CreditOptionType; price: number; fixed_credits?: number }> {
  const raw = (slot.credit_options as any)
  if (typeof raw === 'string') {
    try {
      const obj = JSON.parse(raw)
      return obj?.options ?? []
    } catch (error) {
      console.warn('시간대 크레딧 옵션 JSON 파싱 실패:', error)
      return []
    }
  }
  return raw?.options ?? []
}

export function computeTotalFromSlot(slot: Slot, creditOptionType: CreditOptionType, is2p: boolean): SlotPricingResult {
  if (!isValidCreditOptionType(creditOptionType)) {
    console.warn('유효하지 않은 크레딧 타입:', creditOptionType)
    return { base: 0, extra: 0, total: 0 }
  }

  const options = parseCreditOptions(slot)
  const found = options.find(o => o.type === creditOptionType)
  const base = safeNumber(found?.price)
  const extra = is2p ? safeNumber(slot.price_2p_extra) : 0
  const total = base + extra
  
  return { base, extra, total }
}

export async function computeTotalFromSlotId(
  slotId: number, 
  creditOptionType: CreditOptionType, 
  is2p: boolean
): Promise<SlotPricingResult> {
  try {
    if (!isValidDeviceTypeId(slotId)) {
      console.warn('유효하지 않은 시간대 ID:', slotId)
      return { base: 0, extra: 0, total: 0 }
    }

    if (!isValidCreditOptionType(creditOptionType)) {
      console.warn('유효하지 않은 크레딧 타입:', creditOptionType)
      return { base: 0, extra: 0, total: 0 }
    }

    const slot = await d1GetTimeSlotById(slotId)
    if (!slot) {
      console.warn('시간대를 찾을 수 없습니다:', slotId)
      return { base: 0, extra: 0, total: 0 }
    }
    
    return computeTotalFromSlot(slot as Slot, creditOptionType, is2p)
  } catch (error) {
    console.error('시간대 기반 가격 계산 실패:', { slotId, creditOptionType, is2p, error })
    return { base: 0, extra: 0, total: 0 }
  }
}

// Device-type based pricing (preferred per policy)
export async function computeTotalFromDeviceType(
  deviceTypeId: number,
  creditOptionType: CreditOptionType,
  opts?: { participants?: number; is2p?: boolean; extra_fee?: number }
): Promise<PricingResult> {
  try {
    // 입력값 검증
    if (!isValidDeviceTypeId(deviceTypeId)) {
      console.warn('유효하지 않은 기기 타입 ID:', deviceTypeId)
      const extraFee = safeNumber(opts?.extra_fee)
      return { base: 0, extra_2p: 0, extra_people: 0, extra_fee, total: extraFee }
    }

    if (!isValidCreditOptionType(creditOptionType)) {
      console.warn('유효하지 않은 크레딧 타입:', creditOptionType)
      const extraFee = safeNumber(opts?.extra_fee)
      return { base: 0, extra_2p: 0, extra_people: 0, extra_fee, total: extraFee }
    }

    // 기기별 가격 정보 조회
    const pricing = await d1GetDevicePricing(deviceTypeId, creditOptionType) as DevicePricingRecord | null
    
    if (!pricing) {
      console.warn('기기 가격 정보를 찾을 수 없습니다:', { deviceTypeId, creditOptionType })
      const extraFee = safeNumber(opts?.extra_fee)
      return { base: 0, extra_2p: 0, extra_people: 0, extra_fee, total: extraFee }
    }

    // 가격 계산
    const base = safeNumber(pricing.price)
    const extra2p = opts?.is2p ? safeNumber(pricing.price_2p_extra) : 0
    const enableExtra = Boolean(pricing.enable_extra_people)
    const perPerson = safeNumber(pricing.extra_per_person)
    const participants = Math.max(1, safeNumber(opts?.participants, 1))
    const extraPeople = enableExtra ? Math.max(0, participants - 1) * perPerson : 0
    const extraFee = safeNumber(opts?.extra_fee)
    const total = base + extra2p + extraPeople + extraFee

    const result = {
      base,
      extra_2p: extra2p,
      extra_people: extraPeople,
      extra_fee: extraFee,
      total
    }

    // 가격 계산 결과 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('기기별 가격 계산 완료:', {
        deviceTypeId,
        creditOptionType,
        opts,
        pricing: {
          id: pricing.id,
          price: pricing.price,
          price_2p_extra: pricing.price_2p_extra,
          enable_extra_people: pricing.enable_extra_people,
          extra_per_person: pricing.extra_per_person
        },
        result
      })
    }

    return result
    
  } catch (error) {
    console.error('기기별 가격 계산 실패:', {
      deviceTypeId,
      creditOptionType,
      opts,
      error: error.message,
      stack: error.stack
    })
    
    // 에러 발생 시에도 안전한 기본값 반환
    const extraFee = safeNumber(opts?.extra_fee)
    return { base: 0, extra_2p: 0, extra_people: 0, extra_fee, total: extraFee }
  }
}
