import { createD1Client, d1, type D1Client } from '../client';

export interface BannedWord {
  id: string;
  word: string;
  severity: 'low' | 'medium' | 'high';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class BannedWordsRepository {
  private db: D1Client | null;
  
  constructor() {
    this.db = createD1Client();
  }
  
  async findById(id: string): Promise<BannedWord | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM banned_words WHERE id = ?')
      .bind(id)
      .first<BannedWord>();
    
    return result;
  }
  
  async findByWord(word: string): Promise<BannedWord | null> {
    if (!this.db) return null;
    
    const result = await this.db
      .prepare('SELECT * FROM banned_words WHERE word = ? AND is_active = ?')
      .bind(word, true)
      .first<BannedWord>();
    
    return result;
  }
  
  async findBySeverity(severity: string): Promise<BannedWord[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM banned_words WHERE severity = ? AND is_active = ? ORDER BY word')
      .bind(severity, true)
      .all<BannedWord>();
    
    return result.results || [];
  }
  
  async findActive(): Promise<BannedWord[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM banned_words WHERE is_active = ? ORDER BY severity, word')
      .bind(true)
      .all<BannedWord>();
    
    return result.results || [];
  }
  
  async list(): Promise<BannedWord[]> {
    if (!this.db) return [];
    
    const result = await this.db
      .prepare('SELECT * FROM banned_words ORDER BY severity, word')
      .all<BannedWord>();
    
    return result.results || [];
  }
  
  async checkWord(text: string): Promise<BannedWord[]> {
    if (!this.db) return [];
    
    const words = this.findActive();
    const foundWords: BannedWord[] = [];
    
    const activeWords = await words;
    for (const bannedWord of activeWords) {
      if (text.toLowerCase().includes(bannedWord.word.toLowerCase())) {
        foundWords.push(bannedWord);
      }
    }
    
    return foundWords;
  }
  
  async create(bannedWord: Partial<BannedWord>): Promise<BannedWord | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.insert('banned_words', {
      ...bannedWord,
      id: bannedWord.id || crypto.randomUUID(),
      is_active: bannedWord.is_active ?? true,
      severity: bannedWord.severity || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    if (result.success && result.meta.last_row_id) {
      return this.findById(bannedWord.id || '');
    }
    
    return null;
  }
  
  async update(id: string, updates: Partial<BannedWord>): Promise<BannedWord | null> {
    if (!this.db) return null;
    
    const { query, values } = d1.update('banned_words', 
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
    
    const { query, values } = d1.delete('banned_words', { id });
    
    const result = await this.db
      .prepare(query)
      .bind(...values)
      .run();
    
    return result.success && (result.meta.changes || 0) > 0;
  }
}