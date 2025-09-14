type Listener = (msg: any) => void

export class WSClient {
  private url: string
  private topics: string[]
  private ws: WebSocket | null = null
  private listeners: Set<Listener> = new Set()
  private retry = 1000
  private timer: any = null

  constructor(url: string, topics: string[] = ['all']) {
    this.url = url
    this.topics = topics
  }

  on(listener: Listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }

  disconnect() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
  }

  connect() {
    // Handle both absolute and relative URLs
    let fullUrl: string
    if (this.url.startsWith('http') || this.url.startsWith('ws')) {
      fullUrl = this.url
    } else if (typeof window !== 'undefined') {
      // Use configured WebSocket endpoint for DevicesHub
      const wsEndpoint = 'https://dev.gameplaza.kr/ws/devices'
      fullUrl = wsEndpoint
    } else {
      fullUrl = 'ws://localhost:3000' + this.url
    }

    const url = new URL(fullUrl)
    url.searchParams.set('topics', this.topics.join(','))
    // Convert https to wss, http to ws
    this.ws = new WebSocket(url.toString().replace('https', 'wss').replace('http', 'ws'))
    this.ws.onopen = () => { this.retry = 1000 }
    this.ws.onmessage = (evt) => {
      try { const data = JSON.parse(String(evt.data)); this.listeners.forEach(l => l(data)) } catch { /* ignore */ }
    }
    this.ws.onclose = this.ws.onerror = () => {
      this.ws = null
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => this.connect(), Math.min(this.retry, 10000))
      this.retry *= 2
    }
  }
}

