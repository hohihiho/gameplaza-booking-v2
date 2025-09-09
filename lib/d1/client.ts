// Cloudflare D1 Database Client
// D1은 SQLite 기반 Edge Database로 Cloudflare Workers 환경에서 실행됩니다

export interface D1Client {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  exec(query: string): Promise<D1ExecResult>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(columnName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    last_row_id?: number;
    changes?: number;
    served_by?: string;
    internal_stats?: any;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// D1 클라이언트 생성 함수
// Cloudflare Workers 환경에서는 env.DB로 접근
// 개발 환경에서는 모킹된 클라이언트 사용
export function createD1Client(): D1Client | null {
  // Workers 환경에서는 전역 env 객체에서 D1 바인딩 가져오기
  if (typeof globalThis !== 'undefined' && (globalThis as any).env?.DB) {
    return (globalThis as any).env.DB;
  }
  
  // 개발 환경에서는 null 반환 (Better Auth의 메모리 DB 사용)
  return null;
}

// D1 쿼리 빌더 헬퍼 함수들
export const d1 = {
  // SELECT 쿼리 빌더
  select: (table: string, columns: string[] = ['*']) => {
    return `SELECT ${columns.join(', ')} FROM ${table}`;
  },
  
  // INSERT 쿼리 빌더
  insert: (table: string, data: Record<string, any>) => {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    
    return {
      query: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    };
  },
  
  // UPDATE 쿼리 빌더
  update: (table: string, data: Record<string, any>, where: Record<string, any>) => {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const values = [...Object.values(data), ...Object.values(where)];
    
    return {
      query: `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`,
      values
    };
  },
  
  // DELETE 쿼리 빌더
  delete: (table: string, where: Record<string, any>) => {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(where);
    
    return {
      query: `DELETE FROM ${table} WHERE ${whereClause}`,
      values
    };
  }
};