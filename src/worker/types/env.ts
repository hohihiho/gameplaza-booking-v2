/**
 * Cloudflare Workers 환경 타입 정의
 */

/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database
  DEV_DB: D1Database
  RESERVATION_STATE: DurableObjectNamespace
  DEVICE_STATUS: DurableObjectNamespace
  ENVIRONMENT: string
}