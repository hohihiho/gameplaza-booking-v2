/**
 * 관리자 관련 API 핸들러
 */

/// <reference types="@cloudflare/workers-types" />

import { Router } from 'itty-router'
import type { Env } from '../types/env'

const router = Router({ base: '/api/admin' })

// 관리자 권한 확인 미들웨어
const requireAdmin = async (request: Request) => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json(
      { error: 'Unauthorized', success: false },
      { status: 401 }
    )
  }
  
  // 관리자 권한 확인
  // 임시 구현
  return true
}

// 대시보드 데이터
router.get('/dashboard', async (request, env: Env) => {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck !== true) return adminCheck
    
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    // 통계 데이터 조회
    const [totalReservations, activeDevices, todayReservations] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM reservations').first(),
      db.prepare('SELECT COUNT(*) as count FROM devices WHERE status = "available"').first(),
      db.prepare('SELECT COUNT(*) as count FROM reservations WHERE DATE(created_at) = DATE("now")').first()
    ])
    
    return Response.json({
      data: {
        totalReservations: totalReservations.count,
        activeDevices: activeDevices.count,
        todayReservations: todayReservations.count,
        timestamp: new Date().toISOString()
      },
      success: true
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return Response.json(
      { error: 'Failed to fetch dashboard data', success: false },
      { status: 500 }
    )
  }
})

// 모든 예약 관리
router.get('/reservations', async (request, env: Env) => {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck !== true) return adminCheck
    
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    const reservations = await db
      .prepare(`
        SELECT 
          r.*, d.name as device_name, u.email as user_email
        FROM reservations r
        LEFT JOIN devices d ON r.device_id = d.id
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
        LIMIT 100
      `)
      .all()
    
    return Response.json({
      data: reservations.results,
      success: true
    })
  } catch (error) {
    console.error('Admin reservations error:', error)
    return Response.json(
      { error: 'Failed to fetch reservations', success: false },
      { status: 500 }
    )
  }
})

// CMS - 공지사항 관리
router.get('/cms/announcements', async (request, env: Env) => {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck !== true) return adminCheck
    
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    const url = new URL(request.url)
    
    // 필터링 파라미터
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
    const offset = (page - 1) * limit
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status') // 'published', 'draft', 'all'
    
    let query = `
      SELECT 
        id, title, content, type, is_important, is_published,
        created_at, updated_at, created_by, published_at, expires_at,
        view_count, sort_order
      FROM announcements 
      WHERE 1=1
    `
    
    const params = []
    
    // 타입 필터
    if (type && type !== 'all') {
      query += ` AND type = ?`
      params.push(type)
    }
    
    // 발행 상태 필터
    if (status === 'published') {
      query += ` AND is_published = 1`
    } else if (status === 'draft') {
      query += ` AND is_published = 0`
    }
    
    query += ` ORDER BY is_important DESC, sort_order DESC, created_at DESC`
    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)
    
    const announcements = await db.prepare(query).bind(...params).all()
    
    // 총 개수 조회
    let countQuery = 'SELECT COUNT(*) as count FROM announcements WHERE 1=1'
    const countParams = []
    
    if (type && type !== 'all') {
      countQuery += ` AND type = ?`
      countParams.push(type)
    }
    
    if (status === 'published') {
      countQuery += ` AND is_published = 1`
    } else if (status === 'draft') {
      countQuery += ` AND is_published = 0`
    }
    
    const totalCount = await db.prepare(countQuery).bind(...countParams).first()
    
    return Response.json({
      data: announcements.results,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      },
      success: true
    })
  } catch (error) {
    console.error('Admin announcements fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch announcements', success: false },
      { status: 500 }
    )
  }
})

// 공지사항 생성
router.post('/cms/announcements', async (request, env: Env) => {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck !== true) return adminCheck
    
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    const body = await request.json()
    
    const { 
      title, content, type = 'general', 
      is_important = false, is_published = false,
      expires_at, sort_order = 0 
    } = body
    
    if (!title || !content) {
      return Response.json(
        { error: 'Title and content are required', success: false },
        { status: 400 }
      )
    }
    
    const result = await db
      .prepare(`
        INSERT INTO announcements (
          title, content, type, is_important, is_published,
          created_by, published_at, expires_at, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        title, content, type, is_important ? 1 : 0, is_published ? 1 : 0,
        'admin@gameplaza.kr', // TODO: 실제 관리자 이메일로 대체
        is_published ? new Date().toISOString() : null,
        expires_at, sort_order
      )
      .run()
    
    return Response.json({
      data: { id: result.meta.last_row_id },
      success: true
    })
  } catch (error) {
    console.error('Admin announcement create error:', error)
    return Response.json(
      { error: 'Failed to create announcement', success: false },
      { status: 500 }
    )
  }
})

// 공지사항 수정
router.put('/cms/announcements/:id', async (request, env: Env) => {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck !== true) return adminCheck
    
    const { id } = request.params
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    const body = await request.json()
    
    const { 
      title, content, type, 
      is_important, is_published,
      expires_at, sort_order 
    } = body
    
    // 기존 공지사항 확인
    const existing = await db
      .prepare('SELECT * FROM announcements WHERE id = ?')
      .bind(id)
      .first()
    
    if (!existing) {
      return Response.json(
        { error: 'Announcement not found', success: false },
        { status: 404 }
      )
    }
    
    // 발행 상태가 변경되면 published_at 업데이트
    let publishedAt = existing.published_at
    if (is_published && !existing.is_published) {
      publishedAt = new Date().toISOString()
    } else if (!is_published && existing.is_published) {
      publishedAt = null
    }
    
    await db
      .prepare(`
        UPDATE announcements SET
          title = ?, content = ?, type = ?, 
          is_important = ?, is_published = ?,
          expires_at = ?, sort_order = ?, published_at = ?
        WHERE id = ?
      `)
      .bind(
        title, content, type,
        is_important ? 1 : 0, is_published ? 1 : 0,
        expires_at, sort_order, publishedAt, id
      )
      .run()
    
    return Response.json({
      data: { id: parseInt(id) },
      success: true
    })
  } catch (error) {
    console.error('Admin announcement update error:', error)
    return Response.json(
      { error: 'Failed to update announcement', success: false },
      { status: 500 }
    )
  }
})

// 공지사항 삭제
router.delete('/cms/announcements/:id', async (request, env: Env) => {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck !== true) return adminCheck
    
    const { id } = request.params
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    const result = await db
      .prepare('DELETE FROM announcements WHERE id = ?')
      .bind(id)
      .run()
    
    if (result.meta.changes === 0) {
      return Response.json(
        { error: 'Announcement not found', success: false },
        { status: 404 }
      )
    }
    
    return Response.json({
      data: { deleted: true },
      success: true
    })
  } catch (error) {
    console.error('Admin announcement delete error:', error)
    return Response.json(
      { error: 'Failed to delete announcement', success: false },
      { status: 500 }
    )
  }
})

export const handleAdmin = router.handle