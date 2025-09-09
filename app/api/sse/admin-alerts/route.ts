import { NextRequest } from 'next/server'

// SSE 헤더 설정
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
}

// 연결된 관리자 클라이언트들
const adminClients = new Map<string, ReadableStreamDefaultController>()

// 관리자 알림 브로드캐스트
export function broadcastAdminAlert(alert: any) {
  const message = `data: ${JSON.stringify({ type: 'alert', alert })}\n\n`
  
  adminClients.forEach((controller, clientId) => {
    try {
      controller.enqueue(new TextEncoder().encode(message))
    } catch (error) {
      // 연결이 끊긴 클라이언트 제거
      adminClients.delete(clientId)
    }
  })
}

// 노쇼 알림 발송
export function sendNoShowAlert(reservation: any) {
  const alert = {
    id: crypto.randomUUID(),
    type: 'no_show',
    title: '노쇼 감지',
    message: `예약 #${reservation.id.slice(0, 8)} - ${reservation.deviceName || reservation.deviceId} 기기의 예약자가 체크인하지 않았습니다.`,
    timestamp: new Date().toISOString(),
    priority: 'high',
    actionRequired: true,
    actionUrl: `/admin/reservations/${reservation.id}`,
    actionLabel: '예약 확인'
  }
  
  broadcastAdminAlert(alert)
}

// 기기 문제 알림 발송
export function sendDeviceIssueAlert(deviceId: string, issue: string) {
  const alert = {
    id: crypto.randomUUID(),
    type: 'device_issue',
    title: '기기 문제 발생',
    message: `${deviceId} 기기: ${issue}`,
    timestamp: new Date().toISOString(),
    priority: 'critical',
    actionRequired: true,
    actionUrl: `/admin/devices/${deviceId}`,
    actionLabel: '기기 관리'
  }
  
  broadcastAdminAlert(alert)
}

// 긴급 예약 알림
export function sendUrgentReservationAlert(reservation: any) {
  const alert = {
    id: crypto.randomUUID(),
    type: 'urgent_reservation',
    title: '긴급 예약 요청',
    message: `${reservation.userName}님이 ${reservation.deviceName} 기기를 긴급 예약 요청했습니다.`,
    timestamp: new Date().toISOString(),
    priority: 'medium',
    actionRequired: true,
    actionUrl: `/admin/reservations/pending`,
    actionLabel: '예약 승인'
  }
  
  broadcastAdminAlert(alert)
}

// 결제 문제 알림
export function sendPaymentIssueAlert(payment: any) {
  const alert = {
    id: crypto.randomUUID(),
    type: 'payment_issue',
    title: '결제 문제 발생',
    message: `예약 #${payment.reservationId.slice(0, 8)} - 결제 처리 중 문제가 발생했습니다.`,
    timestamp: new Date().toISOString(),
    priority: 'high',
    actionRequired: true,
    actionUrl: `/admin/payments/${payment.id}`,
    actionLabel: '결제 확인'
  }
  
  broadcastAdminAlert(alert)
}

// 시스템 알림
export function sendSystemAlert(title: string, message: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  const alert = {
    id: crypto.randomUUID(),
    type: 'system',
    title,
    message,
    timestamp: new Date().toISOString(),
    priority,
    actionRequired: false
  }
  
  broadcastAdminAlert(alert)
}

export async function GET(request: NextRequest) {
  // TODO: 관리자 권한 확인
  // const isAdmin = await checkAdminAuth(request)
  // if (!isAdmin) {
  //   return new Response('Unauthorized', { status: 401 })
  // }
  
  const clientId = crypto.randomUUID()
  
  const stream = new ReadableStream({
    start(controller) {
      // 클라이언트 등록
      adminClients.set(clientId, controller)
      console.log(`👤 관리자 알림 클라이언트 연결: ${clientId}`)
      
      // 초기 연결 메시지
      const message = `data: ${JSON.stringify({ 
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString()
      })}\n\n`
      controller.enqueue(new TextEncoder().encode(message))
      
      // 테스트 알림 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          sendSystemAlert('시스템 연결 테스트', '관리자 알림 시스템이 정상적으로 연결되었습니다.', 'low')
        }, 2000)
      }
      
      // 30초마다 heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `: heartbeat ${new Date().toISOString()}\n\n`
          controller.enqueue(new TextEncoder().encode(heartbeat))
        } catch (error) {
          clearInterval(heartbeatInterval)
          adminClients.delete(clientId)
        }
      }, 30000)
      
      // 연결 종료 시 정리
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        adminClients.delete(clientId)
        controller.close()
        console.log(`👤 관리자 알림 클라이언트 연결 종료: ${clientId}`)
      })
    },
  })
  
  return new Response(stream, { headers: SSE_HEADERS })
}