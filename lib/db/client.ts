// Thin client wrapper for getting a DB handle in Next.js routes.
// Uses the compatibility getDB from lib/db, which falls back to a mock
// implementation when a D1 binding is not available.

import { getDB as compatGetDB } from '@/lib/db'

export function getDB() {
  // Pass process.env; compatGetDB will return a mock DB if no D1 binding exists
  return compatGetDB(process.env)
}

export default { getDB }

