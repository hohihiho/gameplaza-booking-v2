import { IReservationRepository } from '../../domain/repositories/reservation.repository.interface'
import { IDeviceRepository } from '../../domain/repositories/device.repository.interface'
import { DeviceAvailabilityDto } from '../dtos/device.dto'
import { KSTDateTime } from '../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../domain/value-objects/time-slot'

export class GetDeviceAvailabilityUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly deviceRepository: IDeviceRepository
  ) {}

  async execute(
    deviceId: string,
    date: string
  ): Promise<DeviceAvailabilityDto> {
    // 1. 기기 존재 확인
    const device = await this.deviceRepository.findDeviceById(deviceId)
    if (!device) {
      throw new Error('Device not found')
    }

    // 2. 해당 날짜의 예약 조회
    const kstDate = KSTDateTime.fromString(date)
    const reservations = await this.reservationRepository
      .findActiveByDeviceIdAndDate(deviceId, kstDate)

    // 3. 모든 가능한 시간 슬롯
    const allSlots = TimeSlot.getAllSlots()
    
    // 4. 예약된 시간 슬롯
    const reservedSlots = reservations.map(r => r.timeSlot.displayString)
    
    // 5. 이용 가능한 시간 슬롯
    const availableSlots = allSlots
      .filter(slot => !reservedSlots.includes(slot.displayString))
      .map(slot => slot.displayString)

    return {
      deviceId,
      date,
      availableTimeSlots: availableSlots,
      reservedTimeSlots: reservedSlots
    }
  }
}