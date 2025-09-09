import { createD1Client, d1, type D1Client } from '../client';

export interface PaymentAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export class PaymentAccountsRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<PaymentAccount | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM payment_accounts WHERE id = ?')
      .bind(id)
      .first<PaymentAccount>();
    
    return result;
  }
  
  async findPrimary(): Promise<PaymentAccount | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM payment_accounts WHERE is_primary = ? AND is_active = ?')
      .bind(true, true)
      .first<PaymentAccount>();
    
    return result;
  }
  
  async findActive(): Promise<PaymentAccount[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM payment_accounts WHERE is_active = ? ORDER BY is_primary DESC, account_name')
      .bind(true)
      .all<PaymentAccount>();
    
    return result.results || [];
  }
  
  async list(): Promise<PaymentAccount[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM payment_accounts ORDER BY is_primary DESC, account_name')
      .all<PaymentAccount>();
    
    return result.results || [];
  }
  
  async create(account: Partial<PaymentAccount>): Promise<PaymentAccount | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('payment_accounts', {
      ...account,
      id: account.id || crypto.randomUUID(),
      is_active: account.is_active ?? true,
      is_primary: account.is_primary ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(account.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<PaymentAccount>): Promise<PaymentAccount | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('payment_accounts', 
      { ...updates, updated_at: new Date().toISOString() },
      { id }
    );
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success) {
      return this.findById(id);
    }
    
    return null;
  }
  
  async delete(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    const { query, values } = d1.delete('payment_accounts', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
  
  async setPrimary(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    // First, unset all other primary accounts
    await this.db
      .prepare('UPDATE payment_accounts SET is_primary = ?, updated_at = ? WHERE is_primary = ?')
      .bind(false, new Date().toISOString(), true)
      .run();
    
    // Then set the specified account as primary
    const result = await this.db
      .prepare('UPDATE payment_accounts SET is_primary = ?, updated_at = ? WHERE id = ?')
      .bind(true, new Date().toISOString(), id)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}