/**
 * 예약 관련 API 핸들러
 */

/// <reference types="@cloudflare/workers-types" />

import { Router } from 'itty-router'
import type { Env } from '../types/env'
import { requireAuth, getCurrentUserFromRequest } from '../auth/jwt-utils'

const router = Router({ base: '/api/v2/reservations' })

// 예약 목록 조회
router.get('/', async (request, env: Env) => {
  try {
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    const reservations = await db
      .prepare(`
        SELECT 
          id, user_id, device_id, start_time, end_time, 
          status, created_at, updated_at
        FROM reservations 
        ORDER BY created_at DESC
        LIMIT 50
      `)
      .all()
    
    return Response.json({
      data: reservations.results,
      success: true
    })
  } catch (error) {
    console.error('Get reservations error:', error)
    return Response.json(
      { error: 'Failed to fetch reservations', success: false },
      { status: 500 }
    )
  }
})

// 예약 생성 (인증 필요)
router.post('/', requireAuth(async (request, user) => {
  try {
    const body = await request.json() as any
    const { device_id, start_time, end_time } = body
    
    // 인증된 사용자의 ID 사용
    const user_id = user.sub
    
    // 입력값 검증  
    if (!device_id || !start_time || !end_time) {
      return Response.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      )
    }
    
    const env = (request as any).env as Env
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    // 중복 예약 검사
    const conflictQuery = await db
      .prepare(`
        SELECT id FROM reservations 
        WHERE device_id = ? 
        AND status = 'confirmed'
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
      `)
      .bind(device_id, start_time, start_time, end_time, end_time, start_time, end_time)
      .first()
    
    if (conflictQuery) {
      return Response.json(
        { error: 'Time slot already reserved', success: false },
        { status: 409 }
      )
    }
    
    // 예약 생성
    const reservation = await db
      .prepare(`
        INSERT INTO reservations (
          user_id, device_id, start_time, end_time, 
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'confirmed', datetime('now'), datetime('now'))
      `)
      .bind(user_id, device_id, start_time, end_time)
      .run()
    
    return Response.json({
      data: { 
        id: reservation.meta.last_row_id, 
        user_id, device_id, start_time, end_time,
        status: 'confirmed' 
      },
      success: true
    })
  } catch (error) {
    console.error('Create reservation error:', error)
    return Response.json(
      { error: 'Failed to create reservation', success: false },
      { status: 500 }
    )
  }
}))

// 특정 예약 조회
router.get('/:id', async (request, env: Env) => {
  try {
    const { id } = request.params
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    const reservation = await db
      .prepare('SELECT * FROM reservations WHERE id = ?')
      .bind(id)
      .first()
    
    if (!reservation) {
      return Response.json(
        { error: 'Reservation not found', success: false },
        { status: 404 }
      )
    }
    
    return Response.json({
      data: reservation,
      success: true
    })
  } catch (error) {
    console.error('Get reservation error:', error)
    return Response.json(
      { error: 'Failed to fetch reservation', success: false },
      { status: 500 }
    )
  }
})

export const handleReservations = router.handle