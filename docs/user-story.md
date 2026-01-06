기존의 CSV 형태의 유저 스토리를, AI(Cursor, Windsurf 등)가 기술적 맥락을 완벽히 이해하고 테스트 케이스까지 도출할 수 있도록 **Gherkin 문법(Given-When-Then) 스타일의 Acceptance Criteria(인수 조건)**를 포함하여 재구성했습니다.

이 내용을 `User_Stories.md`로 저장하여 Tech Spec과 함께 AI에게 제공하면, 프론트엔드/백엔드 로직 구현 시 빈틈없는 코드를 작성할 수 있습니다.

---

# 📋 Refined User Stories for AI Agent

**Project:** Lesume (레스유메)
**Version:** 2.0 (Tech Spec Integrated)
**Context:** 이 유저 스토리는 `Tech_Spec.md`의 데이터베이스 스키마 및 상태 머신(State Machine) 정의를 따른다.

---

## Epic 1: Onboarding & Layout (온보딩 및 레이아웃)

### STORY-1.1: 랜딩 페이지 및 SEO

**Description:** 잠재 고객은 서비스의 가치를 파악하고 자연 유입될 수 있어야 한다.
**Acceptance Criteria:**

- **Performance:** Lighthouse 성능 점수 90점 이상 (Desktop/Mobile) 달성.
- **SEO:** `robots.txt`, `sitemap.xml`, Open Graph 태그가 올바르게 설정되어야 한다.
- **Responsiveness:** 모바일 뷰포트에서 레이아웃 깨짐이 없어야 한다.

### STORY-1.2: 카카오 로그인 (Auth)

**Description:** 잠재 고객은 별도 가입 절차 없이 카카오 계정으로 즉시 서비스를 이용할 수 있다.
**Acceptance Criteria:**

- **Scenario: 신규 유저 로그인**
- **When** 유저가 '카카오로 시작하기'를 클릭하면
- **Then** `Users` 테이블에 레코드가 생성되고, `Plans`는 기본적으로 'FREE'로 설정된다.
- **And** 로그인이 완료되면 `/dashboard`로 리다이렉트 된다.

- **Scenario: 기존 유저 로그인**
- **When** 기존 가입자가 로그인하면
- **Then** 기존 계정 정보를 불러오고, 마지막 작업 상태가 유지된다.

### STORY-1.3: 콘솔 레이아웃 (App Shell)

**Description:** 고객은 일관된 네비게이션을 통해 서비스의 주요 기능에 접근한다.
**Acceptance Criteria:**

- **Global Header:**
- 현재 플랜(Badge)과 남은 Quota(예: `2/6`)가 실시간으로 표시되어야 한다.

- 프로필 클릭 시 '결제 관리'로 이동하는 드롭다운이 제공된다.

- **LNB (Left Navigation Bar):**
- '전환 시작(New)', '작업 관리(History)', '결제 관리(Billing)' 메뉴가 존재해야 한다.

---

## Epic 2: Core Workflow (이력서 변환 프로세스)

### STORY-2.1: 이력서 업로드 및 파싱

**Description:** 고객은 "전환 시작" 메뉴에서 PDF를 업로드하거나 드래그앤드롭 할 수 있다.
**Acceptance Criteria:**

- **Upload:** `.pdf` 파일만 허용하며, 10MB 이하 제한을 둔다.
- **Process:** 업로드 즉시 서버는 텍스트를 파싱하고 `Resumes` 테이블을 생성한다 (Status: `IDLE`).
- **Feedback:** 업로드/파싱 중 스켈레톤 UI 또는 로딩 스피너를 노출한다.

### STORY-2.2: AI 요약 (Summary Step)

**Description:** 고객은 추출된 이력 내용을 바탕으로 회사별 핵심 성과를 요약받고 수정할 수 있다.
**Acceptance Criteria:**

- **Pre-condition:** `Subscriptions`의 잔여 Quota가 1 이상이어야 한다.
- **AI Processing:**
- Gemini API를 호출하여 회사별 불릿 포인트를 추출한다.
- 성공 시 `UsageLogs`에 기록하고 Quota를 1 차감한다.

- **User Edit:** 유저는 생성된 한글 요약(`bullets_kr`)을 텍스트 에디터(Textarea)로 직접 수정할 수 있어야 한다.

### STORY-2.3: AI 번역 및 Split View (Translation Step)

**Description:** 고객은 요약된 내용을 영문으로 번역하고, 원문과 대조하며 수정한다.
**Acceptance Criteria:**

- **UI Layout:** 화면이 좌우로 분할(Split View)되어 왼쪽엔 한글, 오른쪽엔 영문이 표시된다.

- **Sync Logic:**
- 왼쪽(한글)은 수정 불가능(Read-only) 혹은 수정 시 재번역 경고를 띄운다.
- 오른쪽(영문)은 유저가 자유롭게 수정(`bullets_en` update) 가능하다.

- **Progress:** 이 단계가 완료되면 `Resumes.current_step`이 'TEMPLATE'으로 업데이트된다.

### STORY-2.4: 템플릿 선택 및 다운로드

**Description:** 고객은 검수 완료된 영문 이력서를 템플릿에 맞춰 PDF로 다운로드한다.
**Acceptance Criteria:**

- **Templates:** 3가지 옵션(Modern, Classic, Minimal) 중 하나를 선택하면 실시간 미리보기가 렌더링 된다.

- **Download:** 'PDF 다운로드' 클릭 시 브라우저 인쇄/다운로드 창이 호출된다.

- **Completion:** 다운로드 시점에 `Resumes.status`를 'COMPLETED'로 확정한다.

### STORY-2.5: 딸깍 전환 (One-Click Batch)

**Description:** 고객은 요약과 번역 과정을 한 번에 수행하여 결과를 즉시 확인한다.
**Acceptance Criteria:**

- **Validation:** 잔여 Quota가 2 이상일 때만 활성화된다.
- **Batch Process:** 서버는 [요약] → [번역]을 연속으로 수행한다.
- **Error Handling:**
- 중간 실패 시 `Resumes.status`='FAILED', `failure_message`에 사유를 저장한다.
- 유저에게 "실패했습니다. 쿼타는 차감되지 않았습니다" 메시지를 띄우고(롤백 구현 시) 작업을 중단한다.

---

## Epic 3: Workspace & History (작업 관리)

### STORY-3.1: 작업 내역 관리

**Description:** 고객은 "작업 관리" 화면에서 과거의 변환 이력을 리스트 형태로 확인한다.
**Acceptance Criteria:**

- **List View:** 생성일, 프로젝트명, 현재 상태(진행 중/완료/실패)가 테이블 형태로 표시된다.
- **Sorting:** 최신순 정렬을 기본으로 지원한다.

- **Constraint:** `Plans.max_resumes` 개수를 초과하는 오래된 이력서는 비활성화되거나 삭제(아카이빙) 되어야 한다.

### STORY-3.2: 작업 이어하기 (State Persistence)

**Description:** 고객은 중단된 작업 내역을 클릭하여 마지막 단계부터 다시 진행할 수 있다.
**Acceptance Criteria:**

- **Re-entry:** 리스트 클릭 시 `Resumes.current_step`에 해당하는 페이지로 라우팅 된다.

- **Data Integrity:** 이전에 수정해둔 내용(`bullets_kr`, `bullets_en`)이 그대로 로드되어야 한다.

---

## Epic 4: Subscription & Billing (구독 및 결제)

### STORY-4.1: 플랜 구독 및 변경

**Description:** 고객은 "결제 관리"에서 플랜을 조회하고 변경할 수 있다.
**Acceptance Criteria:**

- **Display:** 현재 이용 중인 플랜 정보가 최상단에 노출된다.

- **Upgrade:** 상위 플랜 결제 성공 시, 즉시 `Plans.monthly_quota` 만큼의 크레딧이 추가된다.
- **Payment Method:** 카드 정보 변경 기능을 제공한다.

### STORY-4.2: 결제 이력 및 영수증

**Description:** 고객은 자신의 결제 내역과 영수증을 확인할 수 있다.
**Acceptance Criteria:**

- **History List:** 결제 일시, 금액, 결제 상태(성공/실패) 리스트 제공.
- **Receipt:** PG사 매출전표 URL로 연결되는 '영수증 보기' 버튼 제공.

### STORY-4.3: 구독 해지 (Grace Period)

**Description:** 고객은 구독을 해지하더라도, 이미 결제한 기간 동안은 혜택을 누릴 수 있다.
**Acceptance Criteria:**

- **Cancellation Action:** '구독 해지' 버튼 클릭 시 `Subscriptions` 테이블의 `cancel_at_period_end` 값을 `true`로 설정한다 (Row 삭제 X).
- **UI Feedback:** "해지 예약되었습니다. YYYY-MM-DD까지 Pro 기능을 이용할 수 있습니다." 메시지를 노출한다.
- **Effect:** 실제 권한 박탈은 `current_period_end` 날짜가 지난 후 발생한다.
