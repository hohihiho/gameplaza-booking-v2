// 유연한 쿼리 빌더 구현
import { DatabaseResult, QueryBuilder } from './types';
import { query, queryOne } from './connection';

/**
 * SQL 쿼리 빌더 클래스
 * 복잡한 쿼리를 체이닝 방식으로 구성
 */
export class SQLQueryBuilder<T> implements QueryBuilder<T> {
  private selectClause: string = '*';
  private tableName: string;
  private whereConditions: string[] = [];
  private orderByClause: string = '';
  private limitClause: string = '';
  private offsetClause: string = '';
  private joinClauses: string[] = [];
  private params: any[] = [];
  private paramIndex: number = 1;

  constructor(table: string) {
    this.tableName = table;
  }

  /**
   * SELECT 절 설정
   */
  select(columns: string = '*'): QueryBuilder<T> {
    this.selectClause = columns;
    return this;
  }

  /**
   * WHERE 조건 추가
   */
  where(column: string, operator: string, value: any): QueryBuilder<T> {
    const condition = `${column} ${operator} $${this.paramIndex}`;
    this.whereConditions.push(condition);
    this.params.push(value);
    this.paramIndex++;
    return this;
  }

  /**
   * WHERE IN 조건 추가
   */
  whereIn(column: string, values: any[]): QueryBuilder<T> {
    const placeholders = values.map(() => `$${this.paramIndex++}`).join(', ');
    const condition = `${column} IN (${placeholders})`;
    this.whereConditions.push(condition);
    this.params.push(...values);
    return this;
  }

  /**
   * WHERE LIKE 조건 추가
   */
  whereLike(column: string, pattern: string): QueryBuilder<T> {
    const condition = `${column} ILIKE $${this.paramIndex}`;
    this.whereConditions.push(condition);
    this.params.push(`%${pattern}%`);
    this.paramIndex++;
    return this;
  }

  /**
   * ORDER BY 절 추가
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder<T> {
    if (this.orderByClause) {
      this.orderByClause += `, ${column} ${direction}`;
    } else {
      this.orderByClause = `ORDER BY ${column} ${direction}`;
    }
    return this;
  }

  /**
   * LIMIT 절 추가
   */
  limit(count: number): QueryBuilder<T> {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  /**
   * OFFSET 절 추가
   */
  offset(count: number): QueryBuilder<T> {
    this.offsetClause = `OFFSET ${count}`;
    return this;
  }

  /**
   * JOIN 절 추가
   */
  join(table: string, condition: string): QueryBuilder<T> {
    this.joinClauses.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  /**
   * LEFT JOIN 절 추가
   */
  leftJoin(table: string, condition: string): QueryBuilder<T> {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  /**
   * 쿼리 빌드 및 실행 (여러 행)
   */
  async execute(): Promise<DatabaseResult<T[]>> {
    const sqlQuery = this.buildQuery();
    console.log('🔍 [QueryBuilder] Executing:', sqlQuery, this.params);
    return await query<T[]>(sqlQuery, this.params);
  }

  /**
   * 쿼리 빌드 및 실행 (단일 행)
   */
  async first(): Promise<DatabaseResult<T>> {
    this.limit(1);
    const sqlQuery = this.buildQuery();
    console.log('🔍 [QueryBuilder] Executing (first):', sqlQuery, this.params);
    return await queryOne<T>(sqlQuery, this.params);
  }

  /**
   * COUNT 쿼리 실행
   */
  async count(): Promise<DatabaseResult<number>> {
    const originalSelect = this.selectClause;
    this.selectClause = 'COUNT(*) as count';

    const sqlQuery = this.buildQuery();
    const result = await queryOne<{ count: string }>(sqlQuery, this.params);

    // 원래 SELECT 절 복원
    this.selectClause = originalSelect;

    return {
      data: result.data ? parseInt(result.data.count) : 0,
      error: result.error
    };
  }

  /**
   * SQL 쿼리 문자열 빌드
   */
  private buildQuery(): string {
    let sql = `SELECT ${this.selectClause} FROM ${this.tableName}`;

    // JOIN 절 추가
    if (this.joinClauses.length > 0) {
      sql += ` ${this.joinClauses.join(' ')}`;
    }

    // WHERE 절 추가
    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    // ORDER BY 절 추가
    if (this.orderByClause) {
      sql += ` ${this.orderByClause}`;
    }

    // LIMIT 절 추가
    if (this.limitClause) {
      sql += ` ${this.limitClause}`;
    }

    // OFFSET 절 추가
    if (this.offsetClause) {
      sql += ` ${this.offsetClause}`;
    }

    return sql;
  }

  /**
   * 현재 빌더 상태를 초기화
   */
  reset(): QueryBuilder<T> {
    this.selectClause = '*';
    this.whereConditions = [];
    this.orderByClause = '';
    this.limitClause = '';
    this.offsetClause = '';
    this.joinClauses = [];
    this.params = [];
    this.paramIndex = 1;
    return this;
  }
}

/**
 * 쿼리 빌더 팩토리 함수
 */
export function from<T>(tableName: string): QueryBuilder<T> {
  return new SQLQueryBuilder<T>(tableName);
}