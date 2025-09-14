'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, CheckCircle, XCircle, Timer, Search, Filter,
  ChevronLeft, ChevronRight, AlertCircle, User, Gamepad2, Phone,
  MessageCircle, Eye, X, Trash2, Download, Edit3, RefreshCw,
  CheckSquare, Square, MoreVertical, Mail, CreditCard, Users,
  TrendingUp, Loader2, FileText, ArrowUpDown
} from 'lucide-react'
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'

// 24시간 이상 시간 포맷팅
const formatTime = (time: string) => {
  if (!time) return ''
  const timeParts = time.split(':')
  const hour = timeParts[0]
  const minute = timeParts[1] || '00'

  if (!hour) return ''
  const h = parseInt(hour)
  // 0~5시는 24~29시로 표시
  if (h >= 0 && h <= 5) {
    return `${h + 24}:${minute}`
  }
  return `${hour}:${minute}`
}

// 시간대 구분
const getShiftType = (startTime: string) => {
  if (!startTime) return null
  const [hour] = startTime.split(':')
  const h = parseInt(hour || '0')

  if (h >= 6 && h <= 23) {
    return 'early' // 조기영업
  } else if (h >= 0 && h <= 5) {
    return 'night' // 밤샘영업
  }
  return null
}

// 시간대 뱃지 스타일
const getShiftBadgeStyle = (shiftType: string | null) => {
  switch (shiftType) {
    case 'early':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
        label: '조기'
      }
    case 'night':
      return {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-300',
        label: '밤샘'
      }
    default:
      return null
  }
}

type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'checked_in' | 'no_show'

type Reservation = {
  id: string
  reservation_number: string
  user: {
    id: string
    name: string
    phone: string
    email: string
  }
  device: {
    type_name: string
    device_number: number
    model_name?: string
    version_name?: string
  }
  date: string
  start_time: string
  end_time: string
  people_count: number
  credit_option: string
  total_price: number
  status: ReservationStatus
  created_at: string
  updated_at: string
  memo?: string
  payment_method?: string
}

const statusConfig = {
  pending: {
    label: '승인대기',
    icon: Timer,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    dotColor: 'bg-yellow-500'
  },
  approved: {
    label: '승인됨',
    icon: CheckCircle,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    dotColor: 'bg-blue-500'
  },
  rejected: {
    label: '거절됨',
    icon: XCircle,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500'
  },
  cancelled: {
    label: '취소됨',
    icon: X,
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
    dotColor: 'bg-gray-500'
  },
  checked_in: {
    label: '체크인',
    icon: User,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    dotColor: 'bg-green-500'
  },
  completed: {
    label: '완료',
    icon: CheckCircle,
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-800/30',
    dotColor: 'bg-gray-400'
  },
  no_show: {
    label: '노쇼',
    icon: AlertCircle,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500'
  }
}

type SortField = 'date' | 'status' | 'created_at' | 'user_name' | 'device_name'
type SortOrder = 'asc' | 'desc'

export default function ReservationManagementPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('day')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'all'>('all')
  const [filterShift, setFilterShift] = useState<'early' | 'night' | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'cancel' | ''>('')

  // 예약 데이터 로드
  const loadReservations = async () => {
    setLoading(true)
    setError(null)
    try {
      let startDate: string, endDate: string

      if (dateRange === 'day') {
        startDate = format(selectedDate, 'yyyy-MM-dd')
        endDate = startDate
      } else if (dateRange === 'week') {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
        startDate = format(weekStart, 'yyyy-MM-dd')
        endDate = format(weekEnd, 'yyyy-MM-dd')
      } else {
        startDate = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), 'yyyy-MM-dd')
        endDate = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd')
      }

      const res = await fetch(`/api/v3/reservations?startDate=${startDate}&endDate=${endDate}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setReservations(json.reservations || [])
    } catch (e: any) {
      setError(e?.message || '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReservations()
  }, [selectedDate, dateRange])

  // 예약 상태 변경
  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    try {
      let endpoint = ''
      if (status === 'approved') endpoint = `/api/v3/reservations/${id}/approve`
      else if (status === 'rejected') endpoint = `/api/v3/reservations/${id}/reject`
      else if (status === 'cancelled') endpoint = `/api/v3/reservations/${id}/cancel`
      else if (status === 'no_show') endpoint = `/api/v3/reservations/${id}/no-show`
      else return

      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await loadReservations()
    } catch (e) {
      console.error('Status update error:', e)
      setError('상태 변경 실패')
    }
  }

  // 일괄 상태 변경
  const updateBulkStatus = async () => {
    if (selectedReservations.size === 0 || !bulkAction) {
      setError('선택된 예약이 없거나 작업이 선택되지 않았습니다')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const promises = Array.from(selectedReservations).map(id => {
        const reservation = reservations.find(r => r.id === id)
        if (!reservation) return Promise.resolve()

        let status: ReservationStatus
        if (bulkAction === 'approve') status = 'approved'
        else if (bulkAction === 'reject') status = 'rejected'
        else if (bulkAction === 'cancel') status = 'cancelled'
        else return Promise.resolve()

        return updateReservationStatus(id, status)
      })

      await Promise.all(promises)
      await loadReservations()
      setSelectedReservations(new Set())
      setBulkEditMode(false)
      setBulkAction('')
    } catch (e) {
      console.error('Bulk update error:', e)
      setError('일괄 변경 실패')
    } finally {
      setSaving(false)
    }
  }

  // 필터링 및 정렬
  const filteredAndSorted = useMemo(() => {
    let filtered = [...reservations]

    // 검색 필터
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.user.name.toLowerCase().includes(search) ||
        r.user.phone.includes(search) ||
        r.user.email.toLowerCase().includes(search) ||
        r.device.type_name.toLowerCase().includes(search) ||
        r.reservation_number.toLowerCase().includes(search)
      )
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus)
    }

    // 시간대 필터
    if (filterShift !== 'all') {
      filtered = filtered.filter(r => getShiftType(r.start_time) === filterShift)
    }

    // 정렬
    filtered.sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case 'date':
          compareValue = new Date(`${a.date} ${a.start_time}`).getTime() -
                        new Date(`${b.date} ${b.start_time}`).getTime()
          break
        case 'status':
          compareValue = a.status.localeCompare(b.status)
          break
        case 'created_at':
          compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'user_name':
          compareValue = a.user.name.localeCompare(b.user.name)
          break
        case 'device_name':
          compareValue = a.device.type_name.localeCompare(b.device.type_name)
          break
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    return filtered
  }, [reservations, searchTerm, filterStatus, filterShift, sortField, sortOrder])

  // 통계 계산
  const stats = useMemo(() => {
    const statusCounts: Record<ReservationStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      checked_in: 0,
      completed: 0,
      no_show: 0
    }

    filteredAndSorted.forEach(r => {
      statusCounts[r.status]++
    })

    return {
      total: filteredAndSorted.length,
      ...statusCounts,
      revenue: filteredAndSorted
        .filter(r => r.status === 'completed' || r.status === 'checked_in')
        .reduce((sum, r) => sum + r.total_price, 0)
    }
  }, [filteredAndSorted])

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedReservations.size === filteredAndSorted.length) {
      setSelectedReservations(new Set())
    } else {
      setSelectedReservations(new Set(filteredAndSorted.map(r => r.id)))
    }
  }

  // 정렬 토글
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // CSV 다운로드
  const downloadCSV = () => {
    const headers = ['예약번호', '날짜', '시간', '사용자', '연락처', '기기', '인원', '요금', '상태']
    const rows = filteredAndSorted.map(r => [
      r.reservation_number,
      r.date,
      `${formatTime(r.start_time)}~${formatTime(r.end_time)}`,
      r.user.name,
      r.user.phone,
      `${r.device.type_name} #${r.device.device_number}`,
      r.people_count,
      r.total_price,
      statusConfig[r.status].label
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reservations_${format(selectedDate, 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  예약 관리
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  총 {stats.total}건 • 매출 ₩{stats.revenue.toLocaleString()}
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
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">작업 선택</option>
                    <option value="approve">일괄 승인</option>
                    <option value="reject">일괄 거절</option>
                    <option value="cancel">일괄 취소</option>
                  </select>
                  <button
                    onClick={updateBulkStatus}
                    disabled={saving || selectedReservations.size === 0 || !bulkAction}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckSquare className="w-4 h-4" />
                    )}
                    실행 ({selectedReservations.size})
                  </button>
                  <button
                    onClick={() => {
                      setBulkEditMode(false)
                      setSelectedReservations(new Set())
                      setBulkAction('')
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
                onClick={downloadCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={loadReservations}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 날짜 선택 및 필터 */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <div className="space-y-4">
            {/* 날짜 선택 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDate(subDays(selectedDate, dateRange === 'day' ? 1 : dateRange === 'week' ? 7 : 30))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {dateRange === 'day' && format(selectedDate, 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                    {dateRange === 'week' && `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MM/dd')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MM/dd')}`}
                    {dateRange === 'month' && format(selectedDate, 'yyyy년 MM월', { locale: ko })}
                  </span>
                  {isToday(selectedDate) && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-lg">
                      오늘
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, dateRange === 'day' ? 1 : dateRange === 'week' ? 7 : 30))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDateRange('day')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'day'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  일간
                </button>
                <button
                  onClick={() => setDateRange('week')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'week'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  주간
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'month'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  월간
                </button>
              </div>
            </div>

            {/* 필터 */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 검색 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="이름, 연락처, 이메일, 예약번호로 검색..."
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
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">모든 상태</option>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <option key={status} value={status}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 시간대 필터 */}
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">모든 시간대</option>
                  <option value="early">조기영업</option>
                  <option value="night">밤샘영업</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = stats[status as ReservationStatus]
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-xl ${config.color} text-center`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <config.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="text-xl font-bold">{count}</div>
              </motion.div>
            )
          })}
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

        {/* 예약 목록 테이블 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {/* 전체 선택 */}
            {bulkEditMode && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedReservations.size === filteredAndSorted.length && filteredAndSorted.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    전체 선택 ({selectedReservations.size}/{filteredAndSorted.length})
                  </span>
                </label>
              </div>
            )}

            {/* 테이블 헤더 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {bulkEditMode && (
                      <th className="px-4 py-3 text-left">
                        <Square className="w-5 h-5 text-gray-400" />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => toggleSort('date')}
                        className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        시간
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => toggleSort('user_name')}
                        className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        사용자
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => toggleSort('device_name')}
                        className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        기기
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">정보</th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => toggleSort('status')}
                        className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        상태
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSorted.map((reservation) => {
                    const config = statusConfig[reservation.status]
                    const shiftType = getShiftType(reservation.start_time)
                    const shiftBadge = getShiftBadgeStyle(shiftType)

                    return (
                      <tr
                        key={reservation.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        {bulkEditMode && (
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedReservations.has(reservation.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedReservations)
                                if (e.target.checked) {
                                  newSelected.add(reservation.id)
                                } else {
                                  newSelected.delete(reservation.id)
                                }
                                setSelectedReservations(newSelected)
                              }}
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatTime(reservation.start_time)}~{formatTime(reservation.end_time)}
                              </span>
                              {shiftBadge && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${shiftBadge.bg} ${shiftBadge.text}`}>
                                  {shiftBadge.label}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {reservation.date}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {reservation.user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3" />
                              {reservation.user.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Gamepad2 className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {reservation.device.type_name} #{reservation.device.device_number}
                              </span>
                            </div>
                            {(reservation.device.model_name || reservation.device.version_name) && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {reservation.device.model_name} {reservation.device.version_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {reservation.people_count}명
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {reservation.credit_option}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-900 dark:text-white">
                                ₩{reservation.total_price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                            <span className={`px-2 py-1 rounded-lg text-sm font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {reservation.reservation_number}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {!bulkEditMode && reservation.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateReservationStatus(reservation.id, 'approved')}
                                  className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                  title="승인"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateReservationStatus(reservation.id, 'rejected')}
                                  className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="거절"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setShowDetail(true)
                              }}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="상세보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="더보기"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 결과 없음 */}
            {filteredAndSorted.length === 0 && (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== 'all' || filterShift !== 'all'
                    ? '검색 결과가 없습니다'
                    : '예약이 없습니다'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 상세보기 모달 */}
        <AnimatePresence>
          {showDetail && selectedReservation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      예약 상세정보
                    </h2>
                    <button
                      onClick={() => setShowDetail(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* 예약 정보 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        예약 정보
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">예약번호</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedReservation.reservation_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">날짜</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedReservation.date}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">시간</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatTime(selectedReservation.start_time)}~{formatTime(selectedReservation.end_time)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">상태</span>
                          <span className={`px-2 py-1 rounded-lg text-sm font-medium ${statusConfig[selectedReservation.status].color}`}>
                            {statusConfig[selectedReservation.status].label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 사용자 정보 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        사용자 정보
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">이름</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedReservation.user.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">연락처</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedReservation.user.phone}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">이메일</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedReservation.user.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 기기 정보 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        기기 정보
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">기기</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedReservation.device.type_name} #{selectedReservation.device.device_number}
                          </span>
                        </div>
                        {selectedReservation.device.model_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">모델</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedReservation.device.model_name}
                            </span>
                          </div>
                        )}
                        {selectedReservation.device.version_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">버전</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedReservation.device.version_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 결제 정보 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        결제 정보
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">인원</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedReservation.people_count}명
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">크레딧 옵션</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedReservation.credit_option}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">총 금액</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ₩{selectedReservation.total_price.toLocaleString()}
                          </span>
                        </div>
                        {selectedReservation.payment_method && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">결제 방법</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedReservation.payment_method}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 메모 */}
                    {selectedReservation.memo && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                          메모
                        </h3>
                        <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          {selectedReservation.memo}
                        </p>
                      </div>
                    )}

                    {/* 타임스탬프 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        기록
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">생성일시</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(selectedReservation.created_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">수정일시</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(selectedReservation.updated_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    {selectedReservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            updateReservationStatus(selectedReservation.id, 'approved')
                            setShowDetail(false)
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => {
                            updateReservationStatus(selectedReservation.id, 'rejected')
                            setShowDetail(false)
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          거절
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowDetail(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}