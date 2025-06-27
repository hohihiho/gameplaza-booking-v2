const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('테이블 확인 중...');
  
  // device_categories 테이블 확인
  const { data: categories, error: catError } = await supabase
    .from('device_categories')
    .select('*')
    .limit(1);
    
  if (catError) {
    console.log('❌ device_categories 테이블이 없습니다:', catError.message);
  } else {
    console.log('✅ device_categories 테이블 존재');
  }
  
  // device_types 테이블 확인
  const { data: types, error: typeError } = await supabase
    .from('device_types')
    .select('*')
    .limit(1);
    
  if (typeError) {
    console.log('❌ device_types 테이블이 없습니다:', typeError.message);
  } else {
    console.log('✅ device_types 테이블 존재');
  }
}

checkTables();