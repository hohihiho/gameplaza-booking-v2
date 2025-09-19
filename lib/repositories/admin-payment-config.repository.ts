/**
 * 관리자 결제 설정 Repository
 * 계좌이체 정보 등 관리
 */

import { getDB } from '@/lib/db/server'
import { logger } from '@/lib/utils/logger'
import { v4 as uuidv4 } from 'uuid'

export interface AdminPaymentConfig {
  id: string
  admin_id: string
  bank_name: string
  account_number: string
  account_holder: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface CreateAdminPaymentConfigData {
  admin_id: string
  bank_name: string
  account_number: string
  account_holder: string
  is_active?: boolean
}

export class AdminPaymentConfigRepository {
  private db: any

  constructor(db?: any) {
    this.db = db || getDB()
  }

  /**
   * 기본 설정 초기화
   */
  async initializeDefaultConfigs(): Promise<void> {
    try {
      // 활성화된 설정이 있는지 확인
      const stmt = this.db.prepare(
        'SELECT COUNT(*) as count FROM admin_payment_configs WHERE is_active = 1'
      )
      const result = await stmt.first()

      if (!result || result.count === 0) {
        // 기본 설정 생성
        await this.create({
          admin_id: 'system',
          bank_name: '국민은행',
          account_number: '123-456-789012',
          account_holder: '광주게임플라자',
          is_active: true
        })

        logger.info('Default admin payment config initialized')
      }
    } catch (error) {
      logger.error('Failed to initialize default configs', error)
      // 테이블이 없을 수도 있으므로 에러를 무시
    }
  }

  /**
   * 관리자 결제 설정 생성
   */
  async create(data: CreateAdminPaymentConfigData): Promise<AdminPaymentConfig> {
    try {
      const id = uuidv4()
      const config: AdminPaymentConfig = {
        id,
        admin_id: data.admin_id,
        bank_name: data.bank_name,
        account_number: data.account_number,
        account_holder: data.account_holder,
        is_active: data.is_active ?? false,
        created_at: new Date().toISOString()
      }

      // 새 설정을 활성화하면 기존 설정 비활성화
      if (config.is_active) {
        await this.deactivateAll()
      }

      const stmt = this.db.prepare(`
        INSERT INTO admin_payment_configs (
          id, admin_id, bank_name, account_number,
          account_holder, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      await stmt.bind(
        config.id,
        config.admin_id,
        config.bank_name,
        config.account_number,
        config.account_holder,
        config.is_active ? 1 : 0,
        config.created_at
      ).run()

      logger.info('Admin payment config created', { configId: config.id })

      return config
    } catch (error) {
      logger.error('Failed to create admin payment config', { data, error })
      throw error
    }
  }

  /**
   * ID로 설정 조회
   */
  async findById(id: string): Promise<AdminPaymentConfig | null> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM admin_payment_configs WHERE id = ?'
      )
      const config = await stmt.bind(id).first()

      if (config) {
        config.is_active = config.is_active === 1
      }

      return config || null
    } catch (error) {
      logger.error('Failed to find admin payment config by id', { id, error })
      return null
    }
  }

  /**
   * 관리자 ID로 설정 목록 조회
   */
  async findByAdminId(adminId: string): Promise<AdminPaymentConfig[]> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM admin_payment_configs WHERE admin_id = ? ORDER BY created_at DESC'
      )
      const result = await stmt.bind(adminId).all()

      return (result?.results || []).map((config: any) => ({
        ...config,
        is_active: config.is_active === 1
      }))
    } catch (error) {
      logger.error('Failed to find admin payment configs by admin id', {
        adminId,
        error
      })
      return []
    }
  }

  /**
   * 모든 설정 조회
   */
  async findAll(): Promise<AdminPaymentConfig[]> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM admin_payment_configs ORDER BY is_active DESC, created_at DESC'
      )
      const result = await stmt.all()

      return (result?.results || []).map((config: any) => ({
        ...config,
        is_active: config.is_active === 1
      }))
    } catch (error) {
      logger.error('Failed to find all admin payment configs', error)
      return []
    }
  }

  /**
   * 활성화된 설정 조회
   */
  async findActive(): Promise<AdminPaymentConfig | null> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM admin_payment_configs WHERE is_active = 1 LIMIT 1'
      )
      const config = await stmt.first()

      if (config) {
        config.is_active = true
      }

      return config || null
    } catch (error) {
      logger.error('Failed to find active admin payment config', error)
      return null
    }
  }

  /**
   * 모든 설정 비활성화
   */
  async deactivateAll(): Promise<void> {
    try {
      const stmt = this.db.prepare(
        'UPDATE admin_payment_configs SET is_active = 0, updated_at = datetime("now")'
      )
      await stmt.run()

      logger.info('All admin payment configs deactivated')
    } catch (error) {
      logger.error('Failed to deactivate all admin payment configs', error)
      throw error
    }
  }

  /**
   * 설정 활성화
   */
  async activate(id: string): Promise<AdminPaymentConfig | null> {
    try {
      // 먼저 모든 설정 비활성화
      await this.deactivateAll()

      // 선택한 설정 활성화
      const stmt = this.db.prepare(`
        UPDATE admin_payment_configs
        SET is_active = 1, updated_at = datetime("now")
        WHERE id = ?
      `)
      await stmt.bind(id).run()

      logger.info('Admin payment config activated', { configId: id })

      return await this.findById(id)
    } catch (error) {
      logger.error('Failed to activate admin payment config', { id, error })
      return null
    }
  }

  /**
   * 설정 업데이트
   */
  async update(
    id: string,
    data: Partial<CreateAdminPaymentConfigData>
  ): Promise<AdminPaymentConfig | null> {
    try {
      const updateFields: string[] = []
      const values: any[] = []

      if (data.bank_name !== undefined) {
        updateFields.push('bank_name = ?')
        values.push(data.bank_name)
      }

      if (data.account_number !== undefined) {
        updateFields.push('account_number = ?')
        values.push(data.account_number)
      }

      if (data.account_holder !== undefined) {
        updateFields.push('account_holder = ?')
        values.push(data.account_holder)
      }

      if (data.is_active !== undefined) {
        if (data.is_active) {
          await this.deactivateAll()
        }
        updateFields.push('is_active = ?')
        values.push(data.is_active ? 1 : 0)
      }

      if (updateFields.length === 0) {
        return await this.findById(id)
      }

      updateFields.push('updated_at = datetime("now")')
      values.push(id)

      const stmt = this.db.prepare(`
        UPDATE admin_payment_configs
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `)

      await stmt.bind(...values).run()

      logger.info('Admin payment config updated', { configId: id })

      return await this.findById(id)
    } catch (error) {
      logger.error('Failed to update admin payment config', { id, data, error })
      return null
    }
  }

  /**
   * 설정 삭제
   */
  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(
        'DELETE FROM admin_payment_configs WHERE id = ?'
      )
      await stmt.bind(id).run()

      logger.info('Admin payment config deleted', { configId: id })

      return true
    } catch (error) {
      logger.error('Failed to delete admin payment config', { id, error })
      return false
    }
  }
}