import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 1. NextAuth 세션 확인
    const session = await auth();
    
    // 2. JWT 토큰 확인
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // 3. 헤더 확인
    const headers = {
      'x-user-id': request.headers.get('x-user-id'),
      'x-user-email': request.headers.get('x-user-email'),
      'x-is-admin': request.headers.get('x-is-admin'),
      'x-is-superadmin': request.headers.get('x-is-superadmin'),
    };
    
    // 4. Supabase에서 직접 확인
    let dbCheck = null;
    if (session?.user?.email) {
      const supabaseAdmin = createAdminClient();
      
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('email', session.user.email)
        .single();
      
      if (userData) {
        const { data: adminData } = await supabaseAdmin
          .from('admins')
          .select('*')
          .eq('user_id', userData.id)
          .single();
        
        dbCheck = {
          user: userData,
          admin: adminData
        };
      }
    }
    
    return NextResponse.json({
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      token: token ? {
        email: token.email,
        sub: token.sub,
        isAdmin: token.isAdmin
      } : null,
      headers,
      dbCheck,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}