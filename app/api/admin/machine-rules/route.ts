import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET() {
  try {
    const { data: rules, error } = await supabaseAdmin
      .from('machine_rules')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      // 테이블이 없는 경우 빈 배열 반환
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({ rules: [] })
      }
      throw error
    }

    return NextResponse.json({ rules: rules || [] })
  } catch (error: any) {
    console.error('기기 현황 안내사항 조회 오류:', error)
    return NextResponse.json({ 
      error: error.message || '기기 현황 안내사항을 불러올 수 없습니다',
      rules: []
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { content, display_order } = await request.json()

    const { data, error } = await supabaseAdmin
      .from('machine_rules')
      .insert([{ 
        content,
        display_order: display_order || 0,
        is_active: true
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('안내사항 추가 오류:', error)
    return NextResponse.json({ error: error.message || '안내사항 추가에 실패했습니다' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('machine_rules')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('안내사항 수정 오류:', error)
    return NextResponse.json({ error: error.message || '안내사항 수정에 실패했습니다' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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

    const { error } = await supabaseAdmin
      .from('machine_rules')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('안내사항 삭제 오류:', error)
    return NextResponse.json({ error: error.message || '안내사항 삭제에 실패했습니다' }, { status: 500 })
  }
}