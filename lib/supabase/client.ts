// D1 마이그레이션 중 임시 Supabase client 호환성 모듈

export function createClient() {
  return {
    from: (table: string) => ({
      select: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      insert: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      update: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      delete: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      eq: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      single: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      maybeSingle: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
      signOut: () => Promise.resolve({ error: null }),
    },
    channel: (name: string) => ({
      on: () => ({}),
      subscribe: () => ({}),
    }),
    removeChannel: () => {},
  }
}