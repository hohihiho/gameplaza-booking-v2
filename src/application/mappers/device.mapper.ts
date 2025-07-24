import { Device, DeviceCategory, DeviceType } from '../../domain/entities/device'
import { DeviceDto, DeviceCategoryDto, DeviceTypeDto } from '../dtos/device.dto'

export class DeviceMapper {
  toDeviceDto(device: Device): DeviceDto {
    return {
      id: device.id,
      deviceTypeId: device.deviceTypeId,
      deviceNumber: device.deviceNumber,
      status: device.status,
      notes: device.notes
    }
  }

  toDeviceTypeDto(type: DeviceType): DeviceTypeDto {
    return {
      id: type.id,
      categoryId: type.categoryId,
      name: type.name,
      description: type.description,
      specifications: type.specifications,
      hourlyRate: type.hourlyRate,
      maxReservationHours: type.maxReservationHours
    }
  }

  toDeviceCategoryDto(category: DeviceCategory): DeviceCategoryDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      displayOrder: category.displayOrder
    }
  }
}