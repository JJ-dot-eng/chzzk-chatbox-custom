# HANDOFF

- 날짜: 2026-10-31
- 작성자: 치지직 챗박스 담당/Codex
- 브랜치: `auto/2026-10-31-chzzk-first-pass` (PR → `master`, 병합은 사용자 결정)
- 상태: 이번 작업 완료. 진행 중인 작업 없음.

## 완료한 항목

1. 글자색 자동 보정이 사용자 지정 글자색/닉네임 색 채팅에 가려 적용되지 않던 문제 수정 (`content.css`).
2. 랜덤 닉네임을 꺼도 설정창에 "별명 방식" 영역이 계속 보이던 문제 수정 (`popup.css`).
3. 저장된 색상 값이 `constructor` 같은 특수 문자열이면 색상 정규화가 오류로 멈추던 문제 수정 (`background.js`, `content-options.js`, `popup.js`).
4. 위 3건의 회귀 테스트 추가 (`tests/extension-regressions.test.cjs`). 새 테스트는 수정 전 코드에서 실패하고 수정 후 통과함을 확인.
5. `AGENTS.md`, `HANDOFF.md` 신규 작성.

검증: `node tools/validate-extension.mjs` 통과, 모든 JS `node --check` 통과, JSON 파싱 통과, `git diff --check` 통과,
`EDGE_PATH=/usr/bin/google-chrome node --test tests/extension-regressions.test.cjs` 48/48 통과(Linux, Chrome 사용).
실제 치지직 방송 페이지에서의 수동 확인은 하지 않음.

## 남은 항목 (발견했지만 고치지 않은 것)

- [중간] 나만 보는 채팅이 켜진 상태에서 헤더의 미니 채팅 버튼을 누르면, 설정창은 "미니 채팅"으로 표시하지만 실제로는 나만 보는 채팅이 표시됨. `popup.js:485`(`getChatMode`)의 우선순위가 실제 렌더링과 다름. 관련: `content-guest-chat.js:1961`.
- [중간] 미니 채팅창이 열려 있을 때 프리셋 불러오기 등으로 저장된 위치·크기가 바뀌어도 열린 창에 반영되지 않음. `content-mini-chat.js:1054`. 드래그 중 충돌 처리 필요해 위험도 중간.
- [낮음] 색상 선택기에서 회색(채도 0) 상태로 색조 슬라이더를 움직이면 선택한 색조가 0(빨강)으로 초기화됨. `popup.js:1267`, `popup.js:1305`.
- [낮음] `tools/validate-extension.mjs:248`은 `content_scripts`의 첫 항목만 검사하고 추가 항목은 확인하지 않음.
- [낮음] `package.json:7,9`의 `check`/`package` 스크립트가 `npm.cmd`를 사용해 Windows 외 환경에서는 `npm run check`가 실패함(테스트는 직접 실행하면 동작).
- 버전 번호(`0.8.3`)와 `docs/project/project-after-direction.md` 패치 기록은 이번에 바꾸지 않음. 릴리즈 시 갱신 필요.

## 사용자 결정 사항

- 소통·문서는 한국어.
- 작업은 새 브랜치에서만 하고 push 후 `master`로 PR을 연다. `master` 직접 push, 병합, 강제 push 금지.
- 한 번에 한 AI만 작업.
- 비밀·env·자격증명 파일은 열지 않음.
- AI 임시 파일만 `.git/info/exclude`에 추가.
- 관련 변경만, 검증 통과 및 diff가 깨끗할 때만 커밋.
- 작업 종료 시 `HANDOFF.md`를 덮어씀.
- (기존 README 기준) 현재는 Chrome/Edge 버전만 개발·배포하고 Firefox 버전은 당분간 중단.
