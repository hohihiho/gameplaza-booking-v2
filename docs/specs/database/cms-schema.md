# CMS Schema (Terms & Guide Content)

약관/정책과 이용안내(가이드) 콘텐츠를 관리하기 위한 스키마와 API입니다.

## 테이블: terms_pages (버전 관리)
```
CREATE TABLE terms_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT CHECK (type IN ('terms_of_service','privacy_policy','marketing','age_confirm')),
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```
- 타입별로 다중 버전 저장, 한 번에 하나만 is_active=1

## 테이블: guide_categories / guide_contents
```
CREATE TABLE guide_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE guide_contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

## 관리자 API (v3)
- Terms
  - GET  `/api/v3/admin/terms?type=` (목록)
  - POST `/api/v3/admin/terms` (새 버전 생성)
  - PUT  `/api/v3/admin/terms/:id` (수정)
  - POST `/api/v3/admin/terms/:id/activate` (해당 버전을 활성화, 동일 type의 다른 버전은 비활성화)
  - DELETE `/api/v3/admin/terms/:id`
- Guide
  - GET  `/api/v3/admin/guide-categories` / POST / PUT / DELETE
  - GET  `/api/v3/admin/guide-contents?category_id=` / POST / PUT / DELETE

## 사용자 API (v3)
- Terms: GET `/api/v3/terms?type=terms_of_service` (활성 버전 반환)
- Guides: GET `/api/v3/guide?category=slug` (공개 콘텐츠 반환)

## 구현 상태
- [x] 스키마/인덱스 추가 (SQL 포함)
- [x] 관리자/사용자 API 라우트 구현 예정 포맷 정의
- [x] 관리자/사용자 API 실제 구현
  - Admin: `/api/v3/admin/terms*`, `/api/v3/admin/guide-*`
  - Public: `/api/v3/terms`, `/api/v3/guide`
