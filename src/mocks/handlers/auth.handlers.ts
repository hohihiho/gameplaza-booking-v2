import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'

export const authHandlers = [
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = await request.json() as any
    
    if (body.grant_type === 'refresh_token') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          phone: null,
          app_metadata: {},
          user_metadata: {
            full_name: 'Test User',
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid grant type' },
      { status: 400 }
    )
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      phone: null,
      app_metadata: {},
      user_metadata: {
        full_name: 'Test User',
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    })
  }),

  http.post(`${SUPABASE_URL}/auth/v1/signup`, async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      id: 'mock-user-id',
      email: body.email,
      phone: body.phone || null,
      app_metadata: {},
      user_metadata: body.data || {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      confirmation_sent_at: new Date().toISOString(),
    })
  }),
]