import { DeviceCategory } from '../entities/device-category'
import { DeviceType } from '../entities/device-type'
import { Device } from '../entities/device'

/**
 * 기기 계층 구조 집합체
 * 카테고리 > 타입 > 기기의 3단계 계층 구조를 관리
 */
export class DeviceHierarchy {
  private constructor(
    private readonly _categories: Map<string, DeviceCategory>,
    private readonly _types: Map<string, DeviceType>,
    private readonly _devices: Map<string, Device>,
    private readonly _typesByCategory: Map<string, Set<string>>,
    private readonly _devicesByType: Map<string, Set<string>>
  ) {}

  static create(): DeviceHierarchy {
    return new DeviceHierarchy(
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map()
    )
  }

  /**
   * 카테고리 추가
   */
  addCategory(category: DeviceCategory): DeviceHierarchy {
    if (this._categories.has(category.id)) {
      throw new Error('이미 존재하는 카테고리입니다')
    }

    // 중복 이름 검사
    const existingCategory = Array.from(this._categories.values())
      .find(c => c.name === category.name)
    if (existingCategory) {
      throw new Error(`"${category.name}" 이름의 카테고리가 이미 존재합니다`)
    }

    const newCategories = new Map(this._categories)
    newCategories.set(category.id, category)

    const newTypesByCategory = new Map(this._typesByCategory)
    if (!newTypesByCategory.has(category.id)) {
      newTypesByCategory.set(category.id, new Set())
    }

    return new DeviceHierarchy(
      newCategories,
      this._types,
      this._devices,
      newTypesByCategory,
      this._devicesByType
    )
  }

  /**
   * 카테고리 제거
   */
  removeCategory(categoryId: string): DeviceHierarchy {
    const category = this._categories.get(categoryId)
    if (!category) {
      throw new Error('존재하지 않는 카테고리입니다')
    }

    // 하위 타입이 있는지 확인
    const types = this._typesByCategory.get(categoryId) || new Set()
    if (types.size > 0) {
      throw new Error('하위 기종이 있는 카테고리는 삭제할 수 없습니다')
    }

    const newCategories = new Map(this._categories)
    newCategories.delete(categoryId)

    const newTypesByCategory = new Map(this._typesByCategory)
    newTypesByCategory.delete(categoryId)

    return new DeviceHierarchy(
      newCategories,
      this._types,
      this._devices,
      newTypesByCategory,
      this._devicesByType
    )
  }

  /**
   * 타입 추가
   */
  addType(type: DeviceType): DeviceHierarchy {
    if (this._types.has(type.id)) {
      throw new Error('이미 존재하는 기종입니다')
    }

    // 카테고리 존재 확인
    if (!this._categories.has(type.categoryId)) {
      throw new Error('존재하지 않는 카테고리입니다')
    }

    // 중복 이름 검사 (같은 카테고리 내에서)
    const categoryTypes = this.getTypesByCategory(type.categoryId)
    if (categoryTypes.some(t => t.name === type.name)) {
      throw new Error(`"${type.name}" 이름의 기종이 이미 존재합니다`)
    }

    const newTypes = new Map(this._types)
    newTypes.set(type.id, type)

    const newTypesByCategory = new Map(this._typesByCategory)
    const categoryTypes_ = newTypesByCategory.get(type.categoryId) || new Set()
    newTypesByCategory.set(type.categoryId, new Set([...categoryTypes_, type.id]))

    const newDevicesByType = new Map(this._devicesByType)
    if (!newDevicesByType.has(type.id)) {
      newDevicesByType.set(type.id, new Set())
    }

    return new DeviceHierarchy(
      this._categories,
      newTypes,
      this._devices,
      newTypesByCategory,
      newDevicesByType
    )
  }

  /**
   * 타입 제거
   */
  removeType(typeId: string): DeviceHierarchy {
    const type = this._types.get(typeId)
    if (!type) {
      throw new Error('존재하지 않는 기종입니다')
    }

    // 하위 기기가 있는지 확인
    const devices = this._devicesByType.get(typeId) || new Set()
    if (devices.size > 0) {
      throw new Error('등록된 기기가 있는 기종은 삭제할 수 없습니다')
    }

    const newTypes = new Map(this._types)
    newTypes.delete(typeId)

    const newTypesByCategory = new Map(this._typesByCategory)
    const categoryTypes = newTypesByCategory.get(type.categoryId) || new Set()
    categoryTypes.delete(typeId)
    newTypesByCategory.set(type.categoryId, categoryTypes)

    const newDevicesByType = new Map(this._devicesByType)
    newDevicesByType.delete(typeId)

    return new DeviceHierarchy(
      this._categories,
      newTypes,
      this._devices,
      newTypesByCategory,
      newDevicesByType
    )
  }

  /**
   * 기기 추가
   */
  addDevice(device: Device): DeviceHierarchy {
    if (this._devices.has(device.id)) {
      throw new Error('이미 존재하는 기기입니다')
    }

    // 타입 존재 확인
    if (!this._types.has(device.deviceTypeId)) {
      throw new Error('존재하지 않는 기종입니다')
    }

    // 중복 번호 검사 (같은 타입 내에서)
    const typeDevices = this.getDevicesByType(device.deviceTypeId)
    if (typeDevices.some(d => d.deviceNumber === device.deviceNumber)) {
      throw new Error(`"${device.deviceNumber}" 번호의 기기가 이미 존재합니다`)
    }

    const newDevices = new Map(this._devices)
    newDevices.set(device.id, device)

    const newDevicesByType = new Map(this._devicesByType)
    const typeDevices_ = newDevicesByType.get(device.deviceTypeId) || new Set()
    newDevicesByType.set(device.deviceTypeId, new Set([...typeDevices_, device.id]))

    return new DeviceHierarchy(
      this._categories,
      this._types,
      newDevices,
      this._typesByCategory,
      newDevicesByType
    )
  }

  /**
   * 기기 제거
   */
  removeDevice(deviceId: string): DeviceHierarchy {
    const device = this._devices.get(deviceId)
    if (!device) {
      throw new Error('존재하지 않는 기기입니다')
    }

    const newDevices = new Map(this._devices)
    newDevices.delete(deviceId)

    const newDevicesByType = new Map(this._devicesByType)
    const typeDevices = newDevicesByType.get(device.deviceTypeId) || new Set()
    typeDevices.delete(deviceId)
    newDevicesByType.set(device.deviceTypeId, typeDevices)

    return new DeviceHierarchy(
      this._categories,
      this._types,
      newDevices,
      this._typesByCategory,
      newDevicesByType
    )
  }

  /**
   * 카테고리 업데이트
   */
  updateCategory(category: DeviceCategory): DeviceHierarchy {
    if (!this._categories.has(category.id)) {
      throw new Error('존재하지 않는 카테고리입니다')
    }

    const newCategories = new Map(this._categories)
    newCategories.set(category.id, category)

    return new DeviceHierarchy(
      newCategories,
      this._types,
      this._devices,
      this._typesByCategory,
      this._devicesByType
    )
  }

  /**
   * 타입 업데이트
   */
  updateType(type: DeviceType): DeviceHierarchy {
    if (!this._types.has(type.id)) {
      throw new Error('존재하지 않는 기종입니다')
    }

    const newTypes = new Map(this._types)
    newTypes.set(type.id, type)

    return new DeviceHierarchy(
      this._categories,
      newTypes,
      this._devices,
      this._typesByCategory,
      this._devicesByType
    )
  }

  /**
   * 기기 업데이트
   */
  updateDevice(device: Device): DeviceHierarchy {
    if (!this._devices.has(device.id)) {
      throw new Error('존재하지 않는 기기입니다')
    }

    const newDevices = new Map(this._devices)
    newDevices.set(device.id, device)

    return new DeviceHierarchy(
      this._categories,
      this._types,
      newDevices,
      this._typesByCategory,
      this._devicesByType
    )
  }

  /**
   * 모든 카테고리 조회
   */
  getCategories(): DeviceCategory[] {
    return Array.from(this._categories.values())
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }

  /**
   * 활성 카테고리만 조회
   */
  getActiveCategories(): DeviceCategory[] {
    return this.getCategories().filter(c => c.isActive)
  }

  /**
   * 카테고리 ID로 조회
   */
  getCategoryById(categoryId: string): DeviceCategory | null {
    return this._categories.get(categoryId) || null
  }

  /**
   * 카테고리별 타입 조회
   */
  getTypesByCategory(categoryId: string): DeviceType[] {
    const typeIds = this._typesByCategory.get(categoryId) || new Set()
    return Array.from(typeIds)
      .map(id => this._types.get(id))
      .filter((type): type is DeviceType => type !== undefined)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }

  /**
   * 활성 타입만 조회
   */
  getActiveTypesByCategory(categoryId: string): DeviceType[] {
    return this.getTypesByCategory(categoryId).filter(t => t.isActive)
  }

  /**
   * 타입 ID로 조회
   */
  getTypeById(typeId: string): DeviceType | null {
    return this._types.get(typeId) || null
  }

  /**
   * 타입별 기기 조회
   */
  getDevicesByType(typeId: string): Device[] {
    const deviceIds = this._devicesByType.get(typeId) || new Set()
    return Array.from(deviceIds)
      .map(id => this._devices.get(id))
      .filter((device): device is Device => device !== undefined)
      .sort((a, b) => a.deviceNumber.localeCompare(b.deviceNumber))
  }

  /**
   * 예약 가능한 기기만 조회
   */
  getAvailableDevicesByType(typeId: string): Device[] {
    return this.getDevicesByType(typeId).filter(d => d.canBeReserved())
  }

  /**
   * 기기 ID로 조회
   */
  getDeviceById(deviceId: string): Device | null {
    return this._devices.get(deviceId) || null
  }

  /**
   * 기기의 전체 경로 조회 (카테고리 > 타입 > 기기)
   */
  getDeviceFullPath(deviceId: string): { 
    category: DeviceCategory | null,
    type: DeviceType | null,
    device: Device | null 
  } {
    const device = this._devices.get(deviceId)
    if (!device) {
      return { category: null, type: null, device: null }
    }

    const type = this._types.get(device.deviceTypeId)
    if (!type) {
      return { category: null, type: null, device }
    }

    const category = this._categories.get(type.categoryId)
    
    return { category: category || null, type, device }
  }

  /**
   * 계층 구조 통계
   */
  getStatistics(): {
    totalCategories: number
    activeCategories: number
    totalTypes: number
    activeTypes: number
    totalDevices: number
    availableDevices: number
    devicesByStatus: Map<string, number>
  } {
    const devicesByStatus = new Map<string, number>()
    
    for (const device of this._devices.values()) {
      const status = device.status.value
      devicesByStatus.set(status, (devicesByStatus.get(status) || 0) + 1)
    }

    return {
      totalCategories: this._categories.size,
      activeCategories: this.getActiveCategories().length,
      totalTypes: this._types.size,
      activeTypes: Array.from(this._types.values()).filter(t => t.isActive).length,
      totalDevices: this._devices.size,
      availableDevices: Array.from(this._devices.values()).filter(d => d.canBeReserved()).length,
      devicesByStatus
    }
  }

  /**
   * 계층 구조 검증
   */
  validate(): string[] {
    const errors: string[] = []

    // 고아 타입 검사 (카테고리가 없는 타입)
    for (const [typeId, type] of this._types) {
      if (!this._categories.has(type.categoryId)) {
        errors.push(`타입 "${type.name}" (${typeId})의 카테고리가 존재하지 않습니다`)
      }
    }

    // 고아 기기 검사 (타입이 없는 기기)
    for (const [deviceId, device] of this._devices) {
      if (!this._types.has(device.deviceTypeId)) {
        errors.push(`기기 "${device.deviceNumber}" (${deviceId})의 타입이 존재하지 않습니다`)
      }
    }

    // 관계 맵 검증
    for (const [categoryId, typeIds] of this._typesByCategory) {
      if (!this._categories.has(categoryId)) {
        errors.push(`관계 맵에 존재하지 않는 카테고리 ID: ${categoryId}`)
      }
      for (const typeId of typeIds) {
        if (!this._types.has(typeId)) {
          errors.push(`관계 맵에 존재하지 않는 타입 ID: ${typeId}`)
        }
      }
    }

    for (const [typeId, deviceIds] of this._devicesByType) {
      if (!this._types.has(typeId)) {
        errors.push(`관계 맵에 존재하지 않는 타입 ID: ${typeId}`)
      }
      for (const deviceId of deviceIds) {
        if (!this._devices.has(deviceId)) {
          errors.push(`관계 맵에 존재하지 않는 기기 ID: ${deviceId}`)
        }
      }
    }

    return errors
  }

  /**
   * 타입 이동 (다른 카테고리로)
   */
  moveType(typeId: string, newCategoryId: string): DeviceHierarchy {
    const type = this._types.get(typeId)
    if (!type) {
      throw new Error('존재하지 않는 기종입니다')
    }

    if (!this._categories.has(newCategoryId)) {
      throw new Error('존재하지 않는 카테고리입니다')
    }

    if (type.categoryId === newCategoryId) {
      return this // 이미 같은 카테고리
    }

    // 타입 객체 업데이트
    const updatedType = DeviceType.create({
      id: type.id,
      categoryId: newCategoryId,
      name: type.name,
      manufacturer: type.manufacturer,
      model: type.model,
      description: type.description,
      specifications: type.specifications,
      defaultHourlyRate: type.defaultHourlyRate,
      maxReservationHours: type.maxReservationHours,
      minReservationHours: type.minReservationHours,
      supportsCreditPlay: type.supportsCreditPlay,
      supportsMultiPlayer: type.supportsMultiPlayer,
      playModes: type.playModes,
      displayOrder: type.displayOrder,
      isActive: type.isActive,
      imageUrl: type.imageUrl,
      createdAt: type.createdAt
    })

    const newTypes = new Map(this._types)
    newTypes.set(typeId, updatedType)

    // 관계 맵 업데이트
    const newTypesByCategory = new Map(this._typesByCategory)
    
    // 기존 카테고리에서 제거
    const oldCategoryTypes = newTypesByCategory.get(type.categoryId) || new Set()
    oldCategoryTypes.delete(typeId)
    newTypesByCategory.set(type.categoryId, oldCategoryTypes)
    
    // 새 카테고리에 추가
    const newCategoryTypes = newTypesByCategory.get(newCategoryId) || new Set()
    newCategoryTypes.add(typeId)
    newTypesByCategory.set(newCategoryId, newCategoryTypes)

    return new DeviceHierarchy(
      this._categories,
      newTypes,
      this._devices,
      newTypesByCategory,
      this._devicesByType
    )
  }

  /**
   * 전체 계층 구조를 트리 형태로 반환
   */
  toTree(): Array<{
    category: DeviceCategory
    types: Array<{
      type: DeviceType
      devices: Device[]
    }>
  }> {
    return this.getCategories().map(category => ({
      category,
      types: this.getTypesByCategory(category.id).map(type => ({
        type,
        devices: this.getDevicesByType(type.id)
      }))
    }))
  }
}