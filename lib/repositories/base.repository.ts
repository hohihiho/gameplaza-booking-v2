// D1 Database repository base class

export abstract class BaseRepository<T> {
  protected db: D1Database
  protected tableName: string

  constructor(db: D1Database, tableName: string) {
    this.db = db
    this.tableName = tableName
  }

  async findById(id: string): Promise<T | null> {
    try {
      const result = await this.db
        .prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`)
        .bind(id)
        .first()

      return result as T | null
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error)
      return null
    }
  }

  async findAll(): Promise<T[]> {
    try {
      const result = await this.db
        .prepare(`SELECT * FROM ${this.tableName}`)
        .all()

      return result.results as T[]
    } catch (error) {
      console.error(`Error fetching all ${this.tableName}:`, error)
      return []
    }
  }

  async create(entity: Partial<T>): Promise<T | null> {
    try {
      // 현재 시간을 추가 (created_at, updated_at)
      const now = new Date().toISOString()
      const entityWithTimestamps = {
        ...entity,
        created_at: now,
        updated_at: now,
      }

      const columns = Object.keys(entityWithTimestamps)
      const placeholders = columns.map(() => '?').join(', ')
      const values = Object.values(entityWithTimestamps)

      await this.db
        .prepare(`
          INSERT INTO ${this.tableName} (${columns.join(', ')})
          VALUES (${placeholders})
        `)
        .bind(...values)
        .run()

      // 생성된 엔티티 반환
      const id = (entity as any).id
      const created = await this.findById(id)
      
      if (!created) {
        throw new Error(`Failed to create ${this.tableName}`)
      }

      return created
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      throw error
    }
  }

  async update(id: string, entity: Partial<T>): Promise<T | null> {
    try {
      // updated_at 추가
      const entityWithTimestamp = {
        ...entity,
        updated_at: new Date().toISOString(),
      }

      const columns = Object.keys(entityWithTimestamp)
      const setClause = columns.map(col => `${col} = ?`).join(', ')
      const values = Object.values(entityWithTimestamp)

      await this.db
        .prepare(`
          UPDATE ${this.tableName} 
          SET ${setClause}
          WHERE id = ?
        `)
        .bind(...values, id)
        .run()

      return await this.findById(id)
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.db
        .prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
        .bind(id)
        .run()

      return true
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      return false
    }
  }
}