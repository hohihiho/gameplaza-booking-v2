// Cloudflare D1 데이터베이스 클라이언트 래퍼
// Better Auth와 호환되는 Supabase 스타일 API 제공

// D1 환경 변수 확인
const CLOUDFLARE_DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!CLOUDFLARE_DATABASE_ID || !CLOUDFLARE_ACCOUNT_ID) {
  console.warn('Cloudflare D1 환경 변수가 설정되지 않았습니다.');
}

// 서버 환경에서만 사용 가능한 D1 클라이언트 래퍼
class D1Client {
  private db: any;

  constructor() {
    // 서버 환경에서만 D1에 접근
    if (typeof window === 'undefined' && process.env.CF_BINDING) {
      // Cloudflare Workers 환경에서만 global.D1DB 사용
      this.db = global.D1DB;
    } else if (typeof window === 'undefined') {
      // 개발 환경에서는 wrangler로 로컬 D1 사용
      try {
        // wrangler dev 환경에서 D1 바인딩 시뮬레이션
        this.db = null; // 실제로는 wrangler에서 바인딩됨
      } catch (error) {
        console.warn('D1 로컬 개발 환경을 사용할 수 없습니다:', error);
        this.db = null;
      }
    }
  }

  async query(sql: string, params?: any[]): Promise<{ success: boolean; results?: any[]; meta?: any; error?: string }> {
    try {
      // 실제 환경에서는 D1 바인딩 사용
      if (this.db) {
        const stmt = this.db.prepare(sql);
        if (params && params.length > 0) {
          const result = await stmt.bind(...params).all();
          return { success: true, results: result.results, meta: result.meta };
        } else {
          const result = await stmt.all();
          return { success: true, results: result.results, meta: result.meta };
        }
      } else {
        // 개발 환경에서는 API 호출로 대체
        const response = await fetch('/api/internal/d1-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql, params }),
        });

        if (!response.ok) {
          throw new Error(`D1 API 호출 실패: ${response.status}`);
        }

        return await response.json();
      }
    } catch (error) {
      console.error('D1 쿼리 실행 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  }

  async queryOne(sql: string, params?: any[]): Promise<any> {
    const result = await this.query(sql, params);
    return result.success ? (result.results?.[0] || null) : null;
  }

  async execute(sql: string, params?: any[]): Promise<{ success: boolean; meta?: any; error?: string }> {
    try {
      if (this.db) {
        const stmt = this.db.prepare(sql);
        if (params && params.length > 0) {
          const result = await stmt.bind(...params).run();
          return { success: true, meta: result.meta };
        } else {
          const result = await stmt.run();
          return { success: true, meta: result.meta };
        }
      } else {
        // 개발 환경에서는 API 호출로 대체
        const response = await fetch('/api/internal/d1-execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql, params }),
        });

        if (!response.ok) {
          throw new Error(`D1 API 호출 실패: ${response.status}`);
        }

        return await response.json();
      }
    } catch (error) {
      console.error('D1 실행 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
    }
  }
}

// 전역 D1 클라이언트 인스턴스
let d1Client: D1Client | null = null;

function getD1Client(): D1Client {
  if (!d1Client) {
    d1Client = new D1Client();
  }
  return d1Client;
}

// 서버 전용 함수들 - 클라이언트에서 사용하면 에러 발생
export async function query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
  if (typeof window !== 'undefined') {
    throw new Error('query()는 서버에서만 사용할 수 있습니다. 클라이언트에서는 API를 통해 접근하세요.');
  }

  const client = getD1Client();
  const result = await client.query(sql, params);

  return {
    rows: result.results || [],
    rowCount: result.results?.length || 0
  };
}

export async function queryOne(sql: string, params?: any[]): Promise<any> {
  if (typeof window !== 'undefined') {
    throw new Error('queryOne()는 서버에서만 사용할 수 있습니다. 클라이언트에서는 API를 통해 접근하세요.');
  }

  const client = getD1Client();
  return await client.queryOne(sql, params);
}

export async function execute(sql: string, params?: any[]): Promise<any> {
  if (typeof window !== 'undefined') {
    throw new Error('execute()는 서버에서만 사용할 수 있습니다. 클라이언트에서는 API를 통해 접근하세요.');
  }

  const client = getD1Client();
  return await client.execute(sql, params);
}

// 트랜잭션 지원 (D1에서는 제한적)
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  if (typeof window !== 'undefined') {
    throw new Error('transaction()는 서버에서만 사용할 수 있습니다.');
  }

  const client = getD1Client();
  // D1은 기본적으로 트랜잭션을 지원하지 않으므로 단순 실행
  return await callback(client);
}

// Supabase 호환 API 클라이언트 (클라이언트/서버 모두 사용 가능)
export function createClient() {
  return {
    // Better Auth 호환 속성
    auth: {
      getSession: async () => {
        // Better Auth에서 구현됨
        return { data: { session: null }, error: null };
      },
      getUser: async () => {
        // Better Auth에서 구현됨
        return { data: { user: null }, error: null };
      }
    },

    // 테이블 쿼리 빌더
    from: (table: string) => ({
      select: (columns: string = '*') => {
        let whereClause = '';
        let orderClause = '';
        let limitClause = '';
        let params: any[] = [];

        const executeQuery = async () => {
          try {
            const sql = `SELECT ${columns} FROM ${table}${whereClause}${orderClause}${limitClause}`;

            if (typeof window !== 'undefined') {
              // 클라이언트에서는 API 호출
              const response = await fetch('/api/internal/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql, params }),
              });

              if (!response.ok) {
                throw new Error('API 호출 실패');
              }

              const result = await response.json();
              return { data: result.data || [], error: result.error };
            } else {
              // 서버에서는 직접 쿼리
              const result = await query(sql, params);
              return { data: result.rows, error: null };
            }
          } catch (error) {
            return { data: null, error };
          }
        };

        const builder = {
          eq: (column: string, value: any) => {
            whereClause += whereClause ? ` AND ${column} = ?` : ` WHERE ${column} = ?`;
            params.push(value);
            return builder;
          },
          in: (column: string, values: any[]) => {
            if (!values || values.length === 0) {
              // 빈 배열인 경우 항상 false 조건 추가
              whereClause += whereClause ? ` AND 1=0` : ` WHERE 1=0`;
            } else {
              const placeholders = values.map(() => '?').join(',');
              whereClause += whereClause ? ` AND ${column} IN (${placeholders})` : ` WHERE ${column} IN (${placeholders})`;
              params.push(...values);
            }
            return builder;
          },
          not: (column: string, operator: string, value: any) => {
            if (operator === 'is' && value === null) {
              whereClause += whereClause ? ` AND ${column} IS NOT NULL` : ` WHERE ${column} IS NOT NULL`;
            } else {
              whereClause += whereClause ? ` AND ${column} != ?` : ` WHERE ${column} != ?`;
              params.push(value);
            }
            return builder;
          },
          gte: (column: string, value: any) => {
            whereClause += whereClause ? ` AND ${column} >= ?` : ` WHERE ${column} >= ?`;
            params.push(value);
            return builder;
          },
          lte: (column: string, value: any) => {
            whereClause += whereClause ? ` AND ${column} <= ?` : ` WHERE ${column} <= ?`;
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

              if (typeof window !== 'undefined') {
                // 클라이언트에서는 API 호출
                const response = await fetch('/api/internal/query', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sql, params }),
                });

                if (!response.ok) {
                  throw new Error('API 호출 실패');
                }

                const result = await response.json();
                return { data: result.data?.[0] || null, error: result.error };
              } else {
                // 서버에서는 직접 쿼리
                const result = await queryOne(sql, params);
                return { data: result, error: null };
              }
            } catch (error) {
              return { data: null, error };
            }
          },
          count: async (): Promise<{ count?: number; data?: number; error?: any }> => {
            try {
              const sql = `SELECT COUNT(*) as count FROM ${table}${whereClause}`;

              if (typeof window !== 'undefined') {
                // 클라이언트에서는 API 호출
                const response = await fetch('/api/internal/query', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sql, params }),
                });

                if (!response.ok) {
                  throw new Error('API 호출 실패');
                }

                const result = await response.json();
                const countValue = result.data?.[0]?.count || 0;
                return { count: countValue, data: countValue, error: result.error };
              } else {
                // 서버에서는 직접 쿼리
                const result = await queryOne(sql, params);
                const countValue = result?.count || 0;
                return { count: countValue, data: countValue, error: null };
              }
            } catch (error) {
              return { count: null, data: null, error };
            }
          },
          then: <TResult1 = { data: any[] | null; error: any }, TResult2 = never>(
            onfulfilled?: ((value: { data: any[] | null; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
            onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
          ): Promise<TResult1 | TResult2> => {
            return executeQuery().then(onfulfilled, onrejected);
          }
        };

        return builder;
      },

      insert: (data: any) => {
        const executeInsert = async () => {
          try {
            const columns = Object.keys(data).join(', ');
            const values = Object.values(data);
            const placeholders = values.map(() => '?').join(', ');

            const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;

            if (typeof window !== 'undefined') {
              // 클라이언트에서는 API 호출
              const response = await fetch('/api/internal/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql, params: values }),
              });

              if (!response.ok) {
                throw new Error('API 호출 실패');
              }

              const result = await response.json();
              return { data: result.data?.[0] || null, error: result.error };
            } else {
              // 서버에서는 직접 쿼리
              const result = await queryOne(sql, values);
              return { data: result, error: null };
            }
          } catch (error) {
            return { data: null, error };
          }
        };

        return {
          then: <TResult1 = { data: any | null; error: any }, TResult2 = never>(
            onfulfilled?: ((value: { data: any | null; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
            onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
          ): Promise<TResult1 | TResult2> => {
            return executeInsert().then(onfulfilled, onrejected);
          }
        };
      },

      update: (data: any) => ({
        eq: (column: string, value: any) => {
          const executeUpdate = async () => {
            try {
              const setClause = Object.keys(data)
                .map(key => `${key} = ?`)
                .join(', ');
              const values = [...Object.values(data), value];

              const sql = `UPDATE ${table} SET ${setClause} WHERE ${column} = ? RETURNING *`;

              if (typeof window !== 'undefined') {
                // 클라이언트에서는 API 호출
                const response = await fetch('/api/internal/query', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sql, params: values }),
                });

                if (!response.ok) {
                  throw new Error('API 호출 실패');
                }

                const result = await response.json();
                return { data: result.data?.[0] || null, error: result.error };
              } else {
                // 서버에서는 직접 쿼리
                const result = await queryOne(sql, values);
                return { data: result, error: null };
              }
            } catch (error) {
              return { data: null, error };
            }
          };

          return {
            then: <TResult1 = { data: any | null; error: any }, TResult2 = never>(
              onfulfilled?: ((value: { data: any | null; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
              onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
            ): Promise<TResult1 | TResult2> => {
              return executeUpdate().then(onfulfilled, onrejected);
            }
          };
        }
      }),

      delete: () => ({
        eq: (column: string, value: any) => {
          const executeDelete = async () => {
            try {
              const sql = `DELETE FROM ${table} WHERE ${column} = ? RETURNING *`;

              if (typeof window !== 'undefined') {
                // 클라이언트에서는 API 호출
                const response = await fetch('/api/internal/query', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sql, params: [value] }),
                });

                if (!response.ok) {
                  throw new Error('API 호출 실패');
                }

                const result = await response.json();
                return { data: result.data?.[0] || null, error: result.error };
              } else {
                // 서버에서는 직접 쿼리
                const result = await queryOne(sql, [value]);
                return { data: result, error: null };
              }
            } catch (error) {
              return { data: null, error };
            }
          };

          return {
            then: <TResult1 = { data: any | null; error: any }, TResult2 = never>(
              onfulfilled?: ((value: { data: any | null; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
              onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
            ): Promise<TResult1 | TResult2> => {
              return executeDelete().then(onfulfilled, onrejected);
            }
          };
        }
      })
    }),

    // Realtime 기능 (stub - 실제로는 WebSocket이나 Server-Sent Events 구현 필요)
    channel: (channelName: string) => ({
      on: (event: string, callback: Function) => {
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

// 관리자 클라이언트 (권한 관계없이 모든 데이터 접근 가능)
export function createAdminClient() {
  return createClient();
}

// 기본 export
export default {
  createClient,
  createAdminClient,
  query,
  queryOne,
  execute,
  transaction
};