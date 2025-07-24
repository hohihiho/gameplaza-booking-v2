/**
 * Google OAuth 프로필 정보
 */
export interface GoogleProfileDto {
  id: string
  email: string
  name: string
  given_name?: string
  family_name?: string
  picture?: string
  email_verified?: boolean
  locale?: string
}

/**
 * 인증 요청 DTO
 */
export interface AuthRequestDto {
  googleIdToken: string
  deviceInfo?: {
    type?: 'mobile' | 'tablet' | 'desktop' | 'unknown'
    os?: string
    browser?: string
  }
  ipAddress?: string
  userAgent?: string
}

/**
 * 인증 응답 DTO
 */
export interface AuthResponseDto {
  accessToken: string
  refreshToken?: string
  expiresIn: number // seconds
  tokenType: string
  user: AuthUserDto
  session: AuthSessionDto
}

/**
 * 인증된 사용자 정보 DTO
 */
export interface AuthUserDto {
  id: string
  email: string
  fullName: string
  phone?: string | null
  role: 'user' | 'admin'
  status: 'active' | 'suspended' | 'banned'
  profileImageUrl?: string | null
  isNewUser: boolean
}

/**
 * 세션 정보 DTO
 */
export interface AuthSessionDto {
  id: string
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  createdAt: string
  expiresAt: string
}

/**
 * 토큰 갱신 요청 DTO
 */
export interface RefreshTokenRequestDto {
  refreshToken: string
}

/**
 * 토큰 갱신 응답 DTO
 */
export interface RefreshTokenResponseDto {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
}

/**
 * 로그아웃 요청 DTO
 */
export interface LogoutRequestDto {
  sessionId?: string
  allDevices?: boolean
}

/**
 * 프로필 업데이트 요청 DTO
 */
export interface UpdateProfileRequestDto {
  fullName?: string
  phone?: string | null
  birthDate?: string | null // YYYY-MM-DD
}

/**
 * 사용자 프로필 DTO
 */
export interface UserProfileDto {
  id: string
  email: string
  fullName: string
  phone?: string | null
  birthDate?: string | null
  profileImageUrl?: string | null
  role: 'user' | 'admin'
  status: 'active' | 'suspended' | 'banned'
  googleConnected: boolean
  createdAt: string
  lastLoginAt?: string | null
}