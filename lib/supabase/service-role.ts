// D1 마이그레이션 중 임시 Supabase service-role 호환성 모듈

export function createClient() {
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        data: null, 
        error: new Error('D1 마이그레이션 중'),
        eq: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        single: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        maybeSingle: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      }),
      insert: (data: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      update: (data: any) => ({ 
        data: null, 
        error: new Error('D1 마이그레이션 중'),
        eq: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      }),
    }),
    auth: {
      admin: {
        createUser: () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        updateUser: () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        deleteUser: () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        listUsers: () => Promise.resolve({ data: [], error: new Error('D1 마이그레이션 중') }),
      },
    }
  }
}

export function createServiceRoleClient(
  supabaseUrl?: string,
  supabaseServiceRoleKey?: string,
  options?: any
) {
  return createClient()
}

export function handleSupabaseError(error: any) {
  console.error('Supabase error during D1 migration:', error)
  return {
    success: false,
    error: 'D1 마이그레이션 중 - 데이터베이스 기능 일시 중단',
    data: null
  }
}