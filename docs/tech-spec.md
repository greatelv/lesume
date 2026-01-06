제안하신 PRD와 유저 스토리, 그리고 이전 대화에서 논의된 **수정 사항(구독 유예, 에러 핸들링, 분할 편집)**을 모두 반영한 **Lesume 최종 기술 명세서(Technical Specification)**입니다.

개발팀(혹은 미래의 본인)이 바로 개발에 착수할 수 있도록 **Database Schema**, **State Flow**, **Business Logic**을 엔지니어링 리더의 관점에서 정리했습니다.

---

# 📘 Lesume Technical Specification (v1.0.Final)

## 1. 개요 (Overview)

- **Product Name:** 레스유메 (Lesume)
- **Description:** 한국어 이력서(PDF)를 업로드하면 AI(Gemini Pro)를 통해 **요약(Summarization) → 번역(Translation) → 포맷팅(Formatting)** 과정을 거쳐 영문 이력서로 변환해 주는 Micro SaaS.
- **Target:** 글로벌 취업을 희망하거나 급하게 영문 이력서가 필요한 한국인 구직자.

## 2. 기술 스택 (Tech Stack)

- **Frontend & Backend:** Next.js 15 (App Router), TypeScript
- **Database:** PostgreSQL (Supabase or Neon)
- **ORM:** Prisma
- **AI Engine:** Google Gemini Pro API
- **Auth:** Auth.js (NextAuth) v5 - Kakao Provider
- **Storage:** AWS S3 compatible (Supabase Storage or Cloudflare R2) - PDF 원본 및 결과물 저장
- **Payment:** PortOne or Tosspayments (Billing Key 방식)

---

## 3. 데이터베이스 설계 (Database Schema)

구독 상태 관리의 정합성과 이력서 데이터의 다국어 병기(Side-by-Side) 편집을 지원하기 위한 최종 스키마입니다.

### 3.1 Users & Auth

사용자 기본 정보 및 영문 이력서 헤더에 들어갈 프로필 정보를 관리합니다.

| Table     | Column          | Type     | Description                |
| --------- | --------------- | -------- | -------------------------- |
| **Users** | `id`            | UUID     | PK                         |
|           | `email`         | String   | Unique Email               |
|           | `name`          | String   | 사용자 이름                |
|           | `provider`      | String   | 'kakao'                    |
|           | `provider_id`   | String   | OAuth Sub ID               |
|           | `phone_number`  | String   | 이력서용 연락처 (Optional) |
|           | `linkedin_url`  | String   | 이력서 헤더용 (Optional)   |
|           | `portfolio_url` | String   | 이력서 헤더용 (Optional)   |
|           | `created_at`    | DateTime | 가입일                     |

3.2 Subscription & Billing

"해지 시 당월 유지, 익월 해지" 정책을 위한 필드를 포함합니다.

| Table             | Column                     | Type     | Description                               |
| ----------------- | -------------------------- | -------- | ----------------------------------------- |
| **Plans**         | `code`                     | String   | PK ('FREE', 'STANDARD', 'PRO')            |
|                   | `monthly_quota`            | Int      | 월 제공 크레딧 (2, 6, 20)                 |
|                   | `max_resumes`              | Int      | 동시 보관 가능 이력서 수                  |
| **Subscriptions** | `id`                       | UUID     | PK                                        |
|                   | `user_id`                  | UUID     | FK (Users)                                |
|                   | `plan_code`                | String   | FK (Plans)                                |
|                   | `status`                   | Enum     | 'ACTIVE', 'PAST_DUE', 'CANCELED'          |
|                   | `current_period_start`     | DateTime | 현재 결제 주기 시작일                     |
|                   | **`current_period_end`**   | DateTime | **권한 만료 예정일**                      |
|                   | **`cancel_at_period_end`** | Boolean  | **해지 예약 여부 (True면 만료일에 해지)** |
|                   | `billing_key`              | String   | 정기 결제용 빌링키                        |

3.3 Resume Core (State Machine)

작업 흐름과 에러 추적을 위한 테이블입니다.

| Table       | Column                | Type     | Description                                     |
| ----------- | --------------------- | -------- | ----------------------------------------------- |
| **Resumes** | `id`                  | UUID     | PK                                              |
|             | `user_id`             | UUID     | FK (Users)                                      |
|             | `title`               | String   | 프로젝트명                                      |
|             | `original_file_url`   | String   | 업로드된 PDF 경로                               |
|             | `target_role`         | String   | 지원 희망 직무 (프롬프트 튜닝용)                |
|             | `status`              | Enum     | 'IDLE', 'PROCESSING', 'COMPLETED', **'FAILED'** |
|             | **`failure_message`** | String   | **AI 처리 실패 사유 (User Feedback용)**         |
|             | `current_step`        | Enum     | 'UPLOAD', 'SUMMARY', 'TRANSLATE', 'DONE'        |
|             | `is_one_click`        | Boolean  | 딸깍 전환(Batch Process) 여부                   |
|             | `selected_template`   | Enum     | 'MODERN', 'CLASSIC', 'MINIMAL'                  |
|             | `updated_at`          | DateTime | 최종 수정일                                     |

3.4 Resume Details (Data)

한글(Source)과 영문(Target)을 1:1로 매핑하여 Split View 편집을 지원합니다.

| Table               | Column                | Type   | Description                                |
| ------------------- | --------------------- | ------ | ------------------------------------------ |
| **WorkExperiences** | `id`                  | UUID   | PK                                         |
|                     | `resume_id`           | UUID   | FK                                         |
|                     | `company_name_kr`     | String | 회사명 (한글)                              |
|                     | **`company_name_en`** | String | **회사명 (영문 번역)**                     |
|                     | `role_kr`             | String | 직무 (한글)                                |
|                     | **`role_en`**         | String | **직무 (영문 번역)**                       |
|                     | `start_date`          | String | YYYY.MM                                    |
|                     | `end_date`            | String | YYYY.MM or Present                         |
|                     | `bullets_kr`          | JSONB  | `["성과1", "성과2"]` (한글 원본/수정본)    |
|                     | **`bullets_en`**      | JSONB  | **`["Result1", "Result2"]` (영문 번역본)** |
|                     | `order`               | Int    | 정렬 순서                                  |

---

## 4. 핵심 비즈니스 로직 (Core Business Logic)

4.1 작업 흐름 및 상태 관리 (Workflow)

유저는 각 단계(`current_step`)에 따라 UI가 라우팅되며, 이전 단계로 돌아가 데이터를 수정할 수 있습니다.

1. **UPLOAD:** PDF 업로드 → 텍스트 추출 → `Resumes` 생성 (Status: IDLE).
2. **SUMMARY (요약):**

- Input: 추출된 Raw Text.
- Process: LLM이 경력별 핵심 성과 3~4줄 요약.
- Output: `WorkExperiences` 테이블에 `bullets_kr` Insert.
- _Quota:_ 1 차감.

3. **TRANSLATE (번역):**

- Input: `WorkExperiences`의 `bullets_kr` (유저가 수정했을 수 있음).
- Process: LLM이 영문 번역 (Action Verbs 위주).
- Output: `WorkExperiences` 테이블에 `bullets_en` Update.
- _Quota:_ 1 차감.

4. **DONE:** 템플릿 선택 및 PDF 렌더링.

> One-Click Feature (딸깍 전환):
> 요청 시 `is_one_click=true` 설정 후, Server Worker(Queue)가 **SUMMARY → TRANSLATE** 과정을 연속으로 수행. 중간 실패 시 `status='FAILED'`, `failure_message` 기록 후 중단.

4.2 구독 및 쿼타 정책 (Subscription Policy)

- **쿼타 차감:** `UsageLogs` 테이블에 기록(`INSERT`)하는 방식으로 처리하여 무결성 보장.
- 잔여 쿼타 = `Plan.monthly_quota` - `Count(UsageLogs where current_month)`.

- **해지 로직 (Grace Period):**
- 유저가 해지 요청 시: `cancel_at_period_end` = `true`로 설정. (서비스 이용 가능)
- Daily Batch Job: `current_period_end` < `Now()` AND `cancel_at_period_end` is `true` 인 구독을 찾아 `status` = 'CANCELED'로 변경 및 권한 박탈.

---

## 5. API 설계 가이드 (Server Actions/Route Handlers)

Next.js App Router 사용을 가정합니다.

| Method     | Endpoint                       | Description                                            |
| ---------- | ------------------------------ | ------------------------------------------------------ |
| **POST**   | `/api/resumes/upload`          | PDF 업로드 및 텍스트 파싱, Resume 생성                 |
| **POST**   | `/api/resumes/{id}/summarize`  | **[AI]** 한글 요약 생성 (Quota 차감)                   |
| **PUT**    | `/api/resumes/{id}/experience` | 유저의 한글/영문 데이터 수동 수정 저장                 |
| **POST**   | `/api/resumes/{id}/translate`  | **[AI]** 확정된 한글 내용을 영문으로 번역 (Quota 차감) |
| **POST**   | `/api/resumes/{id}/one-click`  | **[AI]** 요약+번역 일괄 수행 (2 Quota 차감)            |
| **GET**    | `/api/resumes/{id}/preview`    | 선택된 템플릿으로 PDF Preview 생성                     |
| **POST**   | `/api/billing/subscription`    | 구독 생성 및 변경                                      |
| **DELETE** | `/api/billing/subscription`    | 구독 해지 예약 (`cancel_at_period_end = true`)         |

---

## 6. 개발 우선순위 (Implementation Phases)

1. **Phase 1 (Core MVP):**

- 회원가입/로그인 (Kakao).
- PDF 텍스트 추출 + Gemini API 연동 (기본 프롬프트).
- 기본 이력서 CRUD 및 상태 저장.
- 무료 플랜(하드코딩된 Quota) 적용.

2. **Phase 2 (Payment & Polish):**

- PG사 연동 및 구독 테이블 로직 구현.
- 이력서 템플릿 3종 디자인 및 PDF 생성기(React-PDF 등) 구현.
- 분할 뷰(Split View) UI 고도화.

3. **Phase 3 (Optimization):**

- SEO 최적화 (랜딩 페이지).
- One-Click 기능 안정화 (Queue 적용 고려).

이 문서는 **2026년 1월 5일 기준**의 요구사항을 반영하고 있습니다. 프로젝트 폴더의 `docs/tech_spec.md` 등에 보관하시고 개발을 진행하시기 바랍니다.
