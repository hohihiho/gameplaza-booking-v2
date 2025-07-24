import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'

export const deviceHandlers = [
  http.get(`${SUPABASE_URL}/rest/v1/device_categories`, () => {
    return HttpResponse.json([
      {
        id: 'cat-1',
        name: 'PC',
        description: 'High-performance gaming computers',
        display_order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-2',
        name: 'Console',
        description: 'Gaming consoles',
        display_order: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-3',
        name: 'VR',
        description: 'Virtual Reality devices',
        display_order: 3,
        created_at: new Date().toISOString(),
      },
    ])
  }),

  http.get(`${SUPABASE_URL}/rest/v1/device_types`, () => {
    return HttpResponse.json([
      {
        id: 'type-1',
        category_id: 'cat-1',
        name: 'Gaming PC (RTX 4090)',
        description: 'High-end gaming PC with RTX 4090',
        specifications: {
          gpu: 'RTX 4090',
          cpu: 'Intel i9-13900K',
          ram: '32GB DDR5',
        },
        created_at: new Date().toISOString(),
      },
      {
        id: 'type-2',
        category_id: 'cat-2',
        name: 'PlayStation 5',
        description: 'Sony PlayStation 5',
        specifications: {
          storage: '825GB SSD',
        },
        created_at: new Date().toISOString(),
      },
    ])
  }),

  http.get(`${SUPABASE_URL}/rest/v1/devices`, () => {
    return HttpResponse.json([
      {
        id: 'device-1',
        device_type_id: 'type-1',
        device_number: 'PC-001',
        status: 'available',
        created_at: new Date().toISOString(),
      },
      {
        id: 'device-2',
        device_type_id: 'type-1',
        device_number: 'PC-002',
        status: 'available',
        created_at: new Date().toISOString(),
      },
      {
        id: 'device-3',
        device_type_id: 'type-2',
        device_number: 'PS5-001',
        status: 'available',
        created_at: new Date().toISOString(),
      },
    ])
  }),
]