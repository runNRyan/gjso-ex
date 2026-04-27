# 기술 스택

## 설치된 기술

### Core
- **Next.js 16.1.1** (App Router)
- **React 19.2.3**
- **TypeScript 5**

### Styling
- **Tailwind CSS v4**
- **shadcn/ui** (components 설치 가능)
  - `pnpm dlx shadcn@latest add button` 형식으로 컴포넌트 추가

### State Management
- **Zustand 5.0.10** - 클라이언트 전역 상태 관리
- **TanStack Query 5.90.19** - 서버 상태 관리 및 데이터 페칭

### UI Utilities
- **class-variance-authority** - 컴포넌트 variants
- **clsx** - 조건부 클래스명
- **tailwind-merge** - Tailwind 클래스 병합
- **lucide-react** - 아이콘 라이브러리

## 디렉토리 구조

```
app/                  # Next.js App Router 페이지
components/           # React 컴포넌트
  ui/                # shadcn/ui 컴포넌트
lib/                 # 유틸리티 함수
  utils.ts          # cn() 함수
  query-provider.tsx # TanStack Query Provider
store/               # Zustand 스토어
hooks/               # 커스텀 훅
```

## 사용 예시

### 1. Zustand (클라이언트 상태)

```tsx
"use client"

import { useExampleStore } from "@/store/example-store"

export function Counter() {
  const { count, increment, decrement } = useExampleStore()

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}
```

### 2. TanStack Query (서버 데이터)

```tsx
"use client"

import { useQuery } from "@tanstack/react-query"

export function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      return res.json()
    },
  })

  if (isLoading) return <div>Loading...</div>

  return <div>{/* render users */}</div>
}
```

### 3. shadcn/ui 컴포넌트 추가

```bash
# 컴포넌트 설치
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input

# 사용
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
```

### 4. Server Components (기본값)

```tsx
// app/page.tsx
async function getData() {
  const res = await fetch("https://api.example.com/data", {
    cache: "force-cache", // Next.js 캐싱
  })
  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{/* render data */}</div>
}
```

## 권장 패턴

### 서버 vs 클라이언트 데이터 페칭

**서버 컴포넌트 (권장):**
- 초기 페이지 로드 데이터
- SEO가 중요한 데이터
- 민감한 API 키 사용

**TanStack Query (클라이언트):**
- 사용자 인터랙션으로 인한 데이터 페칭
- 실시간 업데이트가 필요한 데이터
- Optimistic updates

### 상태 관리 기준

**Zustand:**
- UI 상태 (모달, 사이드바 열림/닫힘)
- 전역 클라이언트 상태 (테마, 언어)
- 폼 상태

**TanStack Query:**
- 서버 데이터 캐싱
- 백그라운드 리페칭
- 낙관적 업데이트

**React State:**
- 지역 컴포넌트 상태
- 폼 입력

## Vercel Best Practices 적용

이 프로젝트는 Vercel의 React/Next.js 모범 사례를 따릅니다:

- ✅ Server Components 우선
- ✅ 병렬 데이터 페칭
- ✅ 번들 사이즈 최적화
- ✅ 클라이언트 상태 최소화
- ✅ TanStack Query로 중복 요청 제거

자세한 내용은 `/vercel-react-best-practices` 스킬 참조.
