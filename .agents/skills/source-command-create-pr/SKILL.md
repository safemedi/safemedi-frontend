---
name: "source-command-create-pr"
description: "린트·테스트·분기 커버리지 체크 후 safeMedi PR 템플릿에 맞춰 PR 생성"
---

# source-command-create-pr

Use this skill when the user asks to run the migrated source command `create-pr`.

## Command Template

PR을 생성하기 전, 아래 순서를 하나도 건너뛰지 않고 실행한다.

## 0단계 — Base 브랜치 결정

가장 먼저 이번 PR의 base 브랜치를 정한다: 기본은 `dev`, `release` → `main` 승격 PR만 예외적으로 `main`. 이후 모든 단계(2단계 병렬 리뷰의 `git diff <base>...HEAD`, 4단계 PR 생성)는 여기서 정한 값을 그대로 사용하고 다시 묻지 않는다.

## 1단계 — 사전 체크 (`/pr-check`와 동일)

1. `git status` — uncommitted 변경이 없어야 한다. 있으면 커밋 여부를 사용자에게 확인한다 (자동 커밋 금지).
2. `yarn lint` 통과 확인.
3. `yarn test` 통과 확인.

하나라도 실패하면 여기서 중단하고 사용자에게 보고한다. PR을 생성하지 않는다.

## 2단계 - 병렬 리뷰

### 1. 병렬 리뷰 — 반드시 한 메시지에 두 Agent 호출을 함께 보낸다

두 리뷰는 서로 독립적이므로 같은 응답 안에서 병렬로 호출한다
(순서대로 하나씩 부르지 않는다). 둘 다 결과가 있어야 다음 단계로
진행할 수 있으므로 `run_in_background: false`로 호출한다.

**Claude 측 리뷰**

```
Agent({
  subagent_type: "safemedi-reviewer",
  description: "ChartGym PR 리뷰 (Claude)",
  run_in_background: false,
  prompt: "브랜치 `<현재 브랜치>`를 `<base>` 기준으로 리뷰해줘.
    `git diff <base>...HEAD`로 변경 내용을 확인하고, 위 지시(AGENTS.md/
    CLAUDE.md 컨벤션, Phase 범위, README 반영 여부)에 따라 검토한 뒤
    정해진 마크다운 형식으로만 답해줘."
})
```

**Codex 측 리뷰** — `codex:codex-rescue`는 `task`로만 전달하는 순수
포워더이므로, 리뷰 전용임을 프롬프트에 분명히 적어 Codex가 파일을
수정하지 않게 한다(포워더 규칙상 "review/diagnosis만 원한다"고 명시하면
`--write`를 붙이지 않는다).

```
Agent({
  subagent_type: "codex:codex-rescue",
  description: "ChartGym PR 리뷰 (Codex)",
  run_in_background: false,
  prompt: "Review-only request, do not modify any files. Review the diff
    between `<base>` and the current branch `<현재 브랜치>` in this repo
    (safemedi-frontend). Check for correctness/security bugs and any deviation
    from the conventions in AGENTS.md and CLAUDE.md (arrow-function-only
    ESLint rule, MarketDataProvider abstraction for market data, base-ui
    `render` prop pattern, Promise-based `params`/`searchParams`, Next.js
    16 `proxy.ts` convention, domestic candle color convention, Phase 1
    scope). Report findings as a list with file:line and severity
    (blocking vs note). This is diagnosis/review only — make no edits.
    Respond in Korean (한국어로 답변할 것) — AGENTS.md의 응답 언어 규칙."
})
```

### 2. 결과 종합

두 리뷰 결과를 모두 받은 뒤:

- 둘 중 하나라도 **blocking** 이슈를 보고했다면, PR을 만들지 않는다.
  두 리뷰 결과를 사용자에게 요약해서 보여주고 `AskUserQuestion`으로
  "지금 고치기 / 그래도 PR 생성 / 중단" 중 선택하게 한다. 사용자가
  "그래도 PR 생성"을 고르지 않는 한 여기서 멈춘다.
- blocking 이슈가 없으면(둘 다 PASS이거나 note만 있으면) 3단계로
  진행한다. note는 PR 본문에 참고로 남기되 진행을 막지 않는다.

## 3단계 — 커버리지 게이트 (분기 커버리지 80% 권장)

1. `yarn test --coverage`를 실행한다.
2. `coverage/coverage-summary.json`을 읽어 `total.branches.pct` 값을 확인한다.
   - 이 체크는 `jest.config.js`의 전역 60% 임계값(lines/statements/functions/branches)과는 별개로, PR 생성 직전에만 자체적으로 추가하는 80% 기준이다. jest 설정 자체는 건드리지 않는다.
3. `total.branches.pct`가 80 미만이면:
   - PR 생성을 막지는 않는다 (경고만).
   - 현재 분기 커버리지 수치를 사용자에게 알리고, 이대로 계속 진행할지 확인한다.
4. 80 이상이면 통과로 보고하고 다음 단계로 진행한다.

## 4단계 — PR 생성

1. 현재 브랜치가 `main`/`dev`가 아닌지 확인한다 (gitflow 규칙상 이 브랜치들에서 직접 작업 금지).
2. 원격에 브랜치가 push 되어 있는지 확인하고, 안 되어 있으면 push해도 되는지 사용자에게 확인 후 진행한다 (임의 force push 금지).
3. base 브랜치는 0단계에서 이미 결정한 브랜치를 그대로 사용한다 (여기서 다시 정하지 않는다).
4. `git log`/`git diff <base>...HEAD`로 이번 브랜치의 전체 커밋을 파악해 제목과 본문 초안을 작성한다:
   - 제목: `[SAF-00] type: 작업 내용` 형식 — 실제 Linear 티켓명이 있으면 사용자에게 확인한다.
   - 본문: `.github/PULL_REQUEST_TEMPLATE.md`의 섹션(🎟️ 관련 이슈 / 🔥 작업 배경 / 🛠️ 작업 내용 / 🧪 테스트 / 💬 기타 논의 사항 / ✅ 셀프 체크리스트)을 실제 내용으로 채운다. 빈 placeholder로 남기지 않는다.
5. `gh pr create`로 생성한다. assignee는 `@me`, base는 위에서 정한 브랜치.
6. 생성된 PR URL을 사용자에게 전달한다.

## 금지 사항

- `--no-verify`, hook 우회, force push 금지.
- 1단계·2단계·3단계 결과를 조용히 넘기지 않는다 — 매 단계 결과를 사용자에게 보고한다.
- 2단계(병렬 코드 리뷰)를 생략하고 곧바로 PR을 생성하지 않는다.
- 관련 없는 파일 변경을 커밋·PR에 포함시키지 않는다.
