'use client'

import { useEffect, useState } from 'react'
import { WSClient } from '@/lib/realtime/ws-client'
import { Calendar, Clock, Timer, CheckCircle, XCircle, AlertCircle, Users, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_in' | 'completed' | 'no_show'

type ReservationSnapshot = {
  id: string
  reservation_number: string
  user_name: string
  device_name: string
  date: string
  start_time: string
  end_time: string
  status: ReservationStatus
  created_at: string
  people_count?: number
  credit_option?: string
}

type ReservationStats = {
  today: number
  pending: number
  approved: number
  checkedIn: number
  completed: number
  cancelled: number
  noShow: number
}

export default function RealtimeReservationWidget() {
  const [reservations, setReservations] = useState<ReservationSnapshot[]>([])
  const [stats, setStats] = useState<ReservationStats>({
    today: 0,
    pending: 0,
    approved: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  })
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  // 오늘 날짜 (KST)
  const getToday = () => {
    const now = new Date()
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    return kst.toISOString().split('T')[0]
  }

  // 예약 데이터 로드
  const fetchReservations = async () => {
    try {
      const today = getToday()
      const res = await fetch(`/api/v3/reservations?date=${today}`)
      const json = await res.json()

      if (json.reservations) {
        setReservations(json.reservations)
        calculateStats(json.reservations)
        setLastUpdate(new Date())
      }
    } catch (e) {
      console.error('Reservation fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  // 통계 계산
  const calculateStats = (reservationList: ReservationSnapshot[]) => {
    const newStats: ReservationStats = {
      today: reservationList.length,
      pending: 0,
      approved: 0,
      checkedIn: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0
    }

    reservationList.forEach(reservation => {
      switch (reservation.status) {
        case 'pending': newStats.pending++; break
        case 'approved': newStats.approved++; break
        case 'checked_in': newStats.checkedIn++; break
        case 'completed': newStats.completed++; break
        case 'cancelled': newStats.cancelled++; break
        case 'no_show': newStats.noShow++; break
      }
    })

    setStats(newStats)
  }

  // WebSocket 연결 및 폴백
  useEffect(() => {
    let pollTimer: NodeJS.Timeout
    let wsClient: WSClient | null = null
    let unsubscribe: (() => void) | null = null

    const startPolling = () => {
      fetchReservations()
      pollTimer = setInterval(fetchReservations, 30000) // 30초 폴백
    }

    const connectWebSocket = () => {
      try {
        wsClient = new WSClient('/ws/devices', ['all'])

        unsubscribe = wsClient.on((msg) => {
          if (msg?.type?.startsWith('reservation.')) {
            // 예약 관련 이벤트 수신 시 재로드
            fetchReservations()
          }
        })

        wsClient.connect()
        setIsConnected(true)
      } catch (error) {
        console.error('WebSocket connection error:', error)
        setIsConnected(false)
      }
    }

    // 초기 로드 및 연결
    startPolling()
    connectWebSocket()

    // 클린업
    return () => {
      if (pollTimer) clearInterval(pollTimer)
      if (unsubscribe) unsubscribe()
      if (wsClient) wsClient.disconnect()
    }
  }, [])

  const getStatusIcon = (status: ReservationStatus) => {
    switch (status) {
      case 'pending': return <Timer className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      case 'checked_in': return <Users className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'no_show': return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
      case 'approved': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
      case 'rejected': return 'text-red-500 bg-red-100 dark:bg-red-900/30'
      case 'cancelled': return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30'
      case 'checked_in': return 'text-green-500 bg-green-100 dark:bg-green-900/30'
      case 'completed': return 'text-gray-600 bg-gray-100 dark:bg-gray-800/30'
      case 'no_show': return 'text-red-600 bg-red-100 dark:bg-red-900/30'
    }
  }

  const getStatusText = (status: ReservationStatus) => {
    switch (status) {
      case 'pending': return '승인대기'
      case 'approved': return '승인됨'
      case 'rejected': return '거절됨'
      case 'cancelled': return '취소됨'
      case 'checked_in': return '체크인'
      case 'completed': return '완료됨'
      case 'no_show': return '노쇼'
    }
  }

  // 다음 예약 시간 계산
  const getNextReservation = () => {
    const now = new Date()
    const upcoming = reservations
      .filter(r => r.status === 'approved' || r.status === 'checked_in')
      .filter(r => {
        const resTime = new Date(`${r.date} ${r.start_time}`)
        return resTime > now
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date} ${a.start_time}`)
        const timeB = new Date(`${b.date} ${b.start_time}`)
        return timeA.getTime() - timeB.getTime()
      })

    return upcoming[0]
  }

  const nextReservation = getNextReservation()

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold dark:text-white">오늘의 예약</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString('ko-KR')}
              {isConnected && (
                <span className="ml-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-600 dark:text-green-400">실시간</span>
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.today}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">총 예약</div>
        </div>
      </div>

      {/* 긴급 처리 필요 */}
      {stats.pending > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                승인 대기중
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {stats.pending}건
              </span>
              <a
                href="/admin/reservations?status=pending"
                className="px-3 py-1 bg-yellow-600 text-white text-xs font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                처리하기
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 다음 예약 정보 */}
      {nextReservation && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">다음 예약</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {nextReservation.user_name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {nextReservation.device_name} • {nextReservation.start_time}
              </div>
            </div>
            <div className={`px-2 py-1 rounded-lg ${getStatusColor(nextReservation.status)}`}>
              {getStatusIcon(nextReservation.status)}
            </div>
          </div>
        </div>
      )}

      {/* 상태별 통계 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {stats.checkedIn}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">체크인</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {stats.approved}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">승인됨</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20">
          <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
            {stats.completed}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">완료</div>
        </div>
      </div>

      {/* 최근 예약 목록 (최대 5개) */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          최근 예약
        </div>
        <AnimatePresence>
          {reservations.slice(0, 5).map((reservation, index) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {reservation.user_name}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {reservation.device_name} • {reservation.start_time}~{reservation.end_time}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {reservation.reservation_number}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 바로가기 버튼 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/admin/reservations"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
        >
          예약 관리 페이지로 이동
          <TrendingUp className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  )
}