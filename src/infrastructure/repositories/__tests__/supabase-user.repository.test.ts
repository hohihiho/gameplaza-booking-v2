import { SupabaseUserRepository } from '../supabase-user.repository'
import { User } from '../../../domain/entities/user'
import { createMockSupabaseClient } from '../../../test-utils/supabase'

describe('SupabaseUserRepository', () => {
  let repository: SupabaseUserRepository
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  const mockUserRecord = {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: null,
    role: 'user',
    created_at: '2025-07-22T10:00:00Z',
    updated_at: '2025-07-22T10:00:00Z'
  }

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    repository = new SupabaseUserRepository(mockSupabase)
  })

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserRecord, error: null })
      }
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const user = await repository.findById('user-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-1')
      expect(user).not.toBeNull()
      expect(user?.id).toBe('user-1')
      expect(user?.email).toBe('test@example.com')
      expect(user?.fullName).toBe('Test User')
      expect(user?.phone).toBeNull()
    })

    it('should return null if user not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const user = await repository.findById('non-existent')

      expect(user).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserRecord, error: null })
      }
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const user = await repository.findByEmail('test@example.com')

      expect(mockQuery.eq).toHaveBeenCalledWith('email', 'test@example.com')
      expect(user).not.toBeNull()
      expect(user?.email).toBe('test@example.com')
    })
  })

  describe('save', () => {
    it('should save new user', async () => {
      const newUser = User.create({
        id: 'new-user',
        email: 'new@example.com',
        fullName: 'New User',
        phone: '010-1234-5678'
      })

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            ...mockUserRecord,
            id: 'new-user',
            email: 'new@example.com',
            full_name: 'New User',
            phone: '010-1234-5678'
          },
          error: null
        })
      }
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const savedUser = await repository.save(newUser)

      expect(savedUser.id).toBe('new-user')
      expect(savedUser.phone).toBe('010-1234-5678')
    })

    it('should throw error on save failure', async () => {
      const user = User.create({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User'
      })

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } })
      }
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      await expect(repository.save(user))
        .rejects.toThrow('Failed to save user: Insert failed')
    })
  })

  describe('update', () => {
    it('should update user profile', async () => {
      const user = User.create({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Updated Name',
        phone: '010-9876-5432'
      })

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            ...mockUserRecord,
            full_name: 'Updated Name',
            phone: '010-9876-5432'
          },
          error: null
        })
      }
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const updatedUser = await repository.update(user)

      expect(updatedUser.fullName).toBe('Updated Name')
      expect(updatedUser.phone).toBe('010-9876-5432')
    })

    it('should allow removing phone number', async () => {
      const user = User.create({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: null
      })

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockUserRecord, phone: null },
          error: null
        })
      }
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const updatedUser = await repository.update(user)

      expect(updatedUser.phone).toBeNull()
    })
  })
})