'use client'

import { useState, useEffect } from 'react'
import { formatKoreanDate } from '@/lib/utils/kst-date'
import ReservationDetailModal from './ReservationDetailModal'

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
}

export default function ReservationList() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v3/reservations')
      const data = await response.json()
      
      if (data.success) {
        setReservations(data.reservations || [])
      } else {
        setError(data.error || '예약 목록을 불러올 수 없습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    )
  }

  const formatTime = (reservation: Reservation) => {
    if (reservation.start_time && reservation.end_time) {
      return `${reservation.start_time} - ${reservation.end_time}`
    }
    if (reservation.start_hour !== undefined && reservation.end_hour !== undefined) {
      const startHour = reservation.start_hour
      const endHour = reservation.end_hour
      // 0~5시는 24~29시로 표시
      const displayStart = startHour <= 5 ? startHour + 24 : startHour
      const displayEnd = endHour <= 5 ? endHour + 24 : endHour
      return `${displayStart}:00 - ${displayEnd}:00`
    }
    return '시간 미정'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button 
            onClick={loadReservations}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">예약 목록</h2>
          <button 
            onClick={loadReservations}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            새로고침
          </button>
        </div>
      </div>
      
      <div className="divide-y">
        {reservations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            예약이 없습니다
          </div>
        ) : (
          reservations.map(reservation => (
            <div 
              key={reservation.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setSelectedReservation(reservation)
                setIsModalOpen(true)
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{reservation.device_id}</span>
                    {getStatusBadge(reservation.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{formatKoreanDate(new Date(reservation.date))}</p>
                    <p>{formatTime(reservation)}</p>
                    <p>{reservation.player_count}인 · {reservation.credit_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{reservation.total_amount.toLocaleString()}원</p>
                  <p className="text-xs text-gray-500">
                    {new Date(reservation.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* 예약 상세 모달 */}
      <ReservationDetailModal
        reservation={selectedReservation}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedReservation(null)
        }}
      />
    </div>
  )
}