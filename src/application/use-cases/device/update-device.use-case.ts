import { Device } from '../../../domain/entities/device'
import { IDeviceRepository } from '../../../domain/repositories/device.repository.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'

export interface UpdateDeviceRequest {
  userId: string
  deviceId: string
  deviceNumber?: string
  location?: string
  serialNumber?: string
  purchaseDate?: string // ISO string
  notes?: string
}

export interface UpdateDeviceResponse {
  device: Device
  message: string
}

export class UpdateDeviceUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly deviceRepository: IDeviceRepository
  ) {}

  async execute(request: UpdateDeviceRequest): Promise<UpdateDeviceResponse> {
    // 1. 사용자 확인 및 권한 검증
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 기기 정보를 수정할 수 있습니다')
    }

    // 2. 기기 조회
    const device = await this.deviceRepository.findById(request.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    // 3. 기기 번호 변경 시 중복 확인
    let updatedDevice = device
    
    if (request.deviceNumber && request.deviceNumber !== device.deviceNumber) {
      if (!this.isValidDeviceNumber(request.deviceNumber)) {
        throw new Error('기기 번호는 영문자, 숫자, 하이픈(-)만 사용 가능합니다')
      }

      const isDuplicate = await this.deviceRepository.existsByDeviceNumber(
        request.deviceNumber,
        request.deviceId
      )
      if (isDuplicate) {
        throw new Error(`기기 번호 ${request.deviceNumber}는 이미 사용 중입니다`)
      }

      // 기기 번호는 엔티티에서 직접 변경할 수 없으므로 새로운 기기 생성
      updatedDevice = Device.create({
        id: device.id,
        deviceTypeId: device.deviceTypeId,
        deviceNumber: request.deviceNumber,
        status: device.status,
        location: device.location,
        serialNumber: device.serialNumber,
        purchaseDate: device.purchaseDate,
        lastMaintenanceDate: device.lastMaintenanceDate,
        notes: device.notes,
        createdAt: device.createdAt,
        updatedAt: new Date()
      })
    }

    // 4. 위치 변경
    if (request.location !== undefined && request.location !== device.location) {
      updatedDevice = updatedDevice.changeLocation(request.location)
    }

    // 5. 시리얼 번호 변경
    if (request.serialNumber !== undefined && request.serialNumber !== device.serialNumber) {
      updatedDevice = updatedDevice.updateSerialNumber(request.serialNumber)
    }

    // 6. 구매일자 변경
    if (request.purchaseDate !== undefined) {
      const purchaseDate = request.purchaseDate ? new Date(request.purchaseDate) : null
      if (purchaseDate?.getTime() !== device.purchaseDate?.getTime()) {
        // 구매일자는 직접 변경 메서드가 없으므로 새로운 기기 생성
        updatedDevice = Device.create({
          id: updatedDevice.id,
          deviceTypeId: updatedDevice.deviceTypeId,
          deviceNumber: updatedDevice.deviceNumber,
          status: updatedDevice.status,
          location: updatedDevice.location,
          serialNumber: updatedDevice.serialNumber,
          purchaseDate: purchaseDate,
          lastMaintenanceDate: updatedDevice.lastMaintenanceDate,
          notes: updatedDevice.notes,
          createdAt: updatedDevice.createdAt,
          updatedAt: new Date()
        })
      }
    }

    // 7. 메모 변경
    if (request.notes !== undefined && request.notes !== device.notes) {
      updatedDevice = updatedDevice.updateNotes(request.notes || null)
    }

    // 8. 변경사항이 있는 경우에만 저장
    if (updatedDevice !== device) {
      const savedDevice = await this.deviceRepository.update(updatedDevice)
      return {
        device: savedDevice,
        message: '기기 정보가 성공적으로 수정되었습니다'
      }
    }

    return {
      device: device,
      message: '변경사항이 없습니다'
    }
  }

  private isValidDeviceNumber(deviceNumber: string): boolean {
    // 영문자, 숫자, 하이픈만 허용
    const pattern = /^[A-Za-z0-9-]+$/
    return pattern.test(deviceNumber) && deviceNumber.length >= 3 && deviceNumber.length <= 20
  }
}