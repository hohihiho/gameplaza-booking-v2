/**
 * 자동 스케줄링 시스템
 *
 * 기능:
 * - 최적 시간대 자동 제안
 * - 충돌 회피 알고리즘
 * - 리소스 균등 분배
 * - 예약 자동 재배치
 * - 대기열 관리
 */

import { EventEmitter } from 'events';

interface ScheduleSlot {
  startTime: Date;
  endTime: Date;
  deviceId: string;
  userId?: string;
  type: 'available' | 'reserved' | 'maintenance' | 'blocked';
  priority: number;
  metadata?: Record<string, any>;
}

interface SchedulingConstraints {
  minDuration: number;  // 최소 예약 시간 (분)
  maxDuration: number;  // 최대 예약 시간 (분)
  bufferTime: number;   // 예약 간 버퍼 시간 (분)
  maintenanceWindow: {
    dayOfWeek: number;
    startHour: number;
    endHour: number;
  }[];
  peakHours: {
    startHour: number;
    endHour: number;
    surcharge: number;
  }[];
}

interface OptimizationResult {
  originalScore: number;
  optimizedScore: number;
  improvement: number;
  suggestions: Array<{
    type: 'move' | 'merge' | 'split' | 'cancel';
    reason: string;
    impact: string;
    slots: ScheduleSlot[];
  }>;
  conflicts: Array<{
    slot1: ScheduleSlot;
    slot2: ScheduleSlot;
    resolution: string;
  }>;
}

interface WaitlistEntry {
  id: string;
  userId: string;
  deviceId: string;
  preferredTime: Date;
  flexibleRange: number;  // 시간 유연성 (분)
  priority: number;
  createdAt: Date;
  notified: boolean;
}

/**
 * 자동 스케줄러 클래스
 */
export class AutoScheduler extends EventEmitter {
  private schedules: Map<string, ScheduleSlot[]> = new Map();
  private constraints: SchedulingConstraints;
  private waitlist: WaitlistEntry[] = [];
  private optimizationHistory: OptimizationResult[] = [];

  constructor(constraints?: Partial<SchedulingConstraints>) {
    super();
    this.constraints = {
      minDuration: 30,
      maxDuration: 240,
      bufferTime: 10,
      maintenanceWindow: [
        { dayOfWeek: 1, startHour: 3, endHour: 5 },  // 월요일 새벽
      ],
      peakHours: [
        { startHour: 18, endHour: 22, surcharge: 1.5 },  // 저녁 피크
        { startHour: 14, endHour: 17, surcharge: 1.2 },  // 오후 피크
      ],
      ...constraints,
    };
  }

  /**
   * 최적 시간대 찾기
   */
  public findOptimalSlot(
    deviceId: string,
    duration: number,
    preferredTime?: Date,
    flexibleRange: number = 120
  ): ScheduleSlot | null {
    const deviceSchedule = this.schedules.get(deviceId) || [];

    // 선호 시간이 없으면 다음 가능한 시간 찾기
    if (!preferredTime) {
      preferredTime = new Date();
      preferredTime.setHours(preferredTime.getHours() + 1);
    }

    // 유연한 시간 범위 내에서 검색
    const searchStart = new Date(preferredTime.getTime() - flexibleRange * 60000);
    const searchEnd = new Date(preferredTime.getTime() + flexibleRange * 60000);

    let bestSlot: ScheduleSlot | null = null;
    let bestScore = -Infinity;

    // 시간대별로 스코어 계산
    for (let time = searchStart; time <= searchEnd; time = new Date(time.getTime() + 15 * 60000)) {
      const slot: ScheduleSlot = {
        startTime: time,
        endTime: new Date(time.getTime() + duration * 60000),
        deviceId,
        type: 'available',
        priority: 0,
      };

      if (this.isSlotAvailable(slot, deviceSchedule)) {
        const score = this.calculateSlotScore(slot, preferredTime);
        if (score > bestScore) {
          bestScore = score;
          bestSlot = slot;
        }
      }
    }

    return bestSlot;
  }

  /**
   * 스케줄 최적화
   */
  public optimizeSchedule(deviceId: string): OptimizationResult {
    const schedule = this.schedules.get(deviceId) || [];
    const originalScore = this.calculateScheduleScore(schedule);
    const suggestions: OptimizationResult['suggestions'] = [];
    const conflicts: OptimizationResult['conflicts'] = [];

    // 1. 충돌 감지 및 해결
    for (let i = 0; i < schedule.length - 1; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        if (this.detectConflict(schedule[i], schedule[j])) {
          conflicts.push({
            slot1: schedule[i],
            slot2: schedule[j],
            resolution: this.suggestConflictResolution(schedule[i], schedule[j]),
          });
        }
      }
    }

    // 2. 연속된 짧은 예약 병합 제안
    const mergeableSlots = this.findMergeableSlots(schedule);
    if (mergeableSlots.length > 0) {
      suggestions.push({
        type: 'merge',
        reason: '연속된 짧은 예약을 병합하여 효율성 향상',
        impact: '대기 시간 감소, 관리 부담 감소',
        slots: mergeableSlots,
      });
    }

    // 3. 긴 유휴 시간 활용 제안
    const idlePeriods = this.findIdlePeriods(schedule);
    for (const period of idlePeriods) {
      if (period.duration > this.constraints.minDuration * 2) {
        suggestions.push({
          type: 'split',
          reason: '긴 유휴 시간을 활용 가능한 슬롯으로 분할',
          impact: '예약 가능 시간 증가',
          slots: [period.slot],
        });
      }
    }

    // 4. 피크 시간대 재배치 제안
    const peakSlots = this.findPeakTimeSlots(schedule);
    for (const slot of peakSlots) {
      const alternativeSlot = this.findAlternativeSlot(slot);
      if (alternativeSlot) {
        suggestions.push({
          type: 'move',
          reason: '피크 시간대 예약을 비피크 시간으로 이동',
          impact: '비용 절감, 피크 시간 가용성 증가',
          slots: [slot, alternativeSlot],
        });
      }
    }

    // 최적화 후 스코어 계산
    const optimizedSchedule = this.applyOptimizations(schedule, suggestions);
    const optimizedScore = this.calculateScheduleScore(optimizedSchedule);

    const result: OptimizationResult = {
      originalScore,
      optimizedScore,
      improvement: ((optimizedScore - originalScore) / originalScore) * 100,
      suggestions,
      conflicts,
    };

    this.optimizationHistory.push(result);
    this.emit('optimization', result);

    return result;
  }

  /**
   * 대기열 관리
   */
  public addToWaitlist(
    userId: string,
    deviceId: string,
    preferredTime: Date,
    flexibleRange: number = 60
  ): string {
    const entry: WaitlistEntry = {
      id: `wl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      deviceId,
      preferredTime,
      flexibleRange,
      priority: this.calculateWaitlistPriority(userId),
      createdAt: new Date(),
      notified: false,
    };

    this.waitlist.push(entry);
    this.waitlist.sort((a, b) => b.priority - a.priority);

    // 자동 매칭 시도
    this.processWaitlist();

    return entry.id;
  }

  /**
   * 대기열 처리
   */
  private processWaitlist(): void {
    const processed: string[] = [];

    for (const entry of this.waitlist) {
      if (entry.notified) continue;

      const slot = this.findOptimalSlot(
        entry.deviceId,
        60,  // 기본 1시간
        entry.preferredTime,
        entry.flexibleRange
      );

      if (slot) {
        // 예약 가능한 슬롯 발견
        this.emit('waitlist-match', {
          entry,
          slot,
        });

        entry.notified = true;
        processed.push(entry.id);
      }
    }

    // 처리된 항목 제거 (일정 시간 후)
    setTimeout(() => {
      this.waitlist = this.waitlist.filter(e => !processed.includes(e.id));
    }, 3600000);  // 1시간 후
  }

  /**
   * 자동 재배치
   */
  public autoReschedule(
    originalSlot: ScheduleSlot,
    reason: string
  ): ScheduleSlot | null {
    const alternatives: Array<{ slot: ScheduleSlot; score: number }> = [];

    // 다양한 시간대에서 대체 슬롯 찾기
    const searchRanges = [
      { offset: -120, range: 60 },   // 2시간 전
      { offset: 120, range: 60 },    // 2시간 후
      { offset: -240, range: 120 },  // 4시간 전
      { offset: 240, range: 120 },   // 4시간 후
    ];

    for (const { offset, range } of searchRanges) {
      const searchTime = new Date(originalSlot.startTime.getTime() + offset * 60000);
      const duration = (originalSlot.endTime.getTime() - originalSlot.startTime.getTime()) / 60000;

      const alternative = this.findOptimalSlot(
        originalSlot.deviceId,
        duration,
        searchTime,
        range
      );

      if (alternative) {
        alternatives.push({
          slot: alternative,
          score: this.calculateRescheduleScore(originalSlot, alternative),
        });
      }
    }

    // 최적의 대체 슬롯 선택
    alternatives.sort((a, b) => b.score - a.score);

    if (alternatives.length > 0) {
      const bestAlternative = alternatives[0].slot;

      this.emit('auto-reschedule', {
        original: originalSlot,
        new: bestAlternative,
        reason,
      });

      return bestAlternative;
    }

    return null;
  }

  /**
   * 리소스 균등 분배
   */
  public balanceResources(deviceIds: string[]): Map<string, ScheduleSlot[]> {
    const balanced = new Map<string, ScheduleSlot[]>();
    const totalLoad = new Map<string, number>();

    // 각 기기의 현재 부하 계산
    for (const deviceId of deviceIds) {
      const schedule = this.schedules.get(deviceId) || [];
      const load = this.calculateDeviceLoad(schedule);
      totalLoad.set(deviceId, load);
    }

    // 평균 부하 계산
    const avgLoad = Array.from(totalLoad.values()).reduce((a, b) => a + b, 0) / deviceIds.length;

    // 재분배가 필요한 예약 찾기
    for (const [deviceId, load] of totalLoad) {
      if (load > avgLoad * 1.2) {  // 20% 이상 초과
        const schedule = this.schedules.get(deviceId) || [];
        const redistributable = this.findRedistributableSlots(schedule, load - avgLoad);

        for (const slot of redistributable) {
          // 부하가 적은 기기로 이동
          const targetDevice = this.findLeastLoadedDevice(totalLoad, avgLoad);
          if (targetDevice) {
            const movedSlot = { ...slot, deviceId: targetDevice };

            if (!balanced.has(targetDevice)) {
              balanced.set(targetDevice, []);
            }
            balanced.get(targetDevice)!.push(movedSlot);

            // 부하 업데이트
            const slotLoad = (slot.endTime.getTime() - slot.startTime.getTime()) / 3600000;
            totalLoad.set(deviceId, totalLoad.get(deviceId)! - slotLoad);
            totalLoad.set(targetDevice, totalLoad.get(targetDevice)! + slotLoad);
          }
        }
      }
    }

    return balanced;
  }

  /**
   * 예약 패턴 학습
   */
  public learnBookingPatterns(): {
    patterns: Array<{
      dayOfWeek: number;
      hour: number;
      demand: number;
      recommendation: string;
    }>;
  } {
    const patterns: any[] = [];
    const demandMap = new Map<string, number>();

    // 모든 예약 분석
    for (const [_, schedule] of this.schedules) {
      for (const slot of schedule) {
        if (slot.type === 'reserved') {
          const key = `${slot.startTime.getDay()}_${slot.startTime.getHours()}`;
          demandMap.set(key, (demandMap.get(key) || 0) + 1);
        }
      }
    }

    // 패턴 생성
    for (const [key, demand] of demandMap) {
      const [day, hour] = key.split('_').map(Number);
      patterns.push({
        dayOfWeek: day,
        hour,
        demand,
        recommendation: this.generateRecommendation(demand, day, hour),
      });
    }

    return { patterns };
  }

  // 유틸리티 메서드들
  private isSlotAvailable(slot: ScheduleSlot, schedule: ScheduleSlot[]): boolean {
    for (const existing of schedule) {
      if (existing.type === 'reserved' || existing.type === 'maintenance') {
        if (
          (slot.startTime >= existing.startTime && slot.startTime < existing.endTime) ||
          (slot.endTime > existing.startTime && slot.endTime <= existing.endTime) ||
          (slot.startTime <= existing.startTime && slot.endTime >= existing.endTime)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private calculateSlotScore(slot: ScheduleSlot, preferredTime: Date): number {
    let score = 100;

    // 선호 시간과의 차이
    const timeDiff = Math.abs(slot.startTime.getTime() - preferredTime.getTime()) / 60000;
    score -= timeDiff * 0.5;

    // 피크 시간대 페널티
    const hour = slot.startTime.getHours();
    for (const peak of this.constraints.peakHours) {
      if (hour >= peak.startHour && hour < peak.endHour) {
        score -= 20 * peak.surcharge;
      }
    }

    // 유지보수 시간 근처 페널티
    for (const maintenance of this.constraints.maintenanceWindow) {
      if (slot.startTime.getDay() === maintenance.dayOfWeek) {
        if (hour >= maintenance.startHour - 1 && hour <= maintenance.endHour + 1) {
          score -= 30;
        }
      }
    }

    return Math.max(0, score);
  }

  private calculateScheduleScore(schedule: ScheduleSlot[]): number {
    let score = 0;

    // 활용률
    const utilization = this.calculateUtilization(schedule);
    score += utilization * 50;

    // 균등 분포
    const distribution = this.calculateDistribution(schedule);
    score += distribution * 30;

    // 충돌 없음
    const conflicts = this.countConflicts(schedule);
    score -= conflicts * 20;

    // 유휴 시간 최소화
    const idleTime = this.calculateIdleTime(schedule);
    score -= idleTime * 0.1;

    return Math.max(0, score);
  }

  private detectConflict(slot1: ScheduleSlot, slot2: ScheduleSlot): boolean {
    return slot1.deviceId === slot2.deviceId &&
      ((slot1.startTime >= slot2.startTime && slot1.startTime < slot2.endTime) ||
       (slot1.endTime > slot2.startTime && slot1.endTime <= slot2.endTime));
  }

  private suggestConflictResolution(slot1: ScheduleSlot, slot2: ScheduleSlot): string {
    const duration1 = slot1.endTime.getTime() - slot1.startTime.getTime();
    const duration2 = slot2.endTime.getTime() - slot2.startTime.getTime();

    if (slot1.priority > slot2.priority) {
      return `슬롯 2를 ${new Date(slot1.endTime.getTime() + this.constraints.bufferTime * 60000).toLocaleTimeString()}로 이동`;
    } else if (slot2.priority > slot1.priority) {
      return `슬롯 1를 ${new Date(slot2.endTime.getTime() + this.constraints.bufferTime * 60000).toLocaleTimeString()}로 이동`;
    } else {
      return '두 예약을 병합하거나 하나를 취소';
    }
  }

  private findMergeableSlots(schedule: ScheduleSlot[]): ScheduleSlot[] {
    const mergeable: ScheduleSlot[] = [];

    for (let i = 0; i < schedule.length - 1; i++) {
      const current = schedule[i];
      const next = schedule[i + 1];

      if (current.userId === next.userId &&
          current.deviceId === next.deviceId &&
          next.startTime.getTime() - current.endTime.getTime() <= this.constraints.bufferTime * 60000) {
        mergeable.push(current, next);
      }
    }

    return mergeable;
  }

  private findIdlePeriods(schedule: ScheduleSlot[]): Array<{ slot: ScheduleSlot; duration: number }> {
    const idle: Array<{ slot: ScheduleSlot; duration: number }> = [];
    const sorted = [...schedule].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].startTime.getTime() - sorted[i].endTime.getTime();
      if (gap > this.constraints.minDuration * 60000) {
        idle.push({
          slot: {
            startTime: sorted[i].endTime,
            endTime: sorted[i + 1].startTime,
            deviceId: sorted[i].deviceId,
            type: 'available',
            priority: 0,
          },
          duration: gap / 60000,
        });
      }
    }

    return idle;
  }

  private findPeakTimeSlots(schedule: ScheduleSlot[]): ScheduleSlot[] {
    return schedule.filter(slot => {
      const hour = slot.startTime.getHours();
      return this.constraints.peakHours.some(peak =>
        hour >= peak.startHour && hour < peak.endHour
      );
    });
  }

  private findAlternativeSlot(slot: ScheduleSlot): ScheduleSlot | null {
    // 비피크 시간대에서 대체 슬롯 찾기
    const duration = (slot.endTime.getTime() - slot.startTime.getTime()) / 60000;
    const nonPeakHours = this.getNonPeakHours();

    for (const hour of nonPeakHours) {
      const testTime = new Date(slot.startTime);
      testTime.setHours(hour);

      const alternative = this.findOptimalSlot(
        slot.deviceId,
        duration,
        testTime,
        30
      );

      if (alternative) {
        return alternative;
      }
    }

    return null;
  }

  private getNonPeakHours(): number[] {
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    return allHours.filter(hour =>
      !this.constraints.peakHours.some(peak =>
        hour >= peak.startHour && hour < peak.endHour
      )
    );
  }

  private applyOptimizations(
    schedule: ScheduleSlot[],
    suggestions: OptimizationResult['suggestions']
  ): ScheduleSlot[] {
    const optimized = [...schedule];

    for (const suggestion of suggestions) {
      switch (suggestion.type) {
        case 'merge':
          // 병합 로직
          break;
        case 'move':
          // 이동 로직
          break;
        case 'split':
          // 분할 로직
          break;
        case 'cancel':
          // 취소 로직
          break;
      }
    }

    return optimized;
  }

  private calculateWaitlistPriority(userId: string): number {
    // 우선순위 계산 로직
    // VIP, 대기 시간, 이전 예약 이력 등 고려
    return Math.random() * 100;
  }

  private calculateRescheduleScore(original: ScheduleSlot, alternative: ScheduleSlot): number {
    let score = 100;

    // 시간 차이
    const timeDiff = Math.abs(original.startTime.getTime() - alternative.startTime.getTime()) / 3600000;
    score -= timeDiff * 10;

    // 같은 날짜 유지
    if (original.startTime.getDate() === alternative.startTime.getDate()) {
      score += 20;
    }

    return score;
  }

  private calculateDeviceLoad(schedule: ScheduleSlot[]): number {
    return schedule.reduce((total, slot) => {
      if (slot.type === 'reserved') {
        return total + (slot.endTime.getTime() - slot.startTime.getTime()) / 3600000;
      }
      return total;
    }, 0);
  }

  private findLeastLoadedDevice(loads: Map<string, number>, avgLoad: number): string | null {
    let minLoad = Infinity;
    let targetDevice: string | null = null;

    for (const [deviceId, load] of loads) {
      if (load < avgLoad * 0.8 && load < minLoad) {
        minLoad = load;
        targetDevice = deviceId;
      }
    }

    return targetDevice;
  }

  private findRedistributableSlots(schedule: ScheduleSlot[], excessLoad: number): ScheduleSlot[] {
    const redistributable: ScheduleSlot[] = [];
    let accumulatedLoad = 0;

    for (const slot of schedule) {
      if (slot.type === 'reserved' && slot.priority < 5) {
        redistributable.push(slot);
        accumulatedLoad += (slot.endTime.getTime() - slot.startTime.getTime()) / 3600000;

        if (accumulatedLoad >= excessLoad) {
          break;
        }
      }
    }

    return redistributable;
  }

  private calculateUtilization(schedule: ScheduleSlot[]): number {
    const totalTime = 24 * 60;  // 하루 총 시간 (분)
    const usedTime = schedule.reduce((total, slot) => {
      if (slot.type === 'reserved') {
        return total + (slot.endTime.getTime() - slot.startTime.getTime()) / 60000;
      }
      return total;
    }, 0);

    return Math.min(100, (usedTime / totalTime) * 100);
  }

  private calculateDistribution(schedule: ScheduleSlot[]): number {
    // 시간대별 분포 균등도 계산
    const hourCounts = new Array(24).fill(0);

    for (const slot of schedule) {
      if (slot.type === 'reserved') {
        const hour = slot.startTime.getHours();
        hourCounts[hour]++;
      }
    }

    const avg = hourCounts.reduce((a, b) => a + b, 0) / 24;
    const variance = hourCounts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / 24;

    return Math.max(0, 100 - variance * 10);
  }

  private countConflicts(schedule: ScheduleSlot[]): number {
    let conflicts = 0;

    for (let i = 0; i < schedule.length - 1; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        if (this.detectConflict(schedule[i], schedule[j])) {
          conflicts++;
        }
      }
    }

    return conflicts;
  }

  private calculateIdleTime(schedule: ScheduleSlot[]): number {
    const sorted = [...schedule].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    let idleTime = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].startTime.getTime() - sorted[i].endTime.getTime();
      if (gap > 0) {
        idleTime += gap / 60000;
      }
    }

    return idleTime;
  }

  private generateRecommendation(demand: number, day: number, hour: number): string {
    if (demand > 10) {
      return '높은 수요 - 추가 리소스 할당 권장';
    } else if (demand < 3) {
      return '낮은 수요 - 프로모션 또는 할인 고려';
    } else {
      return '정상 수요';
    }
  }
}

// 싱글톤 인스턴스
export const autoScheduler = new AutoScheduler();