# 이메일 로그인 기능 테스트 가이드

## 사전 준비

### 1. Supabase Dashboard 설정

#### A. Email Templates 설정
1. Supabase Dashboard 접속
2. 프로젝트 선택
3. **Authentication** → **Email Templates** 이동

**Confirm your signup (이메일 인증)**
- Subject: 기본값 유지 또는 커스터마이징
- Redirect URL: `{{ .SiteURL }}/auth/callback`
- Body: 기본값 유지

**Reset your password (비밀번호 재설정)**
- Subject: 기본값 유지 또는 커스터마이징
- Redirect URL: `{{ .SiteURL }}/auth/reset-password`
- Body: 기본값 유지

#### B. URL Configuration
1. **Authentication** → **URL Configuration** 이동

**Site URL**
```
http://localhost:3000
```

**Redirect URLs** (다음 URL들을 추가)
```
http://localhost:3000/**
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
```

#### C. Email Auth Provider 활성화 확인
1. **Authentication** → **Providers** 이동
2. **Email** provider가 활성화되어 있는지 확인
3. **Confirm email** 옵션이 체크되어 있는지 확인

### 2. 로컬 환경 설정
```bash
# .env.local 파일에 다음 변수 확인
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# 개발 서버 실행
npm run dev
```

## 테스트 시나리오

### 시나리오 1: 회원가입 (Email Signup)

#### 단계
1. 브라우저에서 `http://localhost:3000` 접속
2. 우측 상단 "로그인" 버튼 클릭
3. 모달에서 "회원가입" 탭 클릭
4. 다음 정보 입력:
   - 이메일: `test@example.com`
   - 비밀번호: `<TEST_PASSWORD>`
   - 비밀번호 확인: `<TEST_PASSWORD>`
5. "회원가입" 버튼 클릭

#### 예상 결과
- ✅ 성공 메시지 표시: "인증 이메일을 확인해주세요. 이메일 인증 후 로그인할 수 있습니다."
- ✅ 입력 필드가 초기화됨
- ✅ 이메일이 발송됨

#### 이메일 확인
1. 이메일 수신함 확인
2. "Confirm your email" 제목의 이메일 열기
3. "Confirm your mail" 링크 클릭

#### 예상 결과
- ✅ `/auth/callback`으로 리다이렉트
- ✅ `/auth/setup-nickname` 페이지로 이동
- ✅ 닉네임 입력 폼 표시

#### 닉네임 설정
1. 원하는 닉네임 입력 (예: `testuser`)
2. "계속하기" 버튼 클릭

#### 예상 결과
- ✅ 홈 페이지로 리다이렉트
- ✅ 우측 상단에 닉네임과 프로필 메뉴 표시
- ✅ "로그인" 버튼이 사라짐

#### 데이터베이스 확인
Supabase Dashboard → Table Editor

**auth.users 테이블**
- ✅ 새 사용자 레코드 생성
- ✅ email: `test@example.com`
- ✅ email_confirmed_at: 현재 시간
- ✅ raw_app_meta_data.provider: `email`

**public.profiles 테이블**
- ✅ 프로필 레코드 자동 생성
- ✅ email: `test@example.com`
- ✅ nickname: `testuser` (설정한 닉네임)
- ✅ provider: `email` 또는 `local`
- ✅ user_type: `member`
- ✅ user_level: `1`

---

### 시나리오 2: 로그인 (Email Sign In)

#### 사전 조건
- 시나리오 1 완료 (회원가입 및 이메일 인증 완료)
- 로그아웃 상태

#### 단계
1. 우측 상단 프로필 메뉴 클릭
2. "로그아웃" 클릭
3. "로그인" 버튼 클릭
4. "로그인" 탭 선택 (기본값)
5. 다음 정보 입력:
   - 이메일: `test@example.com`
   - 비밀번호: `<TEST_PASSWORD>`
6. "로그인" 버튼 클릭

#### 예상 결과
- ✅ 모달이 닫힘
- ✅ 홈 페이지로 이동
- ✅ 우측 상단에 닉네임과 프로필 메뉴 표시
- ✅ 로그인 상태 유지

---

### 시나리오 3: 비밀번호 재설정 (Password Reset)

#### 단계
1. 로그아웃 상태에서 "로그인" 버튼 클릭
2. "비밀번호를 잊으셨나요?" 링크 클릭
3. 이메일 입력: `test@example.com`
4. "재설정 링크 보내기" 버튼 클릭

#### 예상 결과
- ✅ 성공 메시지 표시: "비밀번호 재설정 링크를 이메일로 보냈습니다. 이메일을 확인해주세요."
- ✅ 이메일 발송됨

#### 이메일 확인
1. 이메일 수신함 확인
2. "Reset your password" 제목의 이메일 열기
3. "Reset Password" 링크 클릭

#### 예상 결과
- ✅ `/auth/reset-password` 페이지로 이동
- ✅ 비밀번호 재설정 폼 표시

#### 비밀번호 재설정
1. 새 비밀번호 입력: `<NEW_TEST_PASSWORD>`
2. 비밀번호 확인: `<NEW_TEST_PASSWORD>`
3. "비밀번호 재설정" 버튼 클릭

#### 예상 결과
- ✅ 홈 페이지로 리다이렉트
- ✅ 로그인 상태 (자동 로그인)
- ✅ URL에 `?password_reset=success` 파라미터 포함

#### 새 비밀번호로 로그인 테스트
1. 로그아웃
2. 로그인 시도:
   - 이메일: `test@example.com`
   - 비밀번호: `<NEW_TEST_PASSWORD>`

#### 예상 결과
- ✅ 로그인 성공

---

## 에러 케이스 테스트

### 1. 잘못된 이메일 형식
**입력**: `notanemail`
**예상 결과**: ✅ "올바른 이메일 형식이 아닙니다." 에러 메시지

### 2. 비밀번호 길이 미달
**입력**:
- 이메일: `test@example.com`
- 비밀번호: `12345` (5자)

**예상 결과**: ✅ "비밀번호는 최소 6자 이상이어야 합니다." 에러 메시지

### 3. 비밀번호 불일치 (회원가입)
**입력**:
- 이메일: `test2@example.com`
- 비밀번호: `<TEST_PASSWORD>`
- 비밀번호 확인: `password456`

**예상 결과**: ✅ "비밀번호가 일치하지 않습니다." 에러 메시지

### 4. 이미 가입된 이메일
**입력**:
- 이메일: `test@example.com` (이미 가입됨)
- 비밀번호: `<TEST_PASSWORD>`

**예상 결과**: ✅ "이미 가입된 이메일입니다." 에러 메시지

### 5. 존재하지 않는 이메일로 로그인
**입력**:
- 이메일: `notexist@example.com`
- 비밀번호: `<TEST_PASSWORD>`

**예상 결과**: ✅ "이메일 또는 비밀번호가 올바르지 않습니다." 에러 메시지

### 6. 잘못된 비밀번호
**입력**:
- 이메일: `test@example.com`
- 비밀번호: `<WRONG_PASSWORD>`

**예상 결과**: ✅ "이메일 또는 비밀번호가 올바르지 않습니다." 에러 메시지

### 7. 이메일 미인증 상태에서 로그인
1. 새 계정 회원가입
2. 이메일 인증 링크 클릭하지 않음
3. 로그인 시도

**예상 결과**: ✅ "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요." 에러 메시지

---

## UI/UX 테스트

### 1. 모드 전환
- ✅ "로그인" ↔ "회원가입" 탭 전환 시 폼 내용 초기화
- ✅ 에러 메시지 초기화
- ✅ 성공 메시지 초기화

### 2. 로딩 상태
- ✅ 버튼 클릭 시 "처리 중..." 텍스트 표시
- ✅ 로딩 중 버튼 비활성화
- ✅ 로딩 중 입력 필드 비활성화

### 3. 비밀번호 재설정 모드
- ✅ "비밀번호를 잊으셨나요?" 클릭 시 재설정 폼으로 전환
- ✅ "로그인으로 돌아가기" 클릭 시 로그인 폼으로 복귀

### 4. 모달 닫기 동작
- ✅ 모달 외부 클릭 시 모달 닫힘
- ✅ ESC 키로 모달 닫힘
- ✅ 로그인 성공 시 자동으로 모달 닫힘

---

## 크로스 브라우저 테스트

### 테스트할 브라우저
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### 체크 항목
- [ ] 폼 입력 동작
- [ ] 버튼 클릭 동작
- [ ] 에러/성공 메시지 표시
- [ ] 리다이렉트 동작

---

## 모바일 테스트

### 테스트할 뷰포트
- [ ] iPhone (375px)
- [ ] Android (360px)
- [ ] Tablet (768px)

### 체크 항목
- [ ] 모달 크기 및 레이아웃
- [ ] 입력 필드 포커스 및 키보드 동작
- [ ] 버튼 클릭 영역
- [ ] 텍스트 가독성

---

## 성능 테스트

### 체크 항목
- [ ] 페이지 로드 시간
- [ ] 로그인 응답 시간
- [ ] 이메일 발송 시간
- [ ] 이메일 수신 시간 (보통 몇 초 이내)

---

## 보안 테스트

### 체크 항목
- [ ] 비밀번호 필드가 마스킹되는지 확인
- [ ] 비밀번호가 URL에 노출되지 않는지 확인
- [ ] 네트워크 요청에서 비밀번호가 암호화되는지 확인 (HTTPS)
- [ ] XSS 공격 방어 (입력값 sanitization)
- [ ] CSRF 공격 방어 (Supabase 자동 처리)

---

## 트러블슈팅

### 이메일이 오지 않는 경우
1. 스팸 폴더 확인
2. Supabase Dashboard → Logs 확인
3. Email provider 설정 확인
4. Site URL과 Redirect URLs 설정 확인

### 리다이렉트가 작동하지 않는 경우
1. `.env.local`에서 `NEXT_PUBLIC_SITE_URL` 확인
2. Supabase Dashboard에서 Redirect URLs 설정 확인
3. 브라우저 콘솔에서 에러 확인

### 로그인 후 닉네임이 표시되지 않는 경우
1. Supabase Dashboard → Table Editor → profiles 테이블 확인
2. `handle_new_user()` 트리거가 실행되었는지 확인
3. 브라우저 새로고침

---

## 테스트 완료 체크리스트

### 기본 기능
- [ ] 회원가입 성공
- [ ] 이메일 인증 성공
- [ ] 로그인 성공
- [ ] 로그아웃 성공
- [ ] 비밀번호 재설정 이메일 발송 성공
- [ ] 비밀번호 재설정 성공

### 에러 처리
- [ ] 모든 유효성 검사 에러 메시지 표시
- [ ] 네트워크 에러 처리
- [ ] Supabase 에러 처리

### UI/UX
- [ ] 모든 모드 전환 동작
- [ ] 로딩 상태 표시
- [ ] 모달 동작

### 데이터베이스
- [ ] 사용자 생성
- [ ] 프로필 자동 생성
- [ ] provider 필드 설정

---

## 프로덕션 배포 전 체크리스트

- [ ] `.env.local`을 `.env.production`으로 복사하고 production URL 설정
- [ ] Supabase Dashboard에서 production Site URL 설정
- [ ] Supabase Dashboard에서 production Redirect URLs 추가
- [ ] 커스텀 SMTP 설정 (선택사항)
- [ ] 이메일 템플릿 커스터마이징 (선택사항)
- [ ] HTTPS 설정 확인
- [ ] 에러 로깅 설정
