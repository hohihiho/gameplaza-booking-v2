// 예약 관련 API 함수들

// 기기 타입 목록 조회
export async function getDeviceTypes() {
  const response = await fetch('/api/device-types')
  if (!response.ok) {
    throw new Error('기기 목록을 불러올 수 없습니다')
  }
  return response.json()
}

// 시간대 슬롯 조회
export async function getTimeSlots(date: string, deviceTypeId?: string) {
  const params = new URLSearchParams({ date })
  if (deviceTypeId) params.append('deviceTypeId', deviceTypeId)
  
  const response = await fetch(`/api/time-slots?${params}`)
  if (!response.ok) {
    throw new Error('시간대를 불러올 수 없습니다')
  }
  return response.json()
}

// 예약 생성
export async function createReservation(data: {
  date: string
  startTime: string
  endTime: string
  deviceTypeId: string
  deviceId: string
  playerCount: number
  hourlyRate: number
  totalAmount: number
  userNotes?: string
}) {
  const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    console.error('예약 API 에러:', error)
    throw new Error(error.error || '예약 생성에 실패했습니다')
  }
  
  return response.json()
}

// 내 예약 목록 조회
export async function getMyReservations(status?: string) {
  const params = status ? `?status=${status}` : ''
  const response = await fetch(`/api/reservations${params}`)
  
  if (!response.ok) {
    throw new Error('예약 목록을 불러올 수 없습니다')
  }
  
  return response.json()
}

// 예약 취소
export async function cancelReservation(id: string) {
  const response = await fetch(`/api/reservations/${id}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '예약 취소에 실패했습니다')
  }
  
  return response.json()
}