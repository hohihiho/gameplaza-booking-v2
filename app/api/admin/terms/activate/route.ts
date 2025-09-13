import { getDB, supabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/db';

// 약관 활성화
export const POST = withAuth(
  async (request: NextRequest, { user: _user }) => {
    try {
      const body = await request.json();
      const { id } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'ID가 필요합니다.' },
          { status: 400 }
        );
      }

      const supabaseAdmin = createAdminClient();

      // 활성화할 약관의 타입 조회
      const { data: termToActivate, error: fetchError } = await supabaseAdmin
        .from('terms')
        .select('type')
        .eq('id', id)
        .single();

      if (fetchError || !termToActivate) {
        return NextResponse.json(
          { error: '약관을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 같은 타입의 모든 약관 비활성화
      const { error: deactivateError } = await supabaseAdmin
        .from('terms')
        .update({ is_active: false })
        .eq('type', termToActivate.type)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('약관 비활성화 오류:', deactivateError);
        return NextResponse.json(
          { error: '기존 약관 비활성화 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // 선택된 약관 활성화
      const { data, error: activateError } = await supabaseAdmin
        .from('terms')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (activateError) {
        console.error('약관 활성화 오류:', activateError);
        return NextResponse.json(
          { error: '약관 활성화 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data });

    } catch (error) {
      console.error('약관 활성화 API 오류:', error);
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  },
  { requireAdmin: true }
);