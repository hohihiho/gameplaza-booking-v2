import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      nickname?: string;
      phone?: string;
      image?: string | null;
      role?: 'user' | 'admin';
      isAdmin: boolean;
      isSuperAdmin?: boolean;
    }
  }

  interface User extends DefaultUser {
    id: string;
    email?: string | null;
    name?: string | null;
    nickname?: string;
    phone?: string;
    role?: 'user' | 'admin';
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    nickname?: string;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
    sub?: string;
  }
}