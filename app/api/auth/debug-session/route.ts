import { NextRequest } from 'next/server';
import { auth } from '@/auth';

import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const session = await auth();
  const token = await getToken({ req: request });
  
  return Response.json({
    session,
    token,
    cookies: request.cookies.getAll(),
  });
}