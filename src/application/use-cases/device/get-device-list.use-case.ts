import { Device, DeviceStatus, DeviceType } from '@/src/domain/entities/device.entity'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'

export interface GetDeviceListRequest {
  status?: DeviceStatus
  type?: DeviceType
  includeInactive?: boolean
}

export interface GetDeviceListResponse {
  devices: Device[]
  total: number
}

/**
 * 기기 목록 조회 유스케이스
 */
export class GetDeviceListUseCase {
  constructor(private deviceRepository: DeviceRepository) {}

  async execute(request: GetDeviceListRequest): Promise<GetDeviceListResponse> {
    let devices: Device[]

    // 1. 기본적으로 모든 기기 조회
    devices = await this.deviceRepository.findAll()

    // 2. 필터링 적용
    if (request.status) {
      devices = devices.filter(device => device.status === request.status)
    }

    if (request.type) {
      devices = devices.filter(device => device.type === request.type)
    }

    // 3. 비활성 기기 포함 여부 (기본값: false)
    if (!request.includeInactive) {
      devices = devices.filter(device => device.status !== 'inactive')
    }

    // 4. 기기 번호 순으로 정렬
    devices.sort((a, b) => a.deviceNumber.localeCompare(b.deviceNumber))

    return {
      devices,
      total: devices.length
    }
  }
}