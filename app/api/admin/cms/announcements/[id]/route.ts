/**
 * 개별 공지사항 수정/삭제 API
 */

import { NextRequest, NextResponse } from 'next/server'

// 관리자 권한 확인 함수
async function checkAdminAuth(request: NextRequest) {
  // TODO: Better Auth 또는 세션 기반 관리자 권한 확인 로직 구현
  // 현재는 임시로 모든 요청을 허용
  return true
}

// PUT - 공지사항 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAuth(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    
    const { title, content, type, is_important, is_published, expires_at, sort_order } = body
    
    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수 항목입니다', success: false },
        { status: 400 }
      )
    }

    // Worker API 호출
    const workerUrl = process.env.WORKER_URL || 'http://localhost:8787'
    
    const workerResponse = await fetch(`${workerUrl}/api/admin/cms/announcements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`,
      },
      body: JSON.stringify({
        title,
        content,
        type,
        is_important: Boolean(is_important),
        is_published: Boolean(is_published),
        expires_at,
        sort_order: sort_order || 0
      }),
    })
    
    if (!workerResponse.ok) {
      const errorData = await workerResponse.json()
      if (workerResponse.status === 404) {
        return NextResponse.json(
          { error: '공지사항을 찾을 수 없습니다', success: false },
          { status: 404 }
        )
      }
      throw new Error(errorData.error || `Worker API error: ${workerResponse.status}`)
    }
    
    const data = await workerResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin announcement update error:', error)
    return NextResponse.json(
      { error: '공지사항 수정 중 오류가 발생했습니다', success: false },
      { status: 500 }
    )
  }
}

// DELETE - 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAuth(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const { id } = params

    // Worker API 호출
    const workerUrl = process.env.WORKER_URL || 'http://localhost:8787'
    
    const workerResponse = await fetch(`${workerUrl}/api/admin/cms/announcements/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`,
      },
    })
    
    if (!workerResponse.ok) {
      const errorData = await workerResponse.json()
      if (workerResponse.status === 404) {
        return NextResponse.json(
          { error: '공지사항을 찾을 수 없습니다', success: false },
          { status: 404 }
        )
      }
      throw new Error(errorData.error || `Worker API error: ${workerResponse.status}`)
    }
    
    const data = await workerResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin announcement delete error:', error)
    return NextResponse.json(
      { error: '공지사항 삭제 중 오류가 발생했습니다', success: false },
      { status: 500 }
    )
  }
}