import { NextRequest, NextResponse } from 'next/server';
import { HolidayService } from '@/lib/d1/services/holiday.service';
import { auth } from '@/auth';
import { AdminsRepository } from '@/lib/d1/repositories/admins';

// DELETE /api/admin/holidays/[id] - 공휴일 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 관리자 권한 확인
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자인지 확인
    const adminsRepo = new AdminsRepository();
    const isAdmin = await adminsRepo.isAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    const holidayService = new HolidayService();
    const success = await holidayService.deleteHoliday(id);

    if (!success) {
      return NextResponse.json(
        { error: '공휴일 삭제에 실패했습니다. 임시공휴일만 삭제할 수 있습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: '공휴일이 삭제되었습니다'
    });
  } catch (error) {
    console.error('공휴일 삭제 오류:', error);
    return NextResponse.json(
      { error: '공휴일 삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}