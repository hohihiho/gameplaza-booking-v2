import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./migrations", 
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    databaseId: process.env.NODE_ENV === 'production' 
      ? "1d59afcb-f4c2-4d1c-9532-a63bd124bf97" // gameplaza-production
      : "d8bb6ff7-b731-4d5a-b22f-4b3e41c9ed8e", // gameplaza-development
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    token: process.env.CLOUDFLARE_API_TOKEN || "",
  },
})