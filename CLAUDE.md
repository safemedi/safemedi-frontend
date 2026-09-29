@AGENTS.md 파일 참조

# safeMedi

Expo Router · React Native · Tamagui · TanStack Query · Zustand.

이 문서는 `.cursor/rules/*.mdc`에 흩어져 있던 규칙을 하나로 합친 Claude Code용 프로젝트 메모리입니다. 내용을 바꿀 때는 [AGENTS.md](AGENTS.md) (Codex 등 다른 에이전트가 참조)도 함께 갱신하세요.

## 명령어

| 작업 | 명령어 |
|------|--------|
| 개발 서버 | `yarn dev` / `yarn start` |
| 린트 | `yarn lint` (Biome) |
| 린트 자동 수정 | `yarn lint:fix` |
| 테스트 | `yarn test` |
| 커버리지 | `yarn test --coverage` (전역 60% threshold) |

PR·머지 전 `yarn lint`와 `yarn test` 통과를 전제로 한다.

## 디렉터리 구조

- `app/` — Expo Router 라우트만 (Screen re-export). 화면 로직은 `features/`에 둔다.
- `features/{domain}/{feature}/` — 도메인별 feature UI. 표준 구조는 아래 참고.
- `components/ui/` — 도메인 무관 공용 UI (도메인 로직·API 호출 없음).
- `api/endpoints/` — fetch 함수 (순수, 부수 효과 최소).
- `api/queries/` — TanStack Query hooks.
- `api/types/` — API 요청·응답 타입.
- `api/query-keys.ts` — query key 단일 정의.
- `api/mock/` — 테스트·로컬 전용. **프로덕션 import 경로에 연결 금지.**
- `stores/` — Zustand (session, user 등 전역 UI/세션 상태).
- `hooks/` — 공용 hooks.
- `constants/` — design-tokens, api-config 등.

API 레이어는 `api/endpoints/` → `api/queries/` → `api/query-keys.ts` → `api/types/` 흐름을 따른다.
서버 상태는 TanStack Query, 세션·전역 UI는 Zustand로 관리한다.

### 경로 별칭

`@/*` → 프로젝트 루트 (`tsconfig` paths).

## 아키텍처

### 라우팅 (`app/`)

라우트 파일은 얇게 유지한다.

```tsx
// app/(tabs)/dashboard.tsx — 패턴 예시
import { DashboardScreen } from "@/features/dashboard/home/DashboardScreen";

export default function DashboardTabRoute() {
  return <DashboardScreen />;
}
```

- `(tabs)` / `(detail)` / `(auth)` 그룹 구조 유지.
- 인증 분기: `AuthGateView`, `useAuthRouteState`, session store 패턴 따르기.

### API 레이어

1. `api/endpoints/{domain}.ts` — HTTP/fetch, 순수 함수
2. `api/queries/{domain}.ts` — `useQuery` / `useMutation` hooks
3. `queryKeys` — 새 쿼리마다 `api/query-keys.ts`에 키 추가
4. `api/types/` — 응답·요청 타입

Query hook 패턴:

- `useSessionStore`로 `accessToken` 확인 후 `enabled: !!accessToken`
- `staleTime` 등 기존 도메인과 유사하게 설정

### ViewModel

- `use{Feature}ViewModel.ts` — 화면용 파생 데이터·상태 조합
- `export interface {Feature}ViewModel`로 반환 shape 명시
- Screen은 ViewModel + presentational components 조합

### feature 폴더

```
features/{domain}/{feature}/
  {Feature}Screen.tsx
  use{Feature}ViewModel.ts
  components/
  __tests__/
```

- `view/` 같은 별도 레이어는 기본 구조로 강제하지 않는다.
- 파일명은 `XxxScreen.tsx` 같은 placeholder가 아니라 기능 의미가 드러나는 이름 사용.
- 예: `features/manage/medication-management`, `features/profile/edit`.

### 상태 관리

- 서버 상태: TanStack Query
- 세션·전역 UI: Zustand (`stores/`)
- 화면 로컬: `useState` 우선, 필요 시만 lift

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

## Git & PR

### 브랜치

- **`dev`가 실질적인 개발 기준 브랜치.** 신규 feature 브랜치는 `dev`에서 분기하고, 작업 후 `dev`로 PR을 올린다.
- **`main`은 실서비스(production) 브랜치.** 직접 push·머지 금지, PR로만 반영한다.
- 흐름: `dev`에서 feature 브랜치 분기 → 작업 → `dev`로 PR·병합 → `dev`에서 통합 테스트 → `release` 브랜치에서 검증 → `main`으로 병합.
- `main`/`dev`에서 직접 작업하지 않는다. feature 브랜치에서 작업 후 PR.
- 브랜치는 Linear에서 생성한 티켓명을 그대로 사용한다. 예: `SAF-00`.

### 커밋

- gitflow 원칙 준수, 커밋 메시지는 한국어로 작성.
- 커밋에 Linear 티켓 이름을 붙이지 않는다.
- 커밋 요청 시 직접 관여한 파일만 대상으로 한다. 작업하지 않은 파일은 제외.
- 반드시 커밋은 항상 축약형으로 작성. 장문 서술은 하지 않는다.

### PR

- PR base는 기본적으로 `dev`. `release` → `main` 승격 PR만 예외적으로 `main`을 base로 한다.
- 제목: 티켓명 뒤에 개발 내용. 예: `[SAF-00] feat: 개발 내용`.
- 기본 assignee는 GitHub 인증 사용자(`@me`)로 설정.
- `.github/PULL_REQUEST_TEMPLATE.md`의 섹션을 반드시 채운다: 🎟️ 관련 이슈 / 🔥 작업 배경 / 🛠️ 작업 내용 / 🧪 테스트 / 💬 기타 논의 사항 / ✅ 셀프 체크리스트.
- 관련 이슈에는 Linear 티켓명을 포함하고, 해당 Linear 티켓에 연결된 GitHub issue가 존재하면 그 issue도 함께 기재한다.
- 변경은 **기능 단위** 하나에 가깝게. 무관한 리팩터링 혼합 지양.
- Changes는 파일 나열이 아니라 **기능적 변경** 위주로 작성.
- `package.json` 의존성, env, API 스키마 변경 시 부수 효과를 PR 본문에 명시.

### PR 생성 전 체크 (수동·에이전트 공통)

1. `git status` — uncommitted 변경 없을 것.
2. `yarn lint` 통과.
3. `yarn test` 통과.

테스트·린트 실패 시 PR 생성·머지를 제안하지 않는다. `--no-verify` 등 훅 우회 금지.

### CI

- `main` 또는 `dev`로의 PR 생성·업데이트(opened/reopened/synchronize) 시 coverage 워크플로 실행 (`.github/workflows/coverage.yml`).

## 코드 리뷰 가이드라인 (`/code-review` 등)

Quick 리뷰는 커밋 단위 변경에 대해 **머지 전 반드시 잡아야 할 버그·아키텍처 위반·보안**만 지적한다. Biome/포맷·사소한 네이밍·취향 리팩터는 생략한다.

### 리뷰 실행 방식

로컬 diff·커밋·PR을 리뷰할 때는 `safemedi-reviewer` 서브에이전트 단독으로 끝내지 않는다. `safemedi-reviewer`와 Codex(`codex:codex-rescue` 에이전트 또는 `codex:rescue` 스킬)를 **병렬로 함께 호출**해 두 개의 독립적인 리뷰를 받고, 그 결과를 종합해서 보고한다. 어느 한쪽에서만 잡아낸 이슈도 누락하지 않고, 두 리뷰 결과가 상충하면 근거를 비교해 판단한다. PR 생성 직전 최종 점검처럼 리뷰가 필요한 모든 상황에 적용한다.

### P0 / P1 — 반드시 지적 (blocking)

**보안·비밀**
- `.env`, API 키, 토큰, 자격 증명이 diff에 포함되었는지.
- 로그·에러 메시지에 PII·`accessToken` 노출 여부.

**아키텍처 위반**
- `app/` 라우트에 비즈니스 로직·복잡 UI·fetch 직접 호출 (라우트는 Screen re-export만).
- `api/queries` 없이 컴포넌트에서 직접 `fetch` / endpoint 호출.
- 새 `useQuery`/`useMutation`인데 `api/query-keys.ts`에 키 미추가.
- 인증 API 호출에 `enabled: !!accessToken` (`useSessionStore`) 누락.
- `api/mock/`을 프로덕션 import 경로에 연결.
- feature 구조 위반: `features/{feature}/`에 Screen·ViewModel 미배치.

**타입·런타임**
- `any` 사용, `@ts-ignore` / `@ts-expect-error` 무단 추가.
- null/undefined 미처리로 크래시 가능 (optional chaining·가드 누락).
- 리스트 `key={index}` (동적 목록).

**React / RN**
- `useEffect`로 파생 상태만 동기화 (대신 `useMemo`·인라인 계산 권장).
- 인증 분기 시 `AuthGateView` / `useAuthRouteState` / session store 패턴과 불일치.

### Suggestion — 중요하면 지적 (non-blocking)

- 복잡 Screen에 `use{Feature}ViewModel`·`{Feature}ViewModel` interface 없음.
- ViewModel/Screen 테스트 없이 로직·분기만 크게 추가.
- `@/constants/design-tokens` 대신 임의 hex 남발.
- `package.json` 의존성·API 스키마 변경인데 부수 효과(마이그레이션·env) 언급 없음.
- 무관한 대규모 리팩터가 기능 변경과 한 커밋에 섞임.

### 지적하지 않음

- Biome이 잡는 포맷 (quote, semicolon, trailing comma, line width 100).
- `app/` 라우트의 **default export** (Expo Router 필수).
- 테스트·it 설명의 한국어 사용.
- `coverage/`, `node_modules/` — 커밋 대상이면 그때만 blocking.

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

## 언어

- 기본 응답, 작업 설명, 리뷰 코멘트, 요약, 수정 제안은 **한국어**로 작성한다.
- 코드 식별자, 파일 경로, 커맨드, 에러 메시지는 원문(영문) 그대로 유지한다.
- 설명 문장만 한국어로 작성하고, 코드 블록/심볼 표기는 번역하지 않는다.

## 금지 사항

- `.env`, 시크릿, 토큰, 자격 증명 커밋 금지.
- `coverage/`, `node_modules/` 수정·커밋 금지.
- 요청 범위 밖의 대규모 리팩터링 금지.
