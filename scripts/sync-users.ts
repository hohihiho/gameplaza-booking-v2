import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import Database from 'better-sqlite3';

async function syncUsers() {
  console.log('🔄 사용자 동기화 시작...');
  
  // Better Auth 데이터베이스 연결
  const betterAuthDb = new Database('./dev.db');
  
  // Better Auth user 테이블에서 모든 사용자 가져오기
  const authUsers = betterAuthDb.prepare('SELECT * FROM user').all();
  
  console.log(`📊 Better Auth에서 ${authUsers.length}명의 사용자 발견`);
  
  for (const authUser of authUsers) {
    // users 테이블에 이미 있는지 확인
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, authUser.email))
      .limit(1);
    
    if (existingUser.length === 0) {
      // 새 사용자 추가
      await db.insert(users).values({
        email: authUser.email,
        name: authUser.name || authUser.email.split('@')[0],
        role: authUser.email === 'ndz5496@gmail.com' ? 'super_admin' : 'user',
        marketingConsent: false,
        marketing_agreed: false,
        push_notifications_enabled: false,
        createdAt: new Date(authUser.createdAt),
        updatedAt: new Date(authUser.updatedAt)
      });
      
      console.log(`✅ 사용자 추가: ${authUser.email}`);
    } else {
      console.log(`⏭️  이미 존재: ${authUser.email}`);
    }
  }
  
  betterAuthDb.close();
  console.log('✨ 동기화 완료!');
}

syncUsers().catch(console.error);