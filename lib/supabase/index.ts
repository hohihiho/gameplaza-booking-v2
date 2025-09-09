// D1 마이그레이션 중 임시 Supabase 호환성 모듈
// 빌드 오류를 방지하기 위한 임시 구현

export function createClient() {
  return {
    from: (table: string) => ({
      select: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      insert: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      update: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      delete: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
    }),
    auth: {
      getUser: () => ({ data: { user: null }, error: null }),
      signIn: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      signUp: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      signOut: () => ({ error: null }),
    },
    channel: () => ({
      on: () => ({}),
      subscribe: () => ({}),
    }),
    removeChannel: () => {},
  }
}

export function createAdminClient() {
  return createClient()
}

export function createServiceRoleClient(
  supabaseUrl?: string,
  supabaseServiceRoleKey?: string,
  options?: any
) {
  return createClient()
}