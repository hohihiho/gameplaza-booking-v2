import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    // 간단한 테스트 쿼리
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('device_types')
      .select('id, name')
      .limit(5)

    if (error) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        hint: error.hint,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      count: data?.length || 0,
      data 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}