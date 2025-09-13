import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1ListBannedWords, d1CreateBannedWord } from '@/lib/db/d1'

export const GET = withAuth(async () => {
  const list = await d1ListBannedWords()
  return NextResponse.json({ banned_words: list })
}, { requireAdmin: true })

export const POST = withAuth(async (req: NextRequest, { user }: any) => {
  const body = await req.json()
  const created = await d1CreateBannedWord({
    word: String(body.word),
    category: body.category || 'custom',
    severity: body.severity || 'medium',
    is_active: body.is_active !== false,
    created_by: user?.id,
  })
  return NextResponse.json({ banned_word: created }, { status: 201 })
}, { requireAdmin: true })

