import { NotificationSupabaseRepository } from '../notification.supabase.repository'
import { Notification, NotificationType } from '@/src/domain/entities/notification'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
} as any

describe('NotificationSupabaseRepository', () => {
  let repository: NotificationSupabaseRepository
  
  beforeEach(() => {
    repository = new NotificationSupabaseRepository(mockSupabase)
    jest.clearAllMocks()
  })

  const createMockNotificationData = () => ({
    id: 'test-id',
    user_id: 'user-123',
    type: 'reservation_created' as NotificationType,
    title: '예약 완료',
    body: '예약이 완료되었습니다',
    data: { reservationId: 'res-123' },
    channels: ['push', 'in_app'],
    priority: 'medium',
    scheduled_for: null,
    sent_at: null,
    read_at: null,
    failed_channels: null,
    created_at: '2025-01-24T10:00:00Z',
    updated_at: '2025-01-24T10:00:00Z'
  })

  describe('findById', () => {
    it('should find notification by id', async () => {
      const mockData = createMockNotificationData()
      mockSupabase.single.mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.findById('test-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-id')
      expect(result).toBeInstanceOf(Notification)
      expect(result?.id).toBe('test-id')
    })

    it('should return null when notification not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should find notifications by user id with filters', async () => {
      const mockData = [createMockNotificationData()]
      mockSupabase.single = undefined // range query doesn't use single
      
      // Mock the chained query methods
      const mockQuery = {
        ...mockSupabase,
        range: jest.fn().mockResolvedValueOnce({ data: mockData, error: null, count: 1 })
      }
      
      // Reset and set up the chain
      Object.assign(mockSupabase, mockQuery)

      const result = await repository.findByUserId('user-123', {
        type: ['reservation_created'],
        read: false,
        page: 1,
        pageSize: 20
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' })
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result.notifications).toHaveLength(1)
      expect(result.totalCount).toBe(1)
    })
  })

  describe('save', () => {
    it('should save a new notification', async () => {
      const notification = Notification.create({
        id: 'test-id',
        userId: 'user-123',
        type: 'reservation_created',
        title: '예약 완료',
        body: '예약이 완료되었습니다',
        channels: ['push', 'in_app'],
        priority: 'medium'
      })

      const mockData = createMockNotificationData()
      // save 체인의 끝: insert().select().single()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.save(notification)

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.insert).toHaveBeenCalled()
      expect(mockSupabase.select).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Notification)
    })

    it('should throw error when save fails', async () => {
      const notification = Notification.create({
        id: 'test-id',
        userId: 'user-123',
        type: 'reservation_created',
        title: '예약 완료',
        body: '예약이 완료되었습니다',
        channels: ['push', 'in_app'],
        priority: 'medium'
      })

      const mockError = new Error('Database error')
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: null, error: mockError })

      await expect(repository.save(notification)).rejects.toThrow('Database error')
    })
  })

  describe('update', () => {
    it('should update an existing notification', async () => {
      const notification = Notification.create({
        id: 'test-id',
        userId: 'user-123',
        type: 'reservation_created',
        title: '예약 완료',
        body: '예약이 완료되었습니다',
        channels: ['push', 'in_app'],
        priority: 'medium'
      })

      // Mark as read
      notification.markAsRead()

      const mockData = createMockNotificationData()
      // update 체인의 끝: update().eq().select().single()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.update(notification)

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-id')
      expect(result).toBeInstanceOf(Notification)
    })
  })

  describe('markAsRead', () => {
    it('should mark notifications as read', async () => {
      // markAsRead 체인의 끝: update().eq().in()
      mockSupabase.in = jest.fn().mockResolvedValueOnce({ error: null })

      await repository.markAsRead('user-123', ['notif-1', 'notif-2'])

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        read_at: expect.any(String),
        updated_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockSupabase.in).toHaveBeenCalledWith('id', ['notif-1', 'notif-2'])
    })
  })

  describe('countUnread', () => {
    it('should count unread notifications', async () => {
      // countUnread 체인의 끝: select().eq().is()
      mockSupabase.is = jest.fn().mockResolvedValueOnce({ count: 5, error: null })

      const result = await repository.countUnread('user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockSupabase.is).toHaveBeenCalledWith('read_at', null)
      expect(result).toBe(5)
    })
  })

  describe('findScheduledNotifications', () => {
    beforeEach(() => {
      // findScheduledNotifications 체인을 완전히 재설정
      mockSupabase.not = jest.fn().mockReturnThis()
      mockSupabase.is = jest.fn().mockReturnThis()
      mockSupabase.lte = jest.fn().mockReturnThis()
      mockSupabase.order = jest.fn().mockResolvedValue({ data: [], error: null })
    })

    it('should find notifications scheduled before given time', async () => {
      const mockData = [createMockNotificationData()]
      const beforeTime = KSTDateTime.now()
      
      // findScheduledNotifications 체인의 끝: select().not().is().lte().order()
      mockSupabase.order.mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.findScheduledNotifications(beforeTime)

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.not).toHaveBeenCalledWith('scheduled_for', 'is', null)
      expect(mockSupabase.is).toHaveBeenCalledWith('sent_at', null)
      expect(mockSupabase.lte).toHaveBeenCalledWith('scheduled_for', beforeTime.toISOString())
      expect(result).toHaveLength(1)
    })
  })

  describe('domain entity mapping', () => {
    it('should correctly map DB data to domain entity', async () => {
      const mockData = createMockNotificationData()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      const result = await repository.findById('test-id')

      expect(result).toBeInstanceOf(Notification)
      expect(result!.userId).toBe('user-123')
      expect(result!.type).toBe('reservation_created')
      expect(result!.title).toBe('예약 완료')
      expect(result!.body).toBe('예약이 완료되었습니다')
      expect(result!.channels).toEqual(['push', 'in_app'])
      expect(result!.priority).toBe('medium')
    })

    it('should correctly map domain entity to DB DTO', async () => {
      const notification = Notification.create({
        id: 'test-id',
        userId: 'user-123',
        type: 'reservation_created',
        title: '예약 완료',
        body: '예약이 완료되었습니다',
        channels: ['push', 'in_app'],
        priority: 'medium'
      })

      const mockData = createMockNotificationData()
      mockSupabase.single = jest.fn().mockResolvedValueOnce({ data: mockData, error: null })

      await repository.save(notification)

      // Check that insert was called with correct DTO structure
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall).toMatchObject({
        id: 'test-id',
        user_id: 'user-123',
        type: 'reservation_created',
        title: '예약 완료',
        body: '예약이 완료되었습니다',
        channels: ['push', 'in_app'],
        priority: 'medium'
      })
    })
  })
})