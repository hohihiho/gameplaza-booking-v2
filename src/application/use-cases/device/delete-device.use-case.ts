import { IDeviceRepository } from '../../../domain/repositories/device.repository.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface'

export interface DeleteDeviceRequest {
  userId: string
  deviceId: string
}

export interface DeleteDeviceResponse {
  message: string
}

export class DeleteDeviceUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly deviceRepository: IDeviceRepository,
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(request: DeleteDeviceRequest): Promise<DeleteDeviceResponse> {
    // 1. 사용자 확인 및 권한 검증
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 기기를 삭제할 수 있습니다')
    }

    // 2. 기기 조회
    const device = await this.deviceRepository.findById(request.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    // 3. 기기가 사용 중인지 확인
    if (device.status.value === 'in_use') {
      throw new Error('사용 중인 기기는 삭제할 수 없습니다')
    }

    // 4. 진행 중인 예약이 있는지 확인
    const activeReservations = await this.reservationRepository.findActiveByDeviceId(request.deviceId)
    if (activeReservations.length > 0) {
      throw new Error(`진행 중인 예약 ${activeReservations.length}건이 있어 기기를 삭제할 수 없습니다`)
    }

    // 5. 미래 예약이 있는지 확인
    const futureReservations = await this.reservationRepository.findFutureByDeviceId(request.deviceId)
    if (futureReservations.length > 0) {
      throw new Error(`예정된 예약 ${futureReservations.length}건이 있어 기기를 삭제할 수 없습니다`)
    }

    // 6. 기기 삭제
    await this.deviceRepository.delete(request.deviceId)

    return {
      message: `기기 ${device.deviceNumber}가 성공적으로 삭제되었습니다`
    }
  }
}