import { User } from '../../domain/entities/user'
import { UserResponseDto } from '../dtos/user.dto'

export class UserMapper {
  toDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }
  }
}