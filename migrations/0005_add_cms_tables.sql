-- CMS 콘텐츠 관리를 위한 테이블 생성
-- 생성일: 2025-09-07

-- content_pages 테이블 (약관, 공지사항 등 콘텐츠)
CREATE TABLE IF NOT EXISTS content_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT 0,
    published_at DATETIME,
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- content_versions 테이블 (버전 관리)
CREATE TABLE IF NOT EXISTS content_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_page_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_page_id) REFERENCES content_pages(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages(slug);
CREATE INDEX IF NOT EXISTS idx_content_pages_published ON content_pages(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_content_versions_page_version ON content_versions(content_page_id, version_number);

-- 초기 콘텐츠 데이터 삽입
INSERT OR IGNORE INTO content_pages (slug, title, content, meta_description, is_published, published_at, created_by) VALUES
(
    'terms_of_service',
    '이용약관',
    '<h1>광주 게임플라자 이용약관</h1>

<h2>제1조 (목적)</h2>
<p>이 약관은 광주 게임플라자(이하 "게임플라자")에서 제공하는 게임 기기 예약 및 이용 서비스의 이용조건 및 절차, 회원과 게임플라자의 권리와 의무에 관한 사항을 규정함을 목적으로 합니다.</p>

<h2>제2조 (정의)</h2>
<p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
<ul>
    <li>"게임플라자"란 게임 기기 예약 서비스를 제공하는 사업장을 말합니다.</li>
    <li>"회원"이란 게임플라자와 서비스 이용계약을 체결하고 서비스를 이용하는 자를 말합니다.</li>
    <li>"예약"이란 회원이 게임 기기를 특정 시간에 이용하기 위해 사전 신청하는 것을 말합니다.</li>
</ul>

<h2>제3조 (약관의 효력 및 변경)</h2>
<p>이 약관은 게임플라자 내에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력을 발생합니다.</p>

<h2>제4조 (예약 및 이용)</h2>
<p>회원은 게임플라자의 예약 시스템을 통해 게임 기기를 예약할 수 있으며, 예약 시간에 맞춰 이용하여야 합니다.</p>

<h2>제5조 (요금 및 결제)</h2>
<p>게임 기기 이용요금은 게임플라자가 정한 요금표에 따르며, 예약 시 또는 이용 후 결제하여야 합니다.</p>

<h2>제6조 (예약 취소 및 변경)</h2>
<p>예약 취소 및 변경은 이용 시작 시간 1시간 전까지 가능하며, 이후에는 취소수수료가 발생할 수 있습니다.</p>

<h2>제7조 (이용자의 의무)</h2>
<p>회원은 다음 사항을 준수하여야 합니다:</p>
<ul>
    <li>게임 기기를 정상적으로 이용하고 고의로 손상시키지 않을 것</li>
    <li>다른 이용자에게 피해를 주지 않을 것</li>
    <li>게임플라자의 운영방침을 준수할 것</li>
</ul>

<h2>제8조 (서비스 제공의 중단)</h2>
<p>게임플라자는 다음과 같은 경우 서비스 제공을 중단할 수 있습니다:</p>
<ul>
    <li>설비의 보수 또는 공사로 인한 부득이한 경우</li>
    <li>정전, 제반 설비의 장애 또는 이용량의 폭주 등으로 인한 서비스 이용에 지장이 있는 경우</li>
    <li>기타 중대한 사유로 인하여 서비스 제공이 곤란한 경우</li>
</ul>

<p><strong>시행일: 2025년 1월 1일</strong></p>',
    '광주 게임플라자 이용약관 - 게임 기기 예약 및 이용 서비스 약관',
    1,
    CURRENT_TIMESTAMP,
    'system'
),
(
    'privacy_policy', 
    '개인정보처리방침',
    '<h1>개인정보처리방침</h1>

<p>광주 게임플라자(이하 "게임플라자")는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.</p>

<h2>제1조 개인정보의 처리목적</h2>
<p>게임플라자는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
<ul>
    <li>회원가입 및 관리</li>
    <li>게임 기기 예약 서비스 제공</li>
    <li>서비스 이용 현황 분석 및 맞춤형 서비스 제공</li>
    <li>고객 문의사항 처리</li>
</ul>

<h2>제2조 처리하는 개인정보의 항목</h2>
<h3>필수항목</h3>
<ul>
    <li>이름, 전화번호, 이메일 주소</li>
    <li>서비스 이용 기록</li>
</ul>

<h3>선택항목</h3>
<ul>
    <li>생년월일</li>
    <li>마케팅 수신 동의 여부</li>
</ul>

<h2>제3조 개인정보의 처리 및 보유기간</h2>
<p>게임플라자는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>

<table border="1" style="border-collapse: collapse; width: 100%;">
    <thead>
        <tr>
            <th>처리목적</th>
            <th>보유기간</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>회원가입 및 관리</td>
            <td>회원탈퇴 후 즉시 삭제 (단, 관련 법령에 따른 보존 의무가 있는 경우 해당 기간)</td>
        </tr>
        <tr>
            <td>서비스 제공</td>
            <td>서비스 이용계약 종료 후 3년</td>
        </tr>
    </tbody>
</table>

<h2>제4조 개인정보의 제3자 제공</h2>
<p>게임플라자는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다:</p>
<ul>
    <li>이용자가 사전에 동의한 경우</li>
    <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
</ul>

<h2>제5조 개인정보 처리의 위탁</h2>
<p>게임플라자는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>

<table border="1" style="border-collapse: collapse; width: 100%;">
    <thead>
        <tr>
            <th>수탁업체</th>
            <th>위탁업무</th>
            <th>개인정보의 보유 및 이용기간</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Supabase (PostgreSQL)</td>
            <td>데이터베이스 호스팅 및 관리</td>
            <td>위탁계약 종료시 또는 위탁목적 달성시까지</td>
        </tr>
    </tbody>
</table>

<h2>제6조 정보주체의 권리·의무 및 행사방법</h2>
<p>이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:</p>
<ul>
    <li>개인정보 열람요구</li>
    <li>오류 등이 있을 경우 정정·삭제 요구</li>
    <li>처리정지 요구</li>
</ul>

<h2>제7조 개인정보의 안전성 확보조치</h2>
<p>게임플라자는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
<ul>
    <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
    <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 개인정보의 암호화</li>
    <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
</ul>

<h2>제8조 개인정보보호책임자</h2>
<p>게임플라자는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.</p>

<h3>개인정보보호책임자</h3>
<ul>
    <li>성명: [담당자명]</li>
    <li>연락처: [전화번호], [이메일]</li>
</ul>

<h2>제9조 개인정보처리방침 변경</h2>
<p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>

<p><strong>시행일: 2025년 1월 1일</strong></p>',
    '광주 게임플라자 개인정보처리방침 - 개인정보 보호 및 처리 방침',
    1,
    CURRENT_TIMESTAMP,
    'system'
);

-- 초기 버전 데이터 생성 (각 콘텐츠의 1.0 버전)
INSERT OR IGNORE INTO content_versions (content_page_id, version_number, title, content, meta_description, created_by)
SELECT 
    id, 
    1, 
    title, 
    content, 
    meta_description, 
    'system'
FROM content_pages 
WHERE slug IN ('terms_of_service', 'privacy_policy');