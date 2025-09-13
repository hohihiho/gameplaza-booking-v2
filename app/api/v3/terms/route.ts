import { NextRequest, NextResponse } from 'next/server'
import { d1GetActiveTerms } from '@/lib/db/d1'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'terms_of_service'
  const page = await d1GetActiveTerms(type)
  return NextResponse.json({ type, page })
}

