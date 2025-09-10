/**
 * 초기 관리자 사용자 등록 스크립트
 * Better Auth 역할 시스템을 사용하여 관리자 계정을 생성합니다.
 */

import { getDB } from '@/lib/db/server';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// 초기 관리자 정보
const ADMIN_USERS = [
  {
    email: 'ndz5496@gmail.com',
    name: '이시희',
    role: 'super_admin',
    nickname: '시희',
  },
  {
    email: 'admin@gameplaza.kr',
    name: '게임플라자 관리자',
    role: 'admin',
    nickname: '관리자',
  },
];

async function seedAdminUsers() {
  try {
    const db = getDB();
    
    console.log('🌱 초기 관리자 계정 생성을 시작합니다...');
    
    for (const adminData of ADMIN_USERS) {
      // 이미 존재하는 사용자인지 확인
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, adminData.email))
        .limit(1);
      
      if (existingUser.length > 0) {
        console.log(`⚠️  ${adminData.email} 사용자가 이미 존재합니다. 역할을 업데이트합니다.`);
        
        // 기존 사용자의 역할 업데이트
        await db
          .update(users)
          .set({
            role: adminData.role as 'admin' | 'super_admin',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.email, adminData.email));
          
        console.log(`✅ ${adminData.email} 사용자의 역할이 ${adminData.role}로 업데이트되었습니다.`);
      } else {
        // 새로운 관리자 사용자 생성
        const userId = crypto.randomUUID();
        
        await db.insert(users).values({
          email: adminData.email,
          name: adminData.name,
          role: adminData.role as 'admin' | 'super_admin',
          updated_at: new Date().toISOString(),
        });
        
        console.log(`✅ ${adminData.email} 관리자 계정이 생성되었습니다. (역할: ${adminData.role})`);
      }
    }
    
    console.log('\n🎉 초기 관리자 계정 생성이 완료되었습니다!');
    console.log('\n📝 다음 단계:');
    console.log('1. 관리자는 소셜 로그인(구글/카카오)을 통해 로그인할 수 있습니다.');
    console.log('2. 로그인 시 이메일 주소를 기반으로 관리자 권한이 자동으로 부여됩니다.');
    console.log('3. lib/auth.ts의 하드코딩된 ADMIN_EMAILS 배열을 제거할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 초기 관리자 계정 생성 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  seedAdminUsers()
    .then(() => {
      console.log('\n✨ 스크립트 실행이 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 중 오류:', error);
      process.exit(1);
    });
}

export { seedAdminUsers };