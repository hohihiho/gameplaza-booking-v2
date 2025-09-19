// Cloudflare D1 실제 클라이언트 구현
// Supabase API와 호환되는 인터페이스 제공

import { getD1Database, executeSQL, type Env } from './cloudflare-d1';

// Supabase 호환 쿼리 빌더
class D1QueryBuilder {
  private table: string;
  private selectColumns: string = '*';
  private whereConditions: Array<{ column: string; operator: string; value: any }> = [];
  private orderByColumns: Array<{ column: string; direction: string }> = [];
  private limitCount?: number;
  private offsetCount?: number;
  private env?: Env;

  constructor(table: string, env?: Env) {
    this.table = table;
    this.env = env;
  }

  select(columns?: string) {
    this.selectColumns = columns || '*';
    return this;
  }

  eq(column: string, value: any) {
    this.whereConditions.push({ column, operator: '=', value });
    return this;
  }

  neq(column: string, value: any) {
    this.whereConditions.push({ column, operator: '!=', value });
    return this;
  }

  gt(column: string, value: any) {
    this.whereConditions.push({ column, operator: '>', value });
    return this;
  }

  gte(column: string, value: any) {
    this.whereConditions.push({ column, operator: '>=', value });
    return this;
  }

  lt(column: string, value: any) {
    this.whereConditions.push({ column, operator: '<', value });
    return this;
  }

  lte(column: string, value: any) {
    this.whereConditions.push({ column, operator: '<=', value });
    return this;
  }

  in(column: string, values: any[]) {
    const placeholders = values.map(() => '?').join(',');
    this.whereConditions.push({
      column,
      operator: 'IN',
      value: `(${placeholders})`
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending === false ? 'DESC' : 'ASC';
    this.orderByColumns.push({ column, direction });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  offset(count: number) {
    this.offsetCount = count;
    return this;
  }

  async single() {
    const result = await this.execute();
    if (result.error) return result;

    return {
      data: result.data?.[0] || null,
      error: null
    };
  }

  async execute() {
    if (!this.env) {
      // 개발 환경에서는 더미 응답
      if (process.env.NODE_ENV === 'development') {
        return {
          data: [],
          error: null
        };
      }

      return {
        data: null,
        error: { message: 'D1 환경이 설정되지 않았습니다' }
      };
    }

    try {
      // SQL 쿼리 생성
      let sql = `SELECT ${this.selectColumns} FROM ${this.table}`;
      const params: any[] = [];

      // WHERE 절 추가
      if (this.whereConditions.length > 0) {
        const whereClauses = this.whereConditions.map(condition => {
          if (condition.operator === 'IN') {
            return `${condition.column} ${condition.operator} ${condition.value}`;
          }
          params.push(condition.value);
          return `${condition.column} ${condition.operator} ?`;
        });
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      // ORDER BY 절 추가
      if (this.orderByColumns.length > 0) {
        const orderClauses = this.orderByColumns.map(
          order => `${order.column} ${order.direction}`
        );
        sql += ` ORDER BY ${orderClauses.join(', ')}`;
      }

      // LIMIT/OFFSET 추가
      if (this.limitCount !== undefined) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      if (this.offsetCount !== undefined) {
        sql += ` OFFSET ${this.offsetCount}`;
      }

      const result = await executeSQL(this.env, sql, params);

      return {
        data: result.results || [],
        error: null
      };
    } catch (error: any) {
      console.error('D1 Query Error:', error);
      return {
        data: null,
        error: { message: error.message || 'Query failed' }
      };
    }
  }

  // INSERT 구현
  async insert(data: any) {
    return {
      select: () => ({
        single: async () => {
          if (!this.env) {
            return { data: null, error: { message: 'D1 환경이 설정되지 않았습니다' } };
          }

          try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map(() => '?').join(',');

            const sql = `INSERT INTO ${this.table} (${columns.join(',')}) VALUES (${placeholders}) RETURNING *`;
            const result = await executeSQL(this.env, sql, values);

            return {
              data: result.results?.[0] || null,
              error: null
            };
          } catch (error: any) {
            return {
              data: null,
              error: { message: error.message }
            };
          }
        }
      }),
      returning: async () => {
        // 위와 동일한 로직
        return this.insert(data).select().single();
      }
    };
  }

  // UPDATE 구현
  update(data: any) {
    return {
      eq: (column: string, value: any) => ({
        select: () => ({
          single: async () => {
            if (!this.env) {
              return { data: null, error: { message: 'D1 환경이 설정되지 않았습니다' } };
            }

            try {
              const updates = Object.keys(data)
                .map(key => `${key} = ?`)
                .join(',');
              const values = [...Object.values(data), value];

              const sql = `UPDATE ${this.table} SET ${updates} WHERE ${column} = ? RETURNING *`;
              const result = await executeSQL(this.env, sql, values);

              return {
                data: result.results?.[0] || null,
                error: null
              };
            } catch (error: any) {
              return {
                data: null,
                error: { message: error.message }
              };
            }
          }
        }),
        execute: async () => {
          if (!this.env) {
            return { data: null, error: { message: 'D1 환경이 설정되지 않았습니다' } };
          }

          try {
            const updates = Object.keys(data)
              .map(key => `${key} = ?`)
              .join(',');
            const values = [...Object.values(data), value];

            const sql = `UPDATE ${this.table} SET ${updates} WHERE ${column} = ?`;
            await executeSQL(this.env, sql, values);

            return {
              data: null,
              error: null
            };
          } catch (error: any) {
            return {
              data: null,
              error: { message: error.message }
            };
          }
        }
      })
    };
  }

  // DELETE 구현
  delete() {
    return {
      eq: async (column: string, value: any) => {
        if (!this.env) {
          return { error: { message: 'D1 환경이 설정되지 않았습니다' } };
        }

        try {
          const sql = `DELETE FROM ${this.table} WHERE ${column} = ?`;
          await executeSQL(this.env, sql, [value]);

          return { error: null };
        } catch (error: any) {
          return { error: { message: error.message } };
        }
      }
    };
  }
}

// D1 클라이언트 클래스
export class D1Client {
  private env?: Env;

  constructor(env?: Env) {
    this.env = env;
  }

  from(table: string) {
    return new D1QueryBuilder(table, this.env);
  }

  // Auth 관련 메서드 (Better Auth로 처리)
  auth = {
    getUser: () => Promise.resolve({
      data: { user: null },
      error: { message: 'Better Auth를 사용하세요' }
    })
  };

  // 실시간 채널 (필요시 WebSocket으로 구현)
  channel(name: string) {
    return {
      on: (_event: string, _config: any, _callback: (payload: any) => void) => ({
        subscribe: () => ({
          unsubscribe: () => {}
        })
      })
    };
  }

  removeChannel(_channel: any) {
    // 채널 제거 로직
  }

  // RPC 호출 (SQL 함수 호출)
  async rpc(functionName: string, params?: any) {
    if (!this.env) {
      return { data: null, error: { message: 'D1 환경이 설정되지 않았습니다' } };
    }

    try {
      // D1에서는 직접 SQL 함수를 호출할 수 없으므로,
      // 필요한 경우 별도 구현 필요
      console.warn(`RPC 호출 ${functionName}은 아직 구현되지 않았습니다`);
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }
}

// 싱글톤 인스턴스 (개발 환경)
let d1ClientInstance: D1Client | null = null;

// D1 클라이언트 가져오기
export function getD1Client(env?: Env): D1Client {
  if (!d1ClientInstance || env) {
    d1ClientInstance = new D1Client(env);
  }
  return d1ClientInstance;
}

// Supabase 호환 export
export const supabase = getD1Client();
export const supabaseAdmin = getD1Client();