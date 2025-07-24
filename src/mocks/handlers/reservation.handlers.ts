import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'

export const reservationHandlers = [
  http.get(`${SUPABASE_URL}/rest/v1/reservations`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    
    if (userId === 'eq.mock-user-id') {
      return HttpResponse.json([
        {
          id: 'reservation-1',
          user_id: 'mock-user-id',
          device_id: 'device-1',
          date: '2025-07-23',
          time_slot: '14:00-16:00',
          status: 'pending',
          reservation_number: 'GP-20250723-0001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    }

    return HttpResponse.json([])
  }),

  http.post(`${SUPABASE_URL}/rest/v1/reservations`, async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      id: 'new-reservation-id',
      ...body,
      status: 'pending',
      reservation_number: `GP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/reservations`, async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/reservations`, () => {
    return HttpResponse.json({ message: 'Deleted successfully' })
  }),
]