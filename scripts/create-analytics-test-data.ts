#!/usr/bin/env tsx

/**
 * 📊 통계분석 탭 테스트 데이터 생성 스크립트
 * 
 * 목적: 2023년~2025년 6월까지 월 평균 50건의 현실적인 테스트 데이터 생성
 * 대상: 예약 통계, 매출 분석, 고객 분석 탭 검증
 */

import { createClient } from '@supabase/supabase-js';
import { format, addDays, startOfMonth, endOfMonth, addMonths, isBefore, isWeekend } from 'date-fns';
import { ko } from 'date-fns/locale';
import { config } from 'dotenv';

// 환경 변수 로드
config({ path: '.env.local' });

// Supabase 클라이언트 설정 (서비스 롤 키 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  console.error('필요한 환경 변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 타입 정의
interface DeviceType {
  id: string;
  name: string;
  category_id: string;
  rental_time_slots: TimeSlot[];
}

interface TimeSlot {
  id: string;
  device_type_id: string;
  slot_type: 'early' | 'overnight';
  start_time: string;
  end_time: string;
  credit_options: CreditOption[];
  enable_2p: boolean;
  price_2p_extra: number | null;
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
  age_group: '10s' | '20s' | '30s' | '40s+';
  customer_type: 'regular' | 'normal' | 'occasional' | 'new';
  visit_frequency: number; // 월 평균 방문 횟수
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
  TOTAL_RESERVATIONS: 1500,
  TOTAL_CUSTOMERS: 300,
  DATE_RANGE: {
    START: new Date('2023-01-01'),
    END: new Date('2025-06-30')
  },
  DEVICE_DISTRIBUTION: {
    '사운드 볼텍스': 0.30,
    'CHUNITHM': 0.25,
    'BEATMANIA IIDX': 0.20,
    '마이마이 DX': 0.25
  },
  TIME_SLOT_DISTRIBUTION: {
    early: 0.75,
    overnight: 0.25
  },
  CUSTOMER_TYPES: {
    regular: { ratio: 0.20, visit_frequency: 4 },
    normal: { ratio: 0.40, visit_frequency: 2.5 },
    occasional: { ratio: 0.30, visit_frequency: 1 },
    new: { ratio: 0.10, visit_frequency: 0.5 }
  },
  STATUS_DISTRIBUTION: {
    completed: 0.85,
    cancelled: 0.10,
    no_show: 0.05
  },
  PAYMENT_DISTRIBUTION: {
    cash: 0.40,
    transfer: 0.60
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

const generatePhoneNumber = (): string => {
  const prefix = '010';
  const middle = Math.floor(Math.random() * 9000) + 1000;
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${middle}-${suffix}`;
};

const generateKoreanName = (): string => {
  const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
  const firstNames = ['민수', '지은', '서준', '하은', '도현', '서현', '준호', '지아', '시우', '채원'];
  return randomChoice(surnames) + randomChoice(firstNames);
};

// 월별 계절성 조정 함수
const getSeasonalMultiplier = (month: number): number => {
  // 방학 시즌 (7-8월, 12월-2월): +20%
  if ([7, 8, 12, 1, 2].includes(month)) return 1.2;
  
  // 시험 기간 (4월, 10월): -15%
  if ([4, 10].includes(month)) return 0.85;
  
  // 일반 시기
  return 1.0;
};

// 연도별 성장률 적용
const getYearlyGrowthMultiplier = (year: number): number => {
  switch (year) {
    case 2023: return 0.8;  // 초기 운영
    case 2024: return 1.0;  // 안정기
    case 2025: return 1.2;  // 성장기
    default: return 1.0;
  }
};

// 메인 클래스
class TestDataGenerator {
  private deviceTypes: DeviceType[] = [];
  private customers: Customer[] = [];
  private reservations: Reservation[] = [];

  async init() {
    console.log('🚀 테스트 데이터 생성 시작...');
    
    // 1. 기존 데이터 로드
    await this.loadDeviceTypes();
    
    // 2. 고객 데이터 생성
    await this.generateCustomers();
    
    // 3. 예약 데이터 생성
    await this.generateReservations();
    
    // 4. 데이터베이스에 저장
    await this.saveToDatabase();
    
    console.log('✅ 테스트 데이터 생성 완료!');
  }

  private async loadDeviceTypes() {
    console.log('📱 기종 정보 로드 중...');
    
    const { data: deviceTypes, error } = await supabase
      .from('device_types')
      .select(`
        id,
        name,
        category_id,
        rental_time_slots (
          id,
          device_type_id,
          slot_type,
          start_time,
          end_time,
          credit_options,
          enable_2p,
          price_2p_extra
        ),
        devices (
          id,
          device_number,
          status
        )
      `)
      .eq('is_rentable', true);

    if (error) {
      console.error('❌ 기종 정보 로드 실패:', error);
      process.exit(1);
    }

    this.deviceTypes = deviceTypes || [];
    console.log(`✅ ${this.deviceTypes.length}개 기종 로드 완료`);
    
    // 각 기종별 시간대 확인
    this.deviceTypes.forEach(device => {
      console.log(`  - ${device.name}: ${device.rental_time_slots?.length || 0}개 시간대, ${device.devices?.length || 0}개 기기`);
    });
  }

  private async generateCustomers() {
    console.log('👥 고객 프로필 생성 중...');
    
    const customers: Customer[] = [];
    const ageGroups: ('10s' | '20s' | '30s' | '40s+')[] = ['10s', '20s', '30s', '40s+'];
    const ageWeights = [0.30, 0.50, 0.15, 0.05];
    
    for (let i = 0; i < CONFIG.TOTAL_CUSTOMERS; i++) {
      const customerTypeKeys = Object.keys(CONFIG.CUSTOMER_TYPES) as (keyof typeof CONFIG.CUSTOMER_TYPES)[];
      const customerTypeWeights = customerTypeKeys.map(key => CONFIG.CUSTOMER_TYPES[key].ratio);
      const customerType = randomWeighted(customerTypeKeys, customerTypeWeights);
      
      const customer: Customer = {
        id: generateUUID(),
        email: `test${i + 1}@example.com`,
        name: generateKoreanName(),
        phone: generatePhoneNumber(),
        age_group: randomWeighted(ageGroups, ageWeights),
        customer_type: customerType,
        visit_frequency: CONFIG.CUSTOMER_TYPES[customerType].visit_frequency
      };
      
      customers.push(customer);
    }
    
    this.customers = customers;
    console.log(`✅ ${customers.length}명 고객 프로필 생성 완료`);
    
    // 고객 타입별 분포 출력
    const typeDistribution = customers.reduce((acc, customer) => {
      acc[customer.customer_type] = (acc[customer.customer_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('  고객 타입 분포:');
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count}명 (${((count / customers.length) * 100).toFixed(1)}%)`);
    });
  }

  private async generateReservations() {
    console.log('📅 예약 데이터 생성 중...');
    
    const reservations: Reservation[] = [];
    let currentDate = CONFIG.DATE_RANGE.START;
    
    while (isBefore(currentDate, CONFIG.DATE_RANGE.END)) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // 월별 예약 수 계산
      const baseReservations = 50;
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
    
    // 기종별 분포 출력
    const deviceDistribution = reservations.reduce((acc, reservation) => {
      const deviceName = this.deviceTypes.find(d => d.id === reservation.device_type_id)?.name || 'Unknown';
      acc[deviceName] = (acc[deviceName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('  기종별 예약 분포:');
    Object.entries(deviceDistribution).forEach(([device, count]) => {
      console.log(`    - ${device}: ${count}건 (${((count / reservations.length) * 100).toFixed(1)}%)`);
    });
  }

  private generateSingleReservation(monthStart: Date, monthEnd: Date): Reservation | null {
    // 랜덤 날짜 생성
    const daysDiff = Math.floor((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const randomDay = Math.floor(Math.random() * daysDiff);
    const reservationDate = addDays(monthStart, randomDay);
    
    // 주말 가중치 적용 (주말 60%, 평일 40%)
    const isWeekendDay = isWeekend(reservationDate);
    const weekendBonus = isWeekendDay ? 1.5 : 1.0;
    if (Math.random() > (isWeekendDay ? 0.6 : 0.4) * weekendBonus) {
      return null;
    }
    
    // 기종 선택 (가중치 적용)
    const deviceNames = Object.keys(CONFIG.DEVICE_DISTRIBUTION);
    const deviceWeights = Object.values(CONFIG.DEVICE_DISTRIBUTION);
    const selectedDeviceName = randomWeighted(deviceNames, deviceWeights);
    const selectedDevice = this.deviceTypes.find(d => d.name === selectedDeviceName);
    
    if (!selectedDevice || !selectedDevice.rental_time_slots || selectedDevice.rental_time_slots.length === 0) {
      return null;
    }
    
    // 시간대 선택
    const timeSlotTypes = ['early', 'overnight'] as const;
    const timeSlotWeights = [CONFIG.TIME_SLOT_DISTRIBUTION.early, CONFIG.TIME_SLOT_DISTRIBUTION.overnight];
    const selectedSlotType = randomWeighted(timeSlotTypes, timeSlotWeights);
    
    const availableSlots = selectedDevice.rental_time_slots.filter(slot => slot.slot_type === selectedSlotType);
    if (availableSlots.length === 0) {
      return null;
    }
    
    const selectedTimeSlot = randomChoice(availableSlots);
    
    // 크레딧 옵션 선택
    const creditOption = randomChoice(selectedTimeSlot.credit_options);
    
    // 플레이어 수 결정
    const playerCount = (selectedTimeSlot.enable_2p && Math.random() > 0.7) ? 2 : 1;
    
    // 총 금액 계산
    let totalAmount = creditOption.price;
    if (playerCount === 2 && selectedTimeSlot.price_2p_extra) {
      totalAmount += selectedTimeSlot.price_2p_extra;
    }
    
    // 기기 선택 (해당 기종의 기기 중 랜덤 선택)
    const availableDevices = selectedDevice.devices?.filter(d => d.status === 'available') || [];
    const selectedDeviceId = availableDevices.length > 0 ? randomChoice(availableDevices).id : null;
    
    // 고객 선택 (고객 타입별 가중치 적용)
    const customer = this.selectCustomerForReservation();
    if (!customer) {
      return null;
    }
    
    // 예약 상태 결정
    const statusKeys = Object.keys(CONFIG.STATUS_DISTRIBUTION) as (keyof typeof CONFIG.STATUS_DISTRIBUTION)[];
    const statusWeights = Object.values(CONFIG.STATUS_DISTRIBUTION);
    const status = randomWeighted(statusKeys, statusWeights);
    
    // 결제 방식 결정
    const paymentMethodKeys = Object.keys(CONFIG.PAYMENT_DISTRIBUTION) as (keyof typeof CONFIG.PAYMENT_DISTRIBUTION)[];
    const paymentMethodWeights = Object.values(CONFIG.PAYMENT_DISTRIBUTION);
    const paymentMethod = randomWeighted(paymentMethodKeys, paymentMethodWeights);
    
    // 결제 상태 결정
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' = 'paid';
    if (status === 'cancelled') paymentStatus = 'cancelled';
    else if (status === 'no_show') paymentStatus = Math.random() > 0.5 ? 'refunded' : 'paid';
    
    // 시간 생성
    const createdAt = new Date(reservationDate);
    createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    const approvedAt = status !== 'pending' ? new Date(createdAt.getTime() + Math.random() * 3600000) : undefined;
    const completedAt = status === 'completed' ? new Date(reservationDate) : undefined;
    
    if (completedAt) {
      const [startHour, startMinute] = selectedTimeSlot.start_time.split(':').map(Number);
      completedAt.setHours(startHour, startMinute);
    }
    
    return {
      id: generateUUID(),
      customer_id: customer.id,
      device_type_id: selectedDevice.id,
      device_id: selectedDeviceId,
      time_slot_id: selectedTimeSlot.id,
      date: format(reservationDate, 'yyyy-MM-dd'),
      start_time: selectedTimeSlot.start_time,
      end_time: selectedTimeSlot.end_time,
      player_count: playerCount,
      credit_type: creditOption.type,
      total_amount: totalAmount,
      status,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      created_at: createdAt.toISOString(),
      approved_at: approvedAt?.toISOString(),
      completed_at: completedAt?.toISOString()
    };
  }

  private selectCustomerForReservation(): Customer | null {
    // 고객 타입별 가중치를 고려한 선택
    const customerTypeKeys = Object.keys(CONFIG.CUSTOMER_TYPES) as (keyof typeof CONFIG.CUSTOMER_TYPES)[];
    const customerTypeWeights = customerTypeKeys.map(key => CONFIG.CUSTOMER_TYPES[key].ratio);
    const selectedType = randomWeighted(customerTypeKeys, customerTypeWeights);
    
    const eligibleCustomers = this.customers.filter(c => c.customer_type === selectedType);
    if (eligibleCustomers.length === 0) {
      return randomChoice(this.customers);
    }
    
    return randomChoice(eligibleCustomers);
  }

  private async saveToDatabase() {
    console.log('💾 데이터베이스 저장 중...');
    
    // 기존 테스트 데이터 삭제
    console.log('  기존 테스트 데이터 삭제 중...');
    
    // 먼저 기존 테스트 사용자 ID 조회
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .like('email', 'test%@example.com');
    
    if (existingUsers && existingUsers.length > 0) {
      const userIds = existingUsers.map(u => u.id);
      
      // 해당 사용자들의 예약 데이터 먼저 삭제
      await supabase
        .from('reservations')
        .delete()
        .in('user_id', userIds);
      
      // 테스트 사용자 삭제
      await supabase
        .from('users')
        .delete()
        .like('email', 'test%@example.com');
    }
    
    // 배치 크기 설정
    const BATCH_SIZE = 100;
    
    // 고객 데이터 저장
    console.log('  고객 데이터 저장 중...');
    for (let i = 0; i < this.customers.length; i += BATCH_SIZE) {
      const batch = this.customers.slice(i, i + BATCH_SIZE);
      const userData = batch.map(customer => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('users')
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
        reservation_number: `TEST-${reservation.id.substring(0, 8)}`
      }));
      
      const { error } = await supabase
        .from('reservations')
        .insert(reservationData);
      
      if (error) {
        console.error('❌ 예약 데이터 저장 실패:', error);
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
    const generator = new TestDataGenerator();
    await generator.init();
    
    console.log('\n🎉 테스트 데이터 생성이 완료되었습니다!');
    console.log('\n📊 생성된 데이터:');
    console.log(`  - 고객: ${CONFIG.TOTAL_CUSTOMERS}명`);
    console.log(`  - 예약: ${CONFIG.TOTAL_RESERVATIONS}건`);
    console.log(`  - 기간: 2023년 1월 ~ 2025년 6월`);
    console.log('\n🔍 이제 관리자 페이지에서 통계를 확인해보세요!');
    
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