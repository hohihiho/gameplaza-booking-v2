'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Alert {
  id: string
  type: 'no_show' | 'device_issue' | 'urgent_reservation' | 'system' | 'payment_issue'
  title: string
  message: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  actionRequired?: boolean
  actionUrl?: string
  actionLabel?: string
}

export default function RealtimeAdminAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    // SSE 연결 설정
    const eventSource = new EventSource('/api/sse/admin-alerts')
    
    eventSource.onopen = () => {
      console.log('✅ 관리자 알림 실시간 연결 성공')
      setIsConnected(true)
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'alert') {
          const newAlert: Alert = {
            ...data.alert,
            timestamp: new Date(data.alert.timestamp)
          }
          
          // 새 알림 추가 (최신순)
          setAlerts(prev => [newAlert, ...prev].slice(0, 50)) // 최대 50개
          
          // 중요 알림인 경우 브라우저 알림
          if (newAlert.priority === 'high' || newAlert.priority === 'critical') {
            showBrowserNotification(newAlert)
          }
          
          // 사운드 재생 (중요도에 따라 다른 소리)
          playAlertSound(newAlert.priority)
        }
      } catch (err) {
        console.error('알림 파싱 오류:', err)
      }
    }
    
    eventSource.onerror = () => {
      console.error('❌ 관리자 알림 연결 오류')
      setIsConnected(false)
    }
    
    // 브라우저 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    return () => {
      eventSource.close()
    }
  }, [])

  const showBrowserNotification = (alert: Alert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: alert.id,
        requireInteraction: alert.priority === 'critical'
      })
      
      // 클릭 시 액션 URL로 이동
      if (alert.actionUrl) {
        notification.onclick = () => {
          window.open(alert.actionUrl, '_blank')
          notification.close()
        }
      }
    }
  }

  const playAlertSound = (priority: Alert['priority']) => {
    // 실제로는 오디오 파일 재생
    console.log(`🔊 알림음 재생: ${priority}`)
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'no_show': return '🚫'
      case 'device_issue': return '🔧'
      case 'urgent_reservation': return '⚡'
      case 'payment_issue': return '💳'
      case 'system': return '⚙️'
      default: return '📢'
    }
  }

  // 표시할 알림 (최근 5개 또는 전체)
  const displayAlerts = showAll ? alerts : alerts.slice(0, 5)
  
  // 중요 알림 개수
  const criticalCount = alerts.filter(a => 
    a.priority === 'critical' || a.priority === 'high'
  ).length

  return (
    <div className="fixed top-20 right-4 z-50 w-96 max-w-full">
      {/* 헤더 */}
      <div className="bg-white rounded-t-lg shadow-lg p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">관리자 알림</h3>
            {criticalCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {criticalCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAll ? '간략히' : '모두 보기'}
            </button>
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="bg-white rounded-b-lg shadow-lg max-h-[600px] overflow-y-auto">
        <AnimatePresence>
          {displayAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              새로운 알림이 없습니다
            </div>
          ) : (
            displayAlerts.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="border-b last:border-b-0"
              >
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* 아이콘 */}
                    <div className="text-2xl">
                      {getTypeIcon(alert.type)}
                    </div>
                    
                    {/* 내용 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          getPriorityColor(alert.priority)
                        }`}>
                          {alert.priority.toUpperCase()}
                        </span>
                        <h4 className="font-semibold text-sm">
                          {alert.title}
                        </h4>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {format(alert.timestamp, 'HH:mm:ss', { locale: ko })}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {alert.actionRequired && alert.actionUrl && (
                            <a
                              href={alert.actionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              {alert.actionLabel || '처리하기'}
                            </a>
                          )}
                          
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            닫기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 알림 센터 링크 */}
      {alerts.length > 5 && !showAll && (
        <div className="bg-gray-100 p-2 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            {alerts.length - 5}개 더 보기
          </button>
        </div>
      )}
    </div>
  )
}