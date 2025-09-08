// D1 호환 Service Role 클라이언트
import { createServiceRoleClient } from './index'

export { createServiceRoleClient }

// Service Role 전용 헬퍼 함수들
export function getServiceRoleSupabase() {
  return createServiceRoleClient()
}

export function createServerServiceRoleClient() {
  return createServiceRoleClient()
}