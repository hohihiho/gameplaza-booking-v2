import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// D1 Database instance (will be injected in runtime)
declare global {
  var DB: D1Database;
}

// Create drizzle instance
export const db = typeof globalThis.DB !== 'undefined'
  ? drizzle(globalThis.DB, { schema })
  : null as any;

// Helper function to get DB instance
export function getDB() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export default db;