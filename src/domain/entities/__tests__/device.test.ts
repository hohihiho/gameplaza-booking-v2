import { Device, DeviceCategory, DeviceType } from '../device'
import { DeviceStatus } from '../../value-objects/device-status'

describe('Device Entity', () => {
  describe('Device', () => {
    const createDevice = (props?: Partial<Parameters<typeof Device.create>[0]>) => {
      return Device.create({
        id: 'device-1',
        deviceTypeId: 'type-1',
        deviceNumber: 'PC-001',
        ...props
      })
    }

    describe('create', () => {
      it('should create device with default available status', () => {
        const device = createDevice()
        
        expect(device.id).toBe('device-1')
        expect(device.deviceTypeId).toBe('type-1')
        expect(device.deviceNumber).toBe('PC-001')
        expect(device.status.value).toBe('available')
        expect(device.notes).toBeNull()
      })

      it('should create device with custom status and notes', () => {
        const device = createDevice({
          status: DeviceStatus.maintenance(),
          notes: 'Regular checkup'
        })
        
        expect(device.status.value).toBe('maintenance')
        expect(device.notes).toBe('Regular checkup')
      })
    })

    describe('status checks', () => {
      it('should check availability correctly', () => {
        const available = createDevice({ status: DeviceStatus.available() })
        const reserved = createDevice({ status: DeviceStatus.reserved() })
        const maintenance = createDevice({ status: DeviceStatus.maintenance() })
        
        expect(available.isAvailable()).toBe(true)
        expect(reserved.isAvailable()).toBe(false)
        expect(maintenance.isAvailable()).toBe(false)
      })

      it('should check operational status', () => {
        const available = createDevice({ status: DeviceStatus.available() })
        const reserved = createDevice({ status: DeviceStatus.reserved() })
        const maintenance = createDevice({ status: DeviceStatus.maintenance() })
        const broken = createDevice({ status: DeviceStatus.broken() })
        
        expect(available.isOperational()).toBe(true)
        expect(reserved.isOperational()).toBe(true)
        expect(maintenance.isOperational()).toBe(false)
        expect(broken.isOperational()).toBe(false)
      })
    })

    describe('reservation operations', () => {
      it('should reserve available device', () => {
        const device = createDevice()
        const reserved = device.reserve()
        
        expect(reserved.status.value).toBe('reserved')
        expect(reserved.isReserved()).toBe(true)
      })

      it('should throw error when reserving non-available device', () => {
        const device = createDevice({ status: DeviceStatus.maintenance() })
        
        expect(() => device.reserve()).toThrow()
      })

      it('should release reserved device', () => {
        const device = createDevice({ status: DeviceStatus.reserved() })
        const released = device.release()
        
        expect(released.status.value).toBe('available')
        expect(released.isAvailable()).toBe(true)
      })

      it('should throw error when releasing non-reserved device', () => {
        const device = createDevice()
        
        expect(() => device.release()).toThrow()
      })
    })

    describe('maintenance operations', () => {
      it('should start maintenance with notes', () => {
        const device = createDevice()
        const inMaintenance = device.startMaintenance('GPU fan replacement')
        
        expect(inMaintenance.status.value).toBe('maintenance')
        expect(inMaintenance.notes).toBe('GPU fan replacement')
      })

      it('should end maintenance and clear notes', () => {
        const device = createDevice({
          status: DeviceStatus.maintenance(),
          notes: 'Fixing issue'
        })
        const fixed = device.endMaintenance()
        
        expect(fixed.status.value).toBe('available')
        expect(fixed.notes).toBe('점검 완료')
      })

      it('should throw error when ending maintenance on non-maintenance device', () => {
        const device = createDevice()
        
        expect(() => device.endMaintenance()).toThrow()
      })
    })

    describe('broken operations', () => {
      it('should mark as broken with reason', () => {
        const device = createDevice()
        const broken = device.markAsBroken('Hardware failure')
        
        expect(broken.status.value).toBe('broken')
        expect(broken.notes).toBe('Hardware failure')
      })
    })
  })

  describe('DeviceCategory', () => {
    it('should create device category', () => {
      const category = DeviceCategory.create({
        id: 'cat-1',
        name: 'PC',
        description: 'Gaming computers',
        displayOrder: 1
      })
      
      expect(category.id).toBe('cat-1')
      expect(category.name).toBe('PC')
      expect(category.description).toBe('Gaming computers')
      expect(category.displayOrder).toBe(1)
    })

    it('should handle optional description', () => {
      const category = DeviceCategory.create({
        id: 'cat-1',
        name: 'PC',
        displayOrder: 1
      })
      
      expect(category.description).toBeNull()
    })
  })

  describe('DeviceType', () => {
    const createDeviceType = (props?: Partial<Parameters<typeof DeviceType.create>[0]>) => {
      return DeviceType.create({
        id: 'type-1',
        categoryId: 'cat-1',
        name: 'Gaming PC (RTX 4090)',
        hourlyRate: 5000,
        maxReservationHours: 6,
        ...props
      })
    }

    it('should create device type', () => {
      const type = createDeviceType({
        specifications: {
          gpu: 'RTX 4090',
          cpu: 'i9-13900K',
          ram: '32GB'
        }
      })
      
      expect(type.id).toBe('type-1')
      expect(type.categoryId).toBe('cat-1')
      expect(type.specifications.gpu).toBe('RTX 4090')
      expect(type.hourlyRate).toBe(5000)
    })

    it('should calculate price correctly', () => {
      const type = createDeviceType()
      
      expect(type.calculatePrice(2)).toBe(10000)
      expect(type.calculatePrice(4)).toBe(20000)
      expect(type.calculatePrice(6)).toBe(30000)
    })

    it('should throw error for exceeding max hours', () => {
      const type = createDeviceType({ maxReservationHours: 4 })
      
      expect(() => type.calculatePrice(5)).toThrow(
        'Maximum reservation hours is 4'
      )
    })
  })
})