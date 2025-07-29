// 예약 관련 API 함수들

// 기기 타입 목록 조회
export async function getDeviceTypes() {
  const response = await fetch('/api/v2/devices/types')
  if (!response.ok) {
    throw new Error('기기 목록을 불러올 수 없습니다')
  }
  return response.json()
}

// 시간대 슬롯 조회
export async function getTimeSlots(date: string, deviceTypeId?: string) {
  const params = new URLSearchParams({ date })
  if (deviceTypeId) params.append('deviceTypeId', deviceTypeId)
  
  const response = await fetch(`/api/v2/time-slots?${params}`)
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
  creditType?: string
}) {
  // deviceTypeId는 제거하고 필요한 필드만 전송
  const { deviceTypeId, ...apiData } = data;
  
  console.log('예약 API 요청 데이터:', apiData);
  
  const response = await fetch('/api/v2/reservations', {
    method: 'POST',
    credentials: 'include', // 쿠키 포함
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiData)
  })
  
  const responseText = await response.text();
  console.log('예약 API 응답 텍스트:', responseText);
  
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    console.error('JSON 파싱 에러:', e);
    throw new Error('서버 응답을 파싱할 수 없습니다');
  }
  
  if (!response.ok) {
    console.error('예약 API 에러:', result)
    throw new Error(result.error || '예약 생성에 실패했습니다')
  }
  
  console.log('예약 API 성공 응답:', result)
  return result
}

// 내 예약 목록 조회
export async function getMyReservations(status?: string) {
  try {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    
    // v2 API 사용
    const apiUrl = `/api/v2/reservations${params.toString() ? `?${params.toString()}` : ''}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include', // 쿠키 포함
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const responseText = await response.text()
    console.log('예약 목록 API 호출:', apiUrl)
    console.log('예약 목록 응답 상태:', response.status)
    console.log('예약 목록 응답 헤더:', Object.fromEntries(response.headers.entries()))
    console.log('예약 목록 응답 본문:', responseText)
    
    let result;
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error('예약 목록 JSON 파싱 에러:', e)
      throw new Error('서버 응답을 파싱할 수 없습니다')
    }
    
    if (!response.ok) {
      console.error('예약 목록 API 에러 상태:', response.status)
      console.error('예약 목록 API 에러 내용:', result)
      
      // 인증 오류 처리
      if (response.status === 401) {
        throw new Error('로그인이 필요합니다')
      }
      
      const errorMessage = result.error?.message || result.error || result.message || '예약 목록을 불러올 수 없습니다'
      throw new Error(errorMessage)
    }
    
    // API handler 응답 형식 처리
    if (result.success && result.data) {
      console.log('API 응답 데이터:', result.data)
      return result.data
    }
    
    // v2 API 응답 형식 처리
    if (result.reservations) {
      return { reservations: result.reservations }
    }
    
    // 직접 응답인 경우 (fallback)
    return result
  } catch (error) {
    console.error('예약 목록 조회 실패:', error)
    throw error
  }
}

// 예약 취소
export async function cancelReservation(id: string, reason?: string) {
  // v2 API 사용
  const apiUrl = `/api/v2/reservations/${id}`
  
  const response = await fetch(apiUrl, {
    method: 'DELETE',
    credentials: 'include', // 쿠키 포함
    headers: reason ? { 'Content-Type': 'application/json' } : {},
    body: reason ? JSON.stringify({ reason }) : undefined
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || error.error || '예약 취소에 실패했습니다')
  }
  
  return response.json()
}