/**
 * 비즈니스 인텔리전스 엔진
 *
 * 기능:
 * - 매출 분석 및 예측
 * - 고객 생애 가치(CLV) 계산
 * - 장비 활용도 분석
 * - 피크 타임 분석
 * - 수익성 분석
 */

interface RevenueData {
  date: Date;
  revenue: number;
  transactions: number;
  averageOrderValue: number;
  deviceCategory: string;
  timeSlot: string;
}

interface CustomerMetrics {
  customerId: string;
  totalSpent: number;
  visitCount: number;
  averageSpent: number;
  lastVisit: Date;
  favoriteDevice: string;
  favoriteTime: string;
  churnRisk: number;
  lifetimeValue: number;
}

interface DeviceUtilization {
  deviceId: string;
  deviceType: string;
  totalHours: number;
  utilizedHours: number;
  utilizationRate: number;
  revenue: number;
  revenuePerHour: number;
  maintenanceHours: number;
  peakHours: string[];
}

interface TimeAnalysis {
  hour: number;
  dayOfWeek: number;
  averageOccupancy: number;
  averageRevenue: number;
  peakFactor: number;
  recommendedPricing: number;
}

interface BusinessInsights {
  topPerformingDevices: DeviceUtilization[];
  customerSegments: CustomerSegment[];
  revenueForecasts: RevenueForecast[];
  optimizationRecommendations: Recommendation[];
}

interface CustomerSegment {
  name: string;
  criteria: Record<string, any>;
  size: number;
  averageValue: number;
  growthRate: number;
  characteristics: string[];
}

interface RevenueForecast {
  period: string;
  predicted: number;
  confidence: number;
  factors: string[];
  risks: string[];
}

interface Recommendation {
  type: 'pricing' | 'inventory' | 'marketing' | 'operations';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number;
  implementation: string[];
}

export class BusinessIntelligenceEngine {
  private revenueData: RevenueData[] = [];
  private customerData: Map<string, CustomerMetrics> = new Map();
  private deviceData: Map<string, DeviceUtilization> = new Map();

  /**
   * 매출 데이터 분석
   */
  public analyzeRevenue(
    startDate: Date,
    endDate: Date
  ): {
    totalRevenue: number;
    growthRate: number;
    averageDaily: number;
    topDeviceCategories: Array<{ category: string; revenue: number }>;
    revenueByHour: Array<{ hour: number; revenue: number }>;
    trends: string[];
  } {
    const periodData = this.revenueData.filter(
      d => d.date >= startDate && d.date <= endDate
    );

    const totalRevenue = periodData.reduce((sum, d) => sum + d.revenue, 0);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageDaily = totalRevenue / days;

    // 카테고리별 매출
    const categoryRevenue = new Map<string, number>();
    periodData.forEach(d => {
      const current = categoryRevenue.get(d.deviceCategory) || 0;
      categoryRevenue.set(d.deviceCategory, current + d.revenue);
    });

    const topDeviceCategories = Array.from(categoryRevenue.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 시간대별 매출
    const hourlyRevenue = new Map<number, number>();
    periodData.forEach(d => {
      const hour = new Date(d.date).getHours();
      const current = hourlyRevenue.get(hour) || 0;
      hourlyRevenue.set(hour, current + d.revenue);
    });

    const revenueByHour = Array.from(hourlyRevenue.entries())
      .map(([hour, revenue]) => ({ hour, revenue }))
      .sort((a, b) => a.hour - b.hour);

    // 성장률 계산
    const previousPeriod = this.getPreviousPeriodRevenue(startDate, endDate);
    const growthRate = previousPeriod > 0
      ? ((totalRevenue - previousPeriod) / previousPeriod) * 100
      : 0;

    // 트렌드 분석
    const trends = this.analyzeRevenueTrends(periodData);

    return {
      totalRevenue,
      growthRate,
      averageDaily,
      topDeviceCategories,
      revenueByHour,
      trends,
    };
  }

  /**
   * 고객 생애 가치(CLV) 계산
   */
  public calculateCustomerLifetimeValue(customerId: string): number {
    const customer = this.customerData.get(customerId);
    if (!customer) return 0;

    // 간단한 CLV 모델: 평균 구매액 × 구매 빈도 × 평균 고객 수명
    const averagePurchase = customer.averageSpent;
    const purchaseFrequency = customer.visitCount / 12; // 월 평균
    const customerLifespan = 24; // 24개월 가정

    const clv = averagePurchase * purchaseFrequency * customerLifespan;

    // 이탈 리스크 반영
    const adjustedCLV = clv * (1 - customer.churnRisk);

    return Math.round(adjustedCLV);
  }

  /**
   * 고객 세분화
   */
  public segmentCustomers(): CustomerSegment[] {
    const segments: CustomerSegment[] = [];

    // VIP 고객
    const vipCustomers = Array.from(this.customerData.values()).filter(
      c => c.totalSpent > 500000 && c.visitCount > 10
    );
    segments.push({
      name: 'VIP 고객',
      criteria: { totalSpent: '>500000', visitCount: '>10' },
      size: vipCustomers.length,
      averageValue: this.calculateAverageValue(vipCustomers),
      growthRate: 15, // 예시
      characteristics: ['고빈도 방문', '고단가 서비스 선호', '주말 이용'],
    });

    // 신규 고객
    const newCustomers = Array.from(this.customerData.values()).filter(
      c => c.visitCount <= 2
    );
    segments.push({
      name: '신규 고객',
      criteria: { visitCount: '<=2' },
      size: newCustomers.length,
      averageValue: this.calculateAverageValue(newCustomers),
      growthRate: 25,
      characteristics: ['첫 방문 또는 재방문', '프로모션 민감', '평일 선호'],
    });

    // 일반 고객
    const regularCustomers = Array.from(this.customerData.values()).filter(
      c => c.visitCount > 2 && c.visitCount <= 10 && c.totalSpent <= 500000
    );
    segments.push({
      name: '일반 고객',
      criteria: { visitCount: '3-10', totalSpent: '<=500000' },
      size: regularCustomers.length,
      averageValue: this.calculateAverageValue(regularCustomers),
      growthRate: 10,
      characteristics: ['정기 방문', '표준 서비스 이용', '주중/주말 균등'],
    });

    // 이탈 위험 고객
    const churnRiskCustomers = Array.from(this.customerData.values()).filter(
      c => c.churnRisk > 0.7
    );
    segments.push({
      name: '이탈 위험 고객',
      criteria: { churnRisk: '>0.7' },
      size: churnRiskCustomers.length,
      averageValue: this.calculateAverageValue(churnRiskCustomers),
      growthRate: -5,
      characteristics: ['방문 빈도 감소', '마지막 방문 30일 이상', '재방문 유도 필요'],
    });

    return segments;
  }

  /**
   * 장비 활용도 분석
   */
  public analyzeDeviceUtilization(): {
    overallUtilization: number;
    underutilizedDevices: DeviceUtilization[];
    overutilizedDevices: DeviceUtilization[];
    recommendations: string[];
  } {
    const devices = Array.from(this.deviceData.values());

    const overallUtilization = devices.reduce((sum, d) => sum + d.utilizationRate, 0) / devices.length;

    const underutilizedDevices = devices
      .filter(d => d.utilizationRate < 0.4)
      .sort((a, b) => a.utilizationRate - b.utilizationRate);

    const overutilizedDevices = devices
      .filter(d => d.utilizationRate > 0.8)
      .sort((a, b) => b.utilizationRate - a.utilizationRate);

    const recommendations: string[] = [];

    if (underutilizedDevices.length > 0) {
      recommendations.push('활용도가 낮은 장비에 대한 프로모션 실시');
      recommendations.push('인기 없는 장비의 교체 검토');
    }

    if (overutilizedDevices.length > 0) {
      recommendations.push('인기 장비 추가 도입 검토');
      recommendations.push('피크 시간대 프리미엄 요금 적용');
    }

    return {
      overallUtilization,
      underutilizedDevices,
      overutilizedDevices,
      recommendations,
    };
  }

  /**
   * 피크 타임 분석
   */
  public analyzePeakTimes(): TimeAnalysis[] {
    const analysis: TimeAnalysis[] = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let day = 0; day < 7; day++) {
        const occupancy = this.calculateOccupancy(hour, day);
        const revenue = this.calculateHourlyRevenue(hour, day);
        const peakFactor = this.calculatePeakFactor(occupancy);
        const recommendedPricing = this.calculateDynamicPricing(occupancy, peakFactor);

        analysis.push({
          hour,
          dayOfWeek: day,
          averageOccupancy: occupancy,
          averageRevenue: revenue,
          peakFactor,
          recommendedPricing,
        });
      }
    }

    return analysis;
  }

  /**
   * 매출 예측
   */
  public forecastRevenue(days: number = 30): RevenueForecast[] {
    const forecasts: RevenueForecast[] = [];

    // 간단한 시계열 예측 (실제로는 ARIMA, Prophet 등 사용)
    const historicalAverage = this.calculateHistoricalAverage();
    const trend = this.calculateTrend();
    const seasonality = this.calculateSeasonality();

    for (let i = 1; i <= days; i++) {
      const baselineForecast = historicalAverage + (trend * i) + seasonality;
      const confidence = Math.max(0.7, 1 - (i * 0.01)); // 날짜가 멀수록 신뢰도 감소

      forecasts.push({
        period: `Day ${i}`,
        predicted: Math.round(baselineForecast * (1 + (Math.random() * 0.2 - 0.1))),
        confidence,
        factors: this.identifyForecastFactors(i),
        risks: this.identifyForecastRisks(i),
      });
    }

    return forecasts;
  }

  /**
   * 최적화 추천 사항 생성
   */
  public generateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 가격 최적화
    const peakTimes = this.analyzePeakTimes();
    const highDemandHours = peakTimes.filter(t => t.averageOccupancy > 0.8);

    if (highDemandHours.length > 0) {
      recommendations.push({
        type: 'pricing',
        priority: 'high',
        title: '동적 가격 정책 도입',
        description: '피크 시간대에 프리미엄 요금을 적용하여 수익성 개선',
        expectedImpact: 15, // 15% 수익 증가 예상
        implementation: [
          '피크 시간대(18-22시) 20% 할증 적용',
          '새벽 시간대(0-6시) 30% 할인 적용',
          '주말 프리미엄 10% 적용',
        ],
      });
    }

    // 장비 최적화
    const utilization = this.analyzeDeviceUtilization();
    if (utilization.underutilizedDevices.length > 0) {
      recommendations.push({
        type: 'inventory',
        priority: 'medium',
        title: '장비 포트폴리오 최적화',
        description: '활용도가 낮은 장비를 인기 장비로 교체',
        expectedImpact: 10,
        implementation: [
          `${utilization.underutilizedDevices[0].deviceType} 1대 제거`,
          '인기 장비 추가 도입',
          '장비 배치 재구성',
        ],
      });
    }

    // 마케팅 추천
    const segments = this.segmentCustomers();
    const churnSegment = segments.find(s => s.name === '이탈 위험 고객');

    if (churnSegment && churnSegment.size > 10) {
      recommendations.push({
        type: 'marketing',
        priority: 'high',
        title: '이탈 방지 캠페인 실시',
        description: '이탈 위험 고객 대상 리텐션 프로그램 운영',
        expectedImpact: 8,
        implementation: [
          '30일 이상 미방문 고객 대상 할인 쿠폰 발송',
          'VIP 고객 전용 이벤트 개최',
          '개인화된 프로모션 메시지 발송',
        ],
      });
    }

    // 운영 최적화
    recommendations.push({
      type: 'operations',
      priority: 'low',
      title: '운영 시간 조정',
      description: '수요 패턴에 맞춰 운영 시간 최적화',
      expectedImpact: 5,
      implementation: [
        '평일 오전 시간 단축 (10시 → 11시 오픈)',
        '주말 운영 시간 연장 (새벽 2시 → 3시)',
        '정기 휴무일 도입 검토',
      ],
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 통합 비즈니스 인사이트 생성
   */
  public generateBusinessInsights(): BusinessInsights {
    const devices = Array.from(this.deviceData.values());
    const topPerformingDevices = devices
      .sort((a, b) => b.revenuePerHour - a.revenuePerHour)
      .slice(0, 5);

    const customerSegments = this.segmentCustomers();
    const revenueForecasts = this.forecastRevenue(30);
    const optimizationRecommendations = this.generateRecommendations();

    return {
      topPerformingDevices,
      customerSegments,
      revenueForecasts,
      optimizationRecommendations,
    };
  }

  // 헬퍼 함수들
  private getPreviousPeriodRevenue(startDate: Date, endDate: Date): number {
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = new Date(endDate.getTime() - periodLength);

    return this.revenueData
      .filter(d => d.date >= previousStart && d.date <= previousEnd)
      .reduce((sum, d) => sum + d.revenue, 0);
  }

  private analyzeRevenueTrends(data: RevenueData[]): string[] {
    const trends: string[] = [];

    // 주말 vs 평일 분석
    const weekendRevenue = data
      .filter(d => [0, 6].includes(d.date.getDay()))
      .reduce((sum, d) => sum + d.revenue, 0);
    const weekdayRevenue = data
      .filter(d => ![0, 6].includes(d.date.getDay()))
      .reduce((sum, d) => sum + d.revenue, 0);

    if (weekendRevenue > weekdayRevenue * 1.5) {
      trends.push('주말 매출이 평일 대비 50% 이상 높음');
    }

    // 시간대별 트렌드
    const eveningRevenue = data
      .filter(d => {
        const hour = d.date.getHours();
        return hour >= 18 && hour <= 22;
      })
      .reduce((sum, d) => sum + d.revenue, 0);

    if (eveningRevenue > data.reduce((sum, d) => sum + d.revenue, 0) * 0.5) {
      trends.push('저녁 시간대(18-22시)가 전체 매출의 50% 이상 차지');
    }

    return trends;
  }

  private calculateAverageValue(customers: CustomerMetrics[]): number {
    if (customers.length === 0) return 0;
    return customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length;
  }

  private calculateOccupancy(hour: number, dayOfWeek: number): number {
    // 실제 데이터 기반 계산
    // 여기서는 예시 로직
    const baseOccupancy = 0.5;
    const hourFactor = hour >= 18 && hour <= 22 ? 1.5 : hour >= 14 && hour <= 17 ? 1.2 : 0.8;
    const dayFactor = [0, 6].includes(dayOfWeek) ? 1.3 : 1.0;

    return Math.min(1.0, baseOccupancy * hourFactor * dayFactor);
  }

  private calculateHourlyRevenue(hour: number, dayOfWeek: number): number {
    // 실제 데이터 기반 계산
    const baseRevenue = 50000;
    const occupancy = this.calculateOccupancy(hour, dayOfWeek);

    return baseRevenue * occupancy * (1 + Math.random() * 0.2);
  }

  private calculatePeakFactor(occupancy: number): number {
    if (occupancy > 0.8) return 1.5;
    if (occupancy > 0.6) return 1.2;
    if (occupancy < 0.3) return 0.8;
    return 1.0;
  }

  private calculateDynamicPricing(occupancy: number, peakFactor: number): number {
    const basePrice = 10000;
    return Math.round(basePrice * peakFactor);
  }

  private calculateHistoricalAverage(): number {
    if (this.revenueData.length === 0) return 0;
    return this.revenueData.reduce((sum, d) => sum + d.revenue, 0) / this.revenueData.length;
  }

  private calculateTrend(): number {
    // 간단한 선형 트렌드
    return 1000; // 일일 1000원씩 증가 가정
  }

  private calculateSeasonality(): number {
    // 요일별 계절성
    const today = new Date().getDay();
    return [0, 6].includes(today) ? 20000 : 0; // 주말 보너스
  }

  private identifyForecastFactors(dayOffset: number): string[] {
    const factors: string[] = [];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);

    if ([0, 6].includes(targetDate.getDay())) {
      factors.push('주말 효과');
    }
    if (targetDate.getDate() === 1) {
      factors.push('월초 효과');
    }
    if (targetDate.getMonth() === 11) {
      factors.push('연말 시즌');
    }

    return factors;
  }

  private identifyForecastRisks(dayOffset: number): string[] {
    const risks: string[] = [];

    if (dayOffset > 14) {
      risks.push('장기 예측 불확실성');
    }
    risks.push('경쟁업체 프로모션');
    risks.push('날씨 변동성');

    return risks;
  }
}

// 싱글톤 인스턴스
export const businessIntelligence = new BusinessIntelligenceEngine();