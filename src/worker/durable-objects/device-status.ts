/**
 * 기기 상태 관리를 위한 Durable Object
 * 실시간 기기 상태 업데이트 처리
 */

/// <reference types="@cloudflare/workers-types" />

export class DeviceStatusDurableObject {
  private state: DurableObjectState
  private env: any
  private sessions: Map<WebSocket, Set<string>> // WebSocket과 구독한 기기 ID들

  constructor(state: DurableObjectState, env: any) {
    this.state = state
    this.env = env
    this.sessions = new Map()
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    
    // WebSocket 연결 처리
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request)
    }

    // HTTP 요청 처리
    switch (url.pathname) {
      case '/device/status':
        return this.handleDeviceStatus(request)
      case '/device/update':
        return this.handleDeviceUpdate(request)
      default:
        return new Response('Not found', { status: 404 })
    }
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    if (server) {
      server.accept()
      this.sessions.set(server, new Set())

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
      case 'subscribe_device':
        // 특정 기기 상태 구독
        await this.subscribeToDevice(data.deviceId, socket)
        break
      case 'subscribe_all':
        // 모든 기기 상태 구독
        await this.subscribeToAllDevices(socket)
        break
      case 'unsubscribe':
        // 구독 해제
        await this.unsubscribeFromDevice(data.deviceId, socket)
        break
      case 'ping':
        socket.send(JSON.stringify({ type: 'pong' }))
        break
      default:
        console.warn('Unknown message type:', data.type)
    }
  }

  private async subscribeToDevice(deviceId: string, socket: WebSocket) {
    const subscribedDevices = this.sessions.get(socket)
    if (subscribedDevices) {
      subscribedDevices.add(deviceId)
    }

    // 현재 기기 상태 전송
    const currentStatus = await this.getDeviceStatus(deviceId)
    socket.send(JSON.stringify({
      type: 'device_status',
      deviceId,
      data: currentStatus
    }))
  }

  private async subscribeToAllDevices(socket: WebSocket) {
    // 모든 기기 상태 조회 및 전송
    const allDevices = await this.getAllDevicesStatus()
    
    const subscribedDevices = this.sessions.get(socket) || new Set()
    allDevices.forEach((device: any) => {
      subscribedDevices.add(device.id)
    })
    this.sessions.set(socket, subscribedDevices)

    socket.send(JSON.stringify({
      type: 'all_devices_status',
      data: allDevices
    }))
  }

  private async unsubscribeFromDevice(deviceId: string, socket: WebSocket) {
    const subscribedDevices = this.sessions.get(socket)
    if (subscribedDevices) {
      subscribedDevices.delete(deviceId)
    }
  }

  private async getDeviceStatus(deviceId: string) {
    const db = this.env.DB
    const device = await db
      .prepare('SELECT id, name, status, updated_at FROM devices WHERE id = ?')
      .bind(deviceId)
      .first()
    
    return device
  }

  private async getAllDevicesStatus() {
    const db = this.env.DB
    const devices = await db
      .prepare('SELECT id, name, status, updated_at FROM devices ORDER BY name')
      .all()
    
    return devices.results
  }

  private async handleDeviceStatus(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const deviceId = url.searchParams.get('device_id')
    
    if (deviceId) {
      const device = await this.getDeviceStatus(deviceId)
      return Response.json({ data: device })
    } else {
      const devices = await this.getAllDevicesStatus()
      return Response.json({ data: devices })
    }
  }

  private async handleDeviceUpdate(request: Request): Promise<Response> {
    try {
      const data = await request.json() as any
      const { deviceId, status, metadata } = data

      // 관련된 모든 클라이언트에게 업데이트 브로드캐스트
      const message = JSON.stringify({
        type: 'device_updated',
        deviceId,
        status,
        metadata,
        timestamp: Date.now()
      })

      this.sessions.forEach((subscribedDevices, socket) => {
        // 해당 기기를 구독하는 클라이언트에게만 전송
        if (subscribedDevices.has(deviceId) || subscribedDevices.has('*')) {
          try {
            socket.send(message)
          } catch (error) {
            console.error('Failed to send message to client:', error)
            this.sessions.delete(socket)
          }
        }
      })

      return Response.json({ success: true })
    } catch (error) {
      console.error('Device update error:', error)
      return Response.json({ error: 'Failed to update' }, { status: 500 })
    }
  }

  async alarm() {
    // 주기적으로 기기 상태 확인 및 업데이트
    try {
      const devices = await this.getAllDevicesStatus()
      
      // 모든 구독자에게 상태 업데이트 전송
      const message = JSON.stringify({
        type: 'devices_heartbeat',
        data: devices,
        timestamp: Date.now()
      })

      this.sessions.forEach((subscribedDevices, socket) => {
        if (subscribedDevices.size > 0) {
          try {
            socket.send(message)
          } catch (error) {
            console.error('Failed to send heartbeat:', error)
            this.sessions.delete(socket)
          }
        }
      })
    } catch (error) {
      console.error('Device status alarm error:', error)
    }
  }
}