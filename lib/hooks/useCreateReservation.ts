// 예약 생성 훅 (경량 버전)
import { useCallback, useState } from 'react'

type CreateReservationInput = {
  deviceId: string
  date: string
  startHour: number
  endHour: number
  creditType: string
  playerCount?: number
  userNotes?: string
  onBehalfUserId?: string
}

export function useCreateReservation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReservation = useCallback(async (data: CreateReservationInput) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v3/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `HTTP ${res.status}`)
      }
      return await res.json()
    } catch (err: any) {
      setError(err?.message || '예약 생성에 실패했습니다')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createReservation, loading, error }
}

export default useCreateReservation

