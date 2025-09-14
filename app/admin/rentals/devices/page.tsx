'use client'

import { useEffect, useState, useMemo } from 'react'
import { WSClient } from '@/lib/realtime/ws-client'
import {
  Gamepad2, Activity, Wrench, XCircle, Users, Search, Filter,
  RefreshCw, CheckSquare, Square, ChevronDown, ChevronRight,
  Wifi, WifiOff, AlertCircle, Edit3, Save, X, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type DeviceStatus = 'available' | 'rental' | 'maintenance' | 'disabled'

type Device = {
  id: string
  device_type_id: number
  device_number: number
  status: DeviceStatus
  type_name?: string
  model_name?: string
  version_name?: string
  is_deleted?: boolean
  created_at?: string
  updated_at?: string
}

type DeviceType = {
  id: number
  name: string
  devices: Device[]
}

const statusOptions: DeviceStatus[] = ['available', 'rental', 'maintenance', 'disabled']

const statusConfig = {
  available: {
    label: '대여가능',
    icon: Activity,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    dotColor: 'bg-green-500'
  },
  rental: {
    label: '대여중',
    icon: Users,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    dotColor: 'bg-blue-500'
  },
  maintenance: {
    label: '점검중',
    icon: Wrench,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    dotColor: 'bg-yellow-500'
  },
  disabled: {
    label: '비활성',
    icon: XCircle,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500'
  }
}

export default function DevicesAdminPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [liveStatus, setLiveStatus] = useState<Record<string, DeviceStatus>>({})
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<DeviceStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<DeviceStatus>('available')

  // 기기 데이터 로드
  const loadDevices = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = '/api/v3/admin/devices'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setDevices(json.data || [])

      // 타입별로 자동 확장
      const types = new Set<number>()
      json.data?.forEach((d: Device) => types.add(d.device_type_id))
      setExpandedTypes(types)
    } catch (e: any) {
      setError(e?.message || '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [])

  // WebSocket + 폴백 폴링
  useEffect(() => {
    let pollTimer: NodeJS.Timeout
    let wsClient: WSClient | null = null
    let unsubscribe: (() => void) | null = null

    const fetchSnapshot = async () => {
      try {
        const res = await fetch('/api/v3/devices/status')
        const json = await res.json()
        const statusMap: Record<string, DeviceStatus> = {}
        ;(json.data || []).forEach((d: any) => {
          statusMap[d.id] = d.status
        })
        setLiveStatus(statusMap)
      } catch (e) {
        console.error('Status fetch error:', e)
      }
    }

    const startPolling = () => {
      fetchSnapshot()
      pollTimer = setInterval(fetchSnapshot, 10000) // 10초마다 폴백
    }

    const connectWebSocket = () => {
      try {
        wsClient = new WSClient('/ws/devices', ['all'])
        unsubscribe = wsClient.on((msg) => {
          if (msg?.type === 'device.status.updated' && msg?.payload?.id && msg?.payload?.status) {
            setLiveStatus(prev => ({
              ...prev,
              [msg.payload.id]: msg.payload.status
            }))
          }
        })
        wsClient.connect()
        setIsConnected(true)
      } catch (error) {
        console.error('WebSocket connection error:', error)
        setIsConnected(false)
      }
    }

    startPolling()
    connectWebSocket()

    return () => {
      if (pollTimer) clearInterval(pollTimer)
      if (unsubscribe) unsubscribe()
      if (wsClient) wsClient.disconnect()
    }
  }, [])

  // 기기 상태 업데이트
  const updateDeviceStatus = async (id: string, status: DeviceStatus) => {
    try {
      const res = await fetch(`/api/v3/admin/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await loadDevices()
    } catch (e) {
      console.error('Status update error:', e)
      setError('상태 변경 실패')
    }
  }

  // 일괄 상태 업데이트
  const updateBulkStatus = async () => {
    if (selectedDevices.size === 0) {
      setError('선택된 기기가 없습니다')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const promises = Array.from(selectedDevices).map(id =>
        fetch(`/api/v3/admin/devices/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: bulkStatus })
        })
      )
      await Promise.all(promises)
      await loadDevices()
      setSelectedDevices(new Set())
      setBulkEditMode(false)
    } catch (e) {
      console.error('Bulk update error:', e)
      setError('일괄 변경 실패')
    } finally {
      setSaving(false)
    }
  }

  // 상태 동기화
  const syncStatus = async () => {
    try {
      setLoading(true)
      await fetch('/api/cron/update-device-status')
      await loadDevices()
    } catch (e) {
      console.error('Sync error:', e)
      setError('동기화 실패')
    } finally {
      setLoading(false)
    }
  }

  // 타입별 그룹핑
  const groupedDevices = useMemo(() => {
    const filtered = devices.filter(device => {
      // 검색 필터
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const match =
          device.type_name?.toLowerCase().includes(search) ||
          device.model_name?.toLowerCase().includes(search) ||
          device.version_name?.toLowerCase().includes(search) ||
          device.device_number.toString().includes(search)
        if (!match) return false
      }

      // 상태 필터
      const currentStatus = liveStatus[device.id] || device.status
      if (filterStatus !== 'all' && currentStatus !== filterStatus) return false

      // 타입 필터
      if (filterType !== 'all' && device.device_type_id !== filterType) return false

      return true
    })

    // 타입별로 그룹핑
    const groups = new Map<number, DeviceType>()
    filtered.forEach(device => {
      if (!groups.has(device.device_type_id)) {
        groups.set(device.device_type_id, {
          id: device.device_type_id,
          name: device.type_name || `타입 ${device.device_type_id}`,
          devices: []
        })
      }
      groups.get(device.device_type_id)!.devices.push(device)
    })

    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [devices, liveStatus, searchTerm, filterStatus, filterType])

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set())
    } else {
      setSelectedDevices(new Set(devices.map(d => d.id)))
    }
  }

  // 타입 확장/축소
  const toggleType = (typeId: number) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId)
    } else {
      newExpanded.add(typeId)
    }
    setExpandedTypes(newExpanded)
  }

  // 타입 리스트 가져오기
  const typeList = useMemo(() => {
    const types = new Set<{ id: number; name: string }>()
    devices.forEach(d => {
      types.add({
        id: d.device_type_id,
        name: d.type_name || `타입 ${d.device_type_id}`
      })
    })
    return Array.from(types).sort((a, b) => a.name.localeCompare(b.name))
  }, [devices])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  기기 관리
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">실시간 연결됨</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-gray-400" />
                      <span>오프라인 모드</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {bulkEditMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as DeviceStatus)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {statusConfig[status].label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={updateBulkStatus}
                    disabled={saving || selectedDevices.size === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    일괄 변경 ({selectedDevices.size})
                  </button>
                  <button
                    onClick={() => {
                      setBulkEditMode(false)
                      setSelectedDevices(new Set())
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
              <button
                onClick={() => setBulkEditMode(!bulkEditMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  bulkEditMode
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Edit3 className="w-4 h-4 inline mr-2" />
                일괄 편집
              </button>
              <button
                onClick={syncStatus}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                동기화
              </button>
            </div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="기기명, 모델, 버전, 번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* 상태 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as DeviceStatus | 'all')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">모든 상태</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {statusConfig[status].label}
                  </option>
                ))}
              </select>
            </div>

            {/* 타입 필터 */}
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">모든 타입</option>
                {typeList.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </motion.div>
        )}

        {/* 기기 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* 전체 선택 */}
            {bulkEditMode && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDevices.size === devices.length && devices.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    전체 선택 ({selectedDevices.size}/{devices.length})
                  </span>
                </label>
              </div>
            )}

            {/* 타입별 그룹 */}
            <AnimatePresence>
              {groupedDevices.map((group, groupIndex) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: groupIndex * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                >
                  {/* 타입 헤더 */}
                  <div
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => toggleType(group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedTypes.has(group.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {group.name}
                        </h3>
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg">
                          {group.devices.length}대
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {Object.entries(statusConfig).map(([status, config]) => {
                          const count = group.devices.filter(d =>
                            (liveStatus[d.id] || d.status) === status
                          ).length
                          if (count === 0) return null
                          return (
                            <div
                              key={status}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${config.color}`}
                            >
                              <config.icon className="w-4 h-4" />
                              <span className="text-xs font-medium">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 기기 목록 */}
                  <AnimatePresence>
                    {expandedTypes.has(group.id) && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {group.devices.map((device, deviceIndex) => {
                            const currentStatus = liveStatus[device.id] || device.status
                            const config = statusConfig[currentStatus]

                            return (
                              <motion.div
                                key={device.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: deviceIndex * 0.02 }}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {/* 선택 체크박스 */}
                                    {bulkEditMode && (
                                      <input
                                        type="checkbox"
                                        checked={selectedDevices.has(device.id)}
                                        onChange={(e) => {
                                          const newSelected = new Set(selectedDevices)
                                          if (e.target.checked) {
                                            newSelected.add(device.id)
                                          } else {
                                            newSelected.delete(device.id)
                                          }
                                          setSelectedDevices(newSelected)
                                        }}
                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                      />
                                    )}

                                    {/* 기기 정보 */}
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          #{device.device_number}
                                        </span>
                                        <span className={`w-2 h-2 rounded-full ${config.dotColor} ${
                                          currentStatus === 'rental' ? 'animate-pulse' : ''
                                        }`} />
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {device.model_name && (
                                          <span>{device.model_name}</span>
                                        )}
                                        {device.model_name && device.version_name && (
                                          <span className="mx-1">•</span>
                                        )}
                                        {device.version_name && (
                                          <span>{device.version_name}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 상태 선택 */}
                                  <div className="flex items-center gap-3">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.color}`}>
                                      <config.icon className="w-4 h-4" />
                                      <span className="text-sm font-medium">
                                        {config.label}
                                      </span>
                                    </div>
                                    {!bulkEditMode && (
                                      <select
                                        value={device.status}
                                        onChange={(e) => updateDeviceStatus(device.id, e.target.value as DeviceStatus)}
                                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                      >
                                        {statusOptions.map(status => (
                                          <option key={status} value={status}>
                                            {statusConfig[status].label}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 결과 없음 */}
            {groupedDevices.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                    ? '검색 결과가 없습니다'
                    : '등록된 기기가 없습니다'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}