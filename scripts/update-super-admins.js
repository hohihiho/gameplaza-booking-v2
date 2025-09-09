const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'dev.db');
const db = new Database(DB_PATH);

// 슈퍼관리자 이메일 목록
const SUPER_ADMIN_EMAILS = ['ndz5496@gmail.com', 'leejinseok94@gmail.com'];

console.log('슈퍼관리자 권한 업데이트 시작...\n');

// 각 이메일에 대해 처리
for (const email of SUPER_ADMIN_EMAILS) {
  console.log(`처리 중: ${email}`);
  
  // 기존 사용자 확인
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (user) {
    // 이미 계정이 있는 경우
    if (user.role === 'super_admin') {
      console.log(`  ✓ 이미 슈퍼관리자입니다.`);
    } else {
      // 슈퍼관리자로 승격
      db.prepare('UPDATE users SET role = ? WHERE email = ?')
        .run('super_admin', email);
      console.log(`  🔥 슈퍼관리자로 승격되었습니다! (기존: ${user.role})`);
    }
  } else {
    console.log(`  ℹ️ 아직 가입하지 않은 계정입니다. 가입 시 자동으로 슈퍼관리자 권한이 부여됩니다.`);
  }
}

console.log('\n=== 현재 모든 사용자 목록 ===');
const allUsers = db.prepare('SELECT email, name, role FROM users ORDER BY created_at DESC').all();

if (allUsers.length === 0) {
  console.log('등록된 사용자가 없습니다.');
} else {
  allUsers.forEach(user => {
    const roleEmoji = user.role === 'super_admin' ? '👑' : 
                      user.role === 'admin' ? '🛡️' : '👤';
    console.log(`${roleEmoji} ${user.email} (${user.name || '이름 미설정'}) - ${user.role || 'user'}`);
  });
}

console.log('\n슈퍼관리자 권한 업데이트 완료!');
db.close();