#!/usr/bin/env tsx

/**
 * 🏮 실제 운영 데이터 기반 분석용 테스트 데이터 생성 스크립트
 * 
 * 목적: 현재 실제 운영 중인 기종, 가격, 시간대를 반영한 현실적인 테스트 데이터 생성
 * 대상: 예약/매출/고객 분석 탭의 실질적인 인사이트 제공
 * 
 * 특징:
 * - 실제 DB에서 기종/시간대/가격 정보 로드
 * - 기종별 기기 수에 비례한 예약 분포
 * - 실제 가격 체계 그대로 반영 (25,000원~50,000원)
 * - 2인 플레이 추가 요금 정확히 계산
 * - 청소년 시간대와 overnight 시간대 현실적 패턴
 */

// // import { createClient } from '@/lib/supabase-mock';
import { format, addDays, startOfMonth, endOfMonth, addMonths, isBefore, isWeekend, getDay } from 'date-fns';
import { config } from 'dotenv';

// 환경 변수 로드
config({ path: '.env.local' });

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// import { supabase } from '@/lib/supabase-mock';

// 타입 정의
interface RealDeviceType {
  id: string;
  name: string;
  device_count: number;
  rental_settings: any;
  time_slots: RealTimeSlot[];
  devices: RealDevice[];
}

interface RealTimeSlot {
  id: string;
  device_type_id: string;
  slot_type: 'early' | 'overnight';
  start_time: string;
  end_time: string;
  enable_2p: boolean;
  price_2p_extra: number | null;
  credit_options: CreditOption[];
  is_youth_time: boolean;
}

interface RealDevice {
  id: string;
  device_number: number;
  status: string;
}

interface CreditOption {
  type: 'fixed' | 'freeplay' | 'unlimited';
  price: number;
  fixed_credits?: number;
}

interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  segment: 'casual' | 'hardcore' | 'social';
  age_group: '10대' | '20대' | '30대' | '40대+';
  signup_date: string;
  price_sensitivity: 'high' | 'medium' | 'low';
}

interface Reservation {
  id: string;
  customer_id: string;
  device_type_id: string;
  device_id: string | null;
  time_slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
  player_count: number;
  credit_type: 'fixed' | 'freeplay' | 'unlimited';
  total_amount: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'no_show';
  payment_method: 'cash' | 'transfer';
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  created_at: string;
  approved_at?: string;
  completed_at?: string;
}

// 설정 상수
const CONFIG = {
  TOTAL_CUSTOMERS: 400,
  TARGET_RESERVATIONS: 2200,
  DATE_RANGE: {
    START: new Date('2023-01-01'),
    END: new Date('2025-07-31')
  },
  
  // 실제 기종별 인기도 (기기 수 기반)
  DEVICE_POPULARITY: {
    '사운드 볼텍스': 0.45,    // 13대 - 주력 기종
    '마이마이 DX': 0.25,      // 4대 - 2인 플레이 인기
    'CHUNITHM': 0.20,         // 3대 - 중간 인기  
    'BEATMANIA IIDX': 0.10    // 4대 - 고가격으로 상대적 낮은 빈도
  },
  
  // 고객 세그먼트별 분포
  CUSTOMER_SEGMENTS: {
    casual: { ratio: 0.60, price_sensitivity: 'high', avg_frequency: 2.2 },
    hardcore: { ratio: 0.25, price_sensitivity: 'low', avg_frequency: 3.8 },
    social: { ratio: 0.15, price_sensitivity: 'medium', avg_frequency: 2.8 }
  },
  
  // 시간대별 가중치
  TIME_PATTERNS: {
    weekday: {
      early_morning: 0.05,    // 07:00-08:00
      late_morning: 0.10,     // 08:00-12:00  
      youth_time: 0.30,       // 09:00-13:00 (청소년)
      overnight: 0.15         // 00:00-05:00
    },
    weekend: {
      early_morning: 0.15,
      late_morning: 0.25,
      youth_time: 0.40,
      overnight: 0.25
    }
  },
  
  // 예약 상태 분포
  STATUS_DISTRIBUTION: {
    completed: 0.85,
    cancelled: 0.10,
    no_show: 0.05
  }
};

// 유틸리티 함수들
const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomWeighted = <T>(items: T[], weights: number[]): T => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  
  return items[items.length - 1];
};

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const generateKoreanName = (): string => {
  const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '신', '오', '한', '서', '권'];
  const firstNames = ['민수', '지은', '서준', '하은', '도현', '서현', '준호', '지아', '시우', '채원', '지훈', '수빈', '예준', '하린', '건우'];
  return randomChoice(surnames) + randomChoice(firstNames);
};

const generatePhoneNumber = (): string => {
  const prefix = '010';
  const middle = Math.floor(Math.random() * 9000) + 1000;
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${middle}-${suffix}`;
};

// 계절성 조정 함수
const getSeasonalMultiplier = (month: number): number => {
  // 방학 시즌 (7-8월, 12월-2월): +30%
  if ([7, 8, 12, 1, 2].includes(month)) return 1.3;
  
  // 시험 기간 (4월, 6월, 10월, 11월): -20%
  if ([4, 6, 10, 11].includes(month)) return 0.8;
  
  // 일반 시기
  return 1.0;
};

// 연도별 성장률
const getYearlyGrowthMultiplier = (year: number): number => {
  switch (year) {
    case 2023: return 0.7;  // 초기 운영
    case 2024: return 1.0;  // 안정기
    case 2025: return 1.3;  // 성장기
    default: return 1.0;
  }
};

// 메인 클래스
class RealWorldDataGenerator {
  private deviceTypes: RealDeviceType[] = [];
  private customers: Customer[] = [];
  private reservations: Reservation[] = [];

  async init() {
    console.log('🏮 실제 운영 데이터 기반 테스트 데이터 생성 시작...');
    
    // 1. 실제 운영 데이터 로드
    await this.loadRealOperationData();
    
    // 2. 현실적인 고객 데이터 생성
    await this.generateRealisticCustomers();
    
    // 3. 실제 운영 패턴 기반 예약 데이터 생성
    await this.generateRealWorldReservations();
    
    // 4. 데이터베이스에 저장
    await this.saveToDatabase();
    
    console.log('✅ 실제 운영 기반 테스트 데이터 생성 완료!');
  }

  private async loadRealOperationData() {
    console.log('📊 실제 운영 중인 기종/시간대/가격 정보 로드 중...');
    
    // 기종별 정보와 기기 수 조회
//     import { supabase } from '@/lib/supabase-mock';
  const { data$1 } = await supabase.from('device_types')
      .select(`
        id,
        name,
        rental_settings
      `)
      .in('name', ['사운드 볼텍스', '마이마이 DX', 'CHUNITHM', 'BEATMANIA IIDX']);

    if (deviceError) {
      console.error('❌ 기종 정보 로드 실패:', deviceError);
      process.exit(1);
    }

    // 각 기종별로 시간대와 기기 정보 로드
    for (const device of deviceData || []) {
      // 시간대 정보 로드
//       import { supabase } from '@/lib/supabase-mock';
  const { data$1 } = await supabase.from('rental_time_slots')
        .select('*')
        .eq('device_type_id', device.id);

      // 기기 정보 로드
//       import { supabase } from '@/lib/supabase-mock';
  const { data$1 } = // @ts-ignore
    await Promise.resolve({ data: [], error: null })
        .select('id, device_number, status')
        .eq('device_type_id', device.id)
        .eq('status', 'available');

      this.deviceTypes.push({
        id: device.id,
        name: device.name,
        device_count: devices?.length || 0,
        rental_settings: device.rental_settings,
        time_slots: timeSlots || [],
        devices: devices || []
      });
    }

    console.log('✅ 실제 운영 데이터 로드 완료:');
    this.deviceTypes.forEach(device => {
      console.log(`  - ${device.name}: ${device.device_count}대, ${device.time_slots.length}개 시간대`);
      if (device.time_slots.length > 0) {
        device.time_slots.forEach(slot => {
          const prices = slot.credit_options.map(opt => `${opt.price.toLocaleString()}원`).join('/');
          console.log(`    └ ${slot.slot_type} ${slot.start_time}-${slot.end_time}: ${prices}`);
        });
      }
    });
  }

  private async generateRealisticCustomers() {
    console.log('👥 현실적인 고객 프로필 생성 중...');
    
    const segments = Object.keys(CONFIG.CUSTOMER_SEGMENTS) as (keyof typeof CONFIG.CUSTOMER_SEGMENTS)[];
    const ageGroups: ('10대' | '20대' | '30대' | '40대+')[] = ['10대', '20대', '30대', '40대+'];
    const ageWeights = [0.35, 0.45, 0.15, 0.05]; // 게임 센터 주 고객층

    for (let i = 0; i < CONFIG.TOTAL_CUSTOMERS; i++) {
      // 세그먼트별 가중치 적용
      const segmentWeights = segments.map(seg => CONFIG.CUSTOMER_SEGMENTS[seg].ratio);
      const segment = randomWeighted(segments, segmentWeights);
      
      // 세그먼트별 기종 선호도 반영
      const customer: Customer = {
        id: generateUUID(),
        email: `customer${i + 1}@example.com`,
        name: generateKoreanName(),
        phone: generatePhoneNumber(),
        segment,
        age_group: randomWeighted(ageGroups, ageWeights),
        signup_date: this.generateSignupDate(),
        price_sensitivity: CONFIG.CUSTOMER_SEGMENTS[segment].price_sensitivity
      };
      
      this.customers.push(customer);
    }
    
    console.log(`✅ ${this.customers.length}명 고객 프로필 생성 완료`);
    
    // 세그먼트별 분포 출력
    const segmentDistribution = this.customers.reduce((acc, customer) => {
      acc[customer.segment] = (acc[customer.segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('  고객 세그먼트 분포:');
    Object.entries(segmentDistribution).forEach(([segment, count]) => {
      console.log(`    - ${segment}: ${count}명 (${((count / this.customers.length) * 100).toFixed(1)}%)`);
    });
  }

  private generateSignupDate(): string {
    // 가입일을 데이터 생성 기간 내에서 랜덤하게 생성
    const start = CONFIG.DATE_RANGE.START;
    const end = new Date();
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime).toISOString();
  }

  private async generateRealWorldReservations() {
    console.log('📅 실제 운영 패턴 기반 예약 데이터 생성 중...');
    
    const reservations: Reservation[] = [];
    let currentDate = CONFIG.DATE_RANGE.START;
    
    while (isBefore(currentDate, CONFIG.DATE_RANGE.END)) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // 월별 예약 수 계산 (실제 운영 규모 반영)
      const baseReservations = 71; // 월평균 목표
      const seasonalMultiplier = getSeasonalMultiplier(month);
      const yearlyMultiplier = getYearlyGrowthMultiplier(year);
      const monthlyReservations = Math.floor(baseReservations * seasonalMultiplier * yearlyMultiplier);
      
      console.log(`  ${year}년 ${month}월: ${monthlyReservations}건 예약 생성`);
      
      // 해당 월의 예약 생성
      for (let i = 0; i < monthlyReservations; i++) {
        const reservation = this.generateSingleReservation(monthStart, monthEnd);
        if (reservation) {
          reservations.push(reservation);
        }
      }
      
      // 다음 달로 이동
      currentDate = addMonths(currentDate, 1);
    }
    
    this.reservations = reservations;
    console.log(`✅ ${reservations.length}건 예약 데이터 생성 완료`);
    
    // 실제 기종별 분포 출력
    const deviceDistribution = reservations.reduce((acc, reservation) => {
      const deviceType = this.deviceTypes.find(dt => dt.id === reservation.device_type_id);
      const deviceName = deviceType?.name || 'Unknown';
      acc[deviceName] = (acc[deviceName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('  실제 기종별 예약 분포:');
    Object.entries(deviceDistribution).forEach(([device, count]) => {
      console.log(`    - ${device}: ${count}건 (${((count / reservations.length) * 100).toFixed(1)}%)`);
    });
  }

  private generateSingleReservation(monthStart: Date, monthEnd: Date): Reservation | null {
    // 랜덤 날짜 생성
    const daysDiff = Math.floor((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const randomDay = Math.floor(Math.random() * daysDiff);
    const reservationDate = addDays(monthStart, randomDay);
    
    // 요일별 가중치 적용
    const isWeekendDay = isWeekend(reservationDate);
    const dayOfWeek = getDay(reservationDate);
    
    // 주말/평일 가중치
    const weekendBonus = isWeekendDay ? 1.6 : 1.0;
    if (Math.random() > (isWeekendDay ? 0.65 : 0.35) * weekendBonus) {
      return null;
    }
    
    // 실제 운영 중인 기종 중에서 선택 (기기 수 비례)
    const deviceNames = Object.keys(CONFIG.DEVICE_POPULARITY);
    const deviceWeights = Object.values(CONFIG.DEVICE_POPULARITY);
    const selectedDeviceName = randomWeighted(deviceNames, deviceWeights);
    const selectedDevice = this.deviceTypes.find(d => d.name === selectedDeviceName);
    
    if (!selectedDevice || selectedDevice.time_slots.length === 0) {
      return null;
    }
    
    // 시간대 선택 (요일별 가중치 적용)
    const timePatterns = isWeekendDay ? CONFIG.TIME_PATTERNS.weekend : CONFIG.TIME_PATTERNS.weekday;
    const selectedTimeSlot = this.selectTimeSlot(selectedDevice, timePatterns);
    
    if (!selectedTimeSlot) {
      return null;
    }
    
    // 크레딧 옵션 선택 (고객 세그먼트별 가격 민감도 반영)
    const customer = this.selectCustomerForReservation(selectedDeviceName);
    if (!customer) {
      return null;
    }
    
    const creditOption = this.selectCreditOption(selectedTimeSlot, customer);
    
    // 플레이어 수 결정 (마이마이 DX만 2인 플레이 가능)
    let playerCount = 1;
    let totalPrice = creditOption.price;
    
    if (selectedTimeSlot.enable_2p && selectedDevice.name === '마이마이 DX') {
      // 소셜 플레이어는 2인 플레이 선호, 주말에 더 많이
      const twoPlayerChance = customer.segment === 'social' ? 0.6 : 0.25;
      const weekendBonus = isWeekendDay ? 1.4 : 1.0;
      
      if (Math.random() < twoPlayerChance * weekendBonus) {
        playerCount = 2;
        totalPrice += selectedTimeSlot.price_2p_extra || 0;
      }
    }
    
    // 예약 상태 결정
    const statusKeys = Object.keys(CONFIG.STATUS_DISTRIBUTION) as (keyof typeof CONFIG.STATUS_DISTRIBUTION)[];
    const statusWeights = Object.values(CONFIG.STATUS_DISTRIBUTION);
    const status = randomWeighted(statusKeys, statusWeights);
    
    // 기기 할당 (해당 기종의 사용 가능한 기기 중 랜덤)
    const availableDevices = selectedDevice.devices.filter(d => d.status === 'available');
    const assignedDevice = randomChoice(availableDevices);
    
    // 시간 생성
    const createdAt = new Date(reservationDate);
    createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    const approvedAt = status !== 'pending' ? new Date(createdAt.getTime() + Math.random() * 3600000) : undefined;
    
    let actualStartTime: string | undefined;
    let actualEndTime: string | undefined;
    
    if (status === 'completed') {
      const checkedInTime = new Date(reservationDate);
      const [startHour, startMinute] = selectedTimeSlot.start_time.split(':').map(Number);
      checkedInTime.setHours(startHour, startMinute);
      
      // 실제 시작/종료 시간 (약간의 변동)
      const actualStart = new Date(checkedInTime);
      actualStart.setMinutes(actualStart.getMinutes() + (Math.random() * 30 - 15)); // ±15분
      actualStartTime = actualStart.toISOString();
      
      const [endHour, endMinute] = selectedTimeSlot.end_time.split(':').map(Number);
      const actualEnd = new Date(checkedInTime);
      actualEnd.setHours(endHour, endMinute);
      actualEnd.setMinutes(actualEnd.getMinutes() + (Math.random() * 30 - 15)); // ±15분
      actualEndTime = actualEnd.toISOString();
    }
    
    // 결제 방식 결정
    const paymentMethodKeys = ['cash', 'transfer'] as const;
    const paymentMethodWeights = [0.4, 0.6]; // 현금 40%, 계좌이체 60%
    const paymentMethod = randomWeighted(paymentMethodKeys, paymentMethodWeights);
    
    // 결제 상태 결정
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' = 'paid';
    if (status === 'cancelled') paymentStatus = 'cancelled';
    else if (status === 'no_show') paymentStatus = Math.random() > 0.5 ? 'refunded' : 'paid';

    return {
      id: generateUUID(),
      customer_id: customer.id,
      device_type_id: selectedDevice.id,
      device_id: assignedDevice.id,
      time_slot_id: selectedTimeSlot.id,
      date: format(reservationDate, 'yyyy-MM-dd'),
      start_time: selectedTimeSlot.start_time,
      end_time: selectedTimeSlot.end_time,
      player_count: playerCount,
      credit_type: creditOption.type,
      total_amount: totalPrice,
      status,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      created_at: createdAt.toISOString(),
      approved_at: approvedAt?.toISOString(),
      completed_at: status === 'completed' ? approvedAt?.toISOString() : undefined
    };
  }

  private selectTimeSlot(device: RealDeviceType, timePatterns: any): RealTimeSlot | null {
    // 시간대별 가중치에 따라 선택
    const earlySlots = device.time_slots.filter(slot => 
      slot.slot_type === 'early' && !slot.is_youth_time
    );
    const youthSlots = device.time_slots.filter(slot => 
      slot.slot_type === 'early' && slot.is_youth_time
    );
    const overnightSlots = device.time_slots.filter(slot => 
      slot.slot_type === 'overnight'
    );
    
    const allSlots = [
      ...earlySlots.map(slot => ({ slot, weight: timePatterns.early_morning + timePatterns.late_morning })),
      ...youthSlots.map(slot => ({ slot, weight: timePatterns.youth_time })),
      ...overnightSlots.map(slot => ({ slot, weight: timePatterns.overnight }))
    ];
    
    if (allSlots.length === 0) return null;
    
    const slots = allSlots.map(item => item.slot);
    const weights = allSlots.map(item => item.weight);
    
    return randomWeighted(slots, weights);
  }

  private selectCustomerForReservation(deviceName: string): Customer | null {
    // 기종별 고객 세그먼트 선호도
    const devicePreferences = {
      '마이마이 DX': { casual: 0.5, social: 0.4, hardcore: 0.1 },
      '사운드 볼텍스': { casual: 0.6, hardcore: 0.3, social: 0.1 },
      'CHUNITHM': { hardcore: 0.5, casual: 0.3, social: 0.2 },
      'BEATMANIA IIDX': { hardcore: 0.7, casual: 0.2, social: 0.1 }
    };
    
    const preferences = devicePreferences[deviceName as keyof typeof devicePreferences];
    if (!preferences) {
      return randomChoice(this.customers);
    }
    
    const segments = Object.keys(preferences) as (keyof typeof preferences)[];
    const weights = Object.values(preferences);
    const selectedSegment = randomWeighted(segments, weights);
    
    const eligibleCustomers = this.customers.filter(c => c.segment === selectedSegment);
    return eligibleCustomers.length > 0 ? randomChoice(eligibleCustomers) : randomChoice(this.customers);
  }

  private selectCreditOption(timeSlot: RealTimeSlot, customer: Customer): CreditOption {
    const options = timeSlot.credit_options;
    
    if (options.length === 1) {
      return options[0];
    }
    
    // 고객의 가격 민감도에 따라 선택
    if (customer.price_sensitivity === 'high') {
      // 가격 민감한 고객은 저렴한 옵션 선호
      return options.reduce((min, current) => 
        current.price < min.price ? current : min
      );
    } else if (customer.price_sensitivity === 'low') {
      // 가격 민감하지 않은 고객은 프리미엄 옵션 선호
      return Math.random() > 0.3 ? 
        options.reduce((max, current) => 
          current.price > max.price ? current : max
        ) : randomChoice(options);
    } else {
      // 중간 민감도는 랜덤
      return randomChoice(options);
    }
  }

  private async saveToDatabase() {
    console.log('💾 실제 운영 기반 데이터 저장 중...');
    
    // 기존 테스트 데이터 삭제
    console.log('  기존 테스트 데이터 삭제 중...');
    
//     import { supabase } from '@/lib/supabase-mock';
  const { data$1 } = await supabase.from('users')
      .select('id')
      .like('email', 'customer%@example.com');
    
    if (existingUsers && existingUsers.length > 0) {
      const userIds = existingUsers.map(u => u.id);
      
      await supabase
        .from('reservations')
        .delete()
        .in('user_id', userIds);
      
      await supabase
        .from('users')
        .delete()
        .like('email', 'customer%@example.com');
    }
    
    // 배치 처리
    const BATCH_SIZE = 50;
    
    // 고객 데이터 저장
    console.log('  고객 데이터 저장 중...');
    for (let i = 0; i < this.customers.length; i += BATCH_SIZE) {
      const batch = this.customers.slice(i, i + BATCH_SIZE);
      const userData = batch.map(customer => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        created_at: customer.signup_date
      }));
      
//       import { supabase } from '@/lib/supabase-mock';
  const { error$1 } = await supabase.from('users')
        .insert(userData);
      
      if (error) {
        console.error('❌ 고객 데이터 저장 실패:', error);
        process.exit(1);
      }
    }
    
    // 예약 데이터 저장
    console.log('  예약 데이터 저장 중...');
    for (let i = 0; i < this.reservations.length; i += BATCH_SIZE) {
      const batch = this.reservations.slice(i, i + BATCH_SIZE);
      const reservationData = batch.map(reservation => ({
        id: reservation.id,
        user_id: reservation.customer_id,
        device_id: reservation.device_id,
        date: reservation.date,
        start_time: reservation.start_time,
        end_time: reservation.end_time,
        player_count: reservation.player_count,
        credit_type: reservation.credit_type,
        total_amount: reservation.total_amount,
        hourly_rate: Math.floor(reservation.total_amount / 4), // 4시간 기준으로 시간당 요금 계산
        status: reservation.status,
        payment_method: reservation.payment_method,
        payment_status: reservation.payment_status,
        created_at: reservation.created_at,
        approved_at: reservation.approved_at,
        completed_at: reservation.completed_at,
        reservation_number: `REAL-${reservation.id.substring(0, 8)}`
      }));
      
//       import { supabase } from '@/lib/supabase-mock';
  const { error$1 } = await supabase.from('reservations')
        .insert(reservationData);
      
      if (error) {
        console.error('❌ 예약 데이터 저장 실패:', error);
        console.error('실패한 배치:', JSON.stringify(reservationData, null, 2));
        process.exit(1);
      }
      
      // 진행 상황 출력
      const progress = Math.min(i + BATCH_SIZE, this.reservations.length);
      console.log(`    ${progress}/${this.reservations.length} 건 저장 완료`);
    }
    
    console.log('✅ 모든 데이터 저장 완료!');
  }
}

// 스크립트 실행
async function main() {
  try {
    const generator = new RealWorldDataGenerator();
    await generator.init();
    
    console.log('\n🎉 실제 운영 기반 테스트 데이터 생성이 완료되었습니다!');
    console.log('\n📊 생성된 데이터:');
    console.log(`  - 고객: ${CONFIG.TOTAL_CUSTOMERS}명`);
    console.log(`  - 예약: ${CONFIG.TARGET_RESERVATIONS}건 목표`);
    console.log(`  - 기간: 2023년 1월 ~ 2025년 7월`);
    console.log('\n🔍 특징:');
    console.log('  - 실제 운영 기종 및 가격 반영');
    console.log('  - 기종별 기기 수에 비례한 예약 분포');
    console.log('  - 2인 플레이 추가 요금 정확히 계산');
    console.log('  - 청소년 시간대와 overnight 시간대 구분');
    console.log('  - 고객 세그먼트별 기종 선호도 반영');
    console.log('\n🔍 이제 관리자 페이지에서 현실적인 분석 결과를 확인해보세요!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 직접 실행 시에만 main 함수 호출
if (require.main === module) {
  main();
}