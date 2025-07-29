import { DeviceTypeRepository } from '../../../domain/repositories/device-type.repository.interface'
import { IDeviceRepository } from '../../../domain/repositories/device.repository.interface'

export class DeleteDeviceTypeUseCase {
  constructor(
    private readonly typeRepository: DeviceTypeRepository,
    private readonly deviceRepository: DeviceRepository
  ) {}

  async execute(typeId: string): Promise<void> {
    // 타입 존재 확인
    const type = await this.typeRepository.findById(typeId)
    if (!type) {
      throw new Error('존재하지 않는 기기 타입입니다')
    }

    // 하위 기기 확인
    const deviceCount = await this.deviceRepository.countByDeviceTypeId(typeId)
    if (deviceCount > 0) {
      throw new Error(`${deviceCount}개의 등록된 기기가 존재하여 삭제할 수 없습니다`)
    }

    // 삭제
    await this.typeRepository.delete(typeId)
  }
}