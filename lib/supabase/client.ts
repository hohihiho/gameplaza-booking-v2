// D1 호환 Client
'use client'

import { createClient } from './index'

export { createClient }

// Browser 클라이언트 전용 헬퍼 함수들
export function createBrowserClient() {
  return createClient()
}

export function getSupabaseClient() {
  return createClient()
}