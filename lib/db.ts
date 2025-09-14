// Cloudflare D1 Database Client
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// D1 Database instance - will be injected by Cloudflare Workers
export function getDB(env: any) {
  if (!env?.DB) {
    console.warn('D1 Database not available in this environment');
    // Return mock DB for development
    return createMockDB();
  }
  return drizzle(env.DB, { schema });
}

// Mock DB for development
function createMockDB() {
  return {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => ({ execute: async () => [] }) }),
        limit: () => ({ execute: async () => [] }),
        execute: async () => []
      })
    }),
    insert: () => ({
      values: () => ({ execute: async () => ({ lastInsertRowid: 1 }) })
    }),
    update: () => ({
      set: () => ({
        where: () => ({ execute: async () => ({ changes: 1 }) })
      })
    }),
    delete: () => ({
      where: () => ({ execute: async () => ({ changes: 1 }) })
    }),
    run: async () => ({ success: true }),
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: [] }),
        first: async () => null,
        run: async () => ({ success: true })
      })
    })
  };
}

// Legacy supabase compatibility layer - redirect to D1
export const supabase = {
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  })
};

// Supabase 호환성을 위한 에러 핸들러
export function handleSupabaseError(error: any) {
  console.error('Database error:', error);
  return {
    error: error?.message || 'Database operation failed',
    status: 500,
    details: error
  };
}

export function createAdminClient() {
  console.warn('⚠️  createAdminClient called - returning mock client');
  return {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null })
    })
  };
}

export default { getDB, supabase, handleSupabaseError, createAdminClient };
