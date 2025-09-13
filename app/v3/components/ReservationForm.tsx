'use client'

import { useState } from 'react'
import { formatKSTDate } from '@/lib/utils/kst-date'
import DeviceSelector from './DeviceSelector'

interface ReservationFormProps {
  onSuccess?: () => void
}

export default function ReservationForm({ onSuccess }: ReservationFormProps) {
  const [formData, setFormData] = useState({
    device_id: '',
    date: formatKSTDate(new Date()),
    start_hour: '14',
    end_hour: '16',
    player_count: 1,
    credit_type: 'fixed' as 'fixed' | 'freeplay' | 'unlimited',
    user_notes: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.device_id) {
      setError('기기를 선택해주세요')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v3/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          start_hour: parseInt(formData.start_hour),
          end_hour: parseInt(formData.end_hour)
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 폼 초기화
        setFormData({
          device_id: '',
          date: formatKSTDate(new Date()),
          start_hour: '14',
          end_hour: '16',
          player_count: 1,
          credit_type: 'fixed',
          user_notes: ''
        })
        
        // 성공 콜백 호출
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(data.error || '예약 생성에 실패했습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const creditTypes = [
    { value: 'fixed', label: '고정 크레딧' },
    { value: 'freeplay', label: '프리플레이' },
    { value: 'unlimited', label: '무한 크레딧' }
  ]

  // 시간 옵션 생성 (6시 ~ 29시)
  const timeOptions = []
  for (let i = 6; i <= 29; i++) {
    const hour = i > 23 ? i - 24 : i
    const label = i <= 23 ? `${i}시` : `익일 ${hour}시 (${i}시)`
    timeOptions.push({ value: hour.toString(), label, sortOrder: i })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {/* 기기 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          기기 선택
        </label>
        <DeviceSelector 
          value={formData.device_id}
          onChange={(deviceId) => setFormData({ ...formData, device_id: deviceId })}
        />
      </div>
      
      {/* 날짜 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          예약 날짜
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      {/* 시간 선택 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            시작 시간
          </label>
          <select
            value={formData.start_hour}
            onChange={(e) => setFormData({ ...formData, start_hour: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeOptions.map(option => (
              <option key={option.sortOrder} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            종료 시간
          </label>
          <select
            value={formData.end_hour}
            onChange={(e) => setFormData({ ...formData, end_hour: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeOptions.map(option => (
              <option key={option.sortOrder} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* 인원수 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          인원수
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, player_count: 1 })}
            className={`flex-1 py-2 px-4 rounded-lg border ${
              formData.player_count === 1
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            1인
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, player_count: 2 })}
            className={`flex-1 py-2 px-4 rounded-lg border ${
              formData.player_count === 2
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            2인
          </button>
        </div>
      </div>
      
      {/* 크레딧 타입 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          크레딧 타입
        </label>
        <select
          value={formData.credit_type}
          onChange={(e) => setFormData({ ...formData, credit_type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {creditTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* 메모 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          메모 (선택)
        </label>
        <textarea
          value={formData.user_notes}
          onChange={(e) => setFormData({ ...formData, user_notes: e.target.value })}
          placeholder="추가 요청사항을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? '예약 중...' : '예약하기'}
      </button>
    </form>
  )
}