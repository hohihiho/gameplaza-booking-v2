// 관리자 기기 관리 페이지 타입 정의
export type Category = {
  id: string;
  name: string;
  display_order: number;
};

export type PlayMode = {
  name: string;
  price: number;
  display_order?: number;
};

export type RentalSettings = {
  max_rental_hours?: number;
  min_rental_minutes?: number;
  pricing_type?: 'fixed' | 'hourly';
  base_price?: number;
};

export type DeviceType = {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
  description?: string;
  model_name?: string;
  version_name?: string;
  display_order?: number;
  play_modes: PlayMode[];
  is_rentable: boolean;
  rental_settings?: RentalSettings;
  created_at?: string;
  updated_at?: string;
  device_count?: number;
  active_count?: number;
};

export type Device = {
  id: string;
  device_type_id: string;
  device_number: number;
  name: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_order';
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

// 폼 상태 타입
export type CategoryFormData = {
  name: string;
};

export type DeviceTypeFormData = {
  category_id: string;
  name: string;
  description?: string;
  model_name?: string;
  version_name?: string;
  device_count?: number;
  is_rentable: boolean;
  play_modes: PlayMode[];
  rental_settings?: RentalSettings;
};

export type DeviceFormData = {
  device_type_id: string;
  device_number: number;
  name: string;
  status: Device['status'];
  notes?: string;
};

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// 관리 상태 타입
export type ManagementTab = 'categories' | 'types' | 'devices';

export type EditMode = 'none' | 'category' | 'device-type' | 'device';

export interface CategoryState {
  categories: Category[];
  editingId: string | null;
  showForm: boolean;
  formData: CategoryFormData;
  draggedItem: Category | null;
}

export interface DeviceTypeState {
  deviceTypes: DeviceType[];
  filteredTypes: DeviceType[];
  selectedCategoryId: string | null;
  editingId: string | null;
  showForm: boolean;
  formData: DeviceTypeFormData;
  draggedItem: DeviceType | null;
}

export interface DeviceState {
  devices: Device[];
  filteredDevices: Device[];
  selectedTypeId: string | null;
  editingId: string | null;
  showForm: boolean;
  formData: DeviceFormData;
}

export interface GlobalState {
  activeTab: ManagementTab;
  editMode: EditMode;
  loading: boolean;
  error: string | null;
}

// 커스텀 훅 반환 타입
export interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: string | null;
  editingId: string | null;
  showForm: boolean;
  formData: CategoryFormData;
  draggedItem: Category | null;
  // Actions
  loadCategories: () => Promise<void>;
  startEdit: (category: Category) => void;
  cancelEdit: () => void;
  showCreateForm: () => void;
  updateFormData: (updates: Partial<CategoryFormData>) => void;
  saveCategory: () => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (startIndex: number, endIndex: number) => Promise<void>;
  handleDragStart: (category: Category) => void;
  handleDragEnd: () => void;
}

export interface UseDeviceTypesResult {
  deviceTypes: DeviceType[];
  filteredTypes: DeviceType[];
  categories: Category[];
  selectedCategoryId: string | null;
  loading: boolean;
  error: string | null;
  editingId: string | null;
  showForm: boolean;
  formData: DeviceTypeFormData;
  draggedItem: DeviceType | null;
  // Actions
  loadDeviceTypes: () => Promise<void>;
  selectCategory: (categoryId: string | null) => void;
  startEdit: (deviceType: DeviceType) => void;
  cancelEdit: () => void;
  showCreateForm: () => void;
  updateFormData: (updates: Partial<DeviceTypeFormData>) => void;
  saveDeviceType: () => Promise<void>;
  deleteDeviceType: (id: string) => Promise<void>;
  toggleRentable: (id: string) => Promise<void>;
  addPlayMode: () => void;
  updatePlayMode: (index: number, updates: Partial<PlayMode>) => void;
  removePlayMode: (index: number) => void;
  reorderDeviceTypes: (startIndex: number, endIndex: number) => Promise<void>;
  handleDragStart: (deviceType: DeviceType) => void;
  handleDragEnd: () => void;
}

export interface UseDevicesResult {
  devices: Device[];
  filteredDevices: Device[];
  deviceTypes: DeviceType[];
  selectedTypeId: string | null;
  loading: boolean;
  error: string | null;
  editingId: string | null;
  showForm: boolean;
  formData: DeviceFormData;
  // Actions
  loadDevices: () => Promise<void>;
  selectDeviceType: (typeId: string | null) => void;
  startEdit: (device: Device) => void;
  cancelEdit: () => void;
  showCreateForm: () => void;
  updateFormData: (updates: Partial<DeviceFormData>) => void;
  saveDevice: () => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  updateDeviceStatus: (id: string, status: Device['status']) => Promise<void>;
}