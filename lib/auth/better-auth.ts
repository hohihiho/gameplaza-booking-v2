import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from '@/lib/db/client'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: process.env.NODE_ENV === 'development' ? 'sqlite' : 'd1'
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day  
  },
  rateLimit: {
    window: 10,
    max: 100
  }
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.User