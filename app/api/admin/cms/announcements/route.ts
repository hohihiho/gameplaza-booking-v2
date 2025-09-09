/**
 * 관리자 CMS 공지사항 관리 API
 */

import { NextRequest, NextResponse } from 'next/server'

// 관리자 권한 확인 함수
async function checkAdminAuth(request: NextRequest) {
  // TODO: Better Auth 또는 세션 기반 관리자 권한 확인 로직 구현
  // 현재는 임시로 모든 요청을 허용
  return true
}

// GET - 관리자용 공지사항 목록 조회
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Worker API 호출
    const workerUrl = process.env.WORKER_URL || 'http://localhost:8787'
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    const workerResponse = await fetch(`${workerUrl}/api/admin/cms/announcements?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`,
      },
    })
    
    if (!workerResponse.ok) {
      throw new Error(`Worker API error: ${workerResponse.status}`)
    }
    
    const data = await workerResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin announcements list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements', success: false },
      { status: 500 }
    )
  }
}

// POST - 새 공지사항 생성
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // 입력값 검증
    const { title, content, type, is_important, is_published, expires_at, sort_order } = body
    
    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수 항목입니다', success: false },
        { status: 400 }
      )
    }

    // Worker API 호출
    const workerUrl = process.env.WORKER_URL || 'http://localhost:8787'
    
    const workerResponse = await fetch(`${workerUrl}/api/admin/cms/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`,
      },
      body: JSON.stringify({
        title,
        content,
        type: type || 'general',
        is_important: Boolean(is_important),
        is_published: Boolean(is_published),
        expires_at,
        sort_order: sort_order || 0
      }),
    })
    
    if (!workerResponse.ok) {
      const errorData = await workerResponse.json()
      throw new Error(errorData.error || `Worker API error: ${workerResponse.status}`)
    }
    
    const data = await workerResponse.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Admin announcement create error:', error)
    return NextResponse.json(
      { error: '공지사항 생성 중 오류가 발생했습니다', success: false },
      { status: 500 }
    )
  }
}