import { Device } from '../../../domain/entities/device'
import { IDeviceRepository, IDeviceTypeRepository } from '../../../domain/repositories/device.repository.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'

export interface CreateDeviceRequest {
  userId: string
  deviceTypeId: string
  deviceNumber: string
  location?: string
  serialNumber?: string
  purchaseDate?: string // ISO string
  notes?: string
}

export interface CreateDeviceResponse {
  device: Device
  message: string
}

export class CreateDeviceUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly deviceRepository: IDeviceRepository,
    private readonly deviceTypeRepository: IDeviceTypeRepository
  ) {}

  async execute(request: CreateDeviceRequest): Promise<CreateDeviceResponse> {
    // 1. 사용자 확인 및 권한 검증
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 기기를 등록할 수 있습니다')
    }

    // 2. 기기 타입 존재 여부 확인
    const deviceType = await this.deviceTypeRepository.findById(request.deviceTypeId)
    if (!deviceType) {
      throw new Error('존재하지 않는 기기 타입입니다')
    }

    // 3. 기기 번호 중복 확인
    const isDuplicate = await this.deviceRepository.existsByDeviceNumber(request.deviceNumber)
    if (isDuplicate) {
      throw new Error(`기기 번호 ${request.deviceNumber}는 이미 사용 중입니다`)
    }

    // 4. 기기 번호 형식 검증
    if (!this.isValidDeviceNumber(request.deviceNumber)) {
      throw new Error('기기 번호는 영문자, 숫자, 하이픈(-)만 사용 가능합니다')
    }

    // 5. 기기 생성
    const device = Device.create({
      id: this.generateId(),
      deviceTypeId: request.deviceTypeId,
      deviceNumber: request.deviceNumber,
      location: request.location,
      serialNumber: request.serialNumber,
      purchaseDate: request.purchaseDate ? new Date(request.purchaseDate) : undefined,
      notes: request.notes
    })

    // 6. 기기 저장
    const savedDevice = await this.deviceRepository.save(device)

    return {
      device: savedDevice,
      message: `기기 ${request.deviceNumber}가 성공적으로 등록되었습니다`
    }
  }

  private isValidDeviceNumber(deviceNumber: string): boolean {
    // 영문자, 숫자, 하이픈만 허용
    const pattern = /^[A-Za-z0-9-]+$/
    return pattern.test(deviceNumber) && deviceNumber.length >= 3 && deviceNumber.length <= 20
  }

  private generateId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}