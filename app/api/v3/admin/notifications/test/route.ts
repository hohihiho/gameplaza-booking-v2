import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/utils'
import { d1GetPushTemplateByKey } from '@/lib/db/d1'
import webpush from 'web-push'
import { d1GetPushSubscription, d1LogPushNotification } from '@/lib/db/d1'

export const POST = withAuth(async (req: NextRequest, { user }: any) => {
  const body = await req.json()
  const targetUserId = String(body.user_id || user.id)
  const templateKey = String(body.template_key || '')
  const t = templateKey ? await d1GetPushTemplateByKey(templateKey) : null
  const subscription = await d1GetPushSubscription(targetUserId)
  if (!subscription) return NextResponse.json({ ok: false, error: 'no_subscription' }, { status: 400 })

  const payload = {
    title: t?.title || String(body.title || '테스트 알림'),
    body: t?.body || String(body.body || '테스트 메시지입니다.'),
    data: t?.data || body.data || null,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    timestamp: Date.now(),
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    await d1LogPushNotification({ user_id: targetUserId, type: 'test', title: payload.title, body: payload.body, payload: payload.data, status: 'sent' })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    await d1LogPushNotification({ user_id: targetUserId, type: 'test', title: payload.title, body: payload.body, payload: payload.data, status: 'failed', error: e?.message })
    return NextResponse.json({ ok: false, error: e?.message || 'send failed' }, { status: 500 })
  }
}, { requireAdmin: true })

