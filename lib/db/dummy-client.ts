// Supabase 제거 후 임시 더미 클라이언트
// TODO: 실제 Cloudflare D1 연동으로 교체 필요

export const dummyClient = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } }),
        execute: () => Promise.resolve({ data: [], error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
      }),
      neq: (column: string, value: any) => ({
        execute: () => Promise.resolve({ data: [], error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
      }),
      gte: (column: string, value: any) => ({
        lte: (column2: string, value2: any) => ({
          order: (column3: string) => Promise.resolve({ data: [], error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
        })
      }),
      in: (column: string, values: any[]) => ({
        execute: () => Promise.resolve({ data: [], error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
      }),
      order: (column: string, options?: any) => Promise.resolve({ data: [], error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } }),
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
      }),
      returning: () => Promise.resolve({ data: [], error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
        }),
        execute: () => Promise.resolve({ data: null, error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ error: { message: 'Supabase 제거됨 - D1 마이그레이션 필요' } })
    })
  }),

  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Better Auth 사용 필요' } })
  },

  channel: (name: string) => ({
    on: (event: string, config: any, callback: (payload: any) => void) => ({
      subscribe: () => ({
        unsubscribe: () => {}
      })
    })
  }),

  removeChannel: (channel: any) => {}
};

// supabase와 supabaseAdmin 대체용
export const supabase = dummyClient;
export const supabaseAdmin = dummyClient;