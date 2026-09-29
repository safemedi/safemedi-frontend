# safeMedi

Expo Router · React Native · Tamagui · TanStack Query · Zustand.

## Repository expectations

- PR·머지 전 `yarn lint`(Biome)와 `yarn test` 통과를 전제로 한다.
- 경로 별칭: `@/*` → 프로젝트 루트.
- `app/` — Expo Router 라우트만 (Screen re-export). 화면 로직은 `features/`에 둔다.
- `features/{domain}/{feature}/` — `{Feature}Screen.tsx`, `use{Feature}ViewModel.ts`, `components/`, `__tests__/`.
  - ViewModel은 `export interface {Feature}ViewModel`로 반환 shape을 명시한다. Screen은 ViewModel + presentational components 조합.
  - `view/` 같은 별도 레이어는 기본 구조로 강제하지 않는다.
  - 파일명은 `XxxScreen.tsx` 같은 placeholder가 아니라 기능 의미가 드러나는 이름을 사용한다 (예: `features/manage/medication-management`, `features/profile/edit`).
- API 레이어: `api/endpoints/`(순수 fetch) → `api/queries/`(`useQuery`/`useMutation`) → `api/query-keys.ts`(키 단일 정의) → `api/types/`.
  - Query hook은 `useSessionStore`로 `accessToken` 확인 후 `enabled: !!accessToken`, `staleTime` 등은 기존 도메인과 유사하게 설정.
- 서버 상태는 TanStack Query, 세션·전역 UI는 Zustand (`stores/`), 화면 로컬은 `useState` 우선 (필요 시만 lift).
- `api/mock/`은 테스트·로컬 전용. 프로덕션 경로에 연결하지 않는다.
- `.env`, 시크릿, `coverage/`, `node_modules/` 커밋 금지. 요청 범위 밖 대규모 리팩터링 지양.

### Commands

| 작업 | 명령어 |
|------|--------|
| 개발 서버 | `yarn dev` / `yarn start` |
| 린트 | `yarn lint` |
| 린트 자동 수정 | `yarn lint:fix` |
| 테스트 | `yarn test` |
| 커버리지 | `yarn test --coverage` (전역 60% threshold) |

---

## TypeScript & React 규칙

### 타입

- `strict` 준수. `any` 금지, 불확실하면 `unknown`.
- `@ts-ignore` / `@ts-expect-error` 무단 추가 금지.
- null/undefined 가능 값은 optional chaining·가드 등으로 명시적으로 처리.
- 객체 shape는 `interface`, union은 `type`.
- Props: `{ComponentName}Props` 인터페이스, `readonly` 선호.

### export

- 도메인 컴포넌트·hooks·utils: named export (`export function ProfileScreen`).
- `app/` 라우트 파일만 default export 허용 (Expo Router 요구).

### 컴포넌트

- PascalCase 컴포넌트명. 한 파일 = 한 주요 책임 (~150줄 이하 권장).
- UI 로직과 데이터 로직 분리: 복잡 화면은 `useXxxViewModel` hook으로 분리.
- 이벤트 핸들러: `handle` 접두사 (`handleSubmit`).
- boolean: `is` / `has` / `can` 접두사.

### 스타일·UI

- 색·타이포는 `@/constants/design-tokens`의 `palette` 등 사용. 임의 hex 남발 지양.
- 레이아웃: Tamagui(`YStack`, `XStack` 등) + 필요 시 `StyleSheet`.
- `@/` import로 절대 경로 사용.

### 포맷 (Biome)

- double quote, semicolon always, trailing commas, line width 100, indent 2 spaces.
- Biome이 잡는 포맷은 직접 지적·수정하지 않는다 (`yarn lint:fix`에 맡긴다).

### React 패턴

- `useEffect`로 파생 상태만 동기화하지 말고 `useMemo`·인라인 계산 우선.
- 리스트 `key`는 index 대신 안정 id 사용 (동적 목록).
- premature `useMemo`/`useCallback` 지양.

---

## 테스트

- 러너: Jest (`jest-expo`), `@testing-library/react-native`.
- 설명·it 이름: **한국어** (`"데이터가 없으면 기본값을 반환한다"`).
- co-locate: `__tests__/` 또는 `*.test.ts(x)`를 대상 코드 옆에 배치.

### ViewModel / hook 테스트

- `@/api/queries/*` 등은 `jest.mock`으로 격리.
- mock 반환 타입: `as unknown as ReturnType<typeof hook>` 패턴 사용 (기존 테스트와 동일).

### Screen 테스트

- 네비게이션·store·query는 mock 후 UI·상호작용·분기 검증.

### 커버리지

- `jest.config.js` global threshold 60% (lines, statements, functions, branches).
- mock-only 폴더(`api/mock/`) 등은 `collectCoverageFrom`에서 제외됨.

### 작성 원칙

- 의미 있는 동작만 검증. 구현 디테일·스냅샷 남용 지양.
- 사용자가 테스트 추가를 요청하지 않으면, 버그 수정 시 관련 최소 테스트만 추가.

---

## Review guidelines

**Quick 리뷰**: 커밋 단위 변경에 대해 **머지 전 반드시 잡아야 할 버그·아키텍처 위반·보안**만 지적한다. Biome/포맷·사소한 네이밍·취향 리팩터는 생략한다.

### 리뷰 실행 방식

로컬 diff·커밋·PR을 리뷰할 때는 `safemedi-reviewer` 서브에이전트 단독으로 끝내지 않는다. `safemedi-reviewer`와 Codex(`codex:codex-rescue` 에이전트 또는 `codex:rescue` 스킬)를 **병렬로 함께 호출**해 두 개의 독립적인 리뷰를 받고, 그 결과를 종합해서 보고한다. 어느 한쪽에서만 잡아낸 이슈도 누락하지 않고, 두 리뷰 결과가 상충하면 근거를 비교해 판단한다. PR 생성 직전 최종 점검처럼 리뷰가 필요한 모든 상황에 적용한다.

### Language

- 모든 리뷰 코멘트, 요약, 수정 제안은 한국어로 작성한다.
- 코드 식별자, 파일 경로, 커맨드, 에러 메시지는 원문(영문)을 유지한다. 설명만 한국어로 작성한다.
- 브랜치와 커밋은 gitflow 원칙을 준수하고, 커밋도 한국어 작성을 기본으로 한다. 커밋에 linear 티켓 이름을 붙이지 않는다.
- 브랜치는 linear에서 생성한 티켓명을 그대로 사용한다. ex) SAF-00
- **`dev`가 실질적인 개발 기준 브랜치.** feature 브랜치는 `dev`에서 분기 → 작업 후 `dev`로 PR·병합 → `dev`에서 통합 테스트 → `release` 브랜치 검증 → `main`(실서비스) 병합 순서를 따른다. `main`은 직접 push·머지 금지, PR로만 반영.
- PR base는 기본적으로 `dev`. `release` → `main` 승격 PR만 예외적으로 `main`을 base로 한다.
- 커밋 요청 시 직접 관여한 파일만을 대상으로 한다. 작업하지 않은 파일은 제외한다.
- PR을 생성할 때는 기본 assignee를 GitHub 인증 사용자(@me)로 설정한다.
- PR의 제목은 티켓명 괄호 뒤에 개발 내용을 작성한다. 다음과 같이 작성한다 ex) [SAF-00] feat: ~~ 
- PR작성 시 `.github/PULL_REQUEST_TEMPLATE.md`파일의 규칙을 따른다. 
- PR의 관련 이슈에는 Linear 티켓명을 포함하고, 해당 Linear 티켓에 연결된 GitHub issue가 존재하면 그 issue도 함께 기재한다.

### P0 / P1 — 반드시 지적 (blocking)

#### 보안·비밀

- `.env`, API 키, 토큰, 자격 증명이 diff에 포함되었는지
- 로그·에러 메시지에 PII·`accessToken` 노출 여부

#### 아키텍처 위반

- `app/` 라우트에 비즈니스 로직·복잡 UI·fetch 직접 호출 (라우트는 Screen re-export만)
- `api/queries` 없이 컴포넌트에서 직접 `fetch` / endpoint 호출
- 새 `useQuery`/`useMutation`인데 `api/query-keys.ts`에 키 미추가
- 인증 API 호출에 `enabled: !!accessToken` (`useSessionStore`) 누락
- `api/mock/`을 프로덕션 import 경로에 연결
- feature 구조 위반: `features/{feature}/`에 Screen·ViewModel 미배치

#### 타입·런타임

- `any` 사용, `@ts-ignore` / `@ts-expect-error` 무단 추가
- null/undefined 미처리로 크래시 가능 (optional chaining·가드 누락)
- 리스트 `key={index}` (동적 목록)

#### React / RN

- `useEffect`로 파생 상태만 동기화 (대신 `useMemo`·인라인 계산 권장)
- 인증 분기 시 `AuthGateView` / `useAuthRouteState` / session store 패턴과 불일치

### Suggestion — 중요하면 지적 (non-blocking)

- 복잡 Screen에 `use{Feature}ViewModel`·`{Feature}ViewModel` interface 없음
- ViewModel/Screen 테스트 없이 로직·분기만 크게 추가
- `@/constants/design-tokens` 대신 임의 hex 남발
- `package.json` 의존성·API 스키마 변경인데 부수 효과(마이그레이션·env) 언급 없음
- 무관한 대규모 리팩터가 기능 변경과 한 커밋에 섞임

### 지적하지 않음

- Biome이 잡는 포맷 (quote, semicolon, trailing comma, line width 100)
- `app/` 라우트의 **default export** (Expo Router 필수)
- 테스트·it 설명의 한국어 사용
- `coverage/`, `node_modules/` — 커밋 대상이면 그때만 blocking

### 변경 유형별 빠른 체크

| 변경 위치 | 확인 |
|-----------|------|
| `app/**` | 얇은 라우트만, `(tabs)` / `(detail)` / `(auth)` 그룹 유지 |
| `api/endpoints/**` | 순수 fetch, 부수 효과 최소 |
| `api/queries/**` | query key, `enabled`, `staleTime` 기존 도메인과 일관 |
| `api/types/**` | endpoint·hook과 타입 일치 |
| `features/**` | Screen + ViewModel + `components/` + `__tests__/` |
| `stores/**` | 세션·전역 UI만, 서버 상태는 Query |
| `components/ui/**` | 도메인 로직·API 호출 없음 |

### 리뷰 출력 형식

각 이슈마다:

1. **심각도**: P0 / P1 / suggestion
2. **파일·위치** (가능하면 줄 근처)
3. **문제** (한 문장)
4. **수정 방향** (패턴·경로 예시)

이슈가 없으면 짧게 **「blocking 이슈 없음」**만 보고한다.
