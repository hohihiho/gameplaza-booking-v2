import { UserSupabaseRepository } from '../user.supabase.repository'
import { User } from '@/src/domain/entities/user'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  single: jest.fn(),
  count: jest.fn()
} as any

describe('UserSupabaseRepository', () => {
  let repository: UserSupabaseRepository
  let testUser: User

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new UserSupabaseRepository(mockSupabase)
    
    testUser = User.create({
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
      phone: '010-1234-5678',
      role: 'user',
      status: 'active'
    })
  })

  describe('findById', () => {
    it('ID로 사용자를 조회해야 한다', async () => {
      const mockRow = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '010-1234-5678',
        role: 'user',
        status: 'active',
        birth_date: null,
        profile_image_url: null,
        google_id: null,
        last_login_at: null,
        login_attempts: 0,
        suspended_until: null,
        banned_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockRow, error: null })

      const result = await repository.findById('user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123')
      expect(result).toBeDefined()
      expect(result?.id).toBe('user-123')
      expect(result?.email).toBe('test@example.com')
    })

    it('사용자가 없으면 null을 반환해야 한다', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: 'Not found' })

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('이메일로 사용자를 조회해야 한다', async () => {
      const mockRow = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: null,
        role: 'user',
        status: 'active',
        birth_date: null,
        profile_image_url: null,
        google_id: null,
        last_login_at: null,
        login_attempts: 0,
        suspended_until: null,
        banned_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockRow, error: null })

      const result = await repository.findByEmail('test@example.com')

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'test@example.com')
      expect(result).toBeDefined()
      expect(result?.email).toBe('test@example.com')
    })
  })

  describe('findByGoogleId', () => {
    it('Google ID로 사용자를 조회해야 한다', async () => {
      const mockRow = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: null,
        role: 'user',
        status: 'active',
        birth_date: null,
        profile_image_url: 'https://example.com/photo.jpg',
        google_id: 'google-123',
        last_login_at: null,
        login_attempts: 0,
        suspended_until: null,
        banned_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockRow, error: null })

      const result = await repository.findByGoogleId('google-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.eq).toHaveBeenCalledWith('google_id', 'google-123')
      expect(result).toBeDefined()
      expect(result?.googleId).toBe('google-123')
    })
  })

  describe('save', () => {
    it('새 사용자를 저장해야 한다', async () => {
      const mockRow = {
        id: testUser.id,
        email: testUser.email,
        full_name: testUser.fullName,
        phone: testUser.phone,
        role: testUser.role,
        status: testUser.status,
        birth_date: null,
        profile_image_url: null,
        google_id: null,
        last_login_at: null,
        login_attempts: 0,
        suspended_until: null,
        banned_reason: null,
        created_at: testUser.createdAt.toISOString(),
        updated_at: testUser.updatedAt.toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockRow, error: null })

      const result = await repository.save(testUser)

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        id: testUser.id,
        email: testUser.email,
        full_name: testUser.fullName
      }))
      expect(result.id).toBe(testUser.id)
    })

    it('저장 실패 시 에러를 던져야 한다', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } })

      await expect(repository.save(testUser)).rejects.toThrow('Failed to save user: Insert failed')
    })
  })

  describe('update', () => {
    it('사용자를 업데이트해야 한다', async () => {
      const updatedUser = testUser.updateProfile({ fullName: 'Updated Name' })
      
      const mockRow = {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: 'Updated Name',
        phone: updatedUser.phone,
        role: updatedUser.role,
        status: updatedUser.status,
        birth_date: null,
        profile_image_url: null,
        google_id: null,
        last_login_at: null,
        login_attempts: 0,
        suspended_until: null,
        banned_reason: null,
        created_at: updatedUser.createdAt.toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockRow, error: null })

      const result = await repository.update(updatedUser)

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', updatedUser.id)
      expect(result.fullName).toBe('Updated Name')
    })
  })

  describe('findByRole', () => {
    it('역할별로 사용자를 조회해야 한다', async () => {
      const mockRows = [
        {
          id: 'admin-1',
          email: 'admin1@example.com',
          full_name: 'Admin One',
          phone: null,
          role: 'admin',
          status: 'active',
          birth_date: null,
          profile_image_url: null,
          google_id: null,
          last_login_at: null,
          login_attempts: 0,
          suspended_until: null,
          banned_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'admin-2',
          email: 'admin2@example.com',
          full_name: 'Admin Two',
          phone: null,
          role: 'admin',
          status: 'active',
          birth_date: null,
          profile_image_url: null,
          google_id: null,
          last_login_at: null,
          login_attempts: 0,
          suspended_until: null,
          banned_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      mockSupabase.eq.mockReturnValueOnce({ data: mockRows, error: null })

      const result = await repository.findByRole('admin')

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.eq).toHaveBeenCalledWith('role', 'admin')
      expect(result).toHaveLength(2)
      expect(result[0].role).toBe('admin')
      expect(result[1].role).toBe('admin')
    })
  })

  describe('countByStatus', () => {
    it('상태별 사용자 수를 반환해야 한다', async () => {
      mockSupabase.eq.mockReturnValueOnce({ count: 10, error: null })

      const result = await repository.countByStatus('active')

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active')
      expect(result).toBe(10)
    })
  })

  describe('existsByEmail', () => {
    it('이메일이 존재하면 true를 반환해야 한다', async () => {
      mockSupabase.eq.mockReturnValueOnce({ count: 1, error: null })

      const result = await repository.existsByEmail('test@example.com')

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'test@example.com')
      expect(result).toBe(true)
    })

    it('이메일이 존재하지 않으면 false를 반환해야 한다', async () => {
      mockSupabase.eq.mockReturnValueOnce({ count: 0, error: null })

      const result = await repository.existsByEmail('nonexistent@example.com')

      expect(result).toBe(false)
    })
  })
})