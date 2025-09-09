/**
 * 공지사항 API 핸들러
 */

/// <reference types="@cloudflare/workers-types" />

import { Router } from 'itty-router'
import type { Env } from '../types/env'

const router = Router({ base: '/api/announcements' })

// 공개 공지사항 조회 (발행된 것만, 만료되지 않은 것만)
router.get('/', async (request, env: Env) => {
  try {
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    // URL 파라미터 파싱
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
    const offset = (page - 1) * limit
    
    // 발행된 공지사항 중 만료되지 않은 것만 조회
    const announcements = await db
      .prepare(`
        SELECT 
          id, title, content, type, is_important, 
          published_at, expires_at, view_count, sort_order
        FROM announcements 
        WHERE is_published = 1 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
        ORDER BY 
          is_important DESC, 
          sort_order DESC, 
          published_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(limit, offset)
      .all()
    
    // 총 개수 조회
    const totalCount = await db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM announcements 
        WHERE is_published = 1 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      `)
      .first()
    
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
    console.error('Announcements fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch announcements', success: false },
      { status: 500 }
    )
  }
})

// 특정 공지사항 조회 및 조회수 증가
router.get('/:id', async (request, env: Env) => {
  try {
    const { id } = request.params
    const db = env.ENVIRONMENT === 'production' ? env.DB : env.DEV_DB
    
    // 공지사항 조회
    const announcement = await db
      .prepare(`
        SELECT 
          id, title, content, type, is_important, 
          published_at, expires_at, view_count, sort_order
        FROM announcements 
        WHERE id = ? 
        AND is_published = 1 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      `)
      .bind(id)
      .first()
    
    if (!announcement) {
      return Response.json(
        { error: 'Announcement not found', success: false },
        { status: 404 }
      )
    }
    
    // 조회수 증가
    await db
      .prepare('UPDATE announcements SET view_count = view_count + 1 WHERE id = ?')
      .bind(id)
      .run()
    
    return Response.json({
      data: {
        ...announcement,
        view_count: announcement.view_count + 1
      },
      success: true
    })
  } catch (error) {
    console.error('Announcement fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch announcement', success: false },
      { status: 500 }
    )
  }
})

export const handleAnnouncements = router.handle