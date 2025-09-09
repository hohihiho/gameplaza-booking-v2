const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(process.cwd(), 'dev.db');
const db = new Database(DB_PATH);

async function createAdmin() {
  console.log('관리자 계정 생성 중...');
  
  // 비밀번호 해시
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // 관리자 계정 생성
  const result = db.prepare(`
    INSERT INTO users (email, name, role, emailVerified)
    VALUES (?, ?, ?, ?)
  `).run('admin@gameplaza.kr', '관리자', 'admin', 1);
  
  console.log('관리자 계정 생성 완료!');
  console.log('이메일: admin@gameplaza.kr');
  console.log('비밀번호: admin123');
  console.log('역할: admin');
}

createAdmin().then(() => {
  db.close();
}).catch(err => {
  console.error('오류:', err);
  db.close();
});