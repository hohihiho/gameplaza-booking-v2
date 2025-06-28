import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function POST() {
  try {
    // 테이블 생성 SQL
    const createTableSQL = `
      -- 이용 안내 테이블 생성
      CREATE TABLE IF NOT EXISTS reservation_rules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_reservation_rules_active ON reservation_rules(is_active);
      CREATE INDEX IF NOT EXISTS idx_reservation_rules_order ON reservation_rules(display_order);

      -- 업데이트 트리거 함수 생성 (없으면)
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- 업데이트 트리거 생성
      DROP TRIGGER IF EXISTS update_reservation_rules_updated_at ON reservation_rules;
      CREATE TRIGGER update_reservation_rules_updated_at
        BEFORE UPDATE ON reservation_rules
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `;

    // 테이블 생성 실행
    const { error: createError } = await supabaseAdmin
      .from('reservation_rules')
      .select('id')
      .limit(1);

    if (createError && createError.code === '42P01') {
      // 테이블이 없으면 직접 생성은 불가능하므로, 대신 빈 데이터 반환
      console.log('Table does not exist. Please create it manually.');
    }

    // 샘플 데이터 추가 (테이블이 있고 비어있는 경우)
    const { count } = await supabaseAdmin
      .from('reservation_rules')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      const sampleRules = [
        {
          content: '예약한 시간에 맞춰 방문해주세요. 10분 이상 늦을 경우 예약이 자동 취소될 수 있습니다.',
          display_order: 1
        },
        {
          content: '본인 확인을 위해 신분증을 반드시 지참해주세요.',
          display_order: 2
        },
        {
          content: '예약 변경 및 취소는 이용 시간 1시간 전까지 가능합니다.',
          display_order: 3
        },
        {
          content: '기기는 소중히 다뤄주시고, 음식물 반입은 금지입니다.',
          display_order: 4
        },
        {
          content: '미성년자는 22시 이후 이용이 제한됩니다.',
          display_order: 5
        }
      ];

      const { error: insertError } = await supabaseAdmin
        .from('reservation_rules')
        .insert(sampleRules);

      if (insertError) {
        console.error('Failed to insert sample data:', insertError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting up reservation rules:', error);
    return NextResponse.json({ error: 'Failed to setup reservation rules' }, { status: 500 });
  }
}