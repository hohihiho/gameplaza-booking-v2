'use client'

import { createAuthClient } from "better-auth/react"

export const { signIn, signOut, signUp, useSession, getSession, user, organization } = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  fetchOptions: {
    onError: (e) => {
      if (e.error.status === 401) {
        console.log('Unauthorized request, redirecting to login')
        window.location.href = '/login'
      }
    }
  }
})