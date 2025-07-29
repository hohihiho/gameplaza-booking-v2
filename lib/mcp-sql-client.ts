/**
 * MCP Supabase SQL 클라이언트 래퍼
 * 테스트 환경에서만 사용되는 직접 SQL 실행 유틸리티
 */

// MCP 도구는 Jest 환경에서 직접 사용할 수 없으므로
// 대신 fetch를 사용해서 Supabase REST API를 직접 호출합니다

export const executeSql = async (query: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.')
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        query: query
      })
    })

    if (!response.ok) {
      // REST API가 아닌 직접 Supabase client를 사용해보겠습니다
      // 이 방법이 실패하면 다른 접근 방식을 시도합니다
      throw new Error(`SQL 실행 실패: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('MCP SQL 클라이언트 에러:', error)
    throw error
  }
}