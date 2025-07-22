import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      nickname?: string;
      phone?: string;
      image?: string | null;
      role: 'user' | 'admin';
      isAdmin: boolean;
      isSuperAdmin?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    nickname?: string;
    phone?: string;
    image?: string | null;
    role: 'user' | 'admin';
    isAdmin: boolean;
    isSuperAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
  }
}