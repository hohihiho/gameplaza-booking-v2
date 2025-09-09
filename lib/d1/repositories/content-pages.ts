import { createD1Client, d1, type D1Client } from '../client';

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export class ContentPagesRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findBySlug(slug: string, publishedOnly = true): Promise<ContentPage | null> {
    if (!this.db) return null;
    
    let query = 'SELECT * FROM content_pages WHERE slug = ?';
    const params = [slug];
    
    if (publishedOnly) {
      query += ' AND is_published = ?';
      params.push(1); // SQLite uses 1 for true
    }
    
    query += ' ORDER BY updated_at DESC LIMIT 1';
    
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .first<ContentPage>();
    
    return result;
  }
  
  async findMultiple(slugs: string[], publishedOnly = true): Promise<ContentPage[]> {
    if (!this.db) return [];
    
    const placeholders = slugs.map(() => '?').join(',');
    let query = `SELECT * FROM content_pages WHERE slug IN (${placeholders})`;
    const params = [...slugs];
    
    if (publishedOnly) {
      query += ' AND is_published = ?';
      params.push(1); // SQLite uses 1 for true
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<ContentPage>();
    
    return result.results || [];
  }
  
  async findAll(publishedOnly = true): Promise<ContentPage[]> {
    if (!this.db) return [];
    
    let query = 'SELECT * FROM content_pages';
    const params = [];
    
    if (publishedOnly) {
      query += ' WHERE is_published = ?';
      params.push(1); // SQLite uses 1 for true
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<ContentPage>();
    
    return result.results || [];
  }
  
  async create(page: Partial<ContentPage>): Promise<ContentPage | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('content_pages', {
      ...page,
      id: page.id || crypto.randomUUID(),
      is_published: page.is_published !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && page.slug) {
      return this.findBySlug(page.slug, false);
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<ContentPage>): Promise<ContentPage | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('content_pages', 
      { ...updates, updated_at: new Date().toISOString() },
      { id }
    );
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success) {
      // Find the updated page by id
      const updatedPage = await this.db
        .prepare('SELECT * FROM content_pages WHERE id = ?')
        .bind(id)
        .first<ContentPage>();
      
      return updatedPage;
    }
    
    return null;
  }
  
  async delete(id: string): Promise<boolean> {
    if (!this.db) return false;
    
    const { query, values } = d1.delete('content_pages', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}