const Database = require('better-sqlite3');
const path = require('path');

/**
 * 약관 데이터 동기화 스크립트
 * database.sqlite의 최신 약관 데이터를 dev.db로 동기화
 */
async function syncTermsData() {
  const sourceDbPath = path.join(process.cwd(), 'database.sqlite');
  const targetDbPath = path.join(process.cwd(), 'dev.db');
  
  let sourceDb, targetDb;
  
  try {
    console.log('🔄 약관 데이터 동기화 시작...');
    
    // 데이터베이스 연결
    sourceDb = new Database(sourceDbPath, { readonly: true });
    targetDb = new Database(targetDbPath);
    
    // 소스에서 약관 데이터 읽기
    const termsData = sourceDb.prepare(`
      SELECT * FROM content_pages 
      WHERE slug IN ('terms_of_service', 'privacy_policy')
      ORDER BY slug
    `).all();
    
    console.log(`📋 소스에서 ${termsData.length}개의 약관 데이터 발견`);
    
    if (termsData.length === 0) {
      console.warn('⚠️ 소스 데이터베이스에 약관 데이터가 없습니다.');
      return;
    }
    
    // 타겟 데이터베이스에서 기존 데이터 확인
    const existingData = targetDb.prepare(`
      SELECT slug, title, updated_at FROM content_pages 
      WHERE slug IN ('terms_of_service', 'privacy_policy')
      ORDER BY slug
    `).all();
    
    console.log(`📝 타겟에서 ${existingData.length}개의 기존 약관 데이터 발견`);
    
    // 데이터 비교 및 출력
    console.log('\n📊 데이터 비교:');
    existingData.forEach((existing, index) => {
      const source = termsData.find(t => t.slug === existing.slug);
      if (source) {
        console.log(`\n${existing.slug}:`);
        console.log(`  기존: ${existing.title} (${existing.updated_at})`);
        console.log(`  신규: ${source.title} (${source.updated_at})`);
        console.log(`  변경 필요: ${existing.updated_at !== source.updated_at ? '✅' : '❌'}`);
      }
    });
    
    // 트랜잭션으로 데이터 동기화 (외래 키 제약 조건 무시)
    const updateStmt = targetDb.prepare(`
      UPDATE content_pages 
      SET title = ?, content = ?, content_type = ?, version = ?, 
          is_published = ?, published_at = ?, metadata = ?, 
          updated_at = ?
      WHERE slug = ?
    `);
    
    const insertStmt = targetDb.prepare(`
      INSERT INTO content_pages (
        id, slug, title, content, content_type, version, 
        is_published, published_at, metadata, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    console.log('\n🔄 데이터 동기화 중...');
    
    const transaction = targetDb.transaction(() => {
      let updatedCount = 0;
      let insertedCount = 0;
      
      for (const data of termsData) {
        const existing = existingData.find(e => e.slug === data.slug);
        
        if (existing) {
          // 업데이트 (외래 키 필드 제외)
          const result = updateStmt.run(
            data.title,
            data.content,
            data.content_type,
            data.version,
            data.is_published,
            data.published_at,
            data.metadata,
            data.updated_at,
            data.slug
          );
          if (result.changes > 0) {
            updatedCount++;
            console.log(`  ✅ ${data.slug} 업데이트 완료`);
          }
        } else {
          // 신규 삽입 (외래 키 필드 제외)
          insertStmt.run(
            data.id,
            data.slug,
            data.title,
            data.content,
            data.content_type,
            data.version,
            data.is_published,
            data.published_at,
            data.metadata,
            data.created_at,
            data.updated_at
          );
          insertedCount++;
          console.log(`  ✅ ${data.slug} 신규 삽입 완료`);
        }
      }
      
      console.log(`\n📈 동기화 결과:`);
      console.log(`  - 업데이트: ${updatedCount}개`);
      console.log(`  - 신규 삽입: ${insertedCount}개`);
    });
    
    transaction();
    
    // 동기화 후 검증
    console.log('\n🔍 동기화 검증 중...');
    const verifyData = targetDb.prepare(`
      SELECT slug, title, updated_at FROM content_pages 
      WHERE slug IN ('terms_of_service', 'privacy_policy')
      ORDER BY slug
    `).all();
    
    console.log('\n✅ 동기화 완료된 데이터:');
    verifyData.forEach(data => {
      console.log(`  - ${data.slug}: ${data.title} (${data.updated_at})`);
    });
    
    console.log('\n🎉 약관 데이터 동기화가 성공적으로 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 동기화 중 오류 발생:', error);
    throw error;
  } finally {
    // 데이터베이스 연결 해제
    if (sourceDb) sourceDb.close();
    if (targetDb) targetDb.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  syncTermsData()
    .then(() => {
      console.log('\n✨ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { syncTermsData };