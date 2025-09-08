// D1 호환 더미 Supabase 클라이언트
// 실제 Supabase 대신 D1을 사용하도록 마이그레이션 중

import { getDb } from '@/lib/db'

// 더미 Supabase 클라이언트 생성 함수
export function createClient() {
  return createSupabaseCompatClient()
}

export function createAdminClient() {
  return createSupabaseCompatClient()
}

export function createServiceRoleClient() {
  return createSupabaseCompatClient()
}

// D1과 호환되는 더미 Supabase 클라이언트
function createSupabaseCompatClient() {
  const db = getDb()
  
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            try {
              const result = db.prepare(`SELECT ${columns || '*'} FROM ${table} WHERE ${column} = ?`).get(value)
              return { data: result, error: null }
            } catch (error) {
              return { data: null, error }
            }
          },
          async then(resolve: Function) {
            try {
              const results = db.prepare(`SELECT ${columns || '*'} FROM ${table} WHERE ${column} = ?`).all(value)
              resolve({ data: results, error: null })
            } catch (error) {
              resolve({ data: null, error })
            }
          }
        }),
        async then(resolve: Function) {
          try {
            const results = db.prepare(`SELECT ${columns || '*'} FROM ${table}`).all()
            resolve({ data: results, error: null })
          } catch (error) {
            resolve({ data: null, error })
          }
        }
      }),
      insert: (data: any) => ({
        select: () => ({
          async then(resolve: Function) {
            try {
              const keys = Object.keys(data)
              const values = Object.values(data)
              const placeholders = keys.map(() => '?').join(', ')
              const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
              const result = db.prepare(query).run(...values)
              resolve({ data: { ...data, id: result.lastInsertRowid }, error: null })
            } catch (error) {
              resolve({ data: null, error })
            }
          }
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              try {
                const keys = Object.keys(data)
                const values = Object.values(data)
                const setClause = keys.map(k => `${k} = ?`).join(', ')
                values.push(value)
                db.prepare(`UPDATE ${table} SET ${setClause} WHERE ${column} = ?`).run(...values)
                const result = db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).get(value)
                return { data: result, error: null }
              } catch (error) {
                return { data: null, error }
              }
            }
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          async then(resolve: Function) {
            try {
              db.prepare(`DELETE FROM ${table} WHERE ${column} = ?`).run(value)
              resolve({ error: null })
            } catch (error) {
              resolve({ error })
            }
          }
        })
      }),
      upsert: (data: any) => ({
        select: () => ({
          async then(resolve: Function) {
            try {
              const keys = Object.keys(data)
              const values = Object.values(data)
              const placeholders = keys.map(() => '?').join(', ')
              const updateClause = keys.map(k => `${k} = excluded.${k}`).join(', ')
              const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) 
                             ON CONFLICT(id) DO UPDATE SET ${updateClause}`
              db.prepare(query).run(...values)
              resolve({ data, error: null })
            } catch (error) {
              resolve({ data: null, error })
            }
          }
        })
      })
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: null, error: new Error('Not implemented') }),
      signUp: async () => ({ data: null, error: new Error('Not implemented') }),
      updateUser: async () => ({ data: null, error: new Error('Not implemented') }),
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
        getUserById: async () => ({ data: { user: null }, error: null }),
        deleteUser: async () => ({ data: null, error: null }),
        updateUserById: async () => ({ data: { user: null }, error: null })
      }
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error('Not implemented') }),
        download: async () => ({ data: null, error: new Error('Not implemented') }),
        remove: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    channel: () => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {}
        })
      })
    }),
    realtime: {
      channel: () => ({
        on: () => ({
          subscribe: () => ({
            unsubscribe: () => {}
          })
        })
      })
    }
  }
}

// Export types
export type SupabaseClient = ReturnType<typeof createSupabaseCompatClient>