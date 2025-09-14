// Lightweight D1 access helpers for Cloudflare-only runtime

type D1Database = {
  prepare: (sql: string) => {
    bind: (...args: any[]) => any
    all: () => Promise<{ results?: any[] }>
    first: () => Promise<any>
    run: () => Promise<{ success: boolean; meta?: any }>
  }
}

export function getD1(): D1Database | null {
  const g = globalThis as any
  const bindingName = process.env.D1_BINDING_NAME || 'DB'
  if (g?.env && g.env[bindingName]) return g.env[bindingName] as D1Database
  if (g?.env?.DB) return g.env.DB as D1Database
  if (g?.DB) return g.DB as D1Database
  if (g?.__D1__) return g.__D1__ as D1Database
  return null
}

export async function d1All(db: D1Database, sql: string, ...binds: any[]) {
  const res = await db.prepare(sql).bind(...binds).all()
  return res.results ?? []
}

export async function d1First(db: D1Database, sql: string, ...binds: any[]) {
  return await db.prepare(sql).bind(...binds).first()
}

export async function d1Run(db: D1Database, sql: string, ...binds: any[]) {
  return await db.prepare(sql).bind(...binds).run()
}

