import { AuthToken } from '../auth-token'

describe('AuthToken', () => {
  describe('create', () => {
    it('유효한 토큰을 생성해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1시간 후

      const authToken = AuthToken.create(token, expiresAt)

      expect(authToken.value).toBe(token)
      expect(authToken.type).toBe('Bearer')
      expect(authToken.expiresAt).toEqual(expiresAt)
    })

    it('빈 토큰으로 생성하면 에러가 발생해야 한다', () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      expect(() => {
        AuthToken.create('', expiresAt)
      }).toThrow('Token value cannot be empty')
    })

    it('잘못된 JWT 형식이면 에러가 발생해야 한다', () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      expect(() => {
        AuthToken.create('invalid-token', expiresAt)
      }).toThrow('Invalid JWT token format')
    })

    it('잘못된 만료 시간이면 에러가 발생해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

      expect(() => {
        AuthToken.create(token, new Date('invalid'))
      }).toThrow('Invalid expiration date')
    })
  })

  describe('fromString', () => {
    it('Authorization 헤더에서 토큰을 추출해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const authHeader = `Bearer ${token}`

      const authToken = AuthToken.fromString(authHeader)

      expect(authToken.value).toBe(token)
      expect(authToken.type).toBe('Bearer')
    })

    it('잘못된 헤더 형식이면 에러가 발생해야 한다', () => {
      expect(() => {
        AuthToken.fromString('InvalidHeader')
      }).toThrow('Invalid authorization header format')

      expect(() => {
        AuthToken.fromString('Basic token')
      }).toThrow('Invalid authorization header format')
    })
  })

  describe('toAuthorizationHeader', () => {
    it('Authorization 헤더 형식으로 변환해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      const authToken = AuthToken.create(token, expiresAt)
      const header = authToken.toAuthorizationHeader()

      expect(header).toBe(`Bearer ${token}`)
    })
  })

  describe('isExpired', () => {
    it('만료된 토큰을 감지해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() - 1000) // 1초 전

      const authToken = AuthToken.create(token, expiresAt)

      expect(authToken.isExpired()).toBe(true)
    })

    it('유효한 토큰을 감지해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1시간 후

      const authToken = AuthToken.create(token, expiresAt)

      expect(authToken.isExpired()).toBe(false)
    })
  })

  describe('needsRefresh', () => {
    it('갱신이 필요한 토큰을 감지해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() + 4 * 60 * 1000) // 4분 후 (5분 미만)

      const authToken = AuthToken.create(token, expiresAt)

      expect(authToken.needsRefresh()).toBe(true)
    })

    it('갱신이 필요 없는 토큰을 감지해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1시간 후

      const authToken = AuthToken.create(token, expiresAt)

      expect(authToken.needsRefresh()).toBe(false)
    })
  })

  describe('getSecondsUntilExpiry', () => {
    it('만료까지 남은 시간을 계산해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1시간 후

      const authToken = AuthToken.create(token, expiresAt)
      const seconds = authToken.getSecondsUntilExpiry()

      expect(seconds).toBeGreaterThan(3500) // 약 1시간
      expect(seconds).toBeLessThanOrEqual(3600)
    })

    it('만료된 토큰은 0을 반환해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() - 1000) // 1초 전

      const authToken = AuthToken.create(token, expiresAt)

      expect(authToken.getSecondsUntilExpiry()).toBe(0)
    })
  })

  describe('equals', () => {
    it('동일한 토큰을 비교해야 한다', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      const authToken1 = AuthToken.create(token, expiresAt)
      const authToken2 = AuthToken.create(token, new Date(expiresAt))

      expect(authToken1.equals(authToken2)).toBe(true)
    })

    it('다른 토큰을 구별해야 한다', () => {
      const token1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const token2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOTg3NjU0MzIxIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.abc123'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      const authToken1 = AuthToken.create(token1, expiresAt)
      const authToken2 = AuthToken.create(token2, expiresAt)

      expect(authToken1.equals(authToken2)).toBe(false)
    })
  })
})