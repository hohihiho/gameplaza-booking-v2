import { DeviceCategoryRepository } from '../../../domain/repositories/device-category.repository.interface'

export interface ReorderDeviceCategoriesDTO {
  categoryOrders: Array<{
    categoryId: string
    displayOrder: number
  }>
}

export class ReorderDeviceCategoriesUseCase {
  constructor(
    private readonly categoryRepository: DeviceCategoryRepository
  ) {}

  async execute(dto: ReorderDeviceCategoriesDTO): Promise<void> {
