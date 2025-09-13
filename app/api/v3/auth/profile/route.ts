import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/utils'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ success: true, user })
}

