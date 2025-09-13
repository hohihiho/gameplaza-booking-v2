'use client'

import { useState, useEffect } from 'react'

interface TimeSlotPickerProps {
  deviceId: string
  date: string
  onSelect: (startHour: number, endHour: number) => void
}

export default function TimeSlotPicker({ deviceId, date, onSelect }: TimeSlotPickerProps) {
  const [mode, setMode] = useState<'preset' | 'manual'>('preset')
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [startHour, setStartHour] = useState<string>('14')
  const [endHour, setEndHour] = useState<string>('16')
  const [availability, setAvailability] = useState<any>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  
  // 시간대별 가격 정보 포함
  const presetSlots = [
    { id: '2h', label: '2시간', start: 14, end: 16, price: 20000 },
    { id: '3h', label: '3시간', start: 14, end: 17, price: 28000 },
    { id: '4h', label: '4시간', start: 14, end: 18, price: 35000 },
    { id: 'night', label: '밤샘 (22시~익일 5시)', start: 22, end: 5, price: 50000 },
  ]
  
  // 시간대 구분
  const timeSlots = {
    early: { label: '오전 (6시~12시)', hours: [6, 7, 8, 9, 10, 11] },
    normal: { label: '오후 (12시~22시)', hours: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21] },
    overnight: { label: '심야 (22시~익일 5시)', hours: [22, 23, 0, 1, 2, 3, 4, 5] }
  }
  
  // 가용성 체크
  const checkAvailability = async (start: number, end: number) => {
    if (!deviceId || !date) return
    
    setCheckingAvailability(true)
    try {
      const response = await fetch(`/api/v3/availability?device_id=${deviceId}&date=${date}&start_hour=${start}&end_hour=${end}`)
      const data = await response.json()
      setAvailability(data)
    } catch (error) {
      console.error('Failed to check availability:', error)
    } finally {
      setCheckingAvailability(false)
    }
  }
  
  useEffect(() => {
    if (deviceId && date) {
      const start = parseInt(startHour)
      const end = parseInt(endHour)
      checkAvailability(start, end)
    }
  }, [deviceId, date, startHour, endHour])
  
  const handlePresetSelect = (preset: typeof presetSlots[0]) => {
    setSelectedPreset(preset.id)
    setStartHour(preset.start.toString())
    setEndHour(preset.end.toString())
    onSelect(preset.start, preset.end)
  }
  
  const handleManualSelect = () => {
    const start = parseInt(startHour)
    const end = parseInt(endHour)
    onSelect(start, end)
  }
  
  // 시간 옵션 생성 (6시 ~ 29시)
  const getTimeOptions = () => {
    const options = []
    for (let i = 6; i <= 29; i++) {
      const hour = i > 23 ? i - 24 : i
      const label = i <= 23 ? `${i}시` : `익일 ${hour}시 (${i}시)`
      options.push({ value: hour.toString(), label, sortOrder: i })
    }
    return options
  }
  
  return (
    <div className="space-y-4">
      {/* 모드 선택 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('preset')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            mode === 'preset'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          추천 시간대
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          직접 선택
        </button>
      </div>
      
      {mode === 'preset' ? (
        /* 프리셋 시간대 */
        <div className="grid grid-cols-2 gap-3">
          {presetSlots.map(slot => (
            <button
              key={slot.id}
              type="button"
              onClick={() => handlePresetSelect(slot)}
              className={`p-3 rounded-lg border transition ${
                selectedPreset === slot.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{slot.label}</div>
              <div className="text-xs text-gray-500">
                {slot.start <= 23 ? `${slot.start}:00` : `익일 ${slot.start - 24}:00`}
                {' ~ '}
                {slot.end <= 23 ? `${slot.end}:00` : `익일 ${slot.end - 24}:00`}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {slot.price.toLocaleString()}원
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* 수동 시간 선택 */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 시간
              </label>
              <select
                value={startHour}
                onChange={(e) => {
                  setStartHour(e.target.value)
                  handleManualSelect()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getTimeOptions().map(option => (
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
                value={endHour}
                onChange={(e) => {
                  setEndHour(e.target.value)
                  handleManualSelect()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getTimeOptions().map(option => (
                  <option key={option.sortOrder} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 시간대별 구분 표시 */}
          <div className="text-xs text-gray-500 space-y-1">
            {Object.entries(timeSlots).map(([key, slot]) => (
              <div key={key}>
                {slot.label}: {slot.hours.map(h => h <= 23 ? `${h}시` : `${h - 24}시`).join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 가용성 상태 표시 */}
      {checkingAvailability ? (
        <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
          가용성 확인 중...
        </div>
      ) : availability && (
        <div className={`p-3 rounded-lg text-sm ${
          availability.available 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {availability.available ? (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              예약 가능한 시간대입니다
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                이미 예약된 시간대입니다
              </div>
              {availability.occupied_slots?.length > 0 && (
                <div className="text-xs mt-1">
                  예약된 시간: {availability.occupied_slots.map((slot: any) => 
                    `${slot.start}:00~${slot.end}:00`
                  ).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}