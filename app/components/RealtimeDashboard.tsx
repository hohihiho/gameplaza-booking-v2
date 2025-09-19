'use client'

import { useState, useEffect } from 'react'
import { useRealtimeReservations } from '@/app/hooks/useRealtimeReservations'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface RealtimeStats {
  totalReservations: number
  activeReservations: number
  checkedInCount: number
  availableDevices: number
  recentEvents: any[]
}

export default function RealtimeDashboard() {
  const [stats, setStats] = useState<RealtimeStats>({
    totalReservations: 0,
    activeReservations: 0,
    checkedInCount: 0,
    availableDevices: 0,
    recentEvents: []
  })
  
  const { isConnected, lastEvent } = useRealtimeReservations({
    onReservationCreated: (event) => {
      console.log('🆕 새 예약 생성:', event)
      setStats(prev => ({
        ...prev,
        totalReservations: prev.totalReservations + 1,
        activeReservations: prev.activeReservations + 1,
        recentEvents: [event, ...prev.recentEvents.slice(0, 9)]
      }))
      
      // 토스트 알림 표시
      showNotification('새 예약', `예약 #${event.reservationId} 생성됨`)
    },
    
    onReservationCancelled: (event) => {
      console.log('❌ 예약 취소:', event)
      setStats(prev => ({
        ...prev,
        activeReservations: Math.max(0, prev.activeReservations - 1),
        recentEvents: [event, ...prev.recentEvents.slice(0, 9)]
      }))
      
      showNotification('예약 취소', `예약 #${event.reservationId} 취소됨`)
    },
    
    onReservationCheckedIn: (event) => {
      console.log('✅ 체크인:', event)
      setStats(prev => ({
        ...prev,
        checkedInCount: prev.checkedInCount + 1,
        recentEvents: [event, ...prev.recentEvents.slice(0, 9)]
      }))
      
      showNotification('체크인', `예약 #${event.reservationId} 체크인 완료`)
    },
    
    onDeviceStatusChanged: (event) => {
      console.log('🎮 기기 상태 변경:', event)
      setStats(prev => ({
        ...prev,
        availableDevices: event.data.status === 'available' 
          ? prev.availableDevices + 1 
          : Math.max(0, prev.availableDevices - 1),
        recentEvents: [event, ...prev.recentEvents.slice(0, 9)]
      }))
    }
  })
  
  // 초기 데이터 로드
  useEffect(() => {
    loadInitialStats()
  }, [])
  
  const loadInitialStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-simple')
      if (response.ok) {
        const data = await response.json()
        setStats(prev => ({
          ...prev,
          totalReservations: data.stats?.todayReservations || 0,
          activeReservations: data.stats?.activeReservations || 0,
          checkedInCount: data.stats?.checkedInCount || 0,
          availableDevices: data.stats?.availableDevices || 0
        }))
      }
    } catch (error) {
      console.error('초기 통계 로드 실패:', error)
    }
  }
  
  // 브라우저 알림 표시
  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }
  
  // 브라우저 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">실시간 대시보드</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-sm text-gray-600">
            {isConnected ? '실시간 연결됨' : '연결 끊김'}
          </span>
        </div>
      </div>
      
      {/* 실시간 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="오늘 예약" 
          value={stats.totalReservations}
          color="blue"
          icon="📅"
        />
        <StatCard 
          title="진행 중" 
          value={stats.activeReservations}
          color="green"
          icon="⏳"
        />
        <StatCard 
          title="체크인" 
          value={stats.checkedInCount}
          color="purple"
          icon="✅"
        />
        <StatCard 
          title="사용 가능 기기" 
          value={stats.availableDevices}
          color="orange"
          icon="🎮"
        />
      </div>
      
      {/* 실시간 이벤트 로그 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">실시간 이벤트</h3>
        <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
          {stats.recentEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">아직 이벤트가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {stats.recentEvents.map((event, index) => (
                <EventItem key={`${event.timestamp}-${index}`} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 마지막 업데이트 */}
      {lastEvent && (
        <div className="mt-4 text-sm text-gray-500 text-right">
          마지막 업데이트: {format(new Date(lastEvent.timestamp), 'HH:mm:ss', { locale: ko })}
        </div>
      )}
    </div>
  )
}

// 통계 카드 컴포넌트
function StatCard({ title, value, color, icon }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800'
  }
  
  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}

// 이벤트 아이템 컴포넌트
function EventItem({ event }: any) {
  const eventTypeLabels: Record<string, string> = {
    reservation_created: '예약 생성',
    reservation_updated: '예약 수정',
    reservation_cancelled: '예약 취소',
    reservation_approved: '예약 승인',
    reservation_checked_in: '체크인',
    device_status_changed: '기기 상태 변경'
  }
  
  const eventTypeColors: Record<string, string> = {
    reservation_created: 'bg-blue-100 text-blue-800',
    reservation_updated: 'bg-yellow-100 text-yellow-800',
    reservation_cancelled: 'bg-red-100 text-red-800',
    reservation_approved: 'bg-green-100 text-green-800',
    reservation_checked_in: 'bg-purple-100 text-purple-800',
    device_status_changed: 'bg-gray-100 text-gray-800'
  }
  
  return (
    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 text-xs rounded-full ${eventTypeColors[event.type]}`}>
          {eventTypeLabels[event.type] || event.type}
        </span>
        <span className="text-sm text-gray-600">
          {event.reservationId && `#${event.reservationId.slice(0, 8)}`}
          {event.deviceId && ` • 기기: ${event.deviceId.slice(0, 8)}`}
        </span>
      </div>
      <span className="text-xs text-gray-400">
        {format(new Date(event.timestamp), 'HH:mm:ss')}
      </span>
    </div>
  )
}