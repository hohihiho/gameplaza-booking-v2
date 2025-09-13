'use client'

import { useState, useEffect } from 'react'

interface Device {
  id: string
  name: string
  type: string
  category: string
  status: string
  is_active: boolean
}

interface DeviceSelectorProps {
  value: string
  onChange: (deviceId: string) => void
}

export default function DeviceSelector({ value, onChange }: DeviceSelectorProps) {
  const [filterType, setFilterType] = useState<string>('all')
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadDevices()
  }, [])
  
  const loadDevices = async () => {
    try {
      const response = await fetch('/api/v3/devices')
      const data = await response.json()
      
      if (data.success) {
        // 활성 기기만 필터링
        const activeDevices = data.devices.filter((d: any) => d.is_active)
        setDevices(activeDevices)
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
      // 오류 시 임시 데이터 사용
      setDevices([
        { id: 'ps5-1', name: 'PS5 #1', type: 'console', category: 'PS5', status: 'available', is_active: true },
        { id: 'ps5-2', name: 'PS5 #2', type: 'console', category: 'PS5', status: 'in_use', is_active: true },
        { id: 'switch-1', name: '스위치 #1', type: 'console', category: 'Switch', status: 'available', is_active: true },
        { id: 'switch-2', name: '스위치 #2', type: 'console', category: 'Switch', status: 'available', is_active: true },
        { id: 'racing-1', name: '레이싱 시뮬레이터', type: 'simulator', category: 'Racing', status: 'available', is_active: true },
        { id: 'beatmania-1', name: '비트매니아 IIDX', type: 'arcade', category: 'Rhythm', status: 'available', is_active: true },
        { id: 'sdvx-1', name: 'SDVX', type: 'arcade', category: 'Rhythm', status: 'maintenance', is_active: true },
      ])
    } finally {
      setLoading(false)
    }
  }
  
  const deviceTypes = [
    { value: 'all', label: '전체' },
    { value: 'console', label: '콘솔' },
    { value: 'arcade', label: '아케이드' },
    { value: 'simulator', label: '시뮬레이터' },
    { value: 'rhythm', label: '리듬게임' },
  ]
  
  const filteredDevices = filterType === 'all' 
    ? devices 
    : devices.filter(d => {
        if (filterType === 'console') return d.category === 'PS5' || d.category === 'Switch'
        if (filterType === 'arcade') return d.category === 'Arcade'
        if (filterType === 'simulator') return d.category === 'Racing'
        if (filterType === 'rhythm') return d.category === 'Rhythm'
        return d.type === filterType
      })
  
  const getStatusBadge = (device: Device) => {
    const isAvailable = device.status === 'available' || device.status === 'idle'
    return isAvailable ? (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
        이용 가능
      </span>
    ) : device.status === 'maintenance' ? (
      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
        점검 중
      </span>
    ) : (
      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
        사용 중
      </span>
    )
  }
  
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {/* 필터 버튼 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {deviceTypes.map(type => (
          <button
            key={type.value}
            type="button"
            onClick={() => setFilterType(type.value)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filterType === type.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
      
      {/* 기기 목록 */}
      <div className="space-y-2">
        {filteredDevices.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            해당 카테고리에 이용 가능한 기기가 없습니다
          </div>
        ) : (
          filteredDevices.map(device => (
            <button
              key={device.id}
              type="button"
              onClick={() => onChange(device.id)}
              disabled={device.status === 'in_use' || device.status === 'maintenance'}
              className={`w-full p-3 rounded-lg border transition ${
                value === device.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${
                device.status === 'in_use' || device.status === 'maintenance'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{device.name}</span>
                {getStatusBadge(device)}
              </div>
              <div className="text-xs text-gray-500 mt-1 text-left">
                {device.category}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}