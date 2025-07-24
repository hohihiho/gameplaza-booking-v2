import { Device, DeviceCategory, DeviceType } from '../entities/device'
import { DeviceStatusType } from '../value-objects/device-status'

/**
 * 기기 레포지토리 인터페이스
 */
export interface IDeviceRepository {
  /**
   * ID로 기기 조회
   */
  findById(id: string): Promise<Device | null>

  /**
   * 기기 번호로 조회
   */
  findByDeviceNumber(deviceNumber: string): Promise<Device | null>

  /**
   * 모든 기기 조회
   */
  findAll(): Promise<Device[]>

  /**
   * 상태별 기기 조회
   */
  findByStatus(status: DeviceStatusType): Promise<Device[]>

  /**
   * 예약 가능한 기기만 조회 (available 상태)
   */
  findAvailable(): Promise<Device[]>

  /**
   * 운영 가능한 기기만 조회 (available, in_use, reserved)
   */
  findOperational(): Promise<Device[]>

  /**
   * 기종 ID로 기기 목록 조회
   */
  findByTypeId(typeId: string): Promise<Device[]>

  /**
   * 기종 ID와 상태로 기기 목록 조회
   */
  findByTypeIdAndStatus(typeId: string, status: DeviceStatusType): Promise<Device[]>

  /**
   * 위치별 기기 조회
   */
  findByLocation(location: string): Promise<Device[]>

  /**
   * 기기 저장
   */
  save(device: Device): Promise<Device>

  /**
   * 기기 업데이트
   */
  update(device: Device): Promise<Device>

  /**
   * 기기 삭제
   */
  delete(id: string): Promise<void>

  /**
   * 기기 존재 여부 확인
   */
  exists(id: string): Promise<boolean>

  /**
   * 기기 번호 중복 확인
   */
  existsByDeviceNumber(deviceNumber: string, excludeId?: string): Promise<boolean>
}

/**
 * 기기 카테고리 레포지토리 인터페이스
 */
export interface IDeviceCategoryRepository {
  /**
   * ID로 카테고리 조회
   */
  findById(id: string): Promise<DeviceCategory | null>

  /**
   * 모든 카테고리 조회
   */
  findAll(): Promise<DeviceCategory[]>

  /**
   * 카테고리 저장
   */
  save(category: DeviceCategory): Promise<DeviceCategory>

  /**
   * 카테고리 업데이트
   */
  update(category: DeviceCategory): Promise<DeviceCategory>

  /**
   * 카테고리 삭제
   */
  delete(id: string): Promise<void>

  /**
   * 카테고리명 중복 확인
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>
}

/**
 * 기기 타입 레포지토리 인터페이스
 */
export interface IDeviceTypeRepository {
  /**
   * ID로 기기 타입 조회
   */
  findById(id: string): Promise<DeviceType | null>

  /**
   * 카테고리별 기기 타입 조회
   */
  findByCategoryId(categoryId: string): Promise<DeviceType[]>

  /**
   * 모든 기기 타입 조회
   */
  findAll(): Promise<DeviceType[]>

  /**
   * 기기 타입 저장
   */
  save(type: DeviceType): Promise<DeviceType>

  /**
   * 기기 타입 업데이트
   */
  update(type: DeviceType): Promise<DeviceType>

  /**
   * 기기 타입 삭제
   */
  delete(id: string): Promise<void>

  /**
   * 기기 타입명 중복 확인
   */
  existsByName(name: string, categoryId: string, excludeId?: string): Promise<boolean>
}