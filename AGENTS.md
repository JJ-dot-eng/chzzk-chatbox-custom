# AGENTS.md — AI 작업자 안내

이 문서는 이 저장소에서 작업하는 AI(코딩 에이전트)를 위한 규칙과 안내입니다.

## 저장소 구조

- `manifest.json` — Chrome/Edge MV3 확장 매니페스트(단일 배포 기준). Firefox 버전은 당분간 중단.
- `background.js` — 서비스 워커. 옵션 저장/정규화, 랜덤 닉네임 할당(`chrome.storage.session`), 나만 보는 채팅 테마 중계.
- `content-*.js`, `content.css` — 치지직 페이지에 주입되는 콘텐츠 스크립트. 로드 순서는 `manifest.json`의 `content_scripts[0].js` 순서를 따른다.
  - `content-bootstrap.js` 공통 상수·기본값 / `content-options.js` 옵션 정규화 / `content-theme.js` 테마 감지
  - `content-core.js` 공통 DOM 처리 / `content-audio.js` 오디오 개선 / `content-mini-chat.js` 미니 채팅창
  - `content-guest-chat.js` 나만 보는 채팅 / `content-chat-annotate.js` 채팅 행 표시(닉네임·색상·대비) / `content-runtime.js` 초기화
- `popup.html`, `popup.js`, `popup.css` — 확장 설정창.
- `tests/extension-regressions.test.cjs` — playwright-core 기반 회귀 테스트(브라우저 필요).
- `tools/` — 매니페스트 검증(`validate-extension.mjs`), 실기기 확인(`verify-live-edge.cjs`), 패키징·아이콘 PowerShell 스크립트.
- `docs/` — 스토어 문구, 개인정보 처리방침, 프로젝트 방향 문서(`docs/project/`).

참고: 옵션 정규화 로직(`normalizeOptions`, `normalizeHexColor` 등)은 `background.js`, `content-options.js`, `popup.js` 세 곳에 중복되어 있으므로 하나를 고치면 셋 모두 함께 고친다.

## 검증 방법

```bash
npm ci --ignore-scripts
node tools/validate-extension.mjs
for f in $(git ls-files '*.js' '*.cjs' '*.mjs'); do node --check "$f"; done
# Edge가 없으면 Chromium 계열 브라우저 경로를 EDGE_PATH로 지정
EDGE_PATH=/usr/bin/google-chrome node --test tests/extension-regressions.test.cjs
```

`npm run check`로 같은 검증을 한 번에 실행할 수 있다(Windows·macOS·Linux 모두 동작). 패키징(`npm run package`)은 PowerShell이 필요하다(Windows는 `powershell`, 다른 OS는 `pwsh`).
모든 검증이 통과한 경우에만 커밋한다.

## 공통 규칙

- 사용자와의 소통, 커밋 메시지, PR 설명은 한국어로 작성한다.
- 작업은 항상 새 브랜치에서 하고, 그 브랜치를 push한 뒤 `master`로 PR을 연다.
- `master`에 직접 push, 병합(merge), 강제 push(force push)는 하지 않는다.
- 한 브랜치·worktree에는 한 AI만 작업한다. 서로 다른 worktree(각자 별도 브랜치)라면 여러 AI가 병렬로 작업해도 된다. 같은 파일을 동시에 고치지 않도록 그로기가 작업을 나눈다. 작업 전 열린 PR·최근 브랜치·`HANDOFF.md`를 확인해 같은 브랜치·worktree에서 다른 AI가 작업 중이면 멈춘다.
- 병렬 하위 작업 중인 AI는 `HANDOFF.md`를 고치지 않고 결과(목표·바꾼 파일·상태·실패 원인·남은 일)를 그로기에게 보고하며, `HANDOFF.md`는 통합할 때 그로기가 한 번 갱신한다.
- 비밀값·env·자격증명 파일은 열지 않는다.
- AI 임시 파일만 `.git/info/exclude`에 추가한다.
- 관련 변경만, 검증 통과 후, `git status`가 깨끗할 때만 커밋한다.
- 작업을 마치면 `HANDOFF.md`를 덮어써서 완료 항목, 남은 항목, 사용자 결정 사항을 기록한다.
