import { NextRequest, NextResponse } from 'next/server'
import { d1ListGuideCategories, d1ListGuideContents } from '@/lib/db/d1'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  if (!category) {
    // Return categories only
    const cats = await d1ListGuideCategories()
    return NextResponse.json({ categories: cats })
  }
  // If category is slug, client can map to id via categories list; for now we return all published contents
  const contents = await d1ListGuideContents()
  const published = contents.filter((c: any) => c.is_published === 1)
  return NextResponse.json({ contents: published })
}

