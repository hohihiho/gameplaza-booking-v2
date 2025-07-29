/**
 * Supabase 모킹 유틸리티
 * 테스트에서 Supabase 클라이언트를 모킹하기 위한 헬퍼 함수들
 */

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ 
      data: { 
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com' 
        } 
      }, 
      error: null 
    }),
    signInWithIdToken: jest.fn().mockResolvedValue({ 
      data: { 
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com' 
        }, 
        session: {} 
      }, 
      error: null 
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    refreshSession: jest.fn().mockResolvedValue({
      data: {
        session: { access_token: 'new-token' },
        user: { id: 'test-user-id' }
      },
      error: null
    })
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  range: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  channel: jest.fn(() => ({
    send: jest.fn()
  }))
}

export const createMockSupabaseClient = () => {
  const client = { ...mockSupabaseClient }
  
  // 체이닝을 위한 메서드 설정
  const chainableMethods = [
    'from', 'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'gte', 'lte', 'in', 'or', 
    'range', 'order', 'limit', 'filter'
  ]
  
  chainableMethods.forEach(method => {
    if (client[method]) {
      client[method] = jest.fn().mockReturnValue(client)
    }
  })
  
  return client
}

export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach(fn => {
        if (typeof fn === 'function' && fn.mockClear) {
          fn.mockClear()
        }
      })
    } else if (typeof value === 'function' && value.mockClear) {
      value.mockClear()
    }
  })
}