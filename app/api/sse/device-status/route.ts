import { NextRequest } from 'next/server'
import { DeviceStatusManager } from '@/lib/services/device-status-manager'

// SSE 헤더 설정
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
}

// 연결된 클라이언트들 관리
const clients = new Map<string, ReadableStreamDefaultController>()

// 기기 상태 변경 이벤트 브로드캐스트
export function broadcastDeviceStatusUpdate(data: any) {
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
  const clientId = crypto.randomUUID()
  
  const stream = new ReadableStream({
    start(controller) {
      // 클라이언트 등록
      clients.set(clientId, controller)
      
      // 초기 연결 메시지와 함께 현재 모든 기기 상태 전송
      const devices = DeviceStatusManager.getAllStatuses()
      const initialMessage = `data: ${JSON.stringify({ 
        type: 'full_update',
        devices: devices.map(d => ({
          id: d.deviceId,
          status: d.status,
          currentUser: d.userId,
          startTime: d.startTime?.toISOString(),
          endTime: d.endTime?.toISOString(),
          remainingTime: d.endTime 
            ? Math.max(0, Math.floor((d.endTime.getTime() - Date.now()) / 60000))
            : undefined
        })),
        timestamp: new Date().toISOString()
      })}\n\n`
      
      controller.enqueue(new TextEncoder().encode(initialMessage))
      
      // 30초마다 heartbeat
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

// 기기 상태 API 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const { action, deviceId, ...params } = await request.json()
    
    switch (action) {
      case 'checkIn':
        await DeviceStatusManager.checkIn(
          deviceId,
          params.reservationId,
          new Date(params.startTime),
          new Date(params.endTime),
          params.userId
        )
        break
        
      case 'release':
        await DeviceStatusManager.manualRelease(deviceId)
        break
        
      case 'reserve':
        await DeviceStatusManager.reserve(
          deviceId,
          params.reservationId,
          new Date(params.startTime),
          params.userId
        )
        break
        
      case 'maintenance':
        await DeviceStatusManager.setMaintenance(deviceId)
        break
        
      case 'extend':
        await DeviceStatusManager.extendRental(
          deviceId,
          new Date(params.newEndTime)
        )
        break
        
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('기기 상태 업데이트 오류:', error)
    return Response.json({ 
      error: error instanceof Error ? error.message : '기기 상태 업데이트 실패' 
    }, { status: 500 })
  }
}