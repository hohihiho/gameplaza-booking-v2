import { Device, DeviceStatus } from '@/src/domain/entities/device.entity'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'

export class InMemoryDeviceRepository implements DeviceRepository {
  private devices: Map<string, Device> = new Map()

  async findById(id: string): Promise<Device | null> {
    return this.devices.get(id) || null
  }

  async findByDeviceNumber(deviceNumber: string): Promise<Device | null> {
    return Array.from(this.devices.values())
      .find(device => device.deviceNumber === deviceNumber) || null
  }

  async findAll(): Promise<Device[]> {
    return Array.from(this.devices.values())
      .sort((a, b) => a.deviceNumber.localeCompare(b.deviceNumber))
  }

  async findActive(): Promise<Device[]> {
    return Array.from(this.devices.values())
      .filter(device => device.status === 'active')
      .sort((a, b) => a.deviceNumber.localeCompare(b.deviceNumber))
  }

  async save(device: Device): Promise<void> {
    this.devices.set(device.id, device)
  }

  async update(device: Device): Promise<void> {
    this.devices.set(device.id, device)
  }

  async delete(id: string): Promise<void> {
    this.devices.delete(id)
  }

  // 테스트 헬퍼 메서드
  clear(): void {
    this.devices.clear()
  }

  getAll(): Device[] {
    return Array.from(this.devices.values())
  }
}