import { auth } from '@/auth';
import { UsersRepository } from '@/lib/d1/repositories/users';
import { AdminsRepository } from '@/lib/d1/repositories/admins';

export async function GET() {
  const session = await auth();
  
  console.log('[check-admin] Session:', session);
  
  if (!session?.user?.email) {
    console.log('[check-admin] No session email');
    return Response.json({ isAdmin: false });
  }

  try {
    const usersRepo = new UsersRepository();
    const adminsRepo = new AdminsRepository();
    
    // 사용자 ID 조회
    const userData = await usersRepo.findByEmail(session.user.email);
    
    console.log('[check-admin] User data:', userData);
    
    if (!userData) {
      return Response.json({ isAdmin: false });
    }

    // 관리자 권한 확인
    const adminData = await adminsRepo.findByUserId(userData.id);
    
    console.log('[check-admin] Admin data:', adminData);
    
    // 관리자 권한 확인 - admins 테이블에 있으면 관리자
    const isAdmin = !!adminData || userData.role === 'admin';
    
    console.log('[check-admin] Final result:', { isAdmin, role: userData.role, isSuperAdmin: adminData?.is_super_admin });
    
    return Response.json({ 
      isAdmin,
      userId: userData.id,
      role: userData.role,
      isSuperAdmin: adminData?.is_super_admin || false
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return Response.json({ isAdmin: false });
  }
}