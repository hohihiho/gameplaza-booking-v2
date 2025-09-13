'use client'

import { useEffect, useState } from 'react'

interface PricingDisplayProps {
  deviceType?: string
  creditType: 'fixed' | 'freeplay' | 'unlimited'
  playerCount: number
  duration: number // 시간 단위
  date?: string
  shiftType?: 'early' | 'overnight' | 'normal'
}

interface PricingDetail {
  base: number
  extra2p: number
  shiftExtra: number
  total: number
}

export default function PricingDisplay({
  deviceType,
  creditType,
  playerCount,
  duration,
  date,
  shiftType
}: PricingDisplayProps) {
  const [pricing, setPricing] = useState<PricingDetail>({
    base: 0,
    extra2p: 0,
    shiftExtra: 0,
    total: 0
  })

  useEffect(() => {
    calculatePricing()
  }, [deviceType, creditType, playerCount, duration, shiftType])

  const calculatePricing = () => {
    // 기본 가격표 (임시 데이터)
    const basePrices = {
      PS5: {
        fixed: 10000,
        freeplay: 15000,
        unlimited: 20000
      },
      Switch: {
        fixed: 8000,
        freeplay: 12000,
        unlimited: 18000
      },
      Racing: {
        fixed: 15000,
        freeplay: 20000,
        unlimited: 25000
      },
      Rhythm: {
        fixed: 5000,
        freeplay: 10000,
        unlimited: 15000
      }
    }

    // 기본 가격 계산
    const devicePrices = basePrices[deviceType as keyof typeof basePrices] || basePrices.PS5
    const basePrice = devicePrices[creditType] || 0
    
    // 시간당 가격으로 계산
    const hourlyPrice = basePrice
    const base = hourlyPrice * duration

    // 2인 추가 요금 (20% 추가)
    const extra2p = playerCount === 2 ? base * 0.2 : 0

    // 시간대별 추가 요금
    let shiftExtra = 0
    if (shiftType === 'early') {
      shiftExtra = base * 0.1 // 조기 10% 추가
    } else if (shiftType === 'overnight') {
      shiftExtra = base * 0.2 // 밤샘 20% 추가
    }

    const total = base + extra2p + shiftExtra

    setPricing({
      base,
      extra2p,
      shiftExtra,
      total
    })
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR')
  }

  if (!deviceType) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500 text-center">
          기기를 선택하면 가격이 표시됩니다
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">예상 요금</h3>
      
      <div className="space-y-2">
        {/* 기본 요금 */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            기본 요금 ({duration}시간)
          </span>
          <span className="font-medium">
            {formatPrice(pricing.base)}원
          </span>
        </div>

        {/* 2인 추가 요금 */}
        {pricing.extra2p > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">2인 플레이 추가</span>
            <span className="font-medium text-blue-600">
              +{formatPrice(pricing.extra2p)}원
            </span>
          </div>
        )}

        {/* 시간대 추가 요금 */}
        {pricing.shiftExtra > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {shiftType === 'early' ? '조기 영업' : '밤샘 영업'} 추가
            </span>
            <span className="font-medium text-orange-600">
              +{formatPrice(pricing.shiftExtra)}원
            </span>
          </div>
        )}

        {/* 구분선 */}
        <div className="border-t pt-2">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900">총 금액</span>
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(pricing.total)}원
            </span>
          </div>
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="text-xs text-gray-500 bg-white/50 rounded p-2">
        <p>※ 실제 요금은 현장 상황에 따라 달라질 수 있습니다</p>
        {creditType === 'fixed' && (
          <p>※ 고정 크레딧: 정해진 크레딧만 사용 가능</p>
        )}
        {creditType === 'freeplay' && (
          <p>※ 프리플레이: 시간 내 무제한 플레이</p>
        )}
        {creditType === 'unlimited' && (
          <p>※ 무한 크레딧: 크레딧 제한 없이 플레이</p>
        )}
      </div>
    </div>
  )
}