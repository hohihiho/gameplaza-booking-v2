import { Device } from '../../../domain/entities/device'
import { DeviceStatusType } from '../../../domain/value-objects/device-status'
import { IDeviceRepository } from '../../../domain/repositories/device.repository.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'

export interface GetDevicesRequest {
  userId: string
  status?: DeviceStatusType
  deviceTypeId?: string
  location?: string
}

export interface GetDevicesResponse {
  devices: Device[]
  total: number
  summary: {
    available: number
    inUse: number
    reserved: number
    maintenance: number
    broken: number
  }
}

export class GetDevicesUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly deviceRepository: IDeviceRepository
  ) {}

  async execute(request: GetDevicesRequest): Promise<GetDevicesResponse> {
    // 1. 사용자 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 필터링에 따른 기기 조회
    let devices: Device[]
    
    if (request.status) {
      devices = await this.deviceRepository.findByStatus(request.status)
    } else if (request.deviceTypeId) {
      devices = await this.deviceRepository.findByTypeId(request.deviceTypeId)
    } else if (request.location) {
      devices = await this.deviceRepository.findByLocation(request.location)
    } else {
      devices = await this.deviceRepository.findAll()
    }

    // 3. 추가 필터링 적용
    if (request.deviceTypeId && !request.status) {
      devices = devices.filter(device => device.deviceTypeId === request.deviceTypeId)
    }
    if (request.location && !request.status && !request.deviceTypeId) {
      devices = devices.filter(device => device.location === request.location)
    }

    // 4. 정렬 (기기 번호 순)
    devices.sort((a, b) => a.deviceNumber.localeCompare(b.deviceNumber))

    // 5. 요약 정보 생성
    const summary = {
      available: 0,
      inUse: 0,
      reserved: 0,
      maintenance: 0,
      broken: 0
    }

    // 전체 기기로 요약 정보 계산 (필터링과 관계없이)
    const allDevices = await this.deviceRepository.findAll()
    allDevices.forEach(device => {
      switch (device.status.value) {
        case 'available':
          summary.available++
          break
        case 'in_use':
          summary.inUse++
          break
        case 'reserved':
          summary.reserved++
          break
        case 'maintenance':
          summary.maintenance++
          break
        case 'broken':
          summary.broken++
          break
      }
    })

    return {
      devices,
      total: devices.length,
      summary
    }
  }
}