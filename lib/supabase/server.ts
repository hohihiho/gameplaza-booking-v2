// D1 마이그레이션 중 임시 Supabase server 호환성 모듈

import { cookies } from 'next/headers'

export function createClient() {
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        data: null, 
        error: new Error('D1 마이그레이션 중'),
        eq: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        neq: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        gt: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        gte: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        lt: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        lte: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        like: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        ilike: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        in: (column: string, values: any[]) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        is: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        single: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        maybeSingle: () => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        limit: (count: number) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        order: (column: string, options?: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        range: (from: number, to: number) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        count: (type?: string) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      }),
      insert: (data: any) => ({ 
        data: null, 
        error: new Error('D1 마이그레이션 중'),
        select: (columns?: string) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      }),
      update: (data: any) => ({ 
        data: null, 
        error: new Error('D1 마이그레이션 중'),
        eq: (column: string, value: any) => ({ 
          data: null, 
          error: new Error('D1 마이그레이션 중'),
          select: (columns?: string) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        }),
        neq: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        gt: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        gte: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        lt: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        lte: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        like: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        ilike: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        in: (column: string, values: any[]) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        is: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        select: (columns?: string) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        neq: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        gt: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        gte: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        lt: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        lte: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        like: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        ilike: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        in: (column: string, values: any[]) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
        is: (column: string, value: any) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      }),
      upsert: (data: any) => ({ 
        data: null, 
        error: new Error('D1 마이그레이션 중'),
        select: (columns?: string) => ({ data: null, error: new Error('D1 마이그레이션 중') }),
      }),
    }),
    auth: {
      getUser: async () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: async () => Promise.resolve({ data: { session: null }, error: null }),
      admin: {
        createUser: async () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        updateUser: async () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        deleteUser: async () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        listUsers: async () => Promise.resolve({ data: [], error: new Error('D1 마이그레이션 중') }),
      },
    },
    storage: {
      from: (bucket: string) => ({
        upload: async () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        download: async () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        remove: async () => Promise.resolve({ data: null, error: new Error('D1 마이그레이션 중') }),
        list: async () => Promise.resolve({ data: [], error: new Error('D1 마이그레이션 중') }),
        getPublicUrl: () => ({ data: { publicUrl: '' }, error: null }),
      }),
    }
  }
}

export function createServerClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: any
) {
  return createClient()
}