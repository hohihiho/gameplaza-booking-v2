import { Device } from '../../../domain/entities/device'
import { DeviceStatusType } from '../../../domain/value-objects/device-status'
import { IDeviceRepository } from '../../../domain/repositories/device.repository.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'

export interface ChangeDeviceStatusRequest {
  userId: string
  deviceId: string
  status: DeviceStatusType
  notes?: string
}

export interface ChangeDeviceStatusResponse {
  device: Device
  message: string
}

export class ChangeDeviceStatusUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly deviceRepository: IDeviceRepository
  ) {}

  async execute(request: ChangeDeviceStatusRequest): Promise<ChangeDeviceStatusResponse> {
    // 1. 사용자 확인 및 권한 검증
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 기기 상태를 변경할 수 있습니다')
    }

    // 2. 기기 조회
    const device = await this.deviceRepository.findById(request.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    // 3. 현재 상태와 동일한지 확인
    if (device.status.value === request.status) {
      return {
        device: device,
        message: `기기가 이미 ${device.status.getDisplayName()} 상태입니다`
      }
    }

    // 4. 상태별 특별한 처리
    let updatedDevice: Device
    
    switch (request.status) {
      case 'maintenance':
        if (!request.notes) {
          throw new Error('점검 사유를 입력해주세요')
        }
        updatedDevice = device.startMaintenance(request.notes)
        break
        
      case 'broken':
        if (!request.notes) {
          throw new Error('고장 사유를 입력해주세요')
        }
        updatedDevice = device.markAsBroken(request.notes)
        break
        
      case 'in_use':
        updatedDevice = device.startUsing()
        break
        
      case 'available':
        if (device.status.value === 'maintenance') {
          updatedDevice = device.endMaintenance()
        } else if (device.status.value === 'in_use') {
          updatedDevice = device.endUsing()
        } else if (device.status.value === 'reserved') {
          updatedDevice = device.release()
        } else {
          updatedDevice = device.changeStatus('available', request.notes)
        }
        break
        
      case 'reserved':
        updatedDevice = device.reserve()
        break
        
      default:
        throw new Error(`지원하지 않는 상태입니다: ${request.status}`)
    }

    // 5. 기기 상태 업데이트
    const savedDevice = await this.deviceRepository.update(updatedDevice)

    return {
      device: savedDevice,
      message: `기기 상태가 ${savedDevice.status.getDisplayName()}(으)로 변경되었습니다`
    }
  }
}