// 데이터베이스 연결 래퍼 - Supabase 대체
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            try {
              const result = await query(
                `SELECT ${columns} FROM ${table} WHERE ${column} = $1 LIMIT 1`,
                [value]
              );
              return { data: result.rows[0] || null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          limit: (n: number) => ({
            async then() {
              try {
                const result = await query(
                  `SELECT ${columns} FROM ${table} WHERE ${column} = $1 LIMIT $2`,
                  [value, n]
                );
                return { data: result.rows, error: null };
              } catch (error) {
                return { data: null, error };
              }
            }
          }),
        }),
        async then() {
          try {
            const result = await query(`SELECT ${columns} FROM ${table}`);
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      }),
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
    })
  };
}

// 관리자 클라이언트 (권한 상관없이 모든 데이터 접근 가능)
export function createAdminClient() {
  return createClient();
}

export default { createClient, createAdminClient, query };