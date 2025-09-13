import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createAdminClient } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(_req: NextRequest) {
  console.log('[API /admin/users] Handler called');
  
  // 인증 확인
  const session = await auth();
  console.log('[API /admin/users] Session:', session?.user?.email);
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  
  // 관리자 권한 확인
  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();
    
  if (!userData) {
    return NextResponse.json(
      { error: 'User not found', code: 'USER_NOT_FOUND' },
      { status: 404 }
    );
  }
  
  const { data: adminData } = await adminClient
    .from('admins')
    .select('*')
    .eq('user_id', userData.id)
    .single();
    
  if (!adminData) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }
  
  const supabase = createServiceRoleClient();

  try {
    // 모든 사용자 정보 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (usersError) {
      console.error('사용자 조회 오류:', usersError);
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

    if (!users) {
      return NextResponse.json({ users: [] });
    }

    // 각 사용자의 관리자 정보 및 통계 조회
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      // 관리자 정보 확인
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // 예약 통계
      const { count: totalReservations } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 최근 예약 정보
      const { data: recentReservation } = await supabase
        .from('reservations')
        .select(`
          date,
          status,
          devices(
            device_number,
            device_types(
              name,
              model_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single() as { data: any };

      // 노쇼 카운트
      const { count: noShowCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'no_show');

      return {
        ...user,
        is_admin: !!adminData,
        is_super_admin: adminData?.is_super_admin || false,
        role: adminData ? 'admin' : 'user',
        total_reservations: totalReservations || 0,
        no_show_count: noShowCount || 0,
        recent_reservation: recentReservation ? {
          date: recentReservation.date,
          status: recentReservation.status,
          device_name: (recentReservation as any).devices?.device_types?.name 
            ? `${(recentReservation as any).devices.device_types.name} ${(recentReservation as any).devices.device_number}번`
            : '기기 정보 없음'
        } : null,
        // 기존 필드와의 호환성을 위해
        is_blacklisted: user.is_banned || false,
        admin_notes: user.notes || null
      };
    }));

    return NextResponse.json({ users: enrichedUsers });
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}