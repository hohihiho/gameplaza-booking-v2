// Cloudflare Worker: Perspective API proxy for moderation (ko/en)
// Env vars:
// - PERSPECTIVE_API_KEY (required)
// - WEBHOOK_TOKEN (optional, Bearer auth)
// - TOXICITY_THRESHOLD (optional, default 0.8)

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }
    // Optional Bearer token
    const auth = request.headers.get('authorization') || ''
    if (env.WEBHOOK_TOKEN) {
      if (!auth.startsWith('Bearer ') || auth.slice(7) !== env.WEBHOOK_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } })
      }
    }
    const apiKey = env.PERSPECTIVE_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ matches: [], error: 'PERSPECTIVE_API_KEY missing' }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    let body
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ matches: [], error: 'Invalid JSON' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }
    const text = String(body?.text || '')
    if (!text.trim()) {
      return new Response(JSON.stringify({ matches: [] }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    const threshold = Number(env.TOXICITY_THRESHOLD || 0.8)
    const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${encodeURIComponent(apiKey)}`
    const reqPayload = {
      comment: { text },
      languages: ['ko', 'en'],
      requestedAttributes: {
        TOXICITY: {}, INSULT: {}, PROFANITY: {}, THREAT: {}, SEXUALLY_EXPLICIT: {}
      },
      doNotStore: true
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(reqPayload)
      })
      if (!res.ok) {
        return new Response(JSON.stringify({ matches: [], error: `Perspective error ${res.status}` }), { status: 200, headers: { 'content-type': 'application/json' } })
      }
      const data = await res.json()
      const scores = data?.attributeScores || {}
      const matches = []
      for (const [attr, obj] of Object.entries(scores)) {
        const score = Number(obj?.summaryScore?.value || 0)
        if (score >= threshold) {
          matches.push({ word: attr, category: 'ai', severity: score >= 0.9 ? 'high' : 'medium' })
        }
      }
      return new Response(JSON.stringify({ matches }), { status: 200, headers: { 'content-type': 'application/json' } })
    } catch (e) {
      return new Response(JSON.stringify({ matches: [], error: 'request_failed' }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
  }
}

