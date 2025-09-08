// D1 호환 Admin 클라이언트
import { createAdminClient } from './index'

export { createAdminClient }

// Admin 전용 헬퍼 함수들
export function createServerAdminClient() {
  return createAdminClient()
}

export function getAdminSupabase() {
  return createAdminClient()
}