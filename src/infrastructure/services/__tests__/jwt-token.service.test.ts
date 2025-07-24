import { JWTTokenService } from '../jwt-token.service'
import jwt from 'jsonwebtoken'

describe('JWTTokenService', () => {
  let service: JWTTokenService
  const accessTokenSecret = 'test-access-secret'
  const refreshTokenSecret = 'test-refresh-secret'
  const issuer = 'test-issuer'

  beforeEach(() => {
    service = new JWTTokenService(accessTokenSecret, refreshTokenSecret, issuer)
  })

  describe('generateToken', () => {
    it('액세스 토큰을 생성해야 한다', async () => {
      const payload = { userId: 'user-123', role: 'user' }
      
      const token = await service.generateToken(payload, { type: 'access' })
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      
      // 토큰 검증
      const decoded = jwt.verify(token, accessTokenSecret) as any
      expect(decoded.userId).toBe('user-123')
      expect(decoded.role).toBe('user')
      expect(decoded.iss).toBe(issuer)
    })

    it('리프레시 토큰을 생성해야 한다', async () => {
      const payload = { userId: 'user-123' }
      
      const token = await service.generateToken(payload, { type: 'refresh' })
      
      expect(token).toBeDefined()
      
      // 토큰 검증
      const decoded = jwt.verify(token, refreshTokenSecret) as any
      expect(decoded.userId).toBe('user-123')
      expect(decoded.iss).toBe(issuer)
    })

    it('커스텀 만료 시간을 설정할 수 있어야 한다', async () => {
      const payload = { userId: 'user-123' }
      
      const token = await service.generateToken(payload, { 
        type: 'access',
        expiresIn: '30m'
      })
      
      const decoded = jwt.decode(token) as any
      const now = Math.floor(Date.now() / 1000)
      const expiryTime = decoded.exp - decoded.iat
      
      // 30분 = 1800초
      expect(expiryTime).toBe(1800)
    })
  })

  describe('verifyToken', () => {
    it('유효한 액세스 토큰을 검증해야 한다', async () => {
      const payload = { userId: 'user-123', role: 'user' }
      const token = jwt.sign(payload, accessTokenSecret, { issuer })
      
      const decoded = await service.verifyToken(token, { type: 'access' })
      
      expect(decoded.userId).toBe('user-123')
      expect(decoded.role).toBe('user')
    })

    it('유효한 리프레시 토큰을 검증해야 한다', async () => {
      const payload = { userId: 'user-123' }
      const token = jwt.sign(payload, refreshTokenSecret, { issuer })
      
      const decoded = await service.verifyToken(token, { type: 'refresh' })
      
      expect(decoded.userId).toBe('user-123')
    })

    it('만료된 토큰은 에러가 발생해야 한다', async () => {
      const payload = { userId: 'user-123' }
      const token = jwt.sign(payload, accessTokenSecret, { 
        issuer,
        expiresIn: '-1h' // 이미 만료됨
      })
      
      await expect(service.verifyToken(token)).rejects.toThrow()
    })

    it('잘못된 서명은 에러가 발생해야 한다', async () => {
      const payload = { userId: 'user-123' }
      const token = jwt.sign(payload, 'wrong-secret', { issuer })
      
      await expect(service.verifyToken(token)).rejects.toThrow()
    })
  })

  describe('generateAccessToken', () => {
    it('액세스 토큰을 생성해야 한다', async () => {
      const token = await service.generateAccessToken(
        'user-123',
        'test@example.com',
        'user',
        'session-123'
      )
      
      const decoded = jwt.decode(token) as any
      
      expect(decoded.sub).toBe('user-123')
      expect(decoded.email).toBe('test@example.com')
      expect(decoded.role).toBe('user')
      expect(decoded.sessionId).toBe('session-123')
      expect(decoded.type).toBe('access')
    })
  })

  describe('generateRefreshToken', () => {
    it('리프레시 토큰을 생성해야 한다', async () => {
      const token = await service.generateRefreshToken('user-123', 'session-123')
      
      const decoded = jwt.decode(token) as any
      
      expect(decoded.sub).toBe('user-123')
      expect(decoded.sessionId).toBe('session-123')
      expect(decoded.type).toBe('refresh')
    })
  })

  describe('verifyAccessToken', () => {
    it('액세스 토큰을 검증하고 페이로드를 반환해야 한다', async () => {
      const token = await service.generateAccessToken(
        'user-123',
        'test@example.com',
        'user',
        'session-123'
      )
      
      const payload = await service.verifyAccessToken(token)
      
      expect(payload.sub).toBe('user-123')
      expect(payload.email).toBe('test@example.com')
      expect(payload.role).toBe('user')
      expect(payload.sessionId).toBe('session-123')
      expect(payload.iat).toBeDefined()
      expect(payload.exp).toBeDefined()
    })

    it('필수 필드가 없으면 에러가 발생해야 한다', async () => {
      const token = jwt.sign({ sub: 'user-123' }, accessTokenSecret, { issuer })
      
      await expect(service.verifyAccessToken(token)).rejects.toThrow('Invalid access token payload')
    })
  })

  describe('verifyRefreshToken', () => {
    it('리프레시 토큰을 검증하고 페이로드를 반환해야 한다', async () => {
      const token = await service.generateRefreshToken('user-123', 'session-123')
      
      const payload = await service.verifyRefreshToken(token)
      
      expect(payload.sub).toBe('user-123')
      expect(payload.sessionId).toBe('session-123')
      expect(payload.iat).toBeDefined()
      expect(payload.exp).toBeDefined()
    })
  })

  describe('decodeToken', () => {
    it('토큰을 검증 없이 디코드해야 한다', () => {
      const payload = { userId: 'user-123', role: 'user' }
      const token = jwt.sign(payload, 'any-secret')
      
      const decoded = service.decodeToken(token)
      
      expect(decoded.userId).toBe('user-123')
      expect(decoded.role).toBe('user')
    })

    it('잘못된 토큰은 null을 반환해야 한다', () => {
      const decoded = service.decodeToken('invalid-token')
      
      expect(decoded).toBeNull()
    })
  })

  describe('getTokenExpiry', () => {
    it('토큰 만료 시간을 반환해야 한다', () => {
      const expiryTime = Math.floor(Date.now() / 1000) + 3600 // 1시간 후
      const token = jwt.sign({ exp: expiryTime }, accessTokenSecret)
      
      const expiry = service.getTokenExpiry(token)
      
      expect(expiry).toBeInstanceOf(Date)
      expect(expiry?.getTime()).toBe(expiryTime * 1000)
    })

    it('만료 시간이 없으면 null을 반환해야 한다', () => {
      const token = jwt.sign({ userId: 'user-123' }, accessTokenSecret)
      
      const expiry = service.getTokenExpiry(token)
      
      expect(expiry).toBeNull()
    })
  })

  describe('getTokenIssuedAt', () => {
    it('토큰 발급 시간을 반환해야 한다', () => {
      const issuedAt = Math.floor(Date.now() / 1000)
      const token = jwt.sign({ iat: issuedAt }, accessTokenSecret)
      
      const iat = service.getTokenIssuedAt(token)
      
      expect(iat).toBeInstanceOf(Date)
      expect(iat?.getTime()).toBe(issuedAt * 1000)
    })
  })
})