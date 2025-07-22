import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// 규칙 목록 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient();
  const { data: reservationrulesData } = await supabaseAdmin.from('reservation_rules')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ rules: data || [] })
  } catch (error) {
    console.error('규칙 조회 오류:', error)
    return NextResponse.json({ error: '규칙 조회에 실패했습니다' }, { status: 500 })
  }
}

// 규칙 추가
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { content, display_order } = body

    const supabaseAdmin = createAdminClient();
  const { data: reservationrulesData2 } = await supabaseAdmin.from('reservation_rules')
      .insert({
        content,
        display_order,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ rule: data })
  } catch (error) {
    console.error('규칙 추가 오류:', error)
    return NextResponse.json({ error: '규칙 추가에 실패했습니다' }, { status: 500 })
  }
}

// 규칙 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { id, content, is_active, display_order } = body

    console.log('규칙 수정 요청:', { id, content, is_active, display_order })

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (content !== undefined) updateData.content = content
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order

    console.log('업데이트 데이터:', updateData)

    const supabaseAdmin = createAdminClient();
  const { data: reservationrulesData3 } = await supabaseAdmin.from('reservation_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase 업데이트 에러:', error)
      throw error
    }

    console.log('업데이트 성공:', data)

    return NextResponse.json({ rule: data })
  } catch (error: any) {
    console.error('규칙 수정 오류 상세:', error)
    return NextResponse.json({ 
      error: error.message || '규칙 수정에 실패했습니다',
      details: error
    }, { status: 500 })
  }
}

// 규칙 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from('reservation_rules')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('규칙 삭제 오류:', error)
    return NextResponse.json({ error: '규칙 삭제에 실패했습니다' }, { status: 500 })
  }
}