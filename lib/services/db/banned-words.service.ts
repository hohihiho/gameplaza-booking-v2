import { eq, desc, and, sql } from 'drizzle-orm'
import { createDB } from '@/lib/db/client'
import { bannedWords } from '@/lib/db/schema'

export class BannedWordsService {
  private _db: any
  
  private get db() {
    if (!this._db) {
      this._db = createDB()
    }
    return this._db
  }

  async getAll() {
    return await this.db
      .select()
      .from(bannedWords)
      .orderBy(desc(bannedWords.createdAt))
  }

  async getActive() {
    return await this.db
      .select()
      .from(bannedWords)
      .where(eq(bannedWords.isActive, 1))
      .orderBy(desc(bannedWords.createdAt))
  }

  async findById(id: string) {
    const [word] = await this.db
      .select()
      .from(bannedWords)
      .where(eq(bannedWords.id, id))
      .limit(1)
    
    return word
  }

  async findByWord(word: string) {
    const [result] = await this.db
      .select()
      .from(bannedWords)
      .where(eq(bannedWords.word, word.trim().toLowerCase()))
      .limit(1)
    
    return result
  }

  async create(data: {
    word: string
    category?: string
    language?: string
    severity?: number
    addedBy?: string
    isActive?: boolean
  }) {
    const [bannedWord] = await this.db
      .insert(bannedWords)
      .values({
        word: data.word.trim().toLowerCase(),
        category: data.category || 'custom',
        language: data.language || 'ko',
        severity: data.severity || 1,
        addedBy: data.addedBy,
        isActive: data.isActive !== false ? 1 : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning()
    
    return bannedWord
  }

  async update(id: string, data: {
    word?: string
    category?: string
    language?: string
    severity?: number
    isActive?: boolean
  }) {
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }
    
    if (data.word !== undefined) updateData.word = data.word.trim().toLowerCase()
    if (data.category !== undefined) updateData.category = data.category
    if (data.language !== undefined) updateData.language = data.language
    if (data.severity !== undefined) updateData.severity = data.severity
    if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0
    
    const [bannedWord] = await this.db
      .update(bannedWords)
      .set(updateData)
      .where(eq(bannedWords.id, id))
      .returning()
    
    return bannedWord
  }

  async toggleActive(id: string) {
    const word = await this.findById(id)
    if (!word) return null
    
    const [updated] = await this.db
      .update(bannedWords)
      .set({
        isActive: word.isActive === 1 ? 0 : 1,
        updatedAt: new Date().toISOString()
      })
      .where(eq(bannedWords.id, id))
      .returning()
    
    return updated
  }

  async delete(id: string) {
    await this.db
      .delete(bannedWords)
      .where(eq(bannedWords.id, id))
  }

  async checkText(text: string): Promise<string[]> {
    const activeWords = await this.getActive()
    const foundWords: string[] = []
    const lowerText = text.toLowerCase()
    
    for (const bannedWord of activeWords) {
      if (lowerText.includes(bannedWord.word)) {
        foundWords.push(bannedWord.word)
      }
    }
    
    return foundWords
  }
}