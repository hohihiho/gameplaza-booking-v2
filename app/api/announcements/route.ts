/**
 * 공지사항 조회 API (공개용)
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Worker API 호출
    const workerUrl = process.env.WORKER_URL || 'http://localhost:8787'
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    const workerResponse = await fetch(`${workerUrl}/api/announcements?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!workerResponse.ok) {
      throw new Error(`Worker API error: ${workerResponse.status}`)
    }
    
    const data = await workerResponse.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5분 캐싱
      },
    })
  } catch (error) {
    console.error('Announcements API error:', error)
    return NextResponse.json(
      { 
        error: '공지사항 조회 중 오류가 발생했습니다', 
        success: false,
        data: []
      },
      { status: 500 }
    )
  }
}