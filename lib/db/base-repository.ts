// 기본 Repository 패턴 구현
import { DatabaseResult, QueryOptions, Repository } from './types';
import { query, queryOne } from './connection';

/**
 * 기본 Repository 클래스
 * 모든 데이터베이스 엔티티에 대한 공통 CRUD 작업 제공
 */
export abstract class BaseRepository<T, CreateInput = Partial<T>, UpdateInput = Partial<T>>
  implements Repository<T, CreateInput, UpdateInput> {

  protected abstract tableName: string;
  protected abstract primaryKey: string;

  /**
   * ID로 단일 엔티티 조회
   */
  async findById(id: string): Promise<DatabaseResult<T>> {
    const text = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
    return await queryOne<T>(text, [id]);
  }

  /**
   * 조건에 맞는 여러 엔티티 조회
   */
  async findMany(options?: QueryOptions): Promise<DatabaseResult<T[]>> {
    let text = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    // ORDER BY 추가
    if (options?.orderBy) {
      const direction = options.orderBy.ascending ? 'ASC' : 'DESC';
      text += ` ORDER BY ${options.orderBy.column} ${direction}`;
    }

    // LIMIT 추가
    if (options?.limit) {
      text += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    // OFFSET 추가
    if (options?.offset) {
      text += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    return await query<T[]>(text, params);
  }

  /**
   * 새 엔티티 생성
   */
  async create(data: CreateInput): Promise<DatabaseResult<T>> {
    const columns = Object.keys(data as object).join(', ');
    const values = Object.values(data as object);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const text = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    return await queryOne<T>(text, values);
  }

  /**
   * 엔티티 업데이트
   */
  async update(id: string, data: UpdateInput): Promise<DatabaseResult<T>> {
    const entries = Object.entries(data as object);
    const setClause = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
    const values = entries.map(([, value]) => value);

    const text = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE ${this.primaryKey} = $${values.length + 1}
      RETURNING *
    `;

    return await queryOne<T>(text, [...values, id]);
  }

  /**
   * 엔티티 삭제
   */
  async delete(id: string): Promise<DatabaseResult<T>> {
    const text = `
      DELETE FROM ${this.tableName}
      WHERE ${this.primaryKey} = $1
      RETURNING *
    `;

    return await queryOne<T>(text, [id]);
  }

  /**
   * 조건에 맞는 엔티티 개수 조회
   */
  async count(whereClause?: string, params?: any[]): Promise<DatabaseResult<number>> {
    let text = `SELECT COUNT(*) as count FROM ${this.tableName}`;

    if (whereClause) {
      text += ` WHERE ${whereClause}`;
    }

    const result = await queryOne<{ count: string }>(text, params);

    return {
      data: result.data ? parseInt(result.data.count) : 0,
      error: result.error
    };
  }

  /**
   * 특정 컬럼값으로 엔티티 조회
   */
  async findBy(column: string, value: any): Promise<DatabaseResult<T[]>> {
    const text = `SELECT * FROM ${this.tableName} WHERE ${column} = $1`;
    return await query<T[]>(text, [value]);
  }

  /**
   * 특정 컬럼값으로 단일 엔티티 조회
   */
  async findOneBy(column: string, value: any): Promise<DatabaseResult<T>> {
    const text = `SELECT * FROM ${this.tableName} WHERE ${column} = $1 LIMIT 1`;
    return await queryOne<T>(text, [value]);
  }

  /**
   * 엔티티 존재 여부 확인
   */
  async exists(column: string, value: any): Promise<DatabaseResult<boolean>> {
    const text = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE ${column} = $1) as exists`;
    const result = await queryOne<{ exists: boolean }>(text, [value]);

    return {
      data: result.data?.exists || false,
      error: result.error
    };
  }
}