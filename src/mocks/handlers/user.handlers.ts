import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'

export const userHandlers = [
  http.get(`${SUPABASE_URL}/rest/v1/users`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('id')
    
    if (userId === 'eq.mock-user-id') {
      return HttpResponse.json([
        {
          id: 'mock-user-id',
          email: 'test@example.com',
          full_name: 'Test User',
          phone: null,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    }

    return HttpResponse.json([])
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/users`, async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      id: 'mock-user-id',
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  http.post(`${SUPABASE_URL}/rest/v1/users`, async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      id: 'new-user-id',
      ...body,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),
]