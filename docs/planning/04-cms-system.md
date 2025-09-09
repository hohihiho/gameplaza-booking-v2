# 💻 CMS 시스템

## 개요
동적 콘텐츠 관리를 위한 CMS(Content Management System) 구현으로 약관, 정책, 공지사항 등을 관리자가 직접 편집할 수 있습니다.

## 데이터베이스 설계

### 콘텐츠 페이지 테이블
```sql
-- Cloudflare D1에 저장되는 content_pages 테이블
CREATE TABLE content_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_type VARCHAR(50) NOT NULL,  -- 'terms', 'privacy', 'notice' 등
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',  -- 'draft', 'published'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),  -- 작성자 이메일
  updated_by VARCHAR(255),  -- 수정자 이메일
  published_at DATETIME,
  meta_description TEXT,
  slug VARCHAR(255) UNIQUE
);
```

### 버전 관리 테이블
```sql
-- 콘텐츠 버전 이력 관리
CREATE TABLE content_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  change_summary TEXT,
  FOREIGN KEY (page_id) REFERENCES content_pages (id)
);
```

### 인덱스 생성
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_content_pages_type_status 
  ON content_pages(page_type, status);
  
CREATE INDEX idx_content_versions_page_version 
  ON content_versions(page_id, version);
```

## API 설계

### 공개 API (사용자용)
```typescript
// 콘텐츠 조회
GET /api/content/{page_type}
  - 발행된 최신 버전 반환
  - 30분 캐싱 적용
  - 예: /api/content/terms

// 모든 공개 콘텐츠 목록
GET /api/content
  - 발행된 모든 페이지 목록
  - 제목과 요약만 반환
```

### 관리자 API
```typescript
// 콘텐츠 관리 (관리자 전용)
POST   /api/admin/content/create        // 새 콘텐츠 생성
PUT    /api/admin/content/{id}/update   // 콘텐츠 수정
DELETE /api/admin/content/{id}          // 콘텐츠 삭제
POST   /api/admin/content/{id}/publish  // 콘텐츠 발행
POST   /api/admin/content/{id}/unpublish // 발행 취소

// 버전 관리
GET    /api/admin/content/{id}/versions // 버전 이력 조회
POST   /api/admin/content/{id}/revert/{version} // 특정 버전으로 복원
GET    /api/admin/content/{id}/compare/{v1}/{v2} // 버전 비교

// 미리보기
GET    /api/admin/content/{id}/preview  // 미리보기
```

## 관리자 인터페이스

### 에디터 컴포넌트
```typescript
interface CMSEditor {
  // 리치 텍스트 에디터
  editor: RichTextEditor | MarkdownEditor
  
  // 실시간 미리보기
  preview: LivePreview
  
  // 버전 관리 UI
  versionHistory: VersionManager
  
  // 발행 상태 관리
  publishingControls: PublishingPanel
}
```

### 에디터 설정
```typescript
const editorConfig = {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'header': [1, 2, 3, false] }],
      ['clean']
    ]
  },
  theme: 'snow'
}
```

### 관리자 페이지 구조
```
/admin/cms/
├── page.tsx           // CMS 대시보드
├── create/page.tsx    // 새 콘텐츠 생성
├── [id]/
│   ├── edit/page.tsx  // 콘텐츠 편집
│   ├── preview/page.tsx // 미리보기
│   └── versions/page.tsx // 버전 관리
└── components/
    ├── Editor.tsx     // 에디터 컴포넌트
    ├── Preview.tsx    // 미리보기 컴포넌트
    └── VersionList.tsx // 버전 목록
```

## 프론트엔드 통합

### 동적 페이지 렌더링
```typescript
// app/terms/page.tsx
export default async function TermsPage() {
  const termsContent = await fetchContent('terms')
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {termsContent.title}
      </h1>
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: termsContent.content }}
      />
    </div>
  )
}
```

### 회원가입 모달 통합
```typescript
// 회원가입 모달에서 약관 동적 로딩
const SignupModal = () => {
  const { data: termsContent } = useSWR('/api/content/terms')
  const { data: privacyContent } = useSWR('/api/content/privacy')
  
  return (
    <Modal>
      <div className="terms-section">
        <h3>이용약관</h3>
        <div className="terms-content">
          {termsContent?.content}
        </div>
      </div>
      
      <div className="privacy-section">
        <h3>개인정보처리방침</h3>
        <div className="privacy-content">
          {privacyContent?.content}
        </div>
      </div>
      
      <Checkbox>
        모든 약관에 동의합니다
      </Checkbox>
    </Modal>
  )
}
```

## 캐싱 전략

### 다층 캐싱
1. **브라우저 캐싱**: 30분
2. **CDN 캐싱**: Cloudflare CDN
3. **API 캐싱**: Edge Functions 메모리
4. **데이터베이스 캐싱**: D1 자동 캐싱

### 캐시 무효화
```typescript
// 콘텐츠 업데이트 시 캐시 무효화
async function invalidateCache(pageType: string) {
  // CDN 캐시 제거
  await purgeCloudflareCache(`/api/content/${pageType}`)
  
  // 로컬 캐시 제거
  cache.delete(`content:${pageType}`)
  
  // 클라이언트 리프레시 트리거
  broadcastUpdate({ type: 'content-update', pageType })
}
```

## 보안 고려사항

### 권한 관리
- **읽기**: 모든 사용자 (발행된 콘텐츠만)
- **생성/수정**: 관리자만
- **발행/삭제**: 슈퍼 관리자만

### XSS 방지
```typescript
// HTML 콘텐츠 정제
import DOMPurify from 'isomorphic-dompurify'

function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  })
}
```

### 감사 로그
```typescript
// 모든 CMS 작업 로깅
interface CMSAuditLog {
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish'
  pageId: number
  pageType: string
  userId: string
  timestamp: Date
  changes?: string
  ipAddress: string
}
```

## 마이그레이션 계획

### Phase 1: 기본 구현
- [ ] 데이터베이스 테이블 생성
- [ ] CRUD API 구현
- [ ] 기본 에디터 UI

### Phase 2: 고급 기능
- [ ] 버전 관리 시스템
- [ ] 미리보기 기능
- [ ] 이미지 업로드

### Phase 3: 최적화
- [ ] 캐싱 최적화
- [ ] SEO 메타 태그
- [ ] 다국어 지원

## 콘텐츠 타입

### 현재 지원
- **약관** (terms)
- **개인정보처리방침** (privacy)
- **공지사항** (notice)
- **이용안내** (guide)

### 향후 추가 예정
- **이벤트** (event)
- **FAQ** (faq)
- **블로그** (blog)
- **팝업** (popup)