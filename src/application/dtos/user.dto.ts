export interface CreateUserDto {
  email: string
  fullName: string
  phone?: string | null
}

export interface UpdateUserDto {
  fullName?: string
  phone?: string | null
}

export interface UserResponseDto {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}