/**
 * 마이크로서비스 아키텍처 설계
 *
 * 기능:
 * - 서비스 디스커버리
 * - 로드 밸런싱
 * - 서킷 브레이커
 * - 이벤트 버스
 * - 분산 트랜잭션
 */

import { EventEmitter } from 'events';

// 서비스 타입 정의
type ServiceType =
  | 'auth'
  | 'reservation'
  | 'device'
  | 'payment'
  | 'notification'
  | 'analytics'
  | 'user'
  | 'admin';

// 서비스 상태
type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline';

// 로드 밸런싱 전략
type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'weighted' | 'random';

// 서킷 브레이커 상태
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * 서비스 인스턴스
 */
interface ServiceInstance {
  id: string;
  type: ServiceType;
  version: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'grpc' | 'ws';
  status: ServiceStatus;
  metadata: {
    startTime: Date;
    lastHealthCheck: Date;
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    cpu: number;
    memory: number;
  };
  capabilities: string[];
  dependencies: ServiceType[];
}

/**
 * 서비스 레지스트리
 */
interface ServiceRegistry {
  services: Map<ServiceType, ServiceInstance[]>;
  register(instance: ServiceInstance): void;
  deregister(instanceId: string): void;
  discover(type: ServiceType): ServiceInstance[];
  healthCheck(): void;
}

/**
 * API 엔드포인트
 */
interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  service: ServiceType;
  version: string;
  rateLimit?: {
    requests: number;
    window: number;  // seconds
  };
  cache?: {
    ttl: number;  // seconds
    key: string;
  };
  transform?: (data: any) => any;
  validation?: (data: any) => boolean;
}

/**
 * 이벤트 메시지
 */
interface EventMessage {
  id: string;
  type: string;
  source: ServiceType;
  timestamp: Date;
  data: any;
  metadata: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    version: string;
  };
}

/**
 * 분산 트랜잭션
 */
interface DistributedTransaction {
  id: string;
  status: 'pending' | 'preparing' | 'committed' | 'aborted';
  participants: Array<{
    service: ServiceType;
    status: 'pending' | 'prepared' | 'committed' | 'aborted';
    rollbackData?: any;
  }>;
  timeout: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * 서비스 디스커버리
 */
export class ServiceDiscovery extends EventEmitter implements ServiceRegistry {
  public services: Map<ServiceType, ServiceInstance[]> = new Map();
  private healthCheckInterval: NodeJS.Timer | null = null;

  constructor() {
    super();
    this.startHealthCheck();
  }

  /**
   * 서비스 등록
   */
  public register(instance: ServiceInstance): void {
    const instances = this.services.get(instance.type) || [];

    // 중복 체크
    const existingIndex = instances.findIndex(i => i.id === instance.id);
    if (existingIndex >= 0) {
      instances[existingIndex] = instance;
    } else {
      instances.push(instance);
    }

    this.services.set(instance.type, instances);
    this.emit('service-registered', instance);

    console.log(`Service registered: ${instance.type}@${instance.version} at ${instance.host}:${instance.port}`);
  }

  /**
   * 서비스 등록 해제
   */
  public deregister(instanceId: string): void {
    for (const [type, instances] of this.services) {
      const filtered = instances.filter(i => i.id !== instanceId);
      if (filtered.length < instances.length) {
        this.services.set(type, filtered);
        this.emit('service-deregistered', { type, instanceId });
        console.log(`Service deregistered: ${instanceId}`);
        break;
      }
    }
  }

  /**
   * 서비스 탐색
   */
  public discover(type: ServiceType, version?: string): ServiceInstance[] {
    const instances = this.services.get(type) || [];

    if (version) {
      return instances.filter(i => i.version === version && i.status !== 'offline');
    }

    return instances.filter(i => i.status !== 'offline');
  }

  /**
   * 헬스 체크
   */
  public async healthCheck(): Promise<void> {
    for (const [type, instances] of this.services) {
      for (const instance of instances) {
        try {
          const healthy = await this.checkInstanceHealth(instance);
          instance.status = healthy ? 'healthy' : 'unhealthy';
          instance.metadata.lastHealthCheck = new Date();
        } catch (error) {
          instance.status = 'offline';
          console.error(`Health check failed for ${instance.id}:`, error);
        }
      }
    }
  }

  private async checkInstanceHealth(instance: ServiceInstance): Promise<boolean> {
    // 실제 구현에서는 HTTP/gRPC 헬스 체크 수행
    return Math.random() > 0.1;  // 90% 성공률 시뮬레이션
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.healthCheck();
    }, 10000);  // 10초마다
  }
}

/**
 * 로드 밸런서
 */
export class LoadBalancer {
  private strategy: LoadBalancingStrategy;
  private roundRobinIndex: Map<ServiceType, number> = new Map();
  private connectionCounts: Map<string, number> = new Map();

  constructor(strategy: LoadBalancingStrategy = 'round-robin') {
    this.strategy = strategy;
  }

  /**
   * 다음 인스턴스 선택
   */
  public selectInstance(
    instances: ServiceInstance[],
    serviceType: ServiceType
  ): ServiceInstance | null {
    const healthyInstances = instances.filter(i => i.status === 'healthy');

    if (healthyInstances.length === 0) {
      return null;
    }

    switch (this.strategy) {
      case 'round-robin':
        return this.roundRobin(healthyInstances, serviceType);

      case 'least-connections':
        return this.leastConnections(healthyInstances);

      case 'weighted':
        return this.weighted(healthyInstances);

      case 'random':
        return this.random(healthyInstances);

      default:
        return healthyInstances[0];
    }
  }

  private roundRobin(instances: ServiceInstance[], serviceType: ServiceType): ServiceInstance {
    const currentIndex = this.roundRobinIndex.get(serviceType) || 0;
    const instance = instances[currentIndex % instances.length];
    this.roundRobinIndex.set(serviceType, currentIndex + 1);
    return instance;
  }

  private leastConnections(instances: ServiceInstance[]): ServiceInstance {
    let minConnections = Infinity;
    let selectedInstance = instances[0];

    for (const instance of instances) {
      const connections = this.connectionCounts.get(instance.id) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedInstance = instance;
      }
    }

    return selectedInstance;
  }

  private weighted(instances: ServiceInstance[]): ServiceInstance {
    // CPU와 메모리 기반 가중치
    const weights = instances.map(i => {
      const cpuWeight = 1 - (i.metadata.cpu / 100);
      const memWeight = 1 - (i.metadata.memory / 100);
      return cpuWeight * memWeight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < instances.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return instances[i];
      }
    }

    return instances[instances.length - 1];
  }

  private random(instances: ServiceInstance[]): ServiceInstance {
    return instances[Math.floor(Math.random() * instances.length)];
  }
}

/**
 * 서킷 브레이커
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private nextAttempt?: Date;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000,  // 60초
    private readonly resetTimeout: number = 30000  // 30초
  ) {}

  /**
   * 요청 실행
   */
  public async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    if (this.state === 'open') {
      if (this.canAttemptReset()) {
        this.state = 'half-open';
      } else {
        if (fallback) {
          return fallback();
        }
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();

      if (fallback) {
        return fallback();
      }

      throw error;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), this.timeout)
      ),
    ]);
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.threshold) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      this.nextAttempt = new Date(Date.now() + this.resetTimeout);
    }
  }

  private canAttemptReset(): boolean {
    return this.nextAttempt ? new Date() >= this.nextAttempt : false;
  }

  public getState(): CircuitState {
    return this.state;
  }
}

/**
 * 이벤트 버스
 */
export class EventBus extends EventEmitter {
  private subscribers: Map<string, Set<ServiceType>> = new Map();
  private messageQueue: EventMessage[] = [];
  private processing = false;

  /**
   * 이벤트 발행
   */
  public publish(message: EventMessage): void {
    this.messageQueue.push(message);
    this.emit('message-published', message);

    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * 이벤트 구독
   */
  public subscribe(eventType: string, service: ServiceType): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    this.subscribers.get(eventType)!.add(service);
  }

  /**
   * 구독 해제
   */
  public unsubscribe(eventType: string, service: ServiceType): void {
    this.subscribers.get(eventType)?.delete(service);
  }

  /**
   * 큐 처리
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.deliverMessage(message);
    }

    this.processing = false;
  }

  /**
   * 메시지 전달
   */
  private async deliverMessage(message: EventMessage): Promise<void> {
    const subscribers = this.subscribers.get(message.type);

    if (!subscribers || subscribers.size === 0) {
      console.log(`No subscribers for event type: ${message.type}`);
      return;
    }

    for (const service of subscribers) {
      try {
        this.emit(`event:${service}`, message);
        console.log(`Delivered event ${message.type} to ${service}`);
      } catch (error) {
        console.error(`Failed to deliver event to ${service}:`, error);
      }
    }
  }
}

/**
 * 분산 트랜잭션 관리자 (Saga 패턴)
 */
export class TransactionManager extends EventEmitter {
  private transactions: Map<string, DistributedTransaction> = new Map();
  private compensations: Map<string, Array<() => Promise<void>>> = new Map();

  /**
   * 트랜잭션 시작
   */
  public async beginTransaction(
    participants: ServiceType[],
    timeout: number = 30000
  ): Promise<string> {
    const transaction: DistributedTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      participants: participants.map(service => ({
        service,
        status: 'pending',
      })),
      timeout,
      createdAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);
    this.compensations.set(transaction.id, []);

    // 타임아웃 설정
    setTimeout(() => {
      if (transaction.status === 'pending' || transaction.status === 'preparing') {
        this.rollback(transaction.id);
      }
    }, timeout);

    return transaction.id;
  }

  /**
   * 트랜잭션 준비 (2PC - Phase 1)
   */
  public async prepare(
    transactionId: string,
    service: ServiceType,
    action: () => Promise<any>,
    compensation: () => Promise<void>
  ): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const participant = transaction.participants.find(p => p.service === service);
    if (!participant) {
      throw new Error(`Service ${service} is not a participant`);
    }

    try {
      transaction.status = 'preparing';
      const result = await action();

      participant.status = 'prepared';
      participant.rollbackData = result;

      this.compensations.get(transactionId)!.push(compensation);

      this.emit('transaction-prepared', { transactionId, service });
    } catch (error) {
      participant.status = 'aborted';
      await this.rollback(transactionId);
      throw error;
    }
  }

  /**
   * 트랜잭션 커밋 (2PC - Phase 2)
   */
  public async commit(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // 모든 참여자가 준비되었는지 확인
    const allPrepared = transaction.participants.every(p => p.status === 'prepared');
    if (!allPrepared) {
      await this.rollback(transactionId);
      throw new Error('Not all participants are prepared');
    }

    transaction.status = 'committed';
    transaction.completedAt = new Date();

    for (const participant of transaction.participants) {
      participant.status = 'committed';
    }

    this.emit('transaction-committed', transaction);

    // 정리
    this.transactions.delete(transactionId);
    this.compensations.delete(transactionId);
  }

  /**
   * 트랜잭션 롤백
   */
  public async rollback(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return;
    }

    transaction.status = 'aborted';

    // 보상 트랜잭션 실행 (역순)
    const compensations = this.compensations.get(transactionId) || [];
    for (const compensation of compensations.reverse()) {
      try {
        await compensation();
      } catch (error) {
        console.error('Compensation failed:', error);
      }
    }

    this.emit('transaction-aborted', transaction);

    // 정리
    this.transactions.delete(transactionId);
    this.compensations.delete(transactionId);
  }

  /**
   * 트랜잭션 상태 조회
   */
  public getTransaction(transactionId: string): DistributedTransaction | undefined {
    return this.transactions.get(transactionId);
  }
}

/**
 * 서비스 메시 설정
 */
export interface ServiceMeshConfig {
  service: ServiceType;
  version: string;
  instances: number;
  autoScale: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    cpuThreshold: number;
    memoryThreshold: number;
  };
  healthCheck: {
    path: string;
    interval: number;
    timeout: number;
    retries: number;
  };
  retry: {
    attempts: number;
    backoff: 'exponential' | 'linear';
    maxBackoff: number;
  };
  circuitBreaker: {
    enabled: boolean;
    threshold: number;
    timeout: number;
    resetTimeout: number;
  };
  rateLimit: {
    enabled: boolean;
    requests: number;
    window: number;
  };
}

/**
 * 마이크로서비스 오케스트레이터
 */
export class MicroserviceOrchestrator {
  private serviceDiscovery: ServiceDiscovery;
  private loadBalancer: LoadBalancer;
  private eventBus: EventBus;
  private transactionManager: TransactionManager;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor() {
    this.serviceDiscovery = new ServiceDiscovery();
    this.loadBalancer = new LoadBalancer();
    this.eventBus = new EventBus();
    this.transactionManager = new TransactionManager();

    this.initializeServices();
  }

  /**
   * 서비스 초기화
   */
  private initializeServices(): void {
    // 예제 서비스 등록
    const services: ServiceInstance[] = [
      {
        id: 'auth-1',
        type: 'auth',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http',
        status: 'healthy',
        metadata: {
          startTime: new Date(),
          lastHealthCheck: new Date(),
          requestCount: 0,
          errorCount: 0,
          averageResponseTime: 50,
          cpu: 30,
          memory: 40,
        },
        capabilities: ['login', 'logout', 'refresh'],
        dependencies: [],
      },
      {
        id: 'reservation-1',
        type: 'reservation',
        version: '1.0.0',
        host: 'localhost',
        port: 3002,
        protocol: 'http',
        status: 'healthy',
        metadata: {
          startTime: new Date(),
          lastHealthCheck: new Date(),
          requestCount: 0,
          errorCount: 0,
          averageResponseTime: 75,
          cpu: 45,
          memory: 55,
        },
        capabilities: ['create', 'update', 'cancel', 'list'],
        dependencies: ['auth', 'device', 'payment'],
      },
    ];

    for (const service of services) {
      this.serviceDiscovery.register(service);
    }
  }

  /**
   * 서비스 호출
   */
  public async callService<T>(
    serviceType: ServiceType,
    operation: string,
    data?: any
  ): Promise<T> {
    const instances = this.serviceDiscovery.discover(serviceType);
    const instance = this.loadBalancer.selectInstance(instances, serviceType);

    if (!instance) {
      throw new Error(`No healthy instances found for ${serviceType}`);
    }

    const circuitBreaker = this.getOrCreateCircuitBreaker(instance.id);

    return circuitBreaker.execute(async () => {
      // 실제 서비스 호출 (HTTP/gRPC)
      console.log(`Calling ${serviceType}@${instance.host}:${instance.port}/${operation}`);

      // 시뮬레이션
      return { success: true, data } as T;
    });
  }

  /**
   * 이벤트 발행
   */
  public publishEvent(
    type: string,
    source: ServiceType,
    data: any
  ): void {
    const message: EventMessage = {
      id: `evt_${Date.now()}`,
      type,
      source,
      timestamp: new Date(),
      data,
      metadata: {
        version: '1.0.0',
      },
    };

    this.eventBus.publish(message);
  }

  /**
   * 분산 트랜잭션 실행
   */
  public async executeDistributedTransaction(
    operations: Array<{
      service: ServiceType;
      action: () => Promise<any>;
      compensation: () => Promise<void>;
    }>
  ): Promise<void> {
    const participants = operations.map(op => op.service);
    const transactionId = await this.transactionManager.beginTransaction(participants);

    try {
      // 준비 단계
      for (const operation of operations) {
        await this.transactionManager.prepare(
          transactionId,
          operation.service,
          operation.action,
          operation.compensation
        );
      }

      // 커밋
      await this.transactionManager.commit(transactionId);
    } catch (error) {
      // 자동 롤백
      console.error('Transaction failed, rolling back:', error);
      throw error;
    }
  }

  private getOrCreateCircuitBreaker(serviceId: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceId)) {
      this.circuitBreakers.set(serviceId, new CircuitBreaker());
    }
    return this.circuitBreakers.get(serviceId)!;
  }

  /**
   * 시스템 상태 조회
   */
  public getSystemHealth(): {
    services: Array<{ type: ServiceType; instances: number; healthy: number }>;
    transactions: { active: number; completed: number; failed: number };
    events: { queued: number; processed: number };
  } {
    const services = [];

    for (const [type, instances] of this.serviceDiscovery.services) {
      services.push({
        type,
        instances: instances.length,
        healthy: instances.filter(i => i.status === 'healthy').length,
      });
    }

    return {
      services,
      transactions: {
        active: 0,
        completed: 0,
        failed: 0,
      },
      events: {
        queued: 0,
        processed: 0,
      },
    };
  }
}

// 싱글톤 인스턴스
export const orchestrator = new MicroserviceOrchestrator();