제공해주신 1 Pager와 유저 스토리, 그리고 앞서 우리가 논의한 **Tech Spec(기술 명세)**의 결정 사항(구독 유예, 에러 핸들링 등)을 모두 통합하여 **AI(Cursor, Windsurf, Replit 등)가 문맥을 완벽히 이해하고 코드를 짤 수 있는 형태**로 가공했습니다.

이 내용을 `.md` 파일로 저장하여 AI 코딩 도구에 "Context"로 주입하면, 모호함 없이 바로 개발을 진행할 수 있습니다.

---

# 📂 Project Context: Lesume (Master PRD)

## 1. Product Overview

- **Product Name:** 레스유메 (Lesume)
- **Definition:** 한국어 이력서(PDF)를 입력받아 AI(LLM)를 통해 **요약(Summarization), 번역(Translation), 서식화(Formatting)**를 수행하여 Global Standard에 맞는 영문 이력서(PDF)로 변환해 주는 Micro SaaS.
- **Core Value:** "나를 채용해야 하는 이유"를 증명하는 마케팅 브로셔 관점의 영문 이력서 자동 생성.
- **Design Philosophy:**
  - **Aesthetic:** Vercel & Linear-inspired Modern & Minimal Design.
  - **Values:** Clean typography, monochrome color palette with subtle accents, decluttered UI, and smooth micro-interactions.
- **Target Audience:**
- 글로벌 기업 지원자 (영어 이력서 작성에 부담을 느끼는 한국인).
- 급하게 영문 이력서를 제출해야 하는 직장인.
- 기존 번역기/LLM 채팅의 한계(PDF 미지원, 서식 깨짐)를 느끼는 유저.

## 2. Technical Stack & Constraints (For AI Engineer)

이 프로젝트는 다음 기술 스택을 기반으로 구현되어야 한다.

- **Frontend/Backend:** Next.js 16 (App Router), TypeScript, **Tailwind CSS**, **Shadcn UI**.
- **Database:** PostgreSQL (Supabase or Neon), Prisma ORM.
- **Auth:** Auth.js v5 (Google OAuth).
- **AI Engine:** Google Gemini Pro API (Structured Output).ㅎ
- **Storage:** AWS S3 Compatible (Supabase Storage) - PDF 파일 관리.
- **Payments:** PortOne or Toss Payments (Subscription Model).
- **Deployment:** Vercel.

## 3. Business Rules & Logic

### 3.1. Subscription Model (Quota System)

유저는 **Plan**에 따라 매월 부여되는 **Quota(크레딧)**을 소모하여 AI 기능을 사용한다.

- **Quota Cost:**
- 요약(Summarize) 1회 = **1 Quota**.
- 번역(Translate) 1회 = **1 Quota**.
- 딸깍 전환(One-Click) 1회 = **2 Quota**.

- **Plan Tiers:**

1. **Free:** 월 2 Quota / 이력서 보관 1개.
2. **Standard:** 월 6 Quota / 이력서 보관 3개.
3. **Pro:** 월 20 Quota / 이력서 보관 무제한.

### 3.2. Cancellation Policy (Grace Period)

- 구독 해지 시 즉시 권한이 박탈되지 않는다.
- **`cancel_at_period_end` = true**로 설정되며, 현재 결제 주기의 마지막 날(`current_period_end`)까지는 Pro 기능을 유지한다.
- 결제일 다음날 배치(Batch) 혹은 접속 시점 체크를 통해 최종 권한을 Free로 강등한다.

---

# 📝 Refined User Stories (Functional Specs)

AI가 구현해야 할 기능을 **Epic(기능 단위)**별로 분류하고, 명확한 **Acceptance Criteria(인수 조건)**를 추가했습니다.

## Epic 1: Auth & Onboarding

**Story 1.1: 구글 로그인**

- **As a** 방문자, **I want to** 구글 계정으로 간편하게 가입/로그인하고 싶다.
- **Acceptance Criteria:**
- 로그인 버튼 클릭 시 구글 OAuth 창이 떠야 한다.
- 가입 시 `Users` 테이블에 정보가 없으면 생성하고, `Plans`는 기본적으로 'FREE'로 설정된다.
- 로그인 성공 시 `/dashboard`로 리다이렉트 된다.

**Story 1.2: 기본 레이아웃 (App Shell)**

- **As a** 로그인한 유저, **I want to** 일관된 레이아웃(Header, Nav, Footer)을 경험하고 싶다.
- **Acceptance Criteria:**
- Header: 현재 플랜 정보(Badge)와 남은 Quota 표시.
- Left Nav: [이력서 관리], [새 이력서 만들기], [결제 관리].
- Mobile: 햄버거 메뉴로 반응형 대응.

## Epic 2: Resume Workflow (Core Features)

**Story 2.1: PDF 업로드 및 파싱**

- **As a** 유저, **I want to** PDF 이력서를 업로드하여 텍스트를 추출하고 싶다.
- **Acceptance Criteria:**
- 파일 드래그 앤 드롭 지원.
- 업로드 시 서버에서 텍스트 추출(Parsing) 후 `Resumes` 테이블 생성 (Status: IDLE).
- 업로드 중 Loading UI(Spinner/Skeleton) 표시.

**Story 2.2: AI 요약 (Summarization)**

- **As a** 유저, **I want to** 추출된 경력을 AI가 3~4줄의 불릿 포인트로 요약해 주길 원한다.
- **Acceptance Criteria:**
- 보유 Quota가 1 이상일 때만 실행 가능.
- Gemini API 호출: Raw Text -> Structured Bullets (Korean).
- 성공 시 `WorkExperiences` 테이블에 `bullets_kr` 저장 및 Quota 1 차감.
- 결과 화면에서 유저는 한글 요약본을 직접 수정할 수 있어야 한다.

**Story 2.3: AI 번역 (Translation) & Split View**

- **As a** 유저, **I want to** 확정된 한글 요약을 바탕으로 영문 번역본을 생성하고 비교하고 싶다.
- **Acceptance Criteria:**
- 보유 Quota가 1 이상일 때만 실행 가능.
- **Split View UI:** 좌측(한글 원본/수정본) vs 우측(영문 번역본).
- 우측 영문 텍스트는 유저가 직접 수정 가능해야 한다(`bullets_en` 업데이트).

**Story 2.4: 딸깍 전환 (One-Click Batch)**

- **As a** (성격 급한) 유저, **I want to** 업로드 즉시 영문 이력서 결과물까지 한 번에 받고 싶다.
- **Acceptance Criteria:**
- 보유 Quota가 2 이상일 때만 버튼 활성화.
- 백그라운드에서 [요약] -> [번역] 과정을 순차적으로 자동 실행.
- 중간 실패 시 `Resumes.status` = 'FAILED' 및 에러 사유 저장.
- 성공 시 바로 '변환 결과(Preview)' 페이지로 이동.

**Story 2.5: PDF 내보내기 (Export)**

- **As a** 유저, **I want to** 완성된 데이터를 3가지 템플릿 중 하나로 선택해 PDF로 받고 싶다.
- **Acceptance Criteria:**
- 템플릿 옵션: Modern, Classic, Minimal.
- 헤더 정보(이름, 이메일, LinkedIn 등)가 포함되어야 한다.
- 브라우저에서 즉시 PDF 다운로드가 트리거 되어야 한다.

## Epic 3: Subscription & Payment

**Story 3.1: 플랜 결제**

- **As a** Free 유저, **I want to** 더 많은 기능을 위해 Pro 플랜을 구독하고 싶다.
- **Acceptance Criteria:**
- 결제 모달에서 카드 정보 입력 및 PG사 승인 완료.
- DB `Subscriptions` 테이블 업데이트 및 즉시 Quota 지급.

**Story 3.2: 구독 해지 (유예 처리)**

- **As a** 구독자, **I want to** 다음 달부터 결제가 되지 않도록 해지하고 싶다.
- **Acceptance Criteria:**
- '해지하기' 버튼 클릭 시 즉시 권한이 사라지면 안 됨.

- DB의 `cancel_at_period_end`를 true로 변경.
- UI에는 "YYYY-MM-DD에 해지될 예정입니다"라는 문구 표시.

**Story 3.3: 결제 이력 확인**

- **As a** 유저, **I want to** 내 결제 내역과 영수증을 확인하고 싶다.
- **Acceptance Criteria:**
- 결제 날짜, 금액, 플랜명, 상태(성공/환불) 리스트 제공.
- PG사가 제공하는 영수증 URL 링크 제공.

---

### 💡 AI Agent를 위한 프롬프트 가이드 (Tip)

향후 개발을 시작할 때, AI에게 다음과 같이 지시하면 위 문서를 가장 효과적으로 활용할 수 있습니다.

> "위의 `Project Context`와 `Refined User Stories`를 바탕으로, 우선 **Database Schema(Prisma schema)**를 작성해 줘. 특히 Subscription 모델의 `cancel_at_period_end` 로직과 Resume의 `JSONB` 데이터 구조를 신경 써서 설계해 줘."

이 문서는 개발자가 바로 작업에 착수할 수 있는 수준의 **Implementation Guide**입니다.
