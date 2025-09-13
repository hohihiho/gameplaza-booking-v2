import { NextRequest, NextResponse } from 'next/server'
import { d1CheckBannedInText } from '@/lib/db/d1'
import { aiModerate, mergeMatches } from '@/lib/moderation/index'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const text = String(body?.text || '')
  const [manual, ai] = await Promise.all([
    d1CheckBannedInText(text),
    aiModerate(text)
  ])
  const matches = mergeMatches(manual.matches, ai.matches)
  return NextResponse.json({ matches, manual: manual.matches, ai: ai.matches })
}
