// 데이터베이스 연결 래퍼 - 개선된 아키텍처
// 새로운 구조의 모듈들을 export
export * from './db/connection';
export * from './db/query-builder';
export * from './db/base-repository';
export * from './db/types';

// 기존 구조와의 호환성 유지
import { Pool } from 'pg';
import { query as newQuery, queryOne, transaction } from './db/connection';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 기존 query 함수 - 호환성 유지
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function getClient() {
  return await pool.connect();
}

// Supabase 스타일의 API 래퍼
export function createClient() {
  return {
    // 인증 속성 (Better Auth와 호환)
    auth: {
      getSession: async () => {
        // Better Auth 세션 반환 (실제 구현은 Better Auth에서)
        return { data: { session: null }, error: null };
      },
      getUser: async () => {
        // Better Auth 사용자 반환 (실제 구현은 Better Auth에서)
        return { data: { user: null }, error: null };
      }
    },

    from: (table: string) => ({
      select: (columns: string = '*') => {
        let whereClause = '';
        let orderClause = '';
        let limitClause = '';
        let params: any[] = [];

        const builder = {
          eq: (column: string, value: any) => {
            whereClause += whereClause ? ` AND ${column} = $${params.length + 1}` : ` WHERE ${column} = $${params.length + 1}`;
            params.push(value);
            return builder;
          },
          gte: (column: string, value: any) => {
            whereClause += whereClause ? ` AND ${column} >= $${params.length + 1}` : ` WHERE ${column} >= $${params.length + 1}`;
            params.push(value);
            return builder;
          },
          lte: (column: string, value: any) => {
            whereClause += whereClause ? ` AND ${column} <= $${params.length + 1}` : ` WHERE ${column} <= $${params.length + 1}`;
            params.push(value);
            return builder;
          },
          order: (column: string, options?: { ascending?: boolean }) => {
            const direction = options?.ascending === false ? 'DESC' : 'ASC';
            orderClause = ` ORDER BY ${column} ${direction}`;
            return builder;
          },
          limit: (n: number) => {
            limitClause = ` LIMIT ${n}`;
            return builder;
          },
          single: async () => {
            try {
              const sql = `SELECT ${columns} FROM ${table}${whereClause}${orderClause} LIMIT 1`;
              const result = await query(sql, params);
              return { data: result.rows[0] || null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          count: async () => {
            try {
              const sql = `SELECT COUNT(*) as count FROM ${table}${whereClause}`;
              const result = await query(sql, params);
              return { data: parseInt(result.rows[0].count), error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          async then() {
            try {
              const sql = `SELECT ${columns} FROM ${table}${whereClause}${orderClause}${limitClause}`;
              const result = await query(sql, params);
              return { data: result.rows, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        };

        return builder;
      },
      insert: (data: any) => ({
        async then() {
          try {
            const columns = Object.keys(data).join(', ');
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            const result = await query(
              `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
              values
            );
            return { data: result.rows[0], error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          async then() {
            try {
              const setClause = Object.keys(data)
                .map((key, i) => `${key} = $${i + 1}`)
                .join(', ');
              const values = [...Object.values(data), value];

              const result = await query(
                `UPDATE ${table} SET ${setClause} WHERE ${column} = $${values.length} RETURNING *`,
                values
              );
              return { data: result.rows[0], error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          async then() {
            try {
              const result = await query(
                `DELETE FROM ${table} WHERE ${column} = $1 RETURNING *`,
                [value]
              );
              return { data: result.rows[0], error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        })
      })
    }),

    // Realtime 기능 (간단한 stub)
    channel: (channelName: string) => ({
      on: (event: string, callback: Function) => {
        // Realtime 구독 stub
        console.log(`Subscribed to ${channelName}:${event}`);
        return this;
      },
      subscribe: () => {
        console.log(`Channel ${channelName} subscribed`);
        return Promise.resolve();
      }
    }),

    removeChannel: (channel: any) => {
      console.log('Channel removed');
      return Promise.resolve();
    }
  };
}

// 관리자 클라이언트 (권한 상관없이 모든 데이터 접근 가능)
export function createAdminClient() {
  return createClient();
}

// 새로운 API 편의 함수들
export { queryOne, transaction } from './db/connection';
export { from as queryBuilder } from './db/query-builder';

export default {
  createClient,
  createAdminClient,
  query,
  queryOne,
  transaction,
  queryBuilder: require('./db/query-builder').from
};