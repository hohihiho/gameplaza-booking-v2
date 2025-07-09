import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      email?: string
      name?: string | null
      image?: string | null
      nickname?: string
      phone?: string
      isAdmin?: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    email?: string
    name?: string
    picture?: string
    isAdmin?: boolean
  }
}