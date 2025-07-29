import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    // 가장 간단한 쿼리
    const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.from('device_types')
      .select('*')
      .order('name')

    if (error) {
      console.error('Simple query error:', error)
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}