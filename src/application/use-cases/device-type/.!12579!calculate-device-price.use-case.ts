import { DeviceTypeRepository } from '../../../domain/repositories/device-type.repository.interface'
import { PlayModeType } from '../../../domain/value-objects/device-play-mode'

export interface CalculateDevicePriceDTO {
  deviceTypeId: string
  hours: number
  playModeType?: PlayModeType
  playerCount?: number
}

export interface DevicePriceCalculation {
  basePrice: number
  playMode: string
  playerCount: number
  hours: number
  totalPrice: number
  pricePerHour: number
  pricePerPlayer: number
}

export class CalculateDevicePriceUseCase {
  constructor(
    private readonly typeRepository: DeviceTypeRepository
  ) {}

  async execute(dto: CalculateDevicePriceDTO): Promise<DevicePriceCalculation> {
