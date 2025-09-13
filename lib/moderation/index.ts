export type ModerationMatch = { word: string; category?: string; severity?: string }

// Pluggable AI moderation adapter
export async function aiModerate(text: string): Promise<{ matches: ModerationMatch[] }> {
  const url = process.env.MODERATION_WEBHOOK_URL
  if (!url) return { matches: [] }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': process.env.MODERATION_WEBHOOK_TOKEN ? `Bearer ${process.env.MODERATION_WEBHOOK_TOKEN}` : '' },
      body: JSON.stringify({ text })
    })
    if (!res.ok) return { matches: [] }
    const data = await res.json().catch(() => null)
    if (data && Array.isArray(data.matches)) {
      return { matches: data.matches as ModerationMatch[] }
    }
    return { matches: [] }
  } catch {
    return { matches: [] }
  }
}

export function mergeMatches(a: ModerationMatch[], b: ModerationMatch[]): ModerationMatch[] {
  const key = (m: ModerationMatch) => `${(m.word || '').toLowerCase()}|${m.category || ''}|${m.severity || ''}`
  const seen = new Set<string>()
  const out: ModerationMatch[] = []
  for (const m of [...a, ...b]) {
    const k = key(m)
    if (!seen.has(k)) { seen.add(k); out.push(m) }
  }
  return out
}

