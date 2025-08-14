import { createAdminClient } from '@/lib/supabase';

export interface Holiday {
  id?: string;
  name: string;
  date: string;
  type: 'official' | 'temporary' | 'substitute';
  is_red_day: boolean;
  year: number;
  source: 'api' | 'manual';
  last_synced_at?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HolidayApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: Array<{
          dateKind: string;
          dateName: string;
          isHoliday: string;
          locdate: number;
          seq: number;
        }>;
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

export class HolidayService {
  private static API_KEY = process.env.NEXT_PUBLIC_HOLIDAY_API_KEY || '';
  private static API_URL = 'http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService';

  /**
   * 공공데이터 API에서 공휴일 정보 가져오기
   */
  static async fetchHolidaysFromAPI(year: number): Promise<Holiday[]> {
    try {
      // API 키 확인
      if (!this.API_KEY) {
        console.log('공휴일 API 키가 설정되지 않았습니다. 로컬 데이터를 사용합니다.');
        return this.getLocalHolidays(year);
      }

      const url = `${this.API_URL}/getRestDeInfo`;  // getHoliDeInfo -> getRestDeInfo
      const params = new URLSearchParams({
        serviceKey: this.API_KEY,
        solYear: year.toString(),
        _type: 'json',
        numOfRows: '50'
      });

      const fullUrl = `${url}?${params}`;
      console.log('공휴일 API 호출:', fullUrl);
      
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 에러:', response.status, errorText);
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('API 응답:', responseText.substring(0, 200));
      
      let data: HolidayApiResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON 파싱 실패:', e);
        throw new Error('API 응답 파싱 실패');
      }
      
      if (data.response.header.resultCode !== '00') {
        throw new Error(`API 오류: ${data.response.header.resultMsg}`);
      }

      const items = data.response.body.items?.item || [];
      
      console.log(`공공데이터 API에서 ${year}년 공휴일 ${items.length}개를 가져왔습니다.`);
      
      return items.map(item => ({
        name: item.dateName,
        date: this.formatDate(item.locdate),
        type: this.getHolidayType(item.dateKind, item.dateName),
        is_red_day: item.isHoliday === 'Y',
        year: year,
        source: 'api' as const
      }));
    } catch (error) {
      console.error('공휴일 API 호출 오류:', error);
      // API 오류 시 로컬 데이터 반환
      return this.getLocalHolidays(year);
    }
  }

  /**
   * 날짜 포맷 변환 (20250101 -> 2025-01-01)
   */
  private static formatDate(locdate: number): string {
    const dateStr = locdate.toString();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  /**
   * 공휴일 타입 결정
   */
  private static getHolidayType(dateKind: string, dateName: string): Holiday['type'] {
    if (dateName.includes('대체')) {
      return 'substitute';
    }
    if (dateName.includes('임시')) {
      return 'temporary';
    }
    return 'official';
  }

  /**
   * 로컬 공휴일 데이터 (백업용)
   */
  private static getLocalHolidays(year: number): Holiday[] {
    // 2025년 공휴일 하드코딩 (API 사용 불가 시 백업)
    if (year === 2025) {
      return [
        { name: '신정', date: '2025-01-01', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '설날 연휴', date: '2025-01-28', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '설날', date: '2025-01-29', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '설날 연휴', date: '2025-01-30', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '삼일절', date: '2025-03-01', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '어린이날', date: '2025-05-05', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '어린이날 대체공휴일', date: '2025-05-06', type: 'substitute', is_red_day: true, year: 2025, source: 'manual' },
        { name: '부처님오신날', date: '2025-05-05', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '현충일', date: '2025-06-06', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '광복절', date: '2025-08-15', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '추석 연휴', date: '2025-10-05', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '추석', date: '2025-10-06', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '추석 연휴', date: '2025-10-07', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '추석 대체공휴일', date: '2025-10-08', type: 'substitute', is_red_day: true, year: 2025, source: 'manual' },
        { name: '개천절', date: '2025-10-03', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '한글날', date: '2025-10-09', type: 'official', is_red_day: true, year: 2025, source: 'manual' },
        { name: '성탄절', date: '2025-12-25', type: 'official', is_red_day: true, year: 2025, source: 'manual' }
      ];
    }
    
    // 2024년 공휴일
    if (year === 2024) {
      return [
        { name: '신정', date: '2024-01-01', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '설날 연휴', date: '2024-02-09', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '설날', date: '2024-02-10', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '설날 연휴', date: '2024-02-11', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '설날 대체공휴일', date: '2024-02-12', type: 'substitute', is_red_day: true, year: 2024, source: 'manual' },
        { name: '삼일절', date: '2024-03-01', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '국회의원선거', date: '2024-04-10', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '어린이날', date: '2024-05-05', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '어린이날 대체공휴일', date: '2024-05-06', type: 'substitute', is_red_day: true, year: 2024, source: 'manual' },
        { name: '부처님오신날', date: '2024-05-15', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '현충일', date: '2024-06-06', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '광복절', date: '2024-08-15', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '추석 연휴', date: '2024-09-16', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '추석', date: '2024-09-17', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '추석 연휴', date: '2024-09-18', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '개천절', date: '2024-10-03', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '한글날', date: '2024-10-09', type: 'official', is_red_day: true, year: 2024, source: 'manual' },
        { name: '성탄절', date: '2024-12-25', type: 'official', is_red_day: true, year: 2024, source: 'manual' }
      ];
    }
    
    return [];
  }

  /**
   * 데이터베이스에서 공휴일 조회
   */
  static async getHolidaysForYear(year: number): Promise<Holiday[]> {
    try {
      const supabaseAdmin = createAdminClient();
      
      const { data, error } = await supabaseAdmin
        .from('holidays')
        .select('*')
        .eq('year', year)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('공휴일 조회 오류:', error);
      return [];
    }
  }

  /**
   * 특정 월의 공휴일 조회
   */
  static async getHolidaysForMonth(year: number, month: number): Promise<Holiday[]> {
    try {
      const supabaseAdmin = createAdminClient();
      
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = month === 12 
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`;

      const { data, error } = await supabaseAdmin
        .from('holidays')
        .select('*')
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('월별 공휴일 조회 오류:', error);
      return [];
    }
  }

  /**
   * 특정 날짜가 공휴일인지 확인
   */
  static async isHoliday(date: string): Promise<boolean> {
    try {
      const supabaseAdmin = createAdminClient();
      const { data, error } = await supabaseAdmin
        .from('holidays')
        .select('id')
        .eq('date', date)
        .eq('is_red_day', true)
        .single();
      
      return !error && !!data;
    } catch (error) {
      console.error('공휴일 확인 오류:', error);
      return false;
    }
  }

  /**
   * 공휴일 동기화
   */
  static async syncHolidays(year?: number): Promise<{ created: number; updated: number; errors: number }> {
    const targetYear = year || new Date().getFullYear();
    let created = 0;
    let updated = 0;
    let errors = 0;

    try {
      console.log(`${targetYear}년 공휴일 동기화 시작...`);
      
      // API에서 공휴일 가져오기 (API 키 없으면 로컬 데이터 사용)
      let apiHolidays = await this.fetchHolidaysFromAPI(targetYear);
      
      // API에서 데이터를 못 가져왔으면 로컬 데이터 사용
      if (apiHolidays.length === 0) {
        console.log('API를 사용할 수 없어 로컬 데이터를 사용합니다.');
        apiHolidays = this.getLocalHolidays(targetYear);
        
        if (apiHolidays.length === 0) {
          console.log(`${targetYear}년 공휴일 데이터가 없습니다.`);
          return { created, updated, errors };
        }
      }

      const supabaseAdmin = createAdminClient();

      // 기존 공휴일 조회
      const { data: existingHolidays } = await supabaseAdmin
        .from('holidays')
        .select('date, name')
        .eq('year', targetYear);

      const existingMap = new Map(
        (existingHolidays || []).map(h => [`${h.date}_${h.name}`, true])
      );

      // 공휴일 추가/업데이트
      for (const holiday of apiHolidays) {
        const key = `${holiday.date}_${holiday.name}`;
        
        try {
          if (!existingMap.has(key)) {
            // 새 공휴일 추가
            const { error } = await supabaseAdmin
              .from('holidays')
              .insert({
                ...holiday,
                last_synced_at: new Date().toISOString()
              });

            if (error) {
              console.error(`공휴일 추가 실패 (${holiday.name}):`, error);
              errors++;
            } else {
              created++;
              console.log(`새 공휴일 추가: ${holiday.name} (${holiday.date})`);
            }
          } else {
            // 기존 공휴일 업데이트 (동기화 시간만)
            const { error } = await supabaseAdmin
              .from('holidays')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('date', holiday.date)
              .eq('name', holiday.name);

            if (error) {
              console.error(`공휴일 업데이트 실패 (${holiday.name}):`, error);
              errors++;
            } else {
              updated++;
            }
          }
        } catch (err) {
          console.error(`공휴일 처리 오류 (${holiday.name}):`, err);
          errors++;
        }
      }

      console.log(`동기화 완료 - 생성: ${created}, 업데이트: ${updated}, 오류: ${errors}`);
      
      // 공휴일 전날 밤샘영업 자동 생성
      await this.createOvernightSchedulesForHolidays(targetYear);
      
      return { created, updated, errors };
    } catch (error) {
      console.error('공휴일 동기화 오류:', error);
      return { created, updated, errors: errors + 1 };
    }
  }

  /**
   * 공휴일 전날 밤샘영업 일정 자동 생성 (앞으로 3주치만)
   */
  static async createOvernightSchedulesForHolidays(year: number): Promise<void> {
    try {
      const supabaseAdmin = createAdminClient();
      
      // 오늘부터 3주 후까지의 날짜 범위 계산
      const today = new Date();
      const threeWeeksLater = new Date(today);
      threeWeeksLater.setDate(today.getDate() + 21);
      
      const startDate = today.toISOString().split('T')[0];
      const endDate = threeWeeksLater.toISOString().split('T')[0];
      
      // 3주 내의 공휴일만 조회
      const { data: holidays, error: holidayError } = await supabaseAdmin
        .from('holidays')
        .select('*')
        .eq('year', year)
        .eq('is_red_day', true)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');
      
      if (holidayError || !holidays) {
        console.error('공휴일 조회 실패:', holidayError);
        return;
      }
      
      console.log(`3주 내 공휴일 ${holidays.length}개에 대한 밤샘영업 일정 생성 시작 (${startDate} ~ ${endDate})`);
      
      for (const holiday of holidays) {
        const holidayDate = new Date(holiday.date);
        const dayOfWeek = holidayDate.getDay();
        
        // 공휴일이 일요일(0) 또는 월요일(1)인 경우 전날이 주말이므로 제외
        // 토요일->일요일, 일요일->월요일은 이미 주말 밤샘영업이 있음
        if (dayOfWeek === 0 || dayOfWeek === 1) {
          console.log(`${holiday.date} ${holiday.name}는 일/월요일이므로 밤샘영업 생성 제외`);
          continue;
        }
        
        // 공휴일 전날 날짜 계산
        const prevDate = new Date(holidayDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().split('T')[0];
        const prevDayOfWeek = prevDate.getDay();
        
        // 전날이 금요일(5) 또는 토요일(6)인 경우 이미 주말 밤샘영업이므로 제외
        if (prevDayOfWeek === 5 || prevDayOfWeek === 6) {
          console.log(`${prevDateStr}는 금/토요일이므로 밤샘영업 생성 제외`);
          continue;
        }
        
        // 이미 해당 날짜에 밤샘영업 일정이 있는지 확인
        const { data: existingSchedule, error: checkError } = await supabaseAdmin
          .from('schedule_events')
          .select('id')
          .eq('date', prevDateStr)
          .eq('type', 'overnight')
          .single();
        
        if (!checkError && existingSchedule) {
          console.log(`${prevDateStr}에 이미 밤샘영업 일정이 있음`);
          continue;
        }
        
        // 밤샘영업 일정 생성
        const { error: insertError } = await supabaseAdmin
          .from('schedule_events')
          .insert({
            date: prevDateStr,
            title: '밤샘영업',
            type: 'overnight',
            start_time: null,       // 밤샘영업은 종료시간만 표시
            end_time: '05:00:00',   // 익일 5시(05:00) 종료
            is_auto_generated: true,
            source_type: 'manual',
            source_reference: null,
            affects_reservation: false,
            description: null
          });
        
        if (insertError) {
          console.error(`${prevDateStr} 밤샘영업 생성 실패:`, insertError);
        } else {
          console.log(`✅ ${prevDateStr} (${holiday.name} 전날) 밤샘영업 일정 생성`);
        }
      }
      
      console.log('공휴일 전날 밤샘영업 일정 생성 완료');
    } catch (error) {
      console.error('밤샘영업 일정 생성 오류:', error);
    }
  }

  /**
   * 임시공휴일 추가
   */
  static async addTemporaryHoliday(
    name: string,
    date: string,
    createdBy: string
  ): Promise<Holiday | null> {
    try {
      const supabaseAdmin = createAdminClient();
      
      const year = new Date(date).getFullYear();
      
      const { data, error } = await supabaseAdmin
        .from('holidays')
        .insert({
          name,
          date,
          type: 'temporary',
          is_red_day: true,
          year,
          source: 'manual',
          created_by: createdBy
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`임시공휴일 추가: ${name} (${date})`);
      return data;
    } catch (error) {
      console.error('임시공휴일 추가 오류:', error);
      return null;
    }
  }

  /**
   * 공휴일 삭제 (임시공휴일만 삭제 가능)
   */
  static async deleteHoliday(id: string): Promise<boolean> {
    try {
      const supabaseAdmin = createAdminClient();
      
      // 임시공휴일인지 확인
      const { data: holiday } = await supabaseAdmin
        .from('holidays')
        .select('type, name, date')
        .eq('id', id)
        .single();

      if (!holiday) {
        console.error('공휴일을 찾을 수 없습니다.');
        return false;
      }

      if (holiday.type !== 'temporary') {
        console.error('임시공휴일만 삭제할 수 있습니다.');
        return false;
      }

      const { error } = await supabaseAdmin
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      console.log(`공휴일 삭제: ${holiday.name} (${holiday.date})`);
      return true;
    } catch (error) {
      console.error('공휴일 삭제 오류:', error);
      return false;
    }
  }

  /**
   * 새로운 공휴일 확인 (알림용)
   */
  static async checkNewHolidays(): Promise<Holiday[]> {
    try {
      const supabaseAdmin = createAdminClient();
      
      // 최근 24시간 내에 추가된 공휴일 조회
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data, error } = await supabaseAdmin
        .from('holidays')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('새 공휴일 확인 오류:', error);
      return [];
    }
  }

  /**
   * 마지막 동기화 시간 조회
   */
  static async getLastSyncTime(): Promise<Date | null> {
    try {
      const supabaseAdmin = createAdminClient();
      
      const { data, error } = await supabaseAdmin
        .from('holidays')
        .select('last_synced_at')
        .not('last_synced_at', 'is', null)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return new Date(data.last_synced_at);
    } catch (error) {
      console.error('마지막 동기화 시간 조회 오류:', error);
      return null;
    }
  }
}