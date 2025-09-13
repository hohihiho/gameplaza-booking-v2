export type PaymentMethod = 'cash' | 'transfer'

export interface ReservationRecord {
  id: string
  user_id: string
  device_id: string
  date: string // YYYY-MM-DD (KST)
  start_time: string // HH:MM
  end_time: string // HH:MM
  player_count: number
  credit_type: string
  fixed_credits?: number
  total_amount: number
  user_notes?: string
  slot_type: string
  status: string
  created_at: string
  updated_at: string
  check_in_at?: string
  payment_method?: PaymentMethod
  payment_amount?: number
}

export interface ListParams {
  page?: number
  pageSize?: number
  status?: string
}

export interface ListResult {
  reservations: ReservationRecord[]
  total: number
  page: number
  pageSize: number
}

// 새로운 데이터베이스 레이어 타입 정의
export interface DatabaseResult<T = any> {
  data: T | null;
  error: Error | null;
  count?: number;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
}

export interface TransactionCallback<T> {
  (): Promise<T>;
}

export interface DatabaseClient {
  query(text: string, params?: any[]): Promise<any>;
  release(): void;
}

// Repository 패턴을 위한 기본 인터페이스
export interface Repository<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  findById(id: string): Promise<DatabaseResult<T>>;
  findMany(options?: QueryOptions): Promise<DatabaseResult<T[]>>;
  create(data: CreateInput): Promise<DatabaseResult<T>>;
  update(id: string, data: UpdateInput): Promise<DatabaseResult<T>>;
  delete(id: string): Promise<DatabaseResult<T>>;
}

// 확장된 쿼리 빌더 인터페이스
export interface QueryBuilder<T> {
  select(columns?: string): QueryBuilder<T>;
  where(column: string, operator: string, value: any): QueryBuilder<T>;
  orderBy(column: string, direction?: 'ASC' | 'DESC'): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  offset(count: number): QueryBuilder<T>;
  join(table: string, condition: string): QueryBuilder<T>;
  execute(): Promise<DatabaseResult<T[]>>;
  first(): Promise<DatabaseResult<T>>;
}

