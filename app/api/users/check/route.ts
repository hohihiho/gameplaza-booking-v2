import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET() {
  try {
    // NextAuth 세션 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        user: null 
      }, { status: 401 });
    }

    // Supabase admin client로 사용자 찾기 (RLS 우회)
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('User lookup error:', error);
      return NextResponse.json({ 
        error: 'Database error',
        user: null 
      }, { status: 500 });
    }

    if (!userData) {
      // 사용자가 없으면 생성
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: session.user.email,
          name: session.user.name || '',
          nickname: '',
          phone: '',
          role: 'user',
          is_blacklisted: false
        })
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        return NextResponse.json({ 
          error: 'Failed to create user',
          user: null,
          needsSignup: true
        }, { status: 500 });
      }

      return NextResponse.json({ 
        user: newUser,
        needsSignup: true // 회원가입 완료 필요
      });
    }

    // 회원가입 완료 여부 확인
    const needsSignup = !userData.nickname || !userData.phone;

    return NextResponse.json({ 
      user: userData,
      needsSignup
    });

  } catch (error) {
    console.error('User check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      user: null 
    }, { status: 500 });
  }
}