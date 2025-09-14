'use client'

import { useEffect, useState } from 'react'
import { WSClient } from '@/lib/realtime/ws-client'
import { Gamepad2, Activity, Wrench, XCircle, TrendingUp, Users, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type DeviceStatus = 'available' | 'rental' | 'maintenance' | 'disabled'

type DeviceTypeStats = {
  typeId: number
  typeName: string
  total: number
  available: number
  rental: number
  maintenance: number
  disabled: number
}

type DeviceSnapshot = {
  id: string
  device_type_id: number
  status: DeviceStatus
  type_name?: string
  rental_info?: {
    user_name: string
    end_time: string
  }
}

export default function RealtimeDeviceWidget() {
  const [devices, setDevices] = useState<DeviceSnapshot[]>([])
  const [typeStats, setTypeStats] = useState<DeviceTypeStats[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  // 스냅샷 폴백 (10초마다)
  const fetchSnapshot = async () => {
    try {
      const res = await fetch('/api/v3/devices/status')
      const json = await res.json()
      if (json.data) {
        setDevices(json.data)
        calculateStats(json.data)
        setLastUpdate(new Date())
      }
    } catch (e) {
      console.error('Snapshot fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  // 타입별 통계 계산
  const calculateStats = (deviceList: DeviceSnapshot[]) => {
    const statsMap = new Map<number, DeviceTypeStats>()

    deviceList.forEach(device => {
      const typeId = device.device_type_id
      if (!statsMap.has(typeId)) {
        statsMap.set(typeId, {
          typeId,
          typeName: device.type_name || `타입 ${typeId}`,
          total: 0,
          available: 0,
          rental: 0,
          maintenance: 0,
          disabled: 0
        })
      }

      const stat = statsMap.get(typeId)!
      stat.total++
      stat[device.status]++
    })

    setTypeStats(Array.from(statsMap.values()))
  }

  // WebSocket 연결 및 폴백
  useEffect(() => {
    let pollTimer: NodeJS.Timeout
    let wsClient: WSClient | null = null
    let unsubscribe: (() => void) | null = null

    const startPolling = () => {
      fetchSnapshot()
      pollTimer = setInterval(fetchSnapshot, 10000) // 10초 폴백
    }

    const connectWebSocket = () => {
      try {
        wsClient = new WSClient('/ws/devices', ['all'])

        unsubscribe = wsClient.on((msg) => {
          if (msg?.type === 'device.status.updated' && msg?.payload) {
            setDevices(prev => {
              const updated = prev.map(d =>
                d.id === msg.payload.id
                  ? { ...d, status: msg.payload.status }
                  : d
              )
              calculateStats(updated)
              return updated
            })
            setLastUpdate(new Date())
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

  const getStatusIcon = (status: DeviceStatus) => {
    switch (status) {
      case 'available': return <Activity className="w-4 h-4" />
      case 'rental': return <Users className="w-4 h-4" />
      case 'maintenance': return <Wrench className="w-4 h-4" />
      case 'disabled': return <XCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'available': return 'text-green-500 bg-green-100 dark:bg-green-900/30'
      case 'rental': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
      case 'maintenance': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
      case 'disabled': return 'text-red-500 bg-red-100 dark:bg-red-900/30'
    }
  }

  const totalStats = typeStats.reduce((acc, stat) => ({
    total: acc.total + stat.total,
    available: acc.available + stat.available,
    rental: acc.rental + stat.rental,
    maintenance: acc.maintenance + stat.maintenance,
    disabled: acc.disabled + stat.disabled
  }), { total: 0, available: 0, rental: 0, maintenance: 0, disabled: 0 })

  const utilizationRate = totalStats.total > 0
    ? Math.round((totalStats.rental / totalStats.total) * 100)
    : 0

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
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold dark:text-white">실시간 기기 현황</h2>
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
            {utilizationRate}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">가동률</div>
        </div>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {totalStats.available}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">대여가능</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {totalStats.rental}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">대여중</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {totalStats.maintenance}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">점검중</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {totalStats.disabled}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">비활성</div>
        </div>
      </div>

      {/* 타입별 상세 */}
      <div className="space-y-2">
        <AnimatePresence>
          {typeStats.map((stat, index) => (
            <motion.div
              key={stat.typeId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-900 dark:text-white">
                  {stat.typeName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  총 {stat.total}대
                </div>
              </div>
              <div className="flex gap-2">
                {stat.available > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Activity className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      {stat.available}
                    </span>
                  </div>
                )}
                {stat.rental > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      {stat.rental}
                    </span>
                  </div>
                )}
                {stat.maintenance > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <Wrench className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                      {stat.maintenance}
                    </span>
                  </div>
                )}
                {stat.disabled > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-400">
                      {stat.disabled}
                    </span>
                  </div>
                )}
              </div>
              {/* 진행 바 */}
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full flex">
                  {stat.available > 0 && (
                    <div
                      className="bg-green-500 transition-all duration-500"
                      style={{ width: `${(stat.available / stat.total) * 100}%` }}
                    />
                  )}
                  {stat.rental > 0 && (
                    <div
                      className="bg-blue-500 transition-all duration-500"
                      style={{ width: `${(stat.rental / stat.total) * 100}%` }}
                    />
                  )}
                  {stat.maintenance > 0 && (
                    <div
                      className="bg-yellow-500 transition-all duration-500"
                      style={{ width: `${(stat.maintenance / stat.total) * 100}%` }}
                    />
                  )}
                  {stat.disabled > 0 && (
                    <div
                      className="bg-red-500 transition-all duration-500"
                      style={{ width: `${(stat.disabled / stat.total) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 바로가기 버튼 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/admin/rentals/devices"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
        >
          기기 관리 페이지로 이동
          <TrendingUp className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  )
}