import { HolidaysRepository, type Holiday } from '../repositories/holidays';
import { ScheduleManagementRepository } from '../repositories/schedule-management';

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
  
  private holidaysRepo: HolidaysRepository;
  private scheduleRepo: ScheduleManagementRepository;
  
  constructor() {
    this.holidaysRepo = new HolidaysRepository();
    this.scheduleRepo = new ScheduleManagementRepository();
  }
  
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

      const url = `${this.API_URL}/getRestDeInfo`;
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
        id: crypto.randomUUID(),
        name: item.dateName,
        date: this.formatDate(item.locdate),
        type: this.getHolidayType(item.dateKind, item.dateName),
        is_red_day: item.isHoliday === 'Y',
        year: year,
        source: 'api' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('공휴일 API 호출 실패:', error);
      return this.getLocalHolidays(year);
    }
  }
  
  /**
   * 날짜 포맷팅
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
  private static getHolidayType(dateKind: string, dateName: string): 'official' | 'temporary' | 'substitute' {
    if (dateName.includes('대체')) {
      return 'substitute';
    }
    if (dateKind === '01') {
      return 'official';
    }
    return 'temporary';
  }
  
  /**
   * 로컬 공휴일 데이터 (API 실패 시 대체)
   */
  private static getLocalHolidays(year: number): Holiday[] {
    const holidays: Holiday[] = [
      { id: crypto.randomUUID(), name: '신정', date: `${year}-01-01`, type: 'official', is_red_day: true, year, source: 'manual', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: '삼일절', date: `${year}-03-01`, type: 'official', is_red_day: true, year, source: 'manual', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: '어린이날', date: `${year}-05-05`, type: 'official', is_red_day: true, year, source: 'manual', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: '현충일', date: `${year}-06-06`, type: 'official', is_red_day: true, year, source: 'manual', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: '광복절', date: `${year}-08-15`, type: 'official', is_red_day: true, year, source: 'manual', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: '개천절', date: `${year}-10-03`, type: 'official', is_red_day: true, year, source: 'manual', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: '한글날', date: `${year}-10-09`, type: 'official', is_red_day: true, year, source: 'manual', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: crypto.randomUUID(), name: '성탄절', date: `${year}-12-25`, type: 'official', is_red_day: true, year, source: 'manual', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    
    return holidays;
  }
  
  /**
   * 특정 연도의 공휴일 조회
   */
  async getHolidaysByYear(year: number): Promise<Holiday[]> {
    try {
      return await this.holidaysRepo.findByYear(year);
    } catch (error) {
      console.error('공휴일 조회 오류:', error);
      return [];
    }
  }
  
  /**
   * 날짜 범위로 공휴일 조회
   */
  async getHolidaysByDateRange(startDate: string, endDate: string): Promise<Holiday[]> {
    try {
      return await this.holidaysRepo.findByDateRange(startDate, endDate);
    } catch (error) {
      console.error('공휴일 조회 오류:', error);
      return [];
    }
  }
  
  /**
   * 특정 날짜가 공휴일인지 확인
   */
  async isHoliday(date: string): Promise<boolean> {
    try {
      const holiday = await this.holidaysRepo.findByDate(date);
      return holiday !== null;
    } catch (error) {
      console.error('공휴일 확인 오류:', error);
      return false;
    }
  }
  
  /**
   * 공휴일 동기화 (API에서 가져와서 DB에 저장)
   */
  async syncHolidays(year: number): Promise<boolean> {
    try {
      const apiHolidays = await HolidayService.fetchHolidaysFromAPI(year);
      
      if (apiHolidays.length === 0) {
        console.log(`${year}년 공휴일 동기화 실패: API에서 데이터를 가져올 수 없습니다.`);
        return false;
      }
      
      const success = await this.holidaysRepo.syncFromAPI(year, apiHolidays);
      
      if (success) {
        console.log(`${year}년 공휴일 ${apiHolidays.length}개 동기화 완료`);
        
        // 공휴일에 대한 운영 스케줄 자동 생성
        for (const holiday of apiHolidays) {
          if (holiday.is_red_day) {
            await this.scheduleRepo.upsert({
              date: holiday.date,
              is_operating: false,
              type: 'holiday',
              note: `${holiday.name} (공휴일)`
            });
          }
        }
      }
      
      return success;
    } catch (error) {
      console.error('공휴일 동기화 오류:', error);
      return false;
    }
  }
  
  /**
   * 수동으로 공휴일 추가
   */
  async addManualHoliday(holiday: Partial<Holiday>): Promise<Holiday | null> {
    try {
      return await this.holidaysRepo.create({
        ...holiday,
        source: 'manual',
        type: holiday.type || 'temporary'
      });
    } catch (error) {
      console.error('공휴일 추가 오류:', error);
      return null;
    }
  }
  
  /**
   * 공휴일 삭제 (임시 공휴일만 가능)
   */
  async deleteHoliday(id: string): Promise<boolean> {
    try {
      return await this.holidaysRepo.delete(id);
    } catch (error) {
      console.error('공휴일 삭제 오류:', error);
      return false;
    }
  }
}