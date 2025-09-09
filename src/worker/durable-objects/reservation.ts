/**
 * 예약 상태 관리를 위한 Durable Object
 * 실시간 예약 업데이트 처리
 */

/// <reference types="@cloudflare/workers-types" />

export class ReservationDurableObject {
  private state: DurableObjectState
  private env: any
  private sessions: Set<WebSocket>

  constructor(state: DurableObjectState, env: any) {
    this.state = state
    this.env = env
    this.sessions = new Set()
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    
    // WebSocket 연결 처리
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request)
    }

    // HTTP 요청 처리
    switch (url.pathname) {
      case '/reservation/status':
        return this.handleReservationStatus(request)
      case '/reservation/update':
        return this.handleReservationUpdate(request)
      default:
        return new Response('Not found', { status: 404 })
    }
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    if (server) {
      server.accept()
      this.sessions.add(server)

      server.addEventListener('message', async (event) => {
        try {
          const data = JSON.parse(event.data as string)
          await this.handleMessage(data, server)
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      })

      server.addEventListener('close', () => {
        this.sessions.delete(server)
      })

      return new Response(null, {
        status: 101,
        webSocket: client,
      })
    }

    return new Response('WebSocket creation failed', { status: 500 })
  }

  private async handleMessage(data: any, socket: WebSocket) {
    switch (data.type) {
      case 'subscribe':
        // 예약 상태 구독
        await this.subscribeToReservations(data.deviceId, socket)
        break
      case 'ping':
        socket.send(JSON.stringify({ type: 'pong' }))
        break
      default:
        console.warn('Unknown message type:', data.type)
    }
  }

  private async subscribeToReservations(deviceId: string, socket: WebSocket) {
    // 구독 정보 저장
    await this.state.storage.put(`subscription:${deviceId}`, {
      deviceId,
      timestamp: Date.now()
    })

    // 현재 예약 상태 전송
    const currentReservation = await this.getCurrentReservation(deviceId)
    socket.send(JSON.stringify({
      type: 'reservation_status',
      deviceId,
      data: currentReservation
    }))
  }

  private async getCurrentReservation(deviceId: string) {
    // D1에서 현재 예약 상태 조회
    const db = this.env.DB
    const reservation = await db
      .prepare(`
        SELECT * FROM reservations 
        WHERE device_id = ? 
        AND status = 'confirmed'
        AND start_time <= datetime('now')
        AND end_time > datetime('now')
        LIMIT 1
      `)
      .bind(deviceId)
      .first()
    
    return reservation
  }

  private async handleReservationStatus(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const deviceId = url.searchParams.get('device_id')
    
    if (!deviceId) {
      return Response.json({ error: 'device_id required' }, { status: 400 })
    }

    const reservation = await this.getCurrentReservation(deviceId)
    return Response.json({ data: reservation })
  }

  private async handleReservationUpdate(request: Request): Promise<Response> {
    try {
      const data = await request.json() as any
      const { deviceId, reservationId, status } = data

      // 모든 연결된 클라이언트에게 업데이트 브로드캐스트
      const message = JSON.stringify({
        type: 'reservation_updated',
        deviceId,
        reservationId,
        status,
        timestamp: Date.now()
      })

      this.sessions.forEach(socket => {
        try {
          socket.send(message)
        } catch (error) {
          console.error('Failed to send message to client:', error)
          this.sessions.delete(socket)
        }
      })

      return Response.json({ success: true })
    } catch (error) {
      console.error('Reservation update error:', error)
      return Response.json({ error: 'Failed to update' }, { status: 500 })
    }
  }

  async alarm() {
    // 주기적으로 만료된 세션 정리
    const now = Date.now()
    const expiredThreshold = 30 * 60 * 1000 // 30분

    const subscriptions = await this.state.storage.list({ prefix: 'subscription:' })
    
    const subscriptionsArray = Array.from(subscriptions.entries())
    for (const [key, value] of subscriptionsArray) {
      if (now - (value as any).timestamp > expiredThreshold) {
        await this.state.storage.delete(key)
      }
    }
  }
}