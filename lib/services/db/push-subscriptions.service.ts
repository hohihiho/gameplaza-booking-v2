import { eq, and } from 'drizzle-orm';
import { createDB } from '@/lib/db/client';
import { pushSubscriptions } from '@/lib/db/schema';

export class PushSubscriptionsService {
  private _db: any;
  
  private get db() {
    if (!this._db) {
      this._db = createDB();
    }
    return this._db;
  }

  async findByUserEmail(userEmail: string, enabledOnly = true) {
    const conditions = enabledOnly 
      ? and(eq(pushSubscriptions.user_email, userEmail), eq(pushSubscriptions.enabled, true))
      : eq(pushSubscriptions.user_email, userEmail);

    return await this.db
      .select()
      .from(pushSubscriptions)
      .where(conditions);
  }

  async findById(id: string) {
    const results = await this.db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.id, id))
      .limit(1);
    
    return results[0] || null;
  }

  async create(data: {
    user_email: string;
    endpoint: string;
    p256dh: string | null;
    auth: string | null;
    user_agent: string | null;
    enabled?: boolean;
  }) {
    const [result] = await this.db
      .insert(pushSubscriptions)
      .values({
        ...data,
        enabled: data.enabled ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning();
    
    return result;
  }

  async update(id: string, data: Partial<{
    enabled: boolean;
    p256dh: string | null;
    auth: string | null;
    user_agent: string | null;
  }>) {
    const [result] = await this.db
      .update(pushSubscriptions)
      .set({
        ...data,
        updated_at: new Date().toISOString()
      })
      .where(eq(pushSubscriptions.id, id))
      .returning();
    
    return result || null;
  }

  async disableExpiredSubscription(id: string) {
    return await this.update(id, { enabled: false });
  }

  async delete(id: string) {
    const [result] = await this.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.id, id))
      .returning();
    
    return result || null;
  }

  async findByEndpoint(userEmail: string, endpoint: string) {
    const results = await this.db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.user_email, userEmail),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      )
      .limit(1);
    
    return results[0] || null;
  }

  async upsert(data: {
    user_email: string;
    endpoint: string;
    p256dh: string | null;
    auth: string | null;
    user_agent: string | null;
    enabled?: boolean;
  }) {
    const existing = await this.findByEndpoint(data.user_email, data.endpoint);
    
    if (existing) {
      return await this.update(existing.id, {
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.user_agent,
        enabled: data.enabled ?? true
      });
    } else {
      return await this.create(data);
    }
  }
}