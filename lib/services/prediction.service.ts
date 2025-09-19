/**
 * 예측 분석 서비스
 *
 * 기능:
 * - 수요 예측
 * - 고객 이탈 예측
 * - 매출 예측
 * - 장비 고장 예측
 * - 최적 스케줄링
 */

interface PredictionModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'timeseries';
  accuracy: number;
  lastTrained: Date;
  features: string[];
  predictions: any[];
}

interface DemandPrediction {
  date: Date;
  hour: number;
  deviceType: string;
  expectedDemand: number;
  confidence: number;
  factors: string[];
}

interface ChurnPrediction {
  customerId: string;
  churnProbability: number;
  riskLevel: 'high' | 'medium' | 'low';
  reasons: string[];
  preventionActions: string[];
}

interface RevenuePrediction {
  period: string;
  startDate: Date;
  endDate: Date;
  predictedRevenue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  assumptions: string[];
}

interface MaintenancePrediction {
  deviceId: string;
  deviceType: string;
  failureProbability: number;
  expectedFailureDate?: Date;
  maintenanceRecommendation: 'immediate' | 'scheduled' | 'monitor';
  estimatedDowntime: number;
}

interface OptimalSchedule {
  date: Date;
  slots: Array<{
    time: string;
    deviceId: string;
    expectedRevenue: number;
    utilization: number;
  }>;
  totalRevenue: number;
  efficiency: number;
}

export class PredictionService {
  private models: Map<string, PredictionModel> = new Map();
  private historicalData: any[] = [];

  /**
   * 수요 예측
   */
  public predictDemand(
    startDate: Date,
    days: number = 7
  ): DemandPrediction[] {
    const predictions: DemandPrediction[] = [];

    for (let d = 0; d < days; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);

      for (let hour = 0; hour < 24; hour++) {
        const deviceTypes = ['PS5', 'Switch', 'Racing', 'PC', 'Karaoke'];

        for (const deviceType of deviceTypes) {
          const demand = this.calculateDemand(date, hour, deviceType);
          const confidence = this.calculateConfidence(d);
          const factors = this.identifyDemandFactors(date, hour);

          predictions.push({
            date,
            hour,
            deviceType,
            expectedDemand: demand,
            confidence,
            factors,
          });
        }
      }
    }

    return predictions;
  }

  /**
   * 고객 이탈 예측
   */
  public predictChurn(customerId: string): ChurnPrediction {
    // 고객 데이터 기반 예측 (실제로는 ML 모델 사용)
    const customerData = this.getCustomerData(customerId);

    const daysSinceLastVisit = this.calculateDaysSinceLastVisit(customerData);
    const visitFrequency = customerData.visitCount / customerData.accountAge;
    const averageSpending = customerData.totalSpent / customerData.visitCount;

    let churnProbability = 0;
    const reasons: string[] = [];

    // 간단한 규칙 기반 예측
    if (daysSinceLastVisit > 60) {
      churnProbability += 0.4;
      reasons.push('60일 이상 미방문');
    } else if (daysSinceLastVisit > 30) {
      churnProbability += 0.2;
      reasons.push('30일 이상 미방문');
    }

    if (visitFrequency < 0.5) {
      churnProbability += 0.3;
      reasons.push('낮은 방문 빈도');
    }

    if (averageSpending < 20000) {
      churnProbability += 0.1;
      reasons.push('평균 이용 금액 낮음');
    }

    if (customerData.lastExperience === 'negative') {
      churnProbability += 0.2;
      reasons.push('마지막 방문 경험 부정적');
    }

    churnProbability = Math.min(1.0, churnProbability);

    const riskLevel = churnProbability > 0.7 ? 'high' :
                     churnProbability > 0.4 ? 'medium' : 'low';

    const preventionActions = this.generatePreventionActions(
      churnProbability,
      reasons
    );

    return {
      customerId,
      churnProbability,
      riskLevel,
      reasons,
      preventionActions,
    };
  }

  /**
   * 매출 예측
   */
  public predictRevenue(
    period: 'daily' | 'weekly' | 'monthly',
    startDate: Date
  ): RevenuePrediction {
    const endDate = this.calculateEndDate(startDate, period);
    const baseRevenue = this.calculateBaseRevenue(period);

    // 계절성 반영
    const seasonalFactor = this.calculateSeasonalFactor(startDate);

    // 트렌드 반영
    const trendFactor = this.calculateTrendFactor();

    // 이벤트 영향 반영
    const eventImpact = this.calculateEventImpact(startDate, endDate);

    const predictedRevenue = baseRevenue * seasonalFactor * trendFactor + eventImpact;

    // 신뢰 구간 계산 (±10%)
    const confidenceInterval = {
      lower: predictedRevenue * 0.9,
      upper: predictedRevenue * 1.1,
    };

    const assumptions = [
      '과거 3개월 데이터 기반',
      '현재 장비 구성 유지',
      '경쟁 환경 변화 없음',
      '날씨 영향 미반영',
    ];

    return {
      period,
      startDate,
      endDate,
      predictedRevenue,
      confidenceInterval,
      assumptions,
    };
  }

  /**
   * 장비 유지보수 예측
   */
  public predictMaintenance(deviceId: string): MaintenancePrediction {
    const deviceData = this.getDeviceData(deviceId);

    // 사용 시간 기반 고장 확률
    const usageHours = deviceData.totalUsageHours;
    const lastMaintenanceHours = deviceData.hoursSinceLastMaintenance;
    const averageFailureRate = deviceData.historicalFailureRate;

    let failureProbability = 0;

    // 사용 시간별 고장 확률
    if (usageHours > 5000) {
      failureProbability += 0.3;
    } else if (usageHours > 3000) {
      failureProbability += 0.2;
    } else if (usageHours > 1000) {
      failureProbability += 0.1;
    }

    // 마지막 유지보수 이후 시간
    if (lastMaintenanceHours > 720) { // 30일
      failureProbability += 0.3;
    } else if (lastMaintenanceHours > 360) { // 15일
      failureProbability += 0.15;
    }

    // 과거 고장률 반영
    failureProbability += averageFailureRate;

    failureProbability = Math.min(1.0, failureProbability);

    // 예상 고장 날짜
    let expectedFailureDate: Date | undefined;
    if (failureProbability > 0.5) {
      const daysUntilFailure = Math.floor((1 - failureProbability) * 30);
      expectedFailureDate = new Date();
      expectedFailureDate.setDate(expectedFailureDate.getDate() + daysUntilFailure);
    }

    // 유지보수 권고 사항
    const maintenanceRecommendation =
      failureProbability > 0.7 ? 'immediate' :
      failureProbability > 0.4 ? 'scheduled' : 'monitor';

    // 예상 다운타임 (시간)
    const estimatedDowntime =
      deviceData.deviceType === 'Racing' ? 4 :
      deviceData.deviceType === 'Karaoke' ? 2 : 1;

    return {
      deviceId,
      deviceType: deviceData.deviceType,
      failureProbability,
      expectedFailureDate,
      maintenanceRecommendation,
      estimatedDowntime,
    };
  }

  /**
   * 최적 스케줄 생성
   */
  public generateOptimalSchedule(date: Date): OptimalSchedule {
    const demandPredictions = this.predictDemand(date, 1);
    const devices = this.getAvailableDevices();

    const slots: OptimalSchedule['slots'] = [];
    let totalRevenue = 0;

    // 시간대별 최적 배치
    for (let hour = 10; hour <= 22; hour++) {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      const hourDemand = demandPredictions.filter(p => p.hour === hour);

      // 수요가 높은 장비부터 배치
      const sortedDemand = hourDemand.sort((a, b) => b.expectedDemand - a.expectedDemand);

      for (const demand of sortedDemand) {
        const availableDevice = devices.find(d =>
          d.type === demand.deviceType &&
          !slots.some(s => s.time === hourStr && s.deviceId === d.id)
        );

        if (availableDevice && demand.expectedDemand > 0.3) {
          const expectedRevenue = this.calculateExpectedRevenue(
            demand.deviceType,
            hour,
            demand.expectedDemand
          );

          slots.push({
            time: hourStr,
            deviceId: availableDevice.id,
            expectedRevenue,
            utilization: demand.expectedDemand,
          });

          totalRevenue += expectedRevenue;
        }
      }
    }

    // 효율성 계산
    const maxPossibleSlots = devices.length * 13; // 10시-22시
    const efficiency = slots.length / maxPossibleSlots;

    return {
      date,
      slots,
      totalRevenue,
      efficiency,
    };
  }

  /**
   * 시계열 예측 모델 학습
   */
  public trainTimeSeriesModel(
    modelName: string,
    data: Array<{ date: Date; value: number }>
  ): PredictionModel {
    // 간단한 이동 평균 모델 (실제로는 ARIMA, Prophet 등 사용)
    const model: PredictionModel = {
      id: `model_${Date.now()}`,
      name: modelName,
      type: 'timeseries',
      accuracy: 0.85, // 예시 정확도
      lastTrained: new Date(),
      features: ['date', 'value'],
      predictions: [],
    };

    // 모델 저장
    this.models.set(model.id, model);

    return model;
  }

  /**
   * 이상 탐지
   */
  public detectAnomalies(
    metric: string,
    threshold: number = 2
  ): Array<{
    timestamp: Date;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }> {
    const anomalies: any[] = [];
    const data = this.getMetricData(metric);

    // Z-score 기반 이상 탐지
    const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const variance = data.reduce((sum, d) => sum + Math.pow(d.value - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    for (const point of data) {
      const zScore = Math.abs((point.value - mean) / stdDev);

      if (zScore > threshold) {
        const severity = zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low';

        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          expectedValue: mean,
          deviation: zScore,
          severity,
        });
      }
    }

    return anomalies;
  }

  // 헬퍼 함수들
  private calculateDemand(date: Date, hour: number, deviceType: string): number {
    // 기본 수요
    let baseDemand = 0.5;

    // 시간대별 가중치
    if (hour >= 18 && hour <= 22) {
      baseDemand *= 1.8; // 저녁 피크
    } else if (hour >= 14 && hour <= 17) {
      baseDemand *= 1.3; // 오후
    } else if (hour < 10 || hour > 22) {
      baseDemand *= 0.2; // 비영업 시간
    }

    // 요일별 가중치
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseDemand *= 1.5; // 주말
    }

    // 장비별 인기도
    const popularity: Record<string, number> = {
      'PS5': 1.2,
      'Switch': 1.1,
      'Racing': 1.3,
      'PC': 1.0,
      'Karaoke': 0.9,
    };

    baseDemand *= popularity[deviceType] || 1.0;

    // 약간의 랜덤성 추가
    baseDemand *= (0.9 + Math.random() * 0.2);

    return Math.min(1.0, baseDemand);
  }

  private calculateConfidence(daysAhead: number): number {
    // 날짜가 멀수록 신뢰도 감소
    return Math.max(0.5, 1.0 - (daysAhead * 0.05));
  }

  private identifyDemandFactors(date: Date, hour: number): string[] {
    const factors: string[] = [];

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      factors.push('주말');
    }

    if (hour >= 18 && hour <= 22) {
      factors.push('피크 시간대');
    }

    const month = date.getMonth();
    if (month === 11 || month === 0) {
      factors.push('휴가 시즌');
    }

    if (month >= 6 && month <= 8) {
      factors.push('여름 방학');
    }

    return factors;
  }

  private getCustomerData(customerId: string): any {
    // 실제로는 데이터베이스에서 조회
    return {
      customerId,
      visitCount: 10,
      totalSpent: 200000,
      accountAge: 180, // days
      lastVisit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      lastExperience: 'positive',
    };
  }

  private calculateDaysSinceLastVisit(customerData: any): number {
    const now = Date.now();
    const lastVisit = customerData.lastVisit.getTime();
    return Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
  }

  private generatePreventionActions(
    churnProbability: number,
    reasons: string[]
  ): string[] {
    const actions: string[] = [];

    if (churnProbability > 0.7) {
      actions.push('즉시 개인화된 할인 쿠폰 발송');
      actions.push('VIP 혜택 제공');
      actions.push('직접 전화 상담');
    } else if (churnProbability > 0.4) {
      actions.push('이메일 프로모션 발송');
      actions.push('포인트 2배 이벤트 안내');
    }

    if (reasons.includes('60일 이상 미방문')) {
      actions.push('복귀 고객 특별 혜택 제공');
    }

    if (reasons.includes('마지막 방문 경험 부정적')) {
      actions.push('서비스 개선 사항 안내');
      actions.push('무료 이용권 제공');
    }

    return actions;
  }

  private calculateEndDate(startDate: Date, period: string): Date {
    const endDate = new Date(startDate);

    switch (period) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    return endDate;
  }

  private calculateBaseRevenue(period: string): number {
    switch (period) {
      case 'daily':
        return 500000;
      case 'weekly':
        return 3500000;
      case 'monthly':
        return 15000000;
      default:
        return 0;
    }
  }

  private calculateSeasonalFactor(date: Date): number {
    const month = date.getMonth();

    // 여름/겨울 방학 시즌
    if (month === 0 || month === 1 || month === 7 || month === 8) {
      return 1.3;
    }

    // 연말 시즌
    if (month === 11) {
      return 1.2;
    }

    return 1.0;
  }

  private calculateTrendFactor(): number {
    // 성장 트렌드 (월 2% 성장 가정)
    return 1.02;
  }

  private calculateEventImpact(startDate: Date, endDate: Date): number {
    // 특별 이벤트나 프로모션 영향
    return 50000; // 예시
  }

  private getDeviceData(deviceId: string): any {
    return {
      deviceId,
      deviceType: 'PS5',
      totalUsageHours: 2000,
      hoursSinceLastMaintenance: 400,
      historicalFailureRate: 0.1,
    };
  }

  private getAvailableDevices(): Array<{ id: string; type: string }> {
    return [
      { id: 'ps5_01', type: 'PS5' },
      { id: 'ps5_02', type: 'PS5' },
      { id: 'switch_01', type: 'Switch' },
      { id: 'racing_01', type: 'Racing' },
      { id: 'pc_01', type: 'PC' },
      { id: 'karaoke_01', type: 'Karaoke' },
    ];
  }

  private calculateExpectedRevenue(
    deviceType: string,
    hour: number,
    utilization: number
  ): number {
    const basePrice: Record<string, number> = {
      'PS5': 10000,
      'Switch': 8000,
      'Racing': 15000,
      'PC': 7000,
      'Karaoke': 20000,
    };

    const hourlyPrice = basePrice[deviceType] || 10000;
    return Math.round(hourlyPrice * utilization);
  }

  private getMetricData(metric: string): Array<{ timestamp: Date; value: number }> {
    // 예시 데이터 생성
    const data = [];
    for (let i = 0; i < 100; i++) {
      data.push({
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
        value: 100 + Math.random() * 20 - 10,
      });
    }
    return data;
  }
}

// 싱글톤 인스턴스
export const predictionService = new PredictionService();