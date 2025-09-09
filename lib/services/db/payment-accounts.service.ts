import { paymentAccounts, type PaymentAccount, type NewPaymentAccount } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'

export class PaymentAccountsService {
  private _db: any

  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  /**
   * 모든 결제 계좌 조회
   */
  async findAll(): Promise<PaymentAccount[]> {
    try {
      return await this.db
        .select()
        .from(paymentAccounts)
        .orderBy(desc(paymentAccounts.isPrimary), desc(paymentAccounts.createdAt))
    } catch (error) {
      console.error('PaymentAccountsService.findAll error:', error)
      return []
    }
  }

  /**
   * ID로 계좌 조회
   */
  async findById(id: string): Promise<PaymentAccount | null> {
    try {
      const [account] = await this.db
        .select()
        .from(paymentAccounts)
        .where(eq(paymentAccounts.id, id))
        .limit(1)

      return account || null
    } catch (error) {
      console.error('PaymentAccountsService.findById error:', error)
      return null
    }
  }

  /**
   * 계좌 생성
   */
  async create(data: NewPaymentAccount): Promise<PaymentAccount | null> {
    try {
      // 기본 계좌로 설정하는 경우, 기존 기본 계좌 해제
      if (data.isPrimary) {
        await this.db
          .update(paymentAccounts)
          .set({ isPrimary: false })
          .where(eq(paymentAccounts.isPrimary, true))
      }

      const [account] = await this.db
        .insert(paymentAccounts)
        .values(data)
        .returning()

      return account || null
    } catch (error) {
      console.error('PaymentAccountsService.create error:', error)
      return null
    }
  }

  /**
   * 계좌 수정
   */
  async update(id: string, data: Partial<PaymentAccount>): Promise<PaymentAccount | null> {
    try {
      // 기본 계좌로 설정하는 경우, 기존 기본 계좌 해제
      if (data.isPrimary) {
        await this.db
          .update(paymentAccounts)
          .set({ isPrimary: false })
          .where(eq(paymentAccounts.isPrimary, true))
      }

      const [account] = await this.db
        .update(paymentAccounts)
        .set(data)
        .where(eq(paymentAccounts.id, id))
        .returning()

      return account || null
    } catch (error) {
      console.error('PaymentAccountsService.update error:', error)
      return null
    }
  }

  /**
   * 계좌 삭제
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.db
        .delete(paymentAccounts)
        .where(eq(paymentAccounts.id, id))

      return true
    } catch (error) {
      console.error('PaymentAccountsService.delete error:', error)
      return false
    }
  }

  /**
   * 기본 계좌 설정
   */
  async setPrimary(id: string): Promise<PaymentAccount | null> {
    try {
      // 기존 기본 계좌 해제
      await this.db
        .update(paymentAccounts)
        .set({ isPrimary: false })
        .where(eq(paymentAccounts.isPrimary, true))

      // 새 기본 계좌 설정
      const [account] = await this.db
        .update(paymentAccounts)
        .set({ isPrimary: true })
        .where(eq(paymentAccounts.id, id))
        .returning()

      return account || null
    } catch (error) {
      console.error('PaymentAccountsService.setPrimary error:', error)
      return null
    }
  }

  /**
   * 계좌 활성화/비활성화
   */
  async toggleActive(id: string): Promise<PaymentAccount | null> {
    try {
      // 현재 계좌 정보 조회
      const currentAccount = await this.findById(id)
      if (!currentAccount) {
        return null
      }

      // 활성 상태 토글
      const [account] = await this.db
        .update(paymentAccounts)
        .set({ isActive: !currentAccount.isActive })
        .where(eq(paymentAccounts.id, id))
        .returning()

      return account || null
    } catch (error) {
      console.error('PaymentAccountsService.toggleActive error:', error)
      return null
    }
  }
}