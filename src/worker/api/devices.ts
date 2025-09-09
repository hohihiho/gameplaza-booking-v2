/**
 * 기기 관련 API 핸들러
 */

/// <reference types="@cloudflare/workers-types" />

import { Router } from 'itty-router'
import type { Env } from '../types/env'

const router = Router({ base: '/api/v2/devices' })

// 기기 목록 조회
router.get('/', async (request, env: Env) => {
  try {
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    const devices = await db
      .prepare(`
        SELECT 
          id, name, type, status, location, 
          specifications, created_at, updated_at
        FROM devices 
        ORDER BY name ASC
      `)
      .all()
    
    return Response.json({
      data: devices.results,
      success: true
    })
  } catch (error) {
    console.error('Get devices error:', error)
    return Response.json(
      { error: 'Failed to fetch devices', success: false },
      { status: 500 }
    )
  }
})

// 예약 가능한 기기 조회
router.get('/available', async (request, env: Env) => {
  try {
    const url = new URL(request.url)
    const startTime = url.searchParams.get('start_time')
    const endTime = url.searchParams.get('end_time')
    
    if (!startTime || !endTime) {
      return Response.json(
        { error: 'start_time and end_time are required', success: false },
        { status: 400 }
      )
    }
    
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    const availableDevices = await db
      .prepare(`
        SELECT d.* FROM devices d
        LEFT JOIN reservations r ON d.id = r.device_id 
        AND r.status = 'confirmed'
        AND (
          (r.start_time <= ? AND r.end_time > ?) OR
          (r.start_time < ? AND r.end_time >= ?) OR
          (r.start_time >= ? AND r.end_time <= ?)
        )
        WHERE d.status = 'available' AND r.id IS NULL
        ORDER BY d.name ASC
      `)
      .bind(startTime, startTime, endTime, endTime, startTime, endTime)
      .all()
    
    return Response.json({
      data: availableDevices.results,
      success: true
    })
  } catch (error) {
    console.error('Get available devices error:', error)
    return Response.json(
      { error: 'Failed to fetch available devices', success: false },
      { status: 500 }
    )
  }
})

// 기기 상태 업데이트
router.patch('/:id/status', async (request, env: Env) => {
  try {
    const { id } = request.params
    const body = await request.json() as any
    const { status } = body
    
    if (!status || !['available', 'occupied', 'maintenance', 'offline'].includes(status)) {
      return Response.json(
        { error: 'Invalid status', success: false },
        { status: 400 }
      )
    }
    
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    const result = await db
      .prepare(`
        UPDATE devices 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(status, id)
      .run()
    
    if (result.meta.changes === 0) {
      return Response.json(
        { error: 'Device not found', success: false },
        { status: 404 }
      )
    }
    
    return Response.json({
      data: { id, status, updated_at: new Date().toISOString() },
      success: true
    })
  } catch (error) {
    console.error('Update device status error:', error)
    return Response.json(
      { error: 'Failed to update device status', success: false },
      { status: 500 }
    )
  }
})

export const handleDevices = router.handle