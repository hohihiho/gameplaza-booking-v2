import { Session, DeviceInfo } from '../session'
import { AuthToken } from '../../value-objects/auth-token'

describe('Session', () => {
  const mockUserId = 'user-123'
  const mockDeviceInfo: DeviceInfo = {
    type: 'mobile',
    os: 'iOS',
    browser: 'Safari'
  }
  const mockIpAddress = '192.168.1.1'
  const mockUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)'

  describe('create', () => {
    it('새로운 세션을 생성해야 한다', () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1시간 후
      
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        deviceInfo: mockDeviceInfo,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        expiresAt
      })

      expect(session.id).toBe('session-123')
      expect(session.userId).toBe(mockUserId)
      expect(session.deviceInfo).toEqual(mockDeviceInfo)
      expect(session.ipAddress).toBe(mockIpAddress)
      expect(session.userAgent).toBe(mockUserAgent)
      expect(session.expiresAt).toEqual(expiresAt)
      expect(session.isActive).toBe(true)
    })

    it('기본값으로 세션을 생성해야 한다', () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
      
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt
      })

      expect(session.deviceInfo).toBeUndefined()
      expect(session.ipAddress).toBeUndefined()
      expect(session.userAgent).toBeUndefined()
      expect(session.createdAt).toBeDefined()
      expect(session.lastActivityAt).toBeDefined()
      expect(session.isActive).toBe(true)
    })
  })

  describe('createWithToken', () => {
    it('토큰과 함께 세션을 생성해야 한다', () => {
      const tokenValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
      const token = AuthToken.create(tokenValue, expiresAt)

      const session = Session.createWithToken(
        mockUserId,
        token,
        mockDeviceInfo,
        mockIpAddress,
        mockUserAgent
      )

      expect(session.id).toMatch(/^session-\d+-[a-z0-9]+$/)
      expect(session.userId).toBe(mockUserId)
      expect(session.expiresAt).toEqual(token.expiresAt)
      expect(session.deviceInfo).toEqual(mockDeviceInfo)
    })
  })

  describe('isExpired', () => {
    it('만료된 세션을 감지해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() - 1000) // 1초 전
      })

      expect(session.isExpired()).toBe(true)
    })

    it('비활성화된 세션을 만료로 처리해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isActive: false
      })

      expect(session.isExpired()).toBe(true)
    })

    it('유효한 세션을 감지해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      })

      expect(session.isExpired()).toBe(false)
    })
  })

  describe('needsRefresh', () => {
    it('갱신이 필요한 세션을 감지해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000) // 20분 후 (30분 미만)
      })

      expect(session.needsRefresh()).toBe(true)
    })

    it('갱신이 필요 없는 세션을 감지해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1시간 후
      })

      expect(session.needsRefresh()).toBe(false)
    })
  })

  describe('getInactiveSeconds', () => {
    it('비활성 시간을 계산해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        lastActivityAt: new Date(Date.now() - 5 * 60 * 1000) // 5분 전
      })

      const inactiveSeconds = session.getInactiveSeconds()
      expect(inactiveSeconds).toBeGreaterThanOrEqual(300) // 5분 = 300초
      expect(inactiveSeconds).toBeLessThan(310) // 약간의 오차 허용
    })
  })

  describe('updateActivity', () => {
    it('활동 시간을 업데이트해야 한다', () => {
      const originalSession = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        lastActivityAt: new Date(Date.now() - 5 * 60 * 1000)
      })

      const now = new Date()
      const updatedSession = originalSession.updateActivity(now)

      expect(updatedSession.lastActivityAt).toEqual(now)
      expect(updatedSession.id).toBe(originalSession.id)
      expect(updatedSession.userId).toBe(originalSession.userId)
    })
  })

  describe('extend', () => {
    it('만료 시간을 연장해야 한다', () => {
      const originalExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30분 후
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: originalExpiry
      })

      const extendedSession = session.extend(30) // 30분 추가

      const expectedExpiry = new Date(originalExpiry.getTime() + 30 * 60 * 1000)
      expect(extendedSession.expiresAt).toEqual(expectedExpiry)
    })
  })

  describe('deactivate', () => {
    it('세션을 비활성화해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      })

      const deactivatedSession = session.deactivate()

      expect(deactivatedSession.isActive).toBe(false)
      expect(deactivatedSession.isExpired()).toBe(true)
    })
  })

  describe('updateInfo', () => {
    it('세션 정보를 업데이트해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      })

      const newDeviceInfo: DeviceInfo = {
        type: 'desktop',
        os: 'Windows',
        browser: 'Chrome'
      }
      const newIpAddress = '10.0.0.1'

      const updatedSession = session.updateInfo(
        newDeviceInfo,
        newIpAddress,
        'New User Agent'
      )

      expect(updatedSession.deviceInfo).toEqual(newDeviceInfo)
      expect(updatedSession.ipAddress).toBe(newIpAddress)
      expect(updatedSession.userAgent).toBe('New User Agent')
    })
  })

  describe('isMobileDevice', () => {
    it('모바일 디바이스를 감지해야 한다', () => {
      const mobileSession = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        deviceInfo: { type: 'mobile' }
      })

      const tabletSession = Session.create({
        id: 'session-456',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        deviceInfo: { type: 'tablet' }
      })

      expect(mobileSession.isMobileDevice()).toBe(true)
      expect(tabletSession.isMobileDevice()).toBe(true)
    })

    it('데스크톱 디바이스를 구별해야 한다', () => {
      const desktopSession = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        deviceInfo: { type: 'desktop' }
      })

      expect(desktopSession.isMobileDevice()).toBe(false)
    })
  })

  describe('isSameDevice', () => {
    it('동일한 디바이스를 감지해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        deviceInfo: mockDeviceInfo,
        userAgent: mockUserAgent
      })

      expect(session.isSameDevice(mockDeviceInfo, mockUserAgent)).toBe(true)
    })

    it('다른 디바이스를 구별해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        deviceInfo: mockDeviceInfo,
        userAgent: mockUserAgent
      })

      const differentDevice: DeviceInfo = {
        type: 'desktop',
        os: 'Windows',
        browser: 'Chrome'
      }

      expect(session.isSameDevice(differentDevice, 'Different Agent')).toBe(false)
    })

    it('디바이스 정보가 없으면 false를 반환해야 한다', () => {
      const session = Session.create({
        id: 'session-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      })

      expect(session.isSameDevice(mockDeviceInfo, mockUserAgent)).toBe(false)
    })
  })
})