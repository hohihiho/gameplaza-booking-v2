import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await getServerSession()
  
  if (!session?.user) {
    redirect('/login')
  }
  
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  
  if (!session.user.isAdmin) {
    redirect('/')
  }
  
  return session
}