'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Device {
  id: string
  name: string
  type: string
  status: 'available' | 'in_use' | 'maintenance' | 'reserved'
  currentUser?: string
  startTime?: string
  endTime?: string
  remainingTime?: number
}

export default function RealtimeDeviceStatus() {
  const [devices, setDevices] = useState<Device[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // 초기 기기 상태 로드
    loadDeviceStatuses()
    
    // SSE 연결 설정
    const eventSource = new EventSource('/api/sse/device-status')
    
    eventSource.onopen = () => {
      console.log('✅ 기기 상태 실시간 연결 성공')
      setIsConnected(true)
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'device_status_changed') {
          // 기기 상태 업데이트
          setDevices(prev => prev.map(device => 
            device.id === data.deviceId 
              ? { ...device, status: data.status, ...data.details }
              : device
          ))
        } else if (data.type === 'full_update') {
          // 전체 기기 상태 업데이트
          setDevices(data.devices)
        }
      } catch (err) {
        console.error('이벤트 파싱 오류:', err)
      }
    }
    
    eventSource.onerror = () => {
      console.error('❌ 기기 상태 실시간 연결 오류')
      setIsConnected(false)
      
      // 5초 후 재연결
      setTimeout(() => {
        loadDeviceStatuses()
      }, 5000)
    }
    
    // 1분마다 남은 시간 업데이트
    const interval = setInterval(updateRemainingTimes, 60000)
    
    return () => {
      eventSource.close()
      clearInterval(interval)
    }
  }, [])

  const loadDeviceStatuses = async () => {
    try {
      const response = await fetch('/api/devices/status')
      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices || [])
      }
    } catch (error) {
      console.error('기기 상태 로드 실패:', error)
    }
  }

  const updateRemainingTimes = () => {
    setDevices(prev => prev.map(device => {
      if (device.status === 'in_use' && device.endTime) {
        const remaining = new Date(device.endTime).getTime() - Date.now()
        return {
          ...device,
          remainingTime: Math.max(0, Math.floor(remaining / 60000)) // 분 단위
        }
      }
      return device
    }))
  }

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'in_use': return 'bg-red-100 text-red-800'
      case 'reserved': return 'bg-yellow-100 text-yellow-800'
      case 'maintenance': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: Device['status']) => {
    switch (status) {
      case 'available': return '사용 가능'
      case 'in_use': return '사용 중'
      case 'reserved': return '예약됨'
      case 'maintenance': return '점검 중'
      default: return '알 수 없음'
    }
  }

  const formatRemainingTime = (minutes?: number) => {
    if (!minutes) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}시간 ${mins}분 남음`
    }
    return `${mins}분 남음`
  }

  // 기기 타입별로 그룹화
  const devicesByType = devices.reduce((acc, device) => {
    if (!acc[device.type]) acc[device.type] = []
    acc[device.type].push(device)
    return acc
  }, {} as Record<string, Device[]>)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">실시간 기기 현황</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-sm text-gray-600">
            {isConnected ? '실시간 연결됨' : '연결 끊김'}
          </span>
        </div>
      </div>

      {/* 기기 타입별 섹션 */}
      {Object.entries(devicesByType).map(([type, typeDevices]) => (
        <div key={type} className="mb-6">
          <h3 className="text-lg font-semibold mb-3">{type}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {typeDevices.map(device => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      ))}

      {/* 범례 */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-100 rounded" />
            <span>사용 가능</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-100 rounded" />
            <span>사용 중</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-100 rounded" />
            <span>예약됨</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-gray-100 rounded" />
            <span>점검 중</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 개별 기기 카드 컴포넌트
function DeviceCard({ device }: { device: Device }) {
  const statusColor = getStatusColor(device.status)
  const statusLabel = getStatusLabel(device.status)
  
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      device.status === 'available' 
        ? 'border-green-300 hover:shadow-lg cursor-pointer' 
        : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">{device.name}</h4>
        <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      
      {device.status === 'in_use' && (
        <div className="text-xs text-gray-600 space-y-1">
          {device.currentUser && (
            <p>사용자: {device.currentUser}</p>
          )}
          {device.endTime && (
            <p>종료: {format(new Date(device.endTime), 'HH:mm', { locale: ko })}</p>
          )}
          {device.remainingTime !== undefined && (
            <p className="font-semibold text-orange-600">
              {formatRemainingTime(device.remainingTime)}
            </p>
          )}
        </div>
      )}
      
      {device.status === 'reserved' && device.startTime && (
        <div className="text-xs text-gray-600">
          <p>예약: {format(new Date(device.startTime), 'HH:mm', { locale: ko })}</p>
        </div>
      )}
    </div>
  )
}

function getStatusColor(status: Device['status']) {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800'
    case 'in_use': return 'bg-red-100 text-red-800'
    case 'reserved': return 'bg-yellow-100 text-yellow-800'
    case 'maintenance': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(status: Device['status']) {
  switch (status) {
    case 'available': return '사용 가능'
    case 'in_use': return '사용 중'
    case 'reserved': return '예약됨'
    case 'maintenance': return '점검 중'
    default: return '알 수 없음'
  }
}

function formatRemainingTime(minutes?: number) {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}시간 ${mins}분 남음`
  }
  return `${mins}분 남음`
}