import { DeviceHierarchy } from '../device-hierarchy'
import { DeviceCategory } from '../../entities/device-category'
import { DeviceType } from '../../entities/device-type'
import { Device } from '../../entities/device'
import { DevicePlayMode } from '../../value-objects/device-play-mode'

describe('DeviceHierarchy', () => {
  let hierarchy: DeviceHierarchy
  let segaCategory: DeviceCategory
  let konamiCategory: DeviceCategory
  let maimaiType: DeviceType
  let sdvxType: DeviceType
  let device1: Device
  let device2: Device

  beforeEach(() => {
    hierarchy = DeviceHierarchy.create()

    // 테스트용 카테고리
    segaCategory = DeviceCategory.create({
      id: 'cat-sega',
      name: 'SEGA',
      description: '세가 게임기',
      displayOrder: 0
    })

    konamiCategory = DeviceCategory.create({
      id: 'cat-konami',
      name: 'KONAMI',
      description: '코나미 게임기',
      displayOrder: 1
    })

    // 테스트용 타입
    const dxMode = DevicePlayMode.create({
      mode: 'dx',
      options: {
        maxPlayers: 2,
        minPlayers: 1,
        description: 'DX 모드'
      },
      isDefault: true,
      displayOrder: 0
    })

    maimaiType = DeviceType.create({
      id: 'type-maimai',
      categoryId: 'cat-sega',
      name: '마이마이DX',
      manufacturer: 'SEGA',
      model: 'maimai DX',
      defaultHourlyRate: 5000,
      maxReservationHours: 4,
      playModes: [dxMode],
      displayOrder: 0
    })

    sdvxType = DeviceType.create({
      id: 'type-sdvx',
      categoryId: 'cat-konami',
      name: '사운드볼텍스',
      manufacturer: 'KONAMI',
      model: 'SDVX VI',
      defaultHourlyRate: 4000,
      maxReservationHours: 3,
      displayOrder: 0
    })

    // 테스트용 기기
    device1 = Device.create({
      id: 'dev-1',
      deviceTypeId: 'type-maimai',
      deviceNumber: 'MAIMAI-001',
      location: '1층 중앙'
    })

    device2 = Device.create({
      id: 'dev-2',
      deviceTypeId: 'type-maimai',
      deviceNumber: 'MAIMAI-002',
      location: '1층 중앙'
    })
  })

  describe('카테고리 관리', () => {
    it('카테고리를 추가할 수 있다', () => {
      const updated = hierarchy.addCategory(segaCategory)
      
      expect(updated.getCategories()).toHaveLength(1)
      expect(updated.getCategoryById('cat-sega')).toEqual(segaCategory)
    })

    it('중복된 카테고리는 추가할 수 없다', () => {
      const updated = hierarchy.addCategory(segaCategory)
      
      expect(() => updated.addCategory(segaCategory))
        .toThrow('이미 존재하는 카테고리입니다')
    })

    it('같은 이름의 카테고리는 추가할 수 없다', () => {
      const updated = hierarchy.addCategory(segaCategory)
      const duplicateName = DeviceCategory.create({
        id: 'cat-other',
        name: 'SEGA',
        displayOrder: 2
      })
      
      expect(() => updated.addCategory(duplicateName))
        .toThrow('"SEGA" 이름의 카테고리가 이미 존재합니다')
    })

    it('하위 타입이 없는 카테고리만 삭제할 수 있다', () => {
      let updated = hierarchy.addCategory(segaCategory)
      
      // 카테고리만 있을 때는 삭제 가능
      const removedCategory = updated.removeCategory('cat-sega')
      expect(removedCategory.getCategoryById('cat-sega')).toBeNull()
      
      // 타입 추가 후에는 삭제 불가
      updated = hierarchy.addCategory(segaCategory).addType(maimaiType)
      expect(() => updated.removeCategory('cat-sega'))
        .toThrow('하위 기종이 있는 카테고리는 삭제할 수 없습니다')
    })

    it('활성 카테고리만 필터링할 수 있다', () => {
      const inactiveCategory = konamiCategory.deactivate()
      const updated = hierarchy
        .addCategory(segaCategory)
        .addCategory(inactiveCategory)
      
      expect(updated.getActiveCategories()).toHaveLength(1)
      expect(updated.getActiveCategories()[0].name).toBe('SEGA')
    })
  })

  describe('타입 관리', () => {
    it('카테고리가 있을 때만 타입을 추가할 수 있다', () => {
      expect(() => hierarchy.addType(maimaiType))
        .toThrow('존재하지 않는 카테고리입니다')
      
      const updated = hierarchy.addCategory(segaCategory).addType(maimaiType)
      expect(updated.getTypesByCategory('cat-sega')).toHaveLength(1)
    })

    it('같은 카테고리 내에서 중복된 이름의 타입은 추가할 수 없다', () => {
      const updated = hierarchy
        .addCategory(segaCategory)
        .addType(maimaiType)
      
      const duplicateType = DeviceType.create({
        id: 'type-other',
        categoryId: 'cat-sega',
        name: '마이마이DX',
        defaultHourlyRate: 6000,
        maxReservationHours: 3,
        displayOrder: 1
      })
      
      expect(() => updated.addType(duplicateType))
        .toThrow('"마이마이DX" 이름의 기종이 이미 존재합니다')
    })

    it('하위 기기가 없는 타입만 삭제할 수 있다', () => {
      let updated = hierarchy
        .addCategory(segaCategory)
        .addType(maimaiType)
      
      // 기기가 없을 때는 삭제 가능
      expect(() => updated.removeType('type-maimai')).not.toThrow()
      
      // 기기 추가 후에는 삭제 불가
      updated = updated.addDevice(device1)
      expect(() => updated.removeType('type-maimai'))
        .toThrow('등록된 기기가 있는 기종은 삭제할 수 없습니다')
    })

    it('타입을 다른 카테고리로 이동할 수 있다', () => {
      const updated = hierarchy
        .addCategory(segaCategory)
        .addCategory(konamiCategory)
        .addType(maimaiType)
        .moveType('type-maimai', 'cat-konami')
      
      expect(updated.getTypesByCategory('cat-sega')).toHaveLength(0)
      expect(updated.getTypesByCategory('cat-konami')).toHaveLength(1)
      
      const movedType = updated.getTypeById('type-maimai')
      expect(movedType?.categoryId).toBe('cat-konami')
    })
  })

  describe('기기 관리', () => {
    it('타입이 있을 때만 기기를 추가할 수 있다', () => {
      expect(() => hierarchy.addDevice(device1))
        .toThrow('존재하지 않는 기종입니다')
      
      const updated = hierarchy
        .addCategory(segaCategory)
        .addType(maimaiType)
        .addDevice(device1)
      
      expect(updated.getDevicesByType('type-maimai')).toHaveLength(1)
    })

    it('같은 타입 내에서 중복된 번호의 기기는 추가할 수 없다', () => {
      const updated = hierarchy
        .addCategory(segaCategory)
        .addType(maimaiType)
        .addDevice(device1)
      
      const duplicateDevice = Device.create({
        id: 'dev-other',
        deviceTypeId: 'type-maimai',
        deviceNumber: 'MAIMAI-001'
      })
      
      expect(() => updated.addDevice(duplicateDevice))
        .toThrow('"MAIMAI-001" 번호의 기기가 이미 존재합니다')
    })

    it('예약 가능한 기기만 필터링할 수 있다', () => {
      const brokenDevice = device2.markAsBroken('고장')
      
      const updated = hierarchy
        .addCategory(segaCategory)
        .addType(maimaiType)
        .addDevice(device1)
        .addDevice(brokenDevice)
      
      expect(updated.getAvailableDevicesByType('type-maimai')).toHaveLength(1)
      expect(updated.getAvailableDevicesByType('type-maimai')[0].id).toBe('dev-1')
    })

    it('기기의 전체 경로를 조회할 수 있다', () => {
      const updated = hierarchy
        .addCategory(segaCategory)
        .addType(maimaiType)
        .addDevice(device1)
      
      const path = updated.getDeviceFullPath('dev-1')
      
      expect(path.category?.name).toBe('SEGA')
      expect(path.type?.name).toBe('마이마이DX')
      expect(path.device?.deviceNumber).toBe('MAIMAI-001')
    })
  })

  describe('통계 및 검증', () => {
    it('계층 구조 통계를 제공한다', () => {
      const brokenDevice = device2.markAsBroken('고장')
      
      const updated = hierarchy
        .addCategory(segaCategory)
        .addCategory(konamiCategory.deactivate())
        .addType(maimaiType)
        .addType(sdvxType)
        .addDevice(device1)
        .addDevice(brokenDevice)
      
      const stats = updated.getStatistics()
      
      expect(stats.totalCategories).toBe(2)
      expect(stats.activeCategories).toBe(1)
      expect(stats.totalTypes).toBe(2)
      expect(stats.activeTypes).toBe(2)
      expect(stats.totalDevices).toBe(2)
      expect(stats.availableDevices).toBe(1)
      expect(stats.devicesByStatus.get('available')).toBe(1)
      expect(stats.devicesByStatus.get('broken')).toBe(1)
    })

    it('계층 구조의 무결성을 검증한다', () => {
      // 정상적인 계층 구조
      const valid = hierarchy
        .addCategory(segaCategory)
        .addType(maimaiType)
        .addDevice(device1)
      
      expect(valid.validate()).toHaveLength(0)
      
      // 고아 타입이 있는 경우 (테스트를 위해 직접 Map 조작)
      const invalid = new (DeviceHierarchy as any)(
        new Map(), // 빈 카테고리 맵
        new Map([['type-maimai', maimaiType]]),
        new Map(),
        new Map(),
        new Map()
      )
      
      const errors = invalid.validate()
      expect(errors).toContain('타입 "마이마이DX" (type-maimai)의 카테고리가 존재하지 않습니다')
    })

    it('트리 구조로 변환할 수 있다', () => {
      const updated = hierarchy
        .addCategory(segaCategory)
        .addCategory(konamiCategory)
        .addType(maimaiType)
        .addType(sdvxType)
        .addDevice(device1)
        .addDevice(device2)
      
      const tree = updated.toTree()
      
      expect(tree).toHaveLength(2)
      expect(tree[0].category.name).toBe('SEGA')
      expect(tree[0].types).toHaveLength(1)
      expect(tree[0].types[0].type.name).toBe('마이마이DX')
      expect(tree[0].types[0].devices).toHaveLength(2)
      
      expect(tree[1].category.name).toBe('KONAMI')
      expect(tree[1].types).toHaveLength(1)
      expect(tree[1].types[0].type.name).toBe('사운드볼텍스')
      expect(tree[1].types[0].devices).toHaveLength(0)
    })
  })

  describe('업데이트 작업', () => {
    it('카테고리를 업데이트할 수 있다', () => {
      const updated = hierarchy
        .addCategory(segaCategory)
        .updateCategory(segaCategory.changeName('SEGA GAMES'))
      
      const category = updated.getCategoryById('cat-sega')
      expect(category?.name).toBe('SEGA GAMES')
    })

    it('타입을 업데이트할 수 있다', () => {
      const updated = hierarchy
        .addCategory(segaCategory)
        .addType(maimaiType)
        .updateType(maimaiType.changeHourlyRate(6000))
      
      const type = updated.getTypeById('type-maimai')
      expect(type?.defaultHourlyRate).toBe(6000)
    })

    it('기기를 업데이트할 수 있다', () => {
      const updated = hierarchy
        .addCategory(segaCategory)
        .addType(maimaiType)
        .addDevice(device1)
        .updateDevice(device1.changeLocation('2층 우측'))
      
      const device = updated.getDeviceById('dev-1')
      expect(device?.location).toBe('2층 우측')
    })
  })
})