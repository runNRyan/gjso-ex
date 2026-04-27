# portfolio-sample — Source code sample of 결정소 (example.com)

A frontend code sample repository of **결정소 (example.com)**, a live balance-game community service.
Prepared for portfolio submission; production data, credentials, and internal planning docs have been removed.

> 한국어 버전은 아래 [한국어](#한국어) 섹션을 참고하세요.

## Service overview

A social decision-making platform where users vote on "A vs B" binary questions and **predict** which side the majority will choose, competing on accuracy and points.

- **Vote + Prediction dual-layer**: Beyond your own pick, a meta-game of guessing where the crowd will land
- **Guest mode**: Non-logged-in users can vote and predict via localStorage; activity is migrated on sign-up
- **Worldcup mode**: Tournament UX for clearing many questions in a single session
- **Realtime result dashboard**: Accuracy rings, trend charts, rankings
- **Admin**: Question CRUD, worldcup round management, feed publish-state toggling

## Tech stack

| Area | Stack |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, RSC) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Radix UI, Framer Motion |
| State | Zustand (client), TanStack Query v5 (server state / cache) |
| Backend | Supabase (Postgres + RLS, Auth, Storage), Resend (transactional email) |
| Deploy | Vercel |
| Etc | TypeScript 5, recharts, html2canvas, OG image route |

## Directory layout

```
app/              App Router routes (public pages + /admin + /api)
  api/            REST endpoints (guest migration, bookmarks, worldcup results, OG, etc.)
  worldcup/       Tournament flow (game / result / OG image)
  results/        Personal & aggregated result dashboards
components/       Reusable UI + domain components (results/, worldcup/, mypage/, auth/)
hooks/            Data-fetching & domain-logic hooks (use-vote, use-prediction, use-results, etc.)
lib/              Supabase client, auth, admin utils, worldcup engine
store/            Zustand stores (guest activity, sign-in modal state)
scripts/          Seed scripts (local only)
```

## Notable implementation points

- **Guest → Member migration** (`app/api/migrate-guest/`, `components/guest-migration-provider.tsx`)
  - Atomically migrates localStorage guest activity at sign-up; blocks re-migration for existing members
- **Prediction accuracy pipeline** (`hooks/use-results.ts`, `components/results/`)
  - Vote/prediction aggregates cached via TanStack Query, alongside server-side aggregation API and hydration
- **Dynamic OG image for worldcup** (`app/worldcup/opengraph-image.tsx`, `app/api/og/route.tsx`)
  - Share-only images with per-result metadata branching
- **Dual data path — RLS + Server Actions**: Public reads go through RLS-protected client queries; writes are server-mediated
- **Accessibility / mobile-first UX**: Bottom navigation, swipe gestures, sheet modals (`guest-cta-sheet`, `swipe-view`)

## Local development

```bash
pnpm install
pnpm dev   # http://localhost:61234
```

`.env.local` is not committed. Supabase / Resend keys are required — please request via personal contact if you need access.

## License

Portfolio viewing repository. Source reuse or redistribution is not permitted.

---

## 한국어

실제 운영 중인 밸런스 게임 기반 커뮤니티 서비스 **결정소(example.com)** 의 프런트엔드 코드 샘플 저장소입니다.
포트폴리오 제출용으로, 운영 데이터·민감 설정·내부 기획 문서는 모두 제거했습니다.

### 서비스 개요

"A vs B" 양자택일 질문에 투표하고, 다른 사람이 어떤 쪽을 고를지 **예측**하여 정확도·포인트를 경쟁하는 소셜 의사결정 플랫폼입니다.

- **투표 + 예측 이원 구조**: 내 선택 외에 "다수가 어디로 갈까"를 맞히는 메타 게임
- **게스트 모드**: 비로그인도 localStorage 기반으로 투표·예측 가능, 회원가입 시 이관
- **월드컵 모드**: 토너먼트 UX로 한 세션에 다수 질문 소화
- **실시간 결과 대시보드**: 정확도 링·추세 차트·랭킹
- **어드민**: 질문 CRUD, 월드컵 라운드 관리, 피드 게시 상태 전환

### 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, RSC) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Radix UI, Framer Motion |
| 상태 | Zustand (클라이언트), TanStack Query v5 (서버 상태/캐시) |
| 백엔드 | Supabase (Postgres + RLS, Auth, Storage), Resend (트랜잭셔널 메일) |
| 배포 | Vercel |
| 기타 | TypeScript 5, recharts, html2canvas, OG 이미지 라우트 |

### 디렉토리 구조

```
app/              App Router 라우트 (공개 페이지 + /admin + /api)
  api/            REST 엔드포인트 (게스트 이관, 북마크, 월드컵 결과, OG 등)
  worldcup/       토너먼트 플로우 (게임/결과/OG 이미지)
  results/        개인·전체 결과 대시보드
components/       재사용 UI + 도메인 컴포넌트 (results/, worldcup/, mypage/, auth/)
hooks/            데이터 페칭·도메인 로직 훅 (use-vote, use-prediction, use-results 등)
lib/              Supabase 클라이언트, 인증, 어드민 유틸, 월드컵 엔진
store/            Zustand 스토어 (게스트 활동, 로그인 모달 상태)
scripts/          시드 스크립트 (로컬 전용)
```

### 주목할 만한 구현 포인트

- **게스트 → 회원 이관** (`app/api/migrate-guest/`, `components/guest-migration-provider.tsx`)
  - localStorage 게스트 활동을 회원가입 시점에 원자적으로 이관, 기존 회원 재이관 차단
- **예측 정확도 파이프라인** (`hooks/use-results.ts`, `components/results/`)
  - 투표/예측 집계를 TanStack Query로 캐싱하고 서버 집계 API와 hydration 병행
- **월드컵 OG 이미지 동적 생성** (`app/worldcup/opengraph-image.tsx`, `app/api/og/route.tsx`)
  - 공유 전용 이미지, 결과별 메타데이터 분기
- **RLS + Server Action 이원 데이터 경로**: 공개 조회는 RLS로 보호된 클라이언트 쿼리, 쓰기는 서버 경유
- **접근성/모바일 우선 UX**: 바텀 네비, 스와이프 제스처, 시트 모달 (`guest-cta-sheet`, `swipe-view`)

### 로컬 실행

```bash
pnpm install
pnpm dev   # http://localhost:61234
```

`.env.local` 은 저장소에 포함되어 있지 않습니다. Supabase/Resend 키가 필요하며 열람 시 개인 연락으로 요청해 주세요.

### 라이선스

포트폴리오 열람용 저장소로, 소스 재사용·재배포는 허용되지 않습니다.
