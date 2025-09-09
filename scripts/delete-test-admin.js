const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'dev.db');
const db = new Database(DB_PATH);

console.log('테스트 관리자 계정 삭제 중...');

// admin@gameplaza.kr 계정 삭제
const result = db.prepare(`
  DELETE FROM users WHERE email = ?
`).run('admin@gameplaza.kr');

if (result.changes > 0) {
  console.log('admin@gameplaza.kr 계정이 삭제되었습니다.');
} else {
  console.log('admin@gameplaza.kr 계정을 찾을 수 없습니다.');
}

db.close();