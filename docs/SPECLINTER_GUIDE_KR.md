# SpecLinter MCP 한국어 가이드

## 개요
SpecLinter MCP는 AI 기반으로 API 명세와 요구사항을 분석하고 검증하는 도구입니다.

## 설치 방법

### 1. 저장소 클론 및 빌드
```bash
git clone https://github.com/orangebread/speclinter-mcp.git tools/speclinter-mcp
cd tools/speclinter-mcp
npm install && npm run build
```

### 2. Claude Desktop 설정
Claude Desktop의 설정 파일에 다음 내용을 추가합니다:

**Mac의 경우**: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/Users/seeheejang/Documents/project/gameplaza-v2/tools/speclinter-mcp/dist/cli.js", "serve"]
    }
  }
}
```

### 3. Claude Desktop 재시작
설정을 적용하기 위해 Claude Desktop을 재시작합니다.

## 주요 기능

### 1. 명세 품질 평가
- **등급**: A+ ~ F까지 명세의 품질을 평가
- **평가 기준**:
  - 명확성: 요구사항이 얼마나 명확한가
  - 완전성: 필요한 정보가 모두 포함되어 있는가
  - 일관성: 내용이 서로 모순되지 않는가
  - 측정가능성: 성공 기준이 명확한가

### 2. 자동 작업 생성
명세를 분석하여 구현에 필요한 작업들을 자동으로 생성합니다.

### 3. 유사 기능 찾기
프로젝트 내에서 비슷한 기능을 찾아 중복을 방지합니다.

### 4. 구현 검증
실제 구현이 명세와 일치하는지 검증합니다.

### 5. Gherkin 시나리오 생성
BDD 테스트를 위한 Gherkin 형식의 시나리오를 자동 생성합니다.

## 사용 예시

### 1. 프로젝트 초기화
```
"SpecLinter를 내 프로젝트에 초기화해줘"
```

### 2. API 명세 분석
```
"다음 API 명세를 분석해줘:
POST /api/reservations
- 사용자가 예약을 생성할 수 있어야 함
- 날짜, 시간, 인원수가 필요함
- 중복 예약은 불가능함"
```

### 3. 명세 품질 평가
```
"이 명세의 품질을 평가해줘: [명세 내용]"
```

### 4. 유사 기능 찾기
```
"사용자 프로필 관리와 비슷한 기능이 있는지 찾아줘"
```

### 5. 테스트 시나리오 생성
```
"예약 생성 API에 대한 Gherkin 시나리오를 만들어줘"
```

## 실제 활용 방법

### 1. API 재작성 전 명세 정의
```
"게임플라자 예약 시스템의 모든 API에 대한 명세를 작성하고 평가해줘"
```

### 2. 일관성 검증
```
"모든 API의 에러 응답 형식이 일관되는지 확인해줘"
```

### 3. 타입 정의 생성
```
"API 명세를 기반으로 TypeScript 타입 정의를 생성해줘"
```

## 팁

1. **명세 우선 개발**: 코드를 작성하기 전에 명세를 먼저 작성하고 평가받으세요.
2. **점진적 개선**: F 등급부터 시작해도 괜찮습니다. 피드백을 받아 개선하세요.
3. **팀 협업**: 명세를 통해 팀원들과 요구사항을 명확히 공유하세요.

## 게임플라자 프로젝트 적용 예시

### 예약 API 명세
```
기능: 예약 생성 API
경로: POST /api/reservations
요청:
  - reservation_date: string (YYYY-MM-DD, 필수)
  - start_time: string (HH:mm, 필수)
  - end_time: string (HH:mm, 필수)
  - device_id: string (필수)
  - num_players: number (1-4, 필수)
응답:
  성공: { id: string, status: "pending" }
  실패: { error: string, code: string }
제약사항:
  - 동일 기기의 시간대 중복 불가
  - 24시간 이내 예약만 가능
  - KST 시간대 사용
```

이런 식으로 명세를 작성하고 SpecLinter로 평가받으면 더 나은 API를 만들 수 있습니다.