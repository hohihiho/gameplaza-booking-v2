'use client'

import { formatKoreanDate } from '@/lib/utils/kst-date'

interface Reservation {
  id: string
  device_id: string
  date: string
  start_time?: string
  end_time?: string
  start_hour?: number
  end_hour?: number
  player_count: number
  credit_type: string
  total_amount: number
  status: string
  created_at: string
  user_notes?: string
}

interface ReservationDetailModalProps {
  reservation: Reservation | null
  isOpen: boolean
  onClose: () => void
  onCancel?: (id: string) => void
}

export default function ReservationDetailModal({
  reservation,
  isOpen,
  onClose,
  onCancel
}: ReservationDetailModalProps) {
  if (!isOpen || !reservation) return null

  const formatTime = (reservation: Reservation) => {
    if (reservation.start_time && reservation.end_time) {
      return `${reservation.start_time} - ${reservation.end_time}`
    }
    if (reservation.start_hour !== undefined && reservation.end_hour !== undefined) {
      const startHour = reservation.start_hour
      const endHour = reservation.end_hour
      const displayStart = startHour <= 5 ? startHour + 24 : startHour
      const displayEnd = endHour <= 5 ? endHour + 24 : endHour
      return `${displayStart}:00 - ${displayEnd}:00`
    }
    return '시간 미정'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '대기중', class: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '확정', class: 'bg-blue-100 text-blue-800' },
      active: { label: '진행중', class: 'bg-green-100 text-green-800' },
      completed: { label: '완료', class: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '취소', class: 'bg-red-100 text-red-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    )
  }

  const getCreditTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed': return '고정 크레딧'
      case 'freeplay': return '프리플레이'
      case 'unlimited': return '무한 크레딧'
      default: return type
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">예약 상세</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="px-6 py-4 space-y-4">
          {/* 상태 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">상태</span>
            {getStatusBadge(reservation.status)}
          </div>

          {/* 예약 번호 */}
          <div>
            <span className="text-sm text-gray-600">예약 번호</span>
            <p className="font-mono text-sm mt-1">{reservation.id}</p>
          </div>

          {/* 기기 정보 */}
          <div>
            <span className="text-sm text-gray-600">기기</span>
            <p className="font-medium mt-1">{reservation.device_id}</p>
          </div>

          {/* 날짜 및 시간 */}
          <div>
            <span className="text-sm text-gray-600">예약 일시</span>
            <p className="font-medium mt-1">
              {formatKoreanDate(new Date(reservation.date))}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              {formatTime(reservation)}
            </p>
          </div>

          {/* 인원 및 크레딧 타입 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">인원</span>
              <p className="font-medium mt-1">{reservation.player_count}인</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">크레딧 타입</span>
              <p className="font-medium mt-1">{getCreditTypeLabel(reservation.credit_type)}</p>
            </div>
          </div>

          {/* 요금 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <span className="text-sm text-gray-600">총 요금</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {reservation.total_amount.toLocaleString()}원
            </p>
          </div>

          {/* 메모 */}
          {reservation.user_notes && (
            <div>
              <span className="text-sm text-gray-600">메모</span>
              <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                {reservation.user_notes}
              </p>
            </div>
          )}

          {/* 생성 일시 */}
          <div>
            <span className="text-sm text-gray-600">예약 생성일</span>
            <p className="text-sm mt-1">
              {new Date(reservation.created_at).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            닫기
          </button>
          {onCancel && (reservation.status === 'pending' || reservation.status === 'confirmed') && (
            <button
              onClick={() => {
                onCancel(reservation.id)
                onClose()
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              예약 취소
            </button>
          )}
        </div>
      </div>
    </div>
  )
}