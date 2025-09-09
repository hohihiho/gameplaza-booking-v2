// D1 Base Repository
export abstract class D1BaseRepository<T> {
  protected db: D1Database;
  protected tableName: string;

  constructor(db: D1Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  // 모든 레코드 조회
  async findAll(limit = 100, offset = 0): Promise<T[]> {
    const result = await this.db
      .prepare(`SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all<T>();
    
    return result.results;
  }

  // ID로 조회
  async findById(id: string): Promise<T | null> {
    const result = await this.db
      .prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`)
      .bind(id)
      .first<T>();
    
    return result;
  }

  // 조건으로 조회
  async findByCondition(condition: string, params: any[]): Promise<T[]> {
    const result = await this.db
      .prepare(`SELECT * FROM ${this.tableName} WHERE ${condition}`)
      .bind(...params)
      .all<T>();
    
    return result.results;
  }

  // 단일 조건으로 조회
  async findOneByCondition(condition: string, params: any[]): Promise<T | null> {
    const result = await this.db
      .prepare(`SELECT * FROM ${this.tableName} WHERE ${condition}`)
      .bind(...params)
      .first<T>();
    
    return result;
  }

  // 생성
  async create(data: Partial<T>): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const insertQuery = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.db
      .prepare(insertQuery)
      .bind(...values)
      .first<T>();
    
    if (!result) {
      throw new Error('Failed to create record');
    }
    
    return result;
  }

  // 업데이트
  async update(id: string, data: Partial<T>): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    
    const updateQuery = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
      RETURNING *
    `;
    
    const result = await this.db
      .prepare(updateQuery)
      .bind(...values, id)
      .first<T>();
    
    if (!result) {
      throw new Error('Failed to update record');
    }
    
    return result;
  }

  // 삭제
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
      .bind(id)
      .run();
    
    return result.meta.changes > 0;
  }

  // 트랜잭션 실행
  async transaction<R>(callback: (db: D1Database) => Promise<R>): Promise<R> {
    // D1은 자동으로 트랜잭션을 처리
    return callback(this.db);
  }

  // 카운트
  async count(condition?: string, params?: any[]): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    
    if (condition) {
      query += ` WHERE ${condition}`;
    }
    
    const stmt = this.db.prepare(query);
    
    if (params) {
      stmt.bind(...params);
    }
    
    const result = await stmt.first<{ count: number }>();
    return result?.count || 0;
  }

  // 존재 여부 확인
  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .prepare(`SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`)
      .bind(id)
      .first();
    
    return result !== null;
  }

  // Raw 쿼리 실행
  async raw<R>(query: string, params: any[] = []): Promise<R[]> {
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<R>();
    
    return result.results;
  }

  // Raw 쿼리 실행 (단일 결과)
  async rawFirst<R>(query: string, params: any[] = []): Promise<R | null> {
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .first<R>();
    
    return result;
  }
}