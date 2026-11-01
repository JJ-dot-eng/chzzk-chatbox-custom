# HANDOFF

- 날짜: 2026-11-01
- 작성자: 치지직 챗박스 담당/Codex
- 브랜치: `fix/devtools-validate-crossos` (PR → `master`, 병합은 사용자 결정)
- 상태: 이번 작업 완료. 진행 중인 작업 없음.

## 완료한 항목

1. `tools/validate-extension.mjs`가 `manifest.json`의 `content_scripts` 첫 항목만 검사하던 문제 수정.
   - 검사 로직을 `tools/lib/manifest-content-scripts.mjs`의 `validateContentScripts()`로 분리해 테스트에서 바로 불러 쓸 수 있게 함.
   - 모든 항목에 대해 객체 여부, `matches`(비어 있지 않고 `https://chzzk.naver.com/` 범위), `js`/`css` 경로(상대 경로·실제 파일 존재), js·css 중 하나 이상, `run_at` 값, `all_frames` 형식을 검사. 오류 메시지에 항목 번호를 표시(예: `content_scripts[1].js file not found: x.js`).
   - 첫 항목의 기존 엄격한 조건(matches, document_start, all_frames, content.css, JS 로드 순서)은 그대로 유지.
   - CLI 동작(`node tools/validate-extension.mjs`, 성공 메시지, 실패 시 종료 코드 1)은 그대로.
2. `package.json`의 `check`/`package` 스크립트가 `npm.cmd`를 써서 Windows 외 환경에서 실패하던 문제 수정.
   - `check`는 `npm test`를 호출(Windows에서도 npm 스크립트는 cmd.exe로 실행되어 그대로 동작). 이제 Linux/macOS에서도 `npm run check`가 동작.
   - `package`는 `npm run check && node tools/run-powershell.mjs tools/package-extension.ps1`. Windows에서는 `powershell`, 그 외에는 `pwsh`를 실행하고, PowerShell이 없으면 "패키징에는 PowerShell이 필요하다"는 한국어 안내와 함께 실패 코드 1로 종료.
   - 검증 스크립트가 `npm.cmd`를 요구하던 단언을 새 형태로 바꾸고, 어떤 스크립트에도 `npm.cmd`가 없어야 한다는 단언 추가.
   - `README.md` 빌드·검증 설명 갱신.
3. 브라우저 없이 도는 도구 테스트 `tests/tooling.test.mjs` 33개 추가, `npm test`에 포함. 두 번째 항목의 JS/CSS 파일 누락 등은 임시 fixture 폴더로 실패를 확인.

검증(Linux, Chrome 사용): `npm ci --ignore-scripts`, `node tools/validate-extension.mjs`, 모든 JS `node --check`, `git diff --check` 통과.
`EDGE_PATH=/usr/bin/google-chrome node --test tests/extension-regressions.test.cjs` 50/50, `node --test tests/tooling.test.mjs` 33/33,
`EDGE_PATH=/usr/bin/google-chrome npm run check` 83/83 통과. Linux에서 `npm run package`는 검증 후 PowerShell 필요 안내로 종료됨을 확인(pwsh 미설치).
수정 전 검증 스크립트는 두 번째 항목에 없는 파일이 있어도 통과했고, 수정 후에는 실패함을 확인.

## 남은 항목 (발견했지만 고치지 않은 것)

- [낮음] 색상 선택기에서 회색(채도 0) 상태로 색조 슬라이더를 움직이면 선택한 색조가 0(빨강)으로 초기화됨. `popup.js`의 `applyColorPickerValue`/`updateColorPickerUi`.
- [낮음] `AGENTS.md`의 "Windows에서는 `npm run check`(내부에서 `npm.cmd` 사용)" 문구가 이제 맞지 않음(모든 OS에서 동작). AGENTS.md는 수정 금지라 그대로 둠 — 사용자 확인 후 갱신 필요.
- [낮음] `icons` 스크립트는 여전히 `powershell`을 직접 호출해 Windows 전용. 필요하면 같은 실행기(`tools/run-powershell.mjs`)로 바꿀 수 있음.
- [낮음] 회귀 테스트(`tests/extension-regressions.test.cjs`)는 여전히 `content_scripts[0]`만 불러와 테스트함. 지금 매니페스트는 항목이 하나뿐이라 문제 없음.
- `docs/project/*.md` 작업 기록에는 예전 `npm.cmd run ...` 명령이 남아 있음(기록 문서라 수정하지 않음).
- 0.8.4 이후 수정(PR #5 포함)은 아직 버전 번호를 올리지 않음. 릴리즈할 때 버전 표기와 패치 기록 갱신 필요.

## 사용자 결정 사항

- 소통·문서는 한국어.
- 작업은 새 브랜치에서만 하고 push 후 `master`로 PR을 연다. `master` 직접 push, 병합, 강제 push 금지.
- 한 번에 한 AI만 작업.
- 비밀·env·자격증명 파일은 열지 않음.
- AI 임시 파일만 `.git/info/exclude`에 추가.
- 관련 변경만, 검증 통과 및 diff가 깨끗할 때만 커밋.
- 작업 종료 시 `HANDOFF.md`를 덮어씀.
- 커밋은 커밋별로 `JJ` 신원을 지정하고 `Co-authored-by: Codex` trailer를 붙임.
- `AGENTS.md`는 수정하지 않음.
- (기존 README 기준) 현재는 Chrome/Edge 버전만 개발·배포하고 Firefox 버전은 당분간 중단.
