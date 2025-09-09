import { NextRequest } from 'next/server'

// SSE를 위한 헤더 설정
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no', // nginx 버퍼링 비활성화
}

// 연결된 클라이언트들을 관리하는 맵
const clients = new Map<string, ReadableStreamDefaultController>()

// 모든 클라이언트에게 이벤트 브로드캐스트
export function broadcastReservationUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`
  
  clients.forEach((controller, clientId) => {
    try {
      controller.enqueue(new TextEncoder().encode(message))
    } catch (error) {
      // 연결이 끊긴 클라이언트 제거
      clients.delete(clientId)
    }
  })
}

export async function GET(request: NextRequest) {
  // 클라이언트 ID 생성
  const clientId = crypto.randomUUID()
  
  // ReadableStream 생성
  const stream = new ReadableStream({
    start(controller) {
      // 클라이언트 등록
      clients.set(clientId, controller)
      
      // 초기 연결 메시지
      const message = `data: ${JSON.stringify({ 
        type: 'connected', 
        clientId,
        timestamp: new Date().toISOString() 
      })}\n\n`
      controller.enqueue(new TextEncoder().encode(message))
      
      // 30초마다 heartbeat 전송 (연결 유지)
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `: heartbeat ${new Date().toISOString()}\n\n`
          controller.enqueue(new TextEncoder().encode(heartbeat))
        } catch (error) {
          clearInterval(heartbeatInterval)
          clients.delete(clientId)
        }
      }, 30000)
      
      // 연결 종료 시 정리
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        clients.delete(clientId)
        controller.close()
      })
    },
  })
  
  return new Response(stream, { headers: SSE_HEADERS })
}