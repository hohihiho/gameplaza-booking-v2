import { NextRequest, NextResponse } from 'next/server';
import { getWorkerData } from '@/lib/cloudflare-worker';

export async function GET(request: NextRequest) {
  try {
    // Cloudflare Worker API 호출
    const result = await getWorkerData('/api/business-info');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('비즈니스 정보 조회 오류:', error);
    
    // Worker 연결 실패 시 폴백 응답
    const fallbackData = {
      business: {
        id: 1,
        name: '광주 게임플라자',
        description: '리듬게임 전문 아케이드 게임센터',
        address: '광주광역시 동구 충장로안길 6',
         email: '',
        website: '',
        business_hours: null,
        map_naver: 'https://map.naver.com/v5/search/게임플라자 광주광역시 동구 충장로안길 6',
        map_kakao: 'https://place.map.kakao.com/1155241361',
        map_google: 'https://www.google.com/maps/search/게임플라자 광주광역시 동구 충장로안길 6',
        transportation_info: {
          subway: '금남로4가역 3번 출구 도보 3분',
          subway_detail: '광주 도시철도 1호선',
          bus: '금남로4가 정류장 하차',
          bus_detail: '금남58, 금남59, 수완12, 첨단95, 좌석02 등',
          parking: '인근 유료주차장 이용',
          parking_detail: null
        }
      },
      socialLinks: [
        {
          platform: 'twitter',
          url: 'https://twitter.com/gameplaza94',
          icon: 'Twitter',
          label: 'X(트위터)',
          description: '최신 소식과 이벤트'
        },
        {
          platform: 'youtube',
          url: 'https://www.youtube.com/@GAMEPLAZA_C',
          icon: 'Youtube',
          label: '유튜브',
          description: '실시간 방송'
        },
        {
          platform: 'kakao',
          url: 'https://open.kakao.com/o/gItV8omc',
          icon: 'MessageCircle',
          label: '카카오톡',
          description: '커뮤니티 오픈챗'
        },
        {
          platform: 'discord',
          url: 'https://discord.gg/vTx3y9wvVb',
          icon: 'Headphones',
          label: '디스코드',
          description: '친목 교류'
        }
      ],
      operatingHours: [],
      error: 'Worker API 연결 실패 - 기본 정보 표시'
    };

    return NextResponse.json(fallbackData, { status: 500 });
  }
}