-- 비즈니스 정보 테이블
CREATE TABLE IF NOT EXISTS business_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  business_hours TEXT, -- JSON 형식
  map_naver TEXT,
  map_kakao TEXT,
  map_google TEXT,
  transportation_info TEXT, -- JSON 형식
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 소셜 링크 테이블
CREATE TABLE IF NOT EXISTS social_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_info_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  label TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_info_id) REFERENCES business_info(id)
);

-- 영업시간 테이블 (주간 스케줄)
CREATE TABLE IF NOT EXISTS operating_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_info_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=일요일, 6=토요일
  open_time TEXT,
  close_time TEXT,
  is_closed BOOLEAN DEFAULT 0,
  special_hours TEXT, -- 특별 영업시간 설명
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_info_id) REFERENCES business_info(id)
);

-- 초기 데이터 삽입
INSERT INTO business_info (id, name, description, address, phone, email, website, map_naver, map_kakao, map_google, transportation_info)
VALUES (
  1,
  '광주 게임플라자',
  '리듬게임 전문 아케이드 게임센터',
  '광주광역시 동구 충장로안길 6',
  '',
  '',
  '',
  'https://map.naver.com/v5/search/게임플라자 광주광역시 동구 충장로안길 6',
  'https://place.map.kakao.com/1155241361',
  'https://www.google.com/maps/search/게임플라자 광주광역시 동구 충장로안길 6',
  '{"subway":"금남로4가역 3번 출구 도보 3분","subway_detail":"광주 도시철도 1호선","bus":"금남로4가 정류장 하차","bus_detail":"금남58, 금남59, 수완12, 첨단95, 좌석02 등","parking":"인근 유료주차장 이용","parking_detail":null}'
);

-- 소셜 링크 초기 데이터
INSERT INTO social_links (business_info_id, platform, url, icon, label, description, sort_order) VALUES
(1, 'twitter', 'https://twitter.com/gameplaza94', 'Twitter', 'X(트위터)', '최신 소식과 이벤트', 1),
(1, 'youtube', 'https://www.youtube.com/@GAMEPLAZA_C', 'Youtube', '유튜브', '실시간 방송', 2),
(1, 'kakao', 'https://open.kakao.com/o/gItV8omc', 'MessageCircle', '카카오톡', '커뮤니티 오픈챗', 3),
(1, 'discord', 'https://discord.gg/vTx3y9wvVb', 'Headphones', '디스코드', '친목 교류', 4);