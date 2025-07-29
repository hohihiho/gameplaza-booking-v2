import { AdminSupabaseRepository } from '../admin.supabase.repository'
import { Admin } from '@/src/domain/entities/admin'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  order: jest.fn(),
}


describe('AdminSupabaseRepository', () => {
  let repository: AdminSupabaseRepository

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset all mocks to return mockSupabase for chaining
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.delete.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
    
    repository = new AdminSupabaseRepository(mockSupabase as any)
  })

  describe('findById', () => {
    it('ID로 관리자를 조회해야 한다', async () => {
      const mockData = {
        id: 'admin-123',
        user_id: 'user-123',
        permissions: {
          reservations: true,
          users: true,
          devices: true,
          cms: true,
          settings: false
        },
        is_super_admin: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        users: {
          id: 'user-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        }
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.findById('admin-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('admins')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'admin-123')
      expect(result).toBeTruthy()
      expect(result?.id).toBe('admin-123')
      expect(result?.userId).toBe('user-123')
      expect(result?.isSuperAdmin).toBe(false)
    })

    it('존재하지 않는 ID의 경우 null을 반환해야 한다', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('사용자 ID로 관리자를 조회해야 한다', async () => {
      const mockData = {
        id: 'admin-123',
        user_id: 'user-123',
        permissions: {
          reservations: true,
          users: true,
          devices: true,
          cms: true,
          settings: true
        },
        is_super_admin: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        users: {
          id: 'user-123',
          email: 'superadmin@example.com',
          name: 'Super Admin',
          role: 'superadmin'
        }
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.findByUserId('user-123')

      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toBeTruthy()
      expect(result?.userId).toBe('user-123')
      expect(result?.isSuperAdmin).toBe(true)
    })
  })

  describe('findAll', () => {
    it('모든 관리자를 조회해야 한다', async () => {
      const mockData = [
        {
          id: 'admin-1',
          user_id: 'user-1',
          permissions: { reservations: true, users: true, devices: true, cms: true, settings: true },
          is_super_admin: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          users: { id: 'user-1', email: 'super@example.com', name: 'Super Admin', role: 'superadmin' }
        },
        {
          id: 'admin-2',
          user_id: 'user-2',
          permissions: { reservations: true, users: false, devices: true, cms: true, settings: false },
          is_super_admin: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          users: { id: 'user-2', email: 'admin@example.com', name: 'Admin User', role: 'admin' }
        }
      ]

      mockSupabase.order.mockReturnValueOnce({ data: mockData, error: null })

      const result = await repository.findAll()

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toHaveLength(2)
      expect(result[0].isSuperAdmin).toBe(true)
      expect(result[1].isSuperAdmin).toBe(false)
    })

    it('에러 발생 시 빈 배열을 반환해야 한다', async () => {
      mockSupabase.order.mockReturnValueOnce({ data: null, error: new Error('DB Error') })

      const result = await repository.findAll()

      expect(result).toEqual([])
    })
  })

  describe('findSuperAdmins', () => {
    it('슈퍼관리자만 조회해야 한다', async () => {
      const mockData = [
        {
          id: 'admin-1',
          user_id: 'user-1',
          permissions: { reservations: true, users: true, devices: true, cms: true, settings: true },
          is_super_admin: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          users: { id: 'user-1', email: 'super1@example.com', name: 'Super Admin 1', role: 'superadmin' }
        },
        {
          id: 'admin-2',
          user_id: 'user-2',
          permissions: { reservations: true, users: true, devices: true, cms: true, settings: true },
          is_super_admin: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          users: { id: 'user-2', email: 'super2@example.com', name: 'Super Admin 2', role: 'superadmin' }
        }
      ]

      mockSupabase.order.mockReturnValueOnce({ data: mockData, error: null })

      const result = await repository.findSuperAdmins()

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_super_admin', true)
      expect(result).toHaveLength(2)
      expect(result.every(admin => admin.isSuperAdmin)).toBe(true)
    })
  })

  describe('create', () => {
    it('관리자를 생성해야 한다', async () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123',
        permissions: {
          users: false,
          settings: true
        }
      })

      const mockData = {
        id: 'admin-123',
        user_id: 'user-123',
        permissions: admin.permissions.toJSON(),
        is_super_admin: false,
        created_at: admin.createdAt.toISOString(),
        updated_at: admin.updatedAt.toISOString(),
        users: {
          id: 'user-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        }
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockData, error: null })
      // Reset mocks for users table update
      mockSupabase.from.mockReturnValueOnce(mockSupabase)
      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce({ data: null, error: null })

      const result = await repository.create(admin)

      expect(mockSupabase.from).toHaveBeenCalledWith('admins')
      expect(mockSupabase.insert).toHaveBeenCalled()
      expect(result.id).toBe('admin-123')
    })

    it('생성 실패 시 에러를 발생시켜야 한다', async () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })

      mockSupabase.single.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Duplicate key' } 
      })

      await expect(repository.create(admin)).rejects.toThrow('Failed to create admin: Duplicate key')
    })
  })

  describe('update', () => {
    it('관리자 정보를 업데이트해야 한다', async () => {
      const admin = Admin.createRegularAdmin({
        id: 'admin-123',
        userId: 'user-123'
      })
      const updatedAdmin = admin.grantPermission('settings')

      const mockData = {
        id: 'admin-123',
        user_id: 'user-123',
        permissions: updatedAdmin.permissions.toJSON(),
        is_super_admin: false,
        created_at: admin.createdAt.toISOString(),
        updated_at: updatedAdmin.updatedAt.toISOString(),
        users: {
          id: 'user-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        }
      }

      // Mock 전체 체이닝을 다시 설정 (.update().eq().select().single())
      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({ data: mockData, error: null })
      
      // Reset mocks for users table update
      mockSupabase.from.mockReturnValueOnce(mockSupabase)
      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce({ data: null, error: null })

      const result = await repository.update(updatedAdmin)

      expect(mockSupabase.update).toHaveBeenCalledWith({
        permissions: updatedAdmin.permissions.toJSON(),
        is_super_admin: false,
        updated_at: updatedAdmin.updatedAt.toISOString()
      })
      expect(result.permissions.canManageSettings()).toBe(true)
    })
  })

  describe('delete', () => {
    it('일반 관리자를 삭제해야 한다', async () => {
      const mockAdmin = {
        id: 'admin-123',
        user_id: 'user-123',
        permissions: { reservations: true, users: true, devices: true, cms: true, settings: false },
        is_super_admin: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        users: {
          id: 'user-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        }
      }

      // findById mock (.select().eq().single())
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({ data: mockAdmin, error: null })
      // delete mock
      mockSupabase.from.mockReturnValueOnce(mockSupabase)
      mockSupabase.delete.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce({ data: null, error: null })
      // users update mock
      mockSupabase.from.mockReturnValueOnce(mockSupabase)
      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce({ data: null, error: null })

      await repository.delete('admin-123')

      expect(mockSupabase.delete).toHaveBeenCalled()
    })

    it('슈퍼관리자 삭제 시 에러를 발생시켜야 한다', async () => {
      const mockSuperAdmin = {
        id: 'admin-123',
        user_id: 'user-123',
        permissions: { reservations: true, users: true, devices: true, cms: true, settings: true },
        is_super_admin: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        users: {
          id: 'user-123',
          email: 'super@example.com',
          name: 'Super Admin',
          role: 'superadmin'
        }
      }

      // findById mock (.select().eq().single())
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({ data: mockSuperAdmin, error: null })

      await expect(repository.delete('admin-123')).rejects.toThrow('Cannot delete super admin')
    })
  })

  describe('count methods', () => {
    it('전체 관리자 수를 반환해야 한다', async () => {
      mockSupabase.select.mockReturnValueOnce({ count: 5, error: null })

      const result = await repository.count()

      expect(result).toBe(5)
    })

    it('슈퍼관리자 수를 반환해야 한다', async () => {
      mockSupabase.eq.mockReturnValueOnce({ count: 2, error: null })

      const result = await repository.countSuperAdmins()

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_super_admin', true)
      expect(result).toBe(2)
    })

    it('에러 발생 시 0을 반환해야 한다', async () => {
      mockSupabase.select.mockReturnValueOnce({ count: null, error: new Error('DB Error') })

      const result = await repository.count()

      expect(result).toBe(0)
    })
  })

  describe('exists methods', () => {
    it('존재하는 관리자의 경우 true를 반환해야 한다', async () => {
      mockSupabase.eq.mockReturnValueOnce({ count: 1, error: null })

      const result = await repository.exists('admin-123')

      expect(result).toBe(true)
    })

    it('존재하지 않는 관리자의 경우 false를 반환해야 한다', async () => {
      mockSupabase.eq.mockReturnValueOnce({ count: 0, error: null })

      const result = await repository.exists('non-existent')

      expect(result).toBe(false)
    })

    it('사용자 ID로 존재 여부를 확인해야 한다', async () => {
      mockSupabase.eq.mockReturnValueOnce({ count: 1, error: null })

      const result = await repository.existsByUserId('user-123')

      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toBe(true)
    })
  })
})