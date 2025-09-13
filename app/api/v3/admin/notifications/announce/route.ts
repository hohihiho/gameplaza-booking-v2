import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { sendAnnouncementNotification } from '@/lib/server/push-notifications'

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json()
  const title = String(body.title || '')
  const message = String(body.message || '')
  const userIds = Array.isArray(body.user_ids) ? body.user_ids.map(String) : []
  const result = await sendAnnouncementNotification(userIds, title, message)
  return NextResponse.json(result)
}, { requireAdmin: true })

