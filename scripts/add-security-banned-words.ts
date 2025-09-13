import * as dotenv from 'dotenv';
// // import { createClient } from '@/lib/supabase-mock';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

// Supabase 클라이언트 생성
// import { supabase } from '@/lib/supabase-mock';
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 보안 관련 금지어 목록
const securityBannedWords = [
  // SQL 인젝션 관련
  { word: 'SELECT', severity: 2, category: 'sql_injection' },
  { word: 'INSERT', severity: 2, category: 'sql_injection' },
  { word: 'UPDATE', severity: 2, category: 'sql_injection' },
  { word: 'DELETE', severity: 2, category: 'sql_injection' },
  { word: 'DROP', severity: 2, category: 'sql_injection' },
  { word: 'TRUNCATE', severity: 2, category: 'sql_injection' },
  { word: 'ALTER', severity: 2, category: 'sql_injection' },
  { word: 'CREATE', severity: 2, category: 'sql_injection' },
  { word: 'UNION', severity: 2, category: 'sql_injection' },
  { word: 'WHERE', severity: 2, category: 'sql_injection' },
  { word: 'FROM', severity: 2, category: 'sql_injection' },
  { word: 'JOIN', severity: 2, category: 'sql_injection' },
  { word: 'OR 1=1', severity: 2, category: 'sql_injection' },
  { word: "' OR '", severity: 2, category: 'sql_injection' },
  { word: '" OR "', severity: 2, category: 'sql_injection' },
  { word: '--', severity: 2, category: 'sql_injection' },
  { word: '/*', severity: 2, category: 'sql_injection' },
  { word: '*/', severity: 2, category: 'sql_injection' },
  { word: 'xp_', severity: 2, category: 'sql_injection' },
  { word: 'sp_', severity: 2, category: 'sql_injection' },
  
  // JavaScript 인젝션 관련
  { word: '<script', severity: 2, category: 'xss' },
  { word: '</script', severity: 2, category: 'xss' },
  { word: 'javascript:', severity: 2, category: 'xss' },
  { word: 'onclick', severity: 2, category: 'xss' },
  { word: 'onload', severity: 2, category: 'xss' },
  { word: 'onerror', severity: 2, category: 'xss' },
  { word: 'onmouseover', severity: 2, category: 'xss' },
  { word: 'eval(', severity: 2, category: 'xss' },
  { word: 'alert(', severity: 2, category: 'xss' },
  { word: 'document.', severity: 2, category: 'xss' },
  { word: 'window.', severity: 2, category: 'xss' },
  { word: 'location.', severity: 2, category: 'xss' },
  { word: '.innerHTML', severity: 2, category: 'xss' },
  { word: '.outerHTML', severity: 2, category: 'xss' },
  { word: 'Function(', severity: 2, category: 'xss' },
  { word: 'setTimeout(', severity: 2, category: 'xss' },
  { word: 'setInterval(', severity: 2, category: 'xss' },
  
  // HTML 인젝션 관련
  { word: '<iframe', severity: 2, category: 'html_injection' },
  { word: '<object', severity: 2, category: 'html_injection' },
  { word: '<embed', severity: 2, category: 'html_injection' },
  { word: '<form', severity: 2, category: 'html_injection' },
  { word: '<input', severity: 2, category: 'html_injection' },
  { word: '<button', severity: 2, category: 'html_injection' },
  { word: '<img', severity: 2, category: 'html_injection' },
  { word: '<svg', severity: 2, category: 'html_injection' },
  { word: '<link', severity: 2, category: 'html_injection' },
  { word: '<meta', severity: 2, category: 'html_injection' },
  { word: '<style', severity: 2, category: 'html_injection' },
  
  // 시스템 명령어 관련
  { word: 'exec(', severity: 2, category: 'command_injection' },
  { word: 'system(', severity: 2, category: 'command_injection' },
  { word: 'shell_exec', severity: 2, category: 'command_injection' },
  { word: 'passthru', severity: 2, category: 'command_injection' },
  { word: 'popen', severity: 2, category: 'command_injection' },
  { word: 'proc_open', severity: 2, category: 'command_injection' },
  { word: 'rm -rf', severity: 2, category: 'command_injection' },
  { word: 'sudo', severity: 2, category: 'command_injection' },
  { word: 'chmod', severity: 2, category: 'command_injection' },
  { word: 'chown', severity: 2, category: 'command_injection' },
  { word: 'wget', severity: 2, category: 'command_injection' },
  { word: 'curl', severity: 2, category: 'command_injection' },
  { word: 'nc -e', severity: 2, category: 'command_injection' },
  { word: '/bin/', severity: 2, category: 'command_injection' },
  { word: '/etc/', severity: 2, category: 'command_injection' },
  { word: '../', severity: 2, category: 'path_traversal' },
  { word: '..\\', severity: 2, category: 'path_traversal' },
  
  // 파일 관련
  { word: '.exe', severity: 2, category: 'file_extension' },
  { word: '.bat', severity: 2, category: 'file_extension' },
  { word: '.cmd', severity: 2, category: 'file_extension' },
  { word: '.sh', severity: 2, category: 'file_extension' },
  { word: '.ps1', severity: 2, category: 'file_extension' },
  { word: '.vbs', severity: 2, category: 'file_extension' },
  { word: '.js', severity: 2, category: 'file_extension' },
  { word: '.php', severity: 2, category: 'file_extension' },
  { word: '.asp', severity: 2, category: 'file_extension' },
  { word: '.jsp', severity: 2, category: 'file_extension' },
  
  // 네트워크 관련
  { word: 'http://', severity: 1, category: 'url' },
  { word: 'https://', severity: 1, category: 'url' },
  { word: 'ftp://', severity: 1, category: 'url' },
  { word: 'file://', severity: 2, category: 'url' },
  { word: 'data:', severity: 2, category: 'url' },
  { word: 'vbscript:', severity: 2, category: 'url' },
  
  // 인코딩 시도
  { word: '%3C', severity: 2, category: 'encoding' }, // <
  { word: '%3E', severity: 2, category: 'encoding' }, // >
  { word: '%22', severity: 2, category: 'encoding' }, // "
  { word: '%27', severity: 2, category: 'encoding' }, // '
  { word: '&#x', severity: 2, category: 'encoding' },
  { word: '&#', severity: 2, category: 'encoding' },
  { word: '\\x', severity: 2, category: 'encoding' },
  { word: '\\u', severity: 2, category: 'encoding' },
  
  // Base64 인코딩 패턴
  { word: 'PHNjcmlwdD4', severity: 2, category: 'base64' }, // <script>
  { word: 'YWxlcnQ', severity: 2, category: 'base64' }, // alert
  { word: 'ZXZhbA', severity: 2, category: 'base64' }, // eval
  
  // 특수 문자 조합
  { word: '${', severity: 2, category: 'template_injection' },
  { word: '#{', severity: 2, category: 'template_injection' },
  { word: '{{', severity: 2, category: 'template_injection' },
  { word: '{%', severity: 2, category: 'template_injection' },
  { word: '<%', severity: 2, category: 'template_injection' },
  { word: '<?', severity: 2, category: 'php_injection' },
  { word: '?>', severity: 2, category: 'php_injection' },
  
  // NoSQL 인젝션
  { word: '$where', severity: 2, category: 'nosql_injection' },
  { word: '$regex', severity: 2, category: 'nosql_injection' },
  { word: '$ne', severity: 2, category: 'nosql_injection' },
  { word: '$gt', severity: 2, category: 'nosql_injection' },
  { word: '$lt', severity: 2, category: 'nosql_injection' },
  
  // LDAP 인젝션
  { word: '(cn=', severity: 2, category: 'ldap_injection' },
  { word: '(uid=', severity: 2, category: 'ldap_injection' },
  { word: '(&', severity: 2, category: 'ldap_injection' },
  { word: '(|', severity: 2, category: 'ldap_injection' },
  
  // XML 인젝션
  { word: '<!ENTITY', severity: 2, category: 'xml_injection' },
  { word: '<!DOCTYPE', severity: 2, category: 'xml_injection' },
  { word: '<![CDATA[', severity: 2, category: 'xml_injection' },
  { word: ']]>', severity: 2, category: 'xml_injection' },
  
  // 기타 위험 패턴
  { word: '\\r\\n', severity: 2, category: 'header_injection' },
  { word: '\\n\\r', severity: 2, category: 'header_injection' },
  { word: '%0d%0a', severity: 2, category: 'header_injection' },
  { word: '%0a%0d', severity: 2, category: 'header_injection' },
];

async function addSecurityBannedWords() {
  console.log('보안 관련 금지어 추가 시작...');
  
  for (const bannedWord of securityBannedWords) {
    try {
      // 이미 존재하는지 확인
//       import { supabase } from '@/lib/supabase-mock';
  const { data$1 } = await supabase.from('banned_words')
        .select('id')
        .eq('word', bannedWord.word)
        .single();
      
      if (!existing) {
//         import { supabase } from '@/lib/supabase-mock';
  const { error$1 } = await supabase.from('banned_words')
          .insert({
            word: bannedWord.word,
            severity: bannedWord.severity,
            category: bannedWord.category,
            is_active: true,
            created_at: new Date().toISOString()
          });
        
        if (error) {
          console.error(`금지어 추가 실패 (${bannedWord.word}):`, error);
        } else {
          console.log(`✅ 추가됨: ${bannedWord.word}`);
        }
      } else {
        console.log(`⏭️  이미 존재: ${bannedWord.word}`);
      }
    } catch (error) {
      console.error(`오류 발생 (${bannedWord.word}):`, error);
    }
  }
  
  console.log('\n보안 관련 금지어 추가 완료!');
  console.log(`총 ${securityBannedWords.length}개의 보안 관련 금지어가 처리되었습니다.`);
}

// 스크립트 실행
addSecurityBannedWords().catch(console.error);