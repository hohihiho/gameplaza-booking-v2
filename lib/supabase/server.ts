// D1 호환 Server 클라이언트
import { createClient } from './index'
import { cookies } from 'next/headers'

export function createServerClient() {
  return createClient()
}

export function createServerComponentClient() {
  return createClient()
}

export function createServerActionClient() {
  return createClient()
}

// Cookie 기반 클라이언트 (실제로는 D1 사용)
export async function createCookieClient() {
  const cookieStore = await cookies()
  return createClient()
}