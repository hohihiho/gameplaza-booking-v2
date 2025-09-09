// D1 마이그레이션 중 임시 Supabase admin 호환성 모듈

export function createClient() {
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        data: null, 
        error: new Error('D1 마이그레이션 중'),
        eq: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        single: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        maybeSingle: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      }),
      insert: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      update: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      delete: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
    }),
    auth: {
      admin: {
        createUser: () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        updateUser: () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        deleteUser: () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        listUsers: () => Promise.resolve({ data: [], error: new Error('D1 마이그레이션 중') }),
      },
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    }
  }
}

export function createAdminClient() {
  return createClient()
}