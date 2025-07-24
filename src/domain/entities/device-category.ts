export interface DeviceCategoryProps {
  id: string
  name: string
  description?: string
  displayOrder: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * 기기 카테고리 (최상위 분류)
 * 예: SEGA, KONAMI, BANDAI NAMCO 등
 */
export class DeviceCategory {
  private constructor(
    public readonly id: string,
    private _name: string,
    private _description: string | null,
    private _displayOrder: number,
    private _isActive: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: DeviceCategoryProps): DeviceCategory {
    const now = new Date()
    
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('카테고리 이름은 필수입니다')
    }

    if (props.displayOrder < 0) {
      throw new Error('표시 순서는 0 이상이어야 합니다')
    }

    return new DeviceCategory(
      props.id,
      props.name.trim(),
      props.description?.trim() || null,
      props.displayOrder,
      props.isActive !== false,
      props.createdAt || now,
      props.updatedAt || now
    )
  }

  get name(): string {
    return this._name
  }

  get description(): string | null {
    return this._description
  }

  get displayOrder(): number {
    return this._displayOrder
  }

  get isActive(): boolean {
    return this._isActive
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * 카테고리명 변경
   */
  changeName(newName: string): DeviceCategory {
    if (!newName || newName.trim().length === 0) {
      throw new Error('카테고리 이름은 필수입니다')
    }

    return new DeviceCategory(
      this.id,
      newName.trim(),
      this._description,
      this._displayOrder,
      this._isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 설명 변경
   */
  changeDescription(newDescription: string | null): DeviceCategory {
    return new DeviceCategory(
      this.id,
      this._name,
      newDescription?.trim() || null,
      this._displayOrder,
      this._isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 표시 순서 변경
   */
  changeOrder(newOrder: number): DeviceCategory {
    if (newOrder < 0) {
      throw new Error('표시 순서는 0 이상이어야 합니다')
    }

    return new DeviceCategory(
      this.id,
      this._name,
      this._description,
      newOrder,
      this._isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 활성화
   */
  activate(): DeviceCategory {
    if (this._isActive) {
      return this
    }

    return new DeviceCategory(
      this.id,
      this._name,
      this._description,
      this._displayOrder,
      true,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 비활성화
   */
  deactivate(): DeviceCategory {
    if (!this._isActive) {
      return this
    }

    return new DeviceCategory(
      this.id,
      this._name,
      this._description,
      this._displayOrder,
      false,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 두 카테고리의 순서 교체
   */
  swapOrderWith(other: DeviceCategory): [DeviceCategory, DeviceCategory] {
    const thisWithNewOrder = this.changeOrder(other._displayOrder)
    const otherWithNewOrder = other.changeOrder(this._displayOrder)
    
    return [thisWithNewOrder, otherWithNewOrder]
  }

  equals(other: DeviceCategory): boolean {
    return this.id === other.id
  }

  toString(): string {
    return `${this._name}${this._isActive ? '' : ' (비활성)'}`
  }
}