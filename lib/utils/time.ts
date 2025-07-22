/**
 * 0시~5시를 24시~29시로 변환
 */
export function formatTime24Plus(time: string): string {
  if (!time || typeof time !== 'string') return time as any
  
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return time
  
  const hour = parseInt(match[1])
  const minute = match[2]
  
  if (hour >= 0 && hour <= 5) {
    return `${hour + 24}:${minute}`
  }
  
  return time
}

/**
 * 24시~29시를 0시~5시로 변환
 */
export function parseTime24Plus(time: string): string {
  if (!time || typeof time !== 'string') return time
  
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return time
  
  const hour = parseInt(match[1])
  const minute = match[2]
  
  if (hour >= 24 && hour <= 29) {
    return `${(hour - 24).toString().padStart(2, '0')}:${minute}`
  }
  
  return time
}

/**
 * 시간 범위가 유효한지 검증
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false
  
  const startMatch = startTime.match(/^(\d{1,2}):(\d{2})$/)
  const endMatch = endTime.match(/^(\d{1,2}):(\d{2})$/)
  
  if (!startMatch || !endMatch) return false
  
  const startHour = parseInt(startMatch[1])
  const startMinute = parseInt(startMatch[2])
  const endHour = parseInt(endMatch[1])
  const endMinute = parseInt(endMatch[2])
  
  // 시간 범위 검증
  if (startHour < 0 || startHour > 29 || endHour < 0 || endHour > 29) {
    return false
  }
  
  if (startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59) {
    return false
  }
  
  // 시작 시간을 분으로 변환
  let startTotalMinutes = startHour * 60 + startMinute
  let endTotalMinutes = endHour * 60 + endMinute
  
  // 24시간을 넘는 경우 조정
  if (startHour >= 24) {
    startTotalMinutes = (startHour - 24) * 60 + startMinute + 24 * 60
  }
  if (endHour >= 24) {
    endTotalMinutes = (endHour - 24) * 60 + endMinute + 24 * 60
  }
  
  // 종료 시간이 시작 시간보다 이전인 경우
  if (endTotalMinutes < startTotalMinutes) {
    // 다음날로 넘어가는 경우만 허용
    if (endHour < 24 && startHour < 24) {
      endTotalMinutes += 24 * 60
    } else {
      return false // 역방향은 무효
    }
  }
  
  // 24시간 초과 검증
  const duration = endTotalMinutes - startTotalMinutes
  if (duration > 24 * 60 || duration <= 0) {
    return false
  }
  
  return true
}

/**
 * 시간 차이를 시간 단위로 계산
 */
export function calculateDuration(startTime: string, endTime: string): number {
  if (!isValidTimeRange(startTime, endTime)) {
    return 0
  }
  
  const startMatch = startTime.match(/^(\d{1,2}):(\d{2})$/)!
  const endMatch = endTime.match(/^(\d{1,2}):(\d{2})$/)!
  
  const startHour = parseInt(startMatch[1])
  const startMinute = parseInt(startMatch[2])
  const endHour = parseInt(endMatch[1])
  const endMinute = parseInt(endMatch[2])
  
  let startTotalMinutes = startHour * 60 + startMinute
  let endTotalMinutes = endHour * 60 + endMinute
  
  // 24시간을 넘는 경우 조정
  if (startHour >= 24) {
    startTotalMinutes = (startHour - 24) * 60 + startMinute + 24 * 60
  }
  if (endHour >= 24) {
    endTotalMinutes = (endHour - 24) * 60 + endMinute + 24 * 60
  }
  
  // 종료 시간이 시작 시간보다 이전인 경우 (다음날로 넘어가는 경우)
  if (endTotalMinutes <= startTotalMinutes && endHour < 24) {
    endTotalMinutes += 24 * 60
  }
  
  return (endTotalMinutes - startTotalMinutes) / 60
}