# 치지직 채팅 UI 설정

치지직 채팅창의 표시 방식을 내 브라우저 화면에서만 조정하는 Chrome/Edge 확장프로그램입니다.

이 확장프로그램은 네이버 또는 치지직의 공식 앱이 아니며, 네이버/치지직과 제휴되거나 승인된 도구가 아닙니다.

## 기능

- 닉네임 표시 on/off
- 닉네임 앞 배지 표시 on/off
- `hh:mm` 타임스탬프 표시 on/off
- 채팅별 둥근 박스 표시 on/off
- 큰 글씨 on/off
- 굵게 on/off
- 채팅 박스 색상 선택 및 HEX 코드 입력
- 채팅 헤더 버튼 또는 확장 팝업으로 비로그인 채팅창 실험 토글
- 채팅 헤더 설정 버튼으로 기존 확장 팝업 열기
- 비로그인 채팅창 테마를 현재 라이브 페이지 테마에 맞춰 조정
- 비로그인 채팅창에서 클린봇 표시 필터를 기본 비활성 상태로 시작
- 설정을 브라우저 로컬 확장 저장소와 페이지 로컬 캐시에 저장

이 확장프로그램은 치지직 서버, 실제 채팅 데이터, 메시지 삭제/차단/moderation 동작을 변경하지 않습니다.

## 개발 설치

### Chrome

1. `chrome://extensions`를 엽니다.
2. 개발자 모드를 켭니다.
3. `압축해제된 확장 프로그램을 로드`를 누릅니다.
4. 이 프로젝트 폴더를 선택합니다.

### Edge

1. `edge://extensions`를 엽니다.
2. 개발자 모드를 켭니다.
3. `압축 풀린 항목 로드`를 누릅니다.
4. 이 프로젝트 폴더를 선택합니다.

## 검증

```powershell
npm run check
```

## 아이콘 생성

```powershell
npm run icons
```

`icons/icon-16.png`, `icons/icon-32.png`, `icons/icon-48.png`, `icons/icon-128.png`가 생성됩니다.

## 배포 패키지 생성

```powershell
npm run package
```

제출용 zip은 `dist/chzzk-chat-ui-settings-<version>.zip`에 생성됩니다.

## 스토어 등록 참고

- 등록 문구 초안: `docs/store-listing.md`
- 개인정보 처리방침 초안: `docs/privacy-policy.md`
- 스크린샷은 zip에 넣지 않고 Chrome Web Store 또는 Microsoft Edge Add-ons 등록 화면에 별도로 업로드합니다.
