---
description: safeMedi feature 폴더 표준 구조(Screen + ViewModel + components + __tests__) 스캐폴딩
argument-hint: [domain]/[feature-name] (예: manage/medication-management)
---

인자로 받은 `$ARGUMENTS`를 `{domain}/{feature-name}` 형식으로 해석해 `features/{domain}/{feature-name}/` 아래에 CLAUDE.md 표준 구조를 생성한다.

인자가 없거나 형식이 불명확하면 실행 전에 사용자에게 domain과 feature 이름을 확인한다.

## 생성 규칙

- `feature-name`은 kebab-case 그대로 디렉터리명으로 쓰고, 컴포넌트/파일명은 PascalCase로 변환한다 (예: `medication-management` → `MedicationManagement`).
- placeholder 이름(`XxxScreen.tsx`)을 쓰지 말고, 실제 기능 의미가 드러나는 이름을 사용한다. 사용자가 애매한 이름을 주면 더 구체적인 이름을 제안하고 확인받는다.
- 이미 같은 경로에 폴더가 존재하면 덮어쓰지 말고 사용자에게 알린다.

## 생성 파일

1. `{Feature}Screen.tsx`
   - named export (`export function {Feature}Screen`)
   - `use{Feature}ViewModel` 호출 + presentational 컴포넌트 조합 형태의 최소 스켈레톤
   - Tamagui `YStack`/`XStack` 사용, `@/` 절대경로 import

2. `use{Feature}ViewModel.ts`
   - `export interface {Feature}ViewModel { ... }`로 반환 shape 명시
   - `export function use{Feature}ViewModel(): {Feature}ViewModel` 스켈레톤. 실제 로직은 비워두고 최소한의 반환값만 채운다.

3. `components/` — 사용자가 특정 하위 컴포넌트를 요청했으면 그걸 생성하고, 없으면 빈 디렉터리가 git에 잡히도록 `.gitkeep`만 넣는다.

4. `__tests__/{Feature}Screen.test.tsx` — 렌더 스모크 테스트 1개만 스켈레톤으로 작성. `describe`/`it` 설명은 한국어, `@testing-library/react-native` 사용. 필요 이상으로 케이스를 늘리지 않는다.

## 준수 사항

- `strict` 타입, `any` 금지.
- Props가 필요하면 `{ComponentName}Props` interface.
- Biome 포맷(quote, semicolon, trailing comma)은 신경 쓰지 않는다 — 이후 `yarn lint:fix`로 정리된다.
- `app/` 라우트 파일 생성은 이 커맨드의 범위가 아니다. 라우트 연결이 필요하면 생성 후 어느 그룹(`(tabs)`/`(detail)`/`(auth)`)에 연결할지 사용자에게 확인한다.

## 완료 후

생성된 파일 목록을 나열하고, 라우트 연결이나 `api/endpoints`/`api/queries` 연동이 추가로 필요한지 물어본다.
