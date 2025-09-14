export async function publish(topic: string, type: string, payload: any, secret?: string) {
  try {
    const base = (process.env.PUBLISH_BASE_URL || '').trim()
    const url = base ? `${base.replace(/\/$/, '')}/internal/publish` : '/internal/publish'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { authorization: `Bearer ${secret}` } : {})
      },
      body: JSON.stringify({ topic, type, payload, ts: Date.now() })
    })
    return res.ok
  } catch {
    return false
  }
}
