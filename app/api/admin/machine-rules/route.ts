import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import { d1ListMachineRules, d1CreateMachineRule, d1UpdateMachineRule, d1DeleteMachineRule } from '@/lib/db/d1'

export async function GET() {
  try {
    const rules = await d1ListMachineRules()
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
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { content, display_order } = await request.json()
    const data = await d1CreateMachineRule({ content, display_order, is_active: true })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('안내사항 추가 오류:', error)
    return NextResponse.json({ error: error.message || '안내사항 추가에 실패했습니다' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 })
    }

    const data = await d1UpdateMachineRule(Number(id), updateData)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('안내사항 수정 오류:', error)
    return NextResponse.json({ error: error.message || '안내사항 수정에 실패했습니다' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 })
    }

    await d1DeleteMachineRule(Number(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('안내사항 삭제 오류:', error)
    return NextResponse.json({ error: error.message || '안내사항 삭제에 실패했습니다' }, { status: 500 })
  }
}
