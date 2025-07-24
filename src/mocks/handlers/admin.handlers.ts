import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'

export const adminHandlers = [
  http.get(`${SUPABASE_URL}/rest/v1/admin_settings`, () => {
    return HttpResponse.json([
      {
        id: 'setting-1',
        key: 'business_hours',
        value: {
          weekdays: { start: '10:00', end: '29:00' },
          weekends: { start: '10:00', end: '28:00' },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'setting-2',
        key: 'max_reservation_days',
        value: 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/admin_settings`, async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  http.get(`${SUPABASE_URL}/rest/v1/rpc/get_admin_stats`, () => {
    return HttpResponse.json({
      total_users: 150,
      total_reservations: 450,
      today_reservations: 12,
      pending_approvals: 3,
      active_devices: 25,
    })
  }),
]