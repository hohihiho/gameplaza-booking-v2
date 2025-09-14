export interface Env {
  DEVICES_HUB: DurableObjectNamespace
  PUBLISH_SECRET?: string
}

export class DevicesHub implements DurableObject {
  state: DurableObjectState
  topics: Map<string, Set<WebSocket>>

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state
    this.topics = new Map()
  }

  private broadcast(topic: string, data: any) {
    const set = this.topics.get(topic)
    if (!set || set.size === 0) return
    const msg = JSON.stringify(data)
    for (const ws of set) {
      try { ws.send(msg) } catch { /* noop */ }
    }
  }

  private subscribe(ws: WebSocket, topics: string[]) {
    for (const t of topics) {
      if (!this.topics.has(t)) this.topics.set(t, new Set())
      this.topics.get(t)!.add(ws)
    }
  }

  private unsubscribe(ws: WebSocket) {
    for (const set of this.topics.values()) set.delete(ws)
  }

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/internal/publish' && request.method === 'POST') {
      // Optional auth
      const secret = env.PUBLISH_SECRET
      if (secret) {
        const auth = request.headers.get('authorization') || ''
        if (auth !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 })
      }
      const body = await request.json().catch(() => null)
      if (!body || !body.topic) return new Response('Bad Request', { status: 400 })
      const topic: string = String(body.topic)
      const payload = {
        topic,
        type: body.type || 'event',
        ts: body.ts || Date.now(),
        payload: body.payload || null
      }
      this.broadcast(topic, payload)
      // Fan-out to broader topics if needed
      const parts = topic.split(':')
      if (parts[0] !== 'all') this.broadcast('all', payload)
      return Response.json({ ok: true })
    }

    if (url.pathname === '/ws/devices') {
      const pair = new WebSocketPair()
      const client = pair[0]
      const server = pair[1]
      const topicsParam = url.searchParams.get('topics') || 'all'
      const initialTopics = topicsParam.split(',').map(s => s.trim()).filter(Boolean)
      ;(server as any).accept()
      this.subscribe(server as any, initialTopics)
      ;(server as any).addEventListener('message', (evt: MessageEvent) => {
        // support dynamic subscribe: { action: 'subscribe', topics: ['type:1002'] }
        try {
          const data = JSON.parse(String(evt.data || '{}'))
          if (data?.action === 'subscribe' && Array.isArray(data.topics)) this.subscribe(server as any, data.topics)
          if (data?.action === 'ping') (server as any).send(JSON.stringify({ action: 'pong', ts: Date.now() }))
        } catch {/* ignore */}
      })
      ;(server as any).addEventListener('close', () => this.unsubscribe(server as any))
      ;(server as any).addEventListener('error', () => this.unsubscribe(server as any))
      return new Response(null, { status: 101, webSocket: client })
    }

    return new Response('Not Found', { status: 404 })
  }
}

export default {
  fetch(request: Request, env: Env) {
    const id = env.DEVICES_HUB.idFromName('devices-hub')
    const stub = env.DEVICES_HUB.get(id)
    return stub.fetch(request)
  }
}

