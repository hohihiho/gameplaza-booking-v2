import { Device, DeviceCategory, DeviceType } from '../device'

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
        expect(device.status).toBe('available')
        expect(device.notes).toBeNull()
      })

      it('should create device with custom status and notes', () => {
        const device = createDevice({
          status: 'maintenance',
          notes: 'Regular checkup'
        })
        
        expect(device.status).toBe('maintenance')
        expect(device.notes).toBe('Regular checkup')
      })
    })

    describe('status checks', () => {
      it('should check availability correctly', () => {
        const available = createDevice({ status: 'available' })
        const reserved = createDevice({ status: 'reserved' })
        const maintenance = createDevice({ status: 'maintenance' })
        
        expect(available.isAvailable()).toBe(true)
        expect(reserved.isAvailable()).toBe(false)
        expect(maintenance.isAvailable()).toBe(false)
      })

      it('should check operational status', () => {
        const available = createDevice({ status: 'available' })
        const reserved = createDevice({ status: 'reserved' })
        const maintenance = createDevice({ status: 'maintenance' })
        const offline = createDevice({ status: 'offline' })
        
        expect(available.isOperational()).toBe(true)
        expect(reserved.isOperational()).toBe(true)
        expect(maintenance.isOperational()).toBe(false)
        expect(offline.isOperational()).toBe(false)
      })
    })

    describe('reservation operations', () => {
      it('should reserve available device', () => {
        const device = createDevice()
        const reserved = device.reserve()
        
        expect(reserved.status).toBe('reserved')
        expect(reserved.isReserved()).toBe(true)
      })

      it('should throw error when reserving non-available device', () => {
        const device = createDevice({ status: 'maintenance' })
        
        expect(() => device.reserve()).toThrow(
          'Device PC-001 is not available for reservation'
        )
      })

      it('should release reserved device', () => {
        const device = createDevice({ status: 'reserved' })
        const released = device.release()
        
        expect(released.status).toBe('available')
        expect(released.isAvailable()).toBe(true)
      })

      it('should throw error when releasing non-reserved device', () => {
        const device = createDevice()
        
        expect(() => device.release()).toThrow(
          'Device PC-001 is not reserved'
        )
      })
    })

    describe('maintenance operations', () => {
      it('should start maintenance with notes', () => {
        const device = createDevice()
        const inMaintenance = device.startMaintenance('GPU fan replacement')
        
        expect(inMaintenance.status).toBe('maintenance')
        expect(inMaintenance.notes).toBe('GPU fan replacement')
      })

      it('should end maintenance and clear notes', () => {
        const device = createDevice({
          status: 'maintenance',
          notes: 'Fixing issue'
        })
        const fixed = device.endMaintenance()
        
        expect(fixed.status).toBe('available')
        expect(fixed.notes).toBeNull()
      })

      it('should throw error when ending maintenance on non-maintenance device', () => {
        const device = createDevice()
        
        expect(() => device.endMaintenance()).toThrow(
          'Device PC-001 is not in maintenance'
        )
      })
    })

    describe('offline operations', () => {
      it('should go offline with reason', () => {
        const device = createDevice()
        const offline = device.goOffline('Network issue')
        
        expect(offline.status).toBe('offline')
        expect(offline.notes).toBe('Network issue')
      })

      it('should go online and clear notes', () => {
        const device = createDevice({
          status: 'offline',
          notes: 'Power outage'
        })
        const online = device.goOnline()
        
        expect(online.status).toBe('available')
        expect(online.notes).toBeNull()
      })

      it('should throw error when going online from non-offline status', () => {
        const device = createDevice()
        
        expect(() => device.goOnline()).toThrow(
          'Device PC-001 is not offline'
        )
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