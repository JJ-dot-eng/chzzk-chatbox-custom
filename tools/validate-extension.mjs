import { access, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(source, token, message) {
  assert(source.includes(token), `${message}: ${token}`);
}

function assertExcludes(source, token, message) {
  assert(!source.includes(token), `${message}: ${token}`);
}

function getDefaultOptionContract(source, declaration, label, globals = {}) {
  const start = source.indexOf(declaration);
  assert(start >= 0, `${label} must declare DEFAULT_OPTIONS.`);
  const end = source.indexOf("\n};", start);
  assert(end > start, `${label} DEFAULT_OPTIONS must have a closing brace.`);
  const keys = source
    .slice(start, end)
    .split(/\r?\n/)
    .map((line) => line.match(/^  ([A-Za-z][A-Za-z0-9_]*):/u)?.[1] ?? null)
    .filter(Boolean);
  const context = vm.createContext({ ...globals });

  vm.runInContext(
    `${source.slice(0, end + 3)}\nglobalThis.__defaultOptions = DEFAULT_OPTIONS;`,
    context,
    { filename: `${label}-default-options.js` }
  );

  return {
    keys,
    values: JSON.parse(JSON.stringify(context.__defaultOptions))
  };
}

const manifest = await readJson("manifest.json");
const packageJson = await readJson("package.json");
const packageLock = await readJson("package-lock.json");
const contentScriptFiles = [
  "content-bootstrap.js",
  "content-options.js",
  "content-theme.js",
  "content-core.js",
  "content-mini-chat.js",
  "content-guest-chat.js",
  "content-chat-annotate.js",
  "content-runtime.js"
];
const backgroundSource = await readText("background.js");
const contentSources = await Promise.all(contentScriptFiles.map((file) => readText(file)));
const contentSource = contentSources.join("\n");
const contentCssSource = await readText("content.css");
const popupMarkup = await readText("popup.html");
const popupStyles = await readText("popup.css");
const popupSource = await readText("popup.js");
const readmeSource = await readText("README.md");
const projectDirectionSource = await readText(path.join("docs", "project", "project-direction.md"));
const projectAfterDirectionSource = await readText(path.join("docs", "project", "project-after-direction.md"));
const liveVerifySource = await readText(path.join("tools", "verify-live-edge.cjs"));
const packageScriptSource = await readText(path.join("tools", "package-extension.ps1"));
const regressionTestSource = await readText(path.join("tests", "extension-regressions.test.cjs"));
const normalizedContentSource = contentSource.replace(/\r\n/g, "\n");
const contentSurface = `${contentSource}\n${contentCssSource}`;
const localOnlyChatStart = contentSource.indexOf("function hasLocalOnlyChatCredentiallessFrameMarker()");
const localOnlyChatEnd = contentSource.indexOf("function isDonationRankingPanel", localOnlyChatStart);
const localOnlyChatSource =
  localOnlyChatStart >= 0 && localOnlyChatEnd > localOnlyChatStart
    ? contentSource.slice(localOnlyChatStart, localOnlyChatEnd)
    : "";

const requiredRootFiles = [
  "manifest.json",
  "background.js",
  ...contentScriptFiles,
  "content.css",
  "popup.html",
  "popup.css",
  "popup.js",
  "README.md"
];

for (const file of requiredRootFiles) {
  await access(path.join(root, file));
}

for (const size of ["16", "32", "48", "128"]) {
  const expectedPath = `icons/icon-${size}.png`;

  assert(manifest.icons?.[size] === expectedPath, `manifest icon ${size} must point to ${expectedPath}.`);
  assert(manifest.action?.default_icon?.[size] === expectedPath, `action icon ${size} must point to ${expectedPath}.`);
  await access(path.join(root, expectedPath));
}

assert(manifest.manifest_version === 3, "manifest_version must be 3.");
assert(manifest.name === "치지직 채팅 커스텀", "manifest name must be 치지직 채팅 커스텀.");
assert(manifest.short_name === "채팅 커스텀", "manifest short_name must be 채팅 커스텀.");
assert(manifest.version === packageJson.version, "manifest and package versions must match.");
assert(
  packageLock.version === manifest.version && packageLock.packages?.[""]?.version === manifest.version,
  "package-lock root versions must match manifest version."
);
const manifestVersionParts = manifest.version.split(".");
assert(
  manifestVersionParts.length >= 1 &&
    manifestVersionParts.length <= 4 &&
    manifestVersionParts.every(
      (part) => /^(0|[1-9][0-9]*)$/u.test(part) && Number(part) <= 65535
    ) &&
    manifestVersionParts.some((part) => Number(part) !== 0),
  "manifest version must follow Chrome's one-to-four integer component rules."
);
assertIncludes(contentSource, `var SCRIPT_VERSION = "${manifest.version}";`, "content script version must match manifest version");
assertIncludes(popupSource, `const CONTENT_VERSION = "${manifest.version}";`, "popup content version must match manifest version");
assertIncludes(
  projectDirectionSource,
  `현재 확장 버전: \`${manifest.version}\``,
  "project direction version must match manifest version"
);
assertIncludes(
  projectAfterDirectionSource,
  `현재 확장 버전: \`${manifest.version}\``,
  "project after direction version must match manifest version"
);

const defaultOptionContracts = [
  [backgroundSource, "const DEFAULT_OPTIONS = {", "background"],
  [contentSource, "var DEFAULT_OPTIONS = {", "content"],
  [popupSource, "const DEFAULT_OPTIONS = {", "popup"]
].map(([source, declaration, label]) => ({
  label,
  ...getDefaultOptionContract(
    source,
    declaration,
    label,
    label === "content" ? { window: {} } : {}
  )
}));
const canonicalDefaultOptionKeys = defaultOptionContracts[0].keys;
const canonicalDefaultOptionValues = defaultOptionContracts[0].values;

for (const contract of defaultOptionContracts.slice(1)) {
  assert(
    JSON.stringify(contract.keys) === JSON.stringify(canonicalDefaultOptionKeys),
    `${contract.label} DEFAULT_OPTIONS keys/order must match background DEFAULT_OPTIONS.`
  );
  assert(
    JSON.stringify(contract.values) === JSON.stringify(canonicalDefaultOptionValues),
    `${contract.label} DEFAULT_OPTIONS values must match background DEFAULT_OPTIONS.`
  );
}

const emptyNumericValueGuard =
  'if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {';

for (const [source, label] of [
  [backgroundSource, "background"],
  [contentSource, "content"],
  [popupSource, "popup"]
]) {
  assert(
    source.split(emptyNumericValueGuard).length - 1 >= 2,
    `${label} clamp and coordinate normalization must both preserve null/blank fallbacks.`
  );
  assertIncludes(source, "function normalizeOptionalCoordinate(value)", `${label} must normalize optional coordinates`);
}

assert(
  packageJson.scripts?.package?.startsWith("npm.cmd run check && "),
  "package script must run the complete check before creating release artifacts."
);
assert(
  packageJson.scripts?.test === "node --test tests/extension-regressions.test.cjs" &&
    packageJson.scripts?.check?.endsWith("&& npm.cmd test"),
  "check must run the Edge-backed regression test suite."
);
for (const token of [
  'createChatDocument("12:34")',
  'nativeTimestamp: "09:41"',
  "sameNode: generated === window.__generatedTimestampBefore",
  "__generatedTimestampBeforeReuse",
  'panel.id = "sports-panel"',
  "storageSetDelays: [80, 5]",
  "storageEventsAfterCallbacks: true",
  "assert.deepEqual(result.requestedScales, [110, 120]);",
  "nickname prefix annotation must be restored",
  "팝업 닉네임 크기 저장 직후 미니 채팅을 조작해도 새 설정을 덮어쓰지 않는다",
  "외부 설정으로 rebase한 미니 저장이 실패해도 최신 닉네임 설정은 유지된다",
  "새 storage 변경 뒤 늦게 끝난 초기 읽기는 닉네임 설정을 되돌리지 않는다",
  "실제 background FIFO는 미니 patch 뒤 팝업 patch를 병합해 둘 다 보존한다",
  "게스트 채팅 저장 응답이 늦어도 저장된 최신 상태를 되돌리지 않는다",
  "늦은 게스트 채팅 READ 응답이 더 최신 storage 변경을 덮지 않는다",
  "나만 보기 전환 버튼은 기본·나만 보기 채팅의 전송 버튼 바로 왼쪽에만 표시된다",
  "나만 보는 채팅은 원본 수신 행을 보존하고 사이트 전송 경로 없이 같은 로그에만 추가한다",
  "나만 보는 채팅은 Enter·버튼·submit을 로컬 처리하고 IME·Shift+Enter를 구분한다",
  "나만 보는 채팅은 실제 Edge IME 조합 뒤 첫 Enter 한 번만 로컬 처리한다",
  "나만 보는 채팅은 실제 수신 행을 건드리지 않고 로컬 100개만 유지하며 새로고침 시 비운다",
  "나만 보는 입력 가로채기는 최상위 페이지와 미니 채팅 프레임에 연결되지 않는다",
  "늦은 미니 채팅 성공 응답이 더 최신 storage 변경을 덮지 않는다",
  "완료된 미니 patch는 뒤의 대기 patch에 다시 섞이지 않는다",
  "미니 버블 복원 저장이 미확정 timeout이어도 다시 최소화하지 않는다",
  "style presets preserve every chat window selection",
  "custom preset save and load exclude chat window settings",
  "legacy custom preset chat window values cannot replace the current selection",
  "optionsUpdateResponseDelays: [900]",
  "vm.runInContext(source, context"
]) {
  assertIncludes(regressionTestSource, token, "regression tests must cover timestamp and mini-chat races");
}
for (const token of [
  "function Assert-ChromeManifestVersion",
  "$repoPrefix = $resolvedRepo + [System.IO.Path]::DirectorySeparatorChar",
  "$resolvedPath -ne $resolvedRepo",
  "-not $resolvedPath.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)"
]) {
  assertIncludes(packageScriptSource, token, "package script must validate versions and directory boundaries");
}

assert(manifest.action?.default_popup === "popup.html", "default popup must point to popup.html.");
assert(manifest.background?.service_worker === "background.js", "background service worker must point to background.js.");
assert(Array.isArray(manifest.permissions), "manifest permissions must be an array.");
assert(manifest.permissions.length === 1 && manifest.permissions[0] === "storage", "only storage permission should remain.");
assert(
  Array.isArray(manifest.host_permissions) &&
    manifest.host_permissions.length === 1 &&
    manifest.host_permissions[0] === "https://chzzk.naver.com/*",
  "host permissions must be limited to https://chzzk.naver.com/*."
);

const contentScript = manifest.content_scripts?.[0];
assert(contentScript, "manifest must declare one content script entry.");
assert(
  Array.isArray(contentScript.matches) &&
    contentScript.matches.length === 1 &&
    contentScript.matches[0] === "https://chzzk.naver.com/*",
  "content script matches must be limited to https://chzzk.naver.com/*."
);
assert(contentScript.run_at === "document_start", "content script must run at document_start to avoid raw chat flashes.");
assert(contentScript.all_frames === true, "content script should run in all CHZZK frames.");
assert(
  Array.isArray(contentScript.css) &&
    contentScript.css.length === 1 &&
    contentScript.css[0] === "content.css",
  "content script CSS must load content.css."
);
assert(
  !manifest.web_accessible_resources,
  "local-only chat must not expose a separate extension page or nested composer."
);
assert(
  Array.isArray(contentScript.js) &&
    contentScript.js.length === contentScriptFiles.length &&
    contentScript.js.every((file, index) => file === contentScriptFiles[index]),
  "content script JS files must load in the expected module order."
);

for (const token of [
  "activeTab",
  "chrome.scripting",
  "executeScript",
  "chrome.webNavigation",
  "webNavigation",
  "chrome.tabs.onUpdated",
  "CONTENT_SCRIPT_FILE",
  "scheduleContentScriptInjection",
  "pushStoredOptionsToTab"
]) {
  assertExcludes(`${JSON.stringify(manifest)}\n${backgroundSource}\n${popupSource}`, token, "review-friendly build must not keep dynamic reinjection code");
}

for (const token of [
  'const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";',
  'const UPDATE_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_UPDATE_OPTIONS";',
  'const OPEN_POPUP_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_POPUP";',
  'const READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";',
  'const SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";',
  'const APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";',
  "chrome.runtime.onMessage.addListener",
  "chrome.action.openPopup()",
  "chrome.storage.local.get(STORAGE_KEY",
  "function queueStoredOptionsUpdate(message)",
  "optionsUpdateQueue.then(() => getStoredOptions(sendResponse));",
  "chrome.tabs.sendMessage("
]) {
  assertIncludes(backgroundSource, token, "background script must keep storage, popup, and guest-theme message support");
}

for (const token of [
  'var NATIVE_CHAT_ROW_SELECTOR = `:is([class*="live_chatting_list_item" i], [role="log"] [class*="_item_" i]):has(:is([class*="live_chatting_message_container" i], [class*="_chatting_message_" i]))`;',
  'var CHAT_ROW_SCOPE_SELECTOR = `:is([class*="live_chatting_list_item" i], [role="log"] [class*="_item_" i])[${CHAT_ROW_ATTR}="true"]`;',
  "function readOptionsFromBackground()",
  "Promise.all([\n    readOptionsFromStorageLocal(),\n    readOptionsFromBackground()\n  ])",
  "connectMessages();",
  "connectStorageListener();",
  "function syncGuestChatFrame()",
  "function syncMiniFloatingChatPanel()",
  "function cleanupUnscopedAnnotations",
  "function scanRows(rows, { contentMutated = false, contentMutatedRows = null } = {})",
  "observer = new MutationObserver",
  "characterData: true",
  "function collectChangedChatRows(mutations)",
  "function collectChangedChatRowDetails(mutations)",
  "function isTimestampCandidate(row, element)",
  "function hasNonGeneratedAddedNodesOutsideChatRows(mutations)",
  "return Boolean(element && (!closestRow || !isChatMessageRow(closestRow)));",
  "var largeTextLayoutRows = new Set();",
  "scheduleLargeTextLayoutSync(uniqueRows);",
  "function removeGeneratedTimestampWhenNativeExists(row)",
  "function isMiniChatInputFieldInChatContext(field)",
  "var chatRowAnnotationSnapshots = new WeakMap();",
  "var miniChatOptionsWriteQueue = [];",
  "function drainMiniChatOptionsWriteQueue()",
  "function reapplyPendingMiniChatOptionsAfterStorageChange(storedOptions)",
  "function getQueuedMiniChatOptionsPatch()",
  "miniChatOptionsCommittedState = normalizeOptions(storedOptions);",
  "reapplyPendingMiniChatOptionsAfterStorageChange(changes[STORAGE_KEY].newValue);",
  "function writeOptionsPatchToStorageLocal(patch)",
  "function doOptionsMatchPatch(options, patch)",
  "const reconcileWithLatestOptions = async (fallbackResult)",
  "authoritative: true",
  "stateRevisionAtStart !== optionsStateRevision",
  "optionsStateRevision !== item.stateRevisionAtStart",
  "composer-toggle-reconciled-error",
  "if (!result.ok && !result.uncertain)",
  "const baseOptions = miniChatOptionsOptimisticState || currentOptions;"
]) {
  assertIncludes(normalizedContentSource, token, "content script must keep core chat and option wiring");
}

for (const token of [
  "function findGuestChatComposerToggleTarget()",
  "const canRenderHeaderButtons = isGuestChatFrameEligibleContext();",
  "const canRenderGuestChatToggle = canRenderHeaderButtons || isLocalOnlyChatContext();",
  "const localOnlySendButton = isLocalOnlyChatContext() ? getLocalOnlyChatSendButton() : null;",
  "guestButton.nextSibling !== composerTarget.before",
  "composerTarget.container.insertBefore(guestButton, composerTarget.before);"
]) {
  assertIncludes(contentSource, token, "guest toggle must stay beside the active composer send button");
}
for (const token of [
  "margin: 0 8px 0 auto !important;",
  '[data-chzzk-chat-ui-toggle-local-only-send-button="true"]',
  'button[class*="send_button" i]'
]) {
  assertIncludes(contentCssSource, token, "guest toggle must keep footer alignment beside the send button");
}

for (const token of [
  'var GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";',
  'var GUEST_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleGuest";',
  'var GUEST_CHAT_CLEANBOT_DEFAULT_ATTR = "data-chzzk-chat-ui-toggle-guest-cleanbot-default";',
  'var GUEST_CHAT_CLEANBOT_STORAGE_KEY = "cleanbot";',
  'var GUEST_CHAT_CLEANBOT_DISABLED_VALUE = "false";',
  "function applyGuestChatCleanBotDefault()",
  "!isLocalOnlyChatContext()",
  "window.localStorage?.setItem(GUEST_CHAT_CLEANBOT_STORAGE_KEY, GUEST_CHAT_CLEANBOT_DISABLED_VALUE);",
  'document.documentElement.setAttribute(GUEST_CHAT_CLEANBOT_DEFAULT_ATTR, "off");',
  "applyGuestChatCleanBotDefault();",
  "iframe.credentialless = true",
  "frameUrl.searchParams.set(GUEST_CHAT_FRAME_MARKER_PARAM, \"1\");"
]) {
  assertIncludes(contentSource, token, "guest chat frame must keep iframe-scoped CleanBot display correction");
}

for (const token of [
  'var LOCAL_ONLY_CHAT_FIELD_ATTR = "data-chzzk-chat-ui-toggle-local-only-field";',
  'var LOCAL_ONLY_CHAT_ORIGINAL_FIELD_ATTR = "data-chzzk-chat-ui-toggle-local-only-original-field";',
  'var LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR = "data-chzzk-chat-ui-toggle-local-only-send-button";',
  'var LOCAL_ONLY_CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-local-only-row";',
  "var LOCAL_ONLY_CHAT_MAX_MESSAGE_LENGTH = 200;",
  "var LOCAL_ONLY_CHAT_MAX_MESSAGES = 100;",
  'var LOCAL_ONLY_CHAT_PLACEHOLDER = "나만 보는 채팅, 실제로 전송되지 않음";',
  "var LOCAL_ONLY_CHAT_INPUT_FIELD_SELECTORS = [",
  "var localOnlyChatCredentiallessVerificationStarted = false;",
  "var localOnlyChatCredentiallessVerified = false;",
  "var localOnlyChatNativeTimelineInitialized = false;",
  "var localOnlyChatNativeTimelineBaselineWasEmpty = false;",
  "var localOnlyChatNativeTimelinePlacementSuspended = false;",
  "var localOnlyChatNativeTimelineSnapshot = [];",
  "var localOnlyChatNativeTimelineRowsSnapshot = [];",
  "var localOnlyChatSuspendedTimelinePlacementAvailable = false;",
  "var localOnlyChatSuspendedTimelineSnapshot = [];",
  "var localOnlyChatSuspendedTimelineRowsSnapshot = [];",
  "function hasLocalOnlyChatCredentiallessFrameMarker()",
  "function isLocalOnlyChatContext()",
  "async function verifyLocalOnlyChatCredentiallessContext()",
  'typeof document.hasStorageAccess !== "function"',
  "const hasStorageAccess = await document.hasStorageAccess();",
  "hasStorageAccess !== false",
  "localOnlyChatCredentiallessVerified = true;",
  'String(frame.tagName || "").toUpperCase() === "IFRAME"',
  'frame.hasAttribute("credentialless")',
  "frame.credentialless === true",
  "function connectLocalOnlyChatInterception()",
  'window.addEventListener(eventType, handleLocalOnlyChatCapturedEvent, true);',
  'event.type === "submit"',
  'event.type === "beforeinput"',
  'event.type === "keydown"',
  'event.type === "click"',
  "event.stopImmediatePropagation();",
  "function createLocalOnlyChatField(originalField)",
  "function stripLocalOnlyChatExecutableAttributes(root)",
  'attribute.name.toLowerCase().startsWith("on")',
  "const field = originalField.cloneNode(false);",
  "function createLocalOnlyChatSendButton(originalButton)",
  'button.type = "button";',
  '"button[class*=\'send_button\' i]"',
  '"button[type=\'submit\']"',
  "function submitLocalOnlyChatMessage(field = getLocalOnlyChatField())",
  "function getLocalOnlyChatNativeRows(log)",
  "function getLocalOnlyChatTimelineSignature(row)",
  "function matchLocalOnlyChatTimelineEntries(previousEntries, currentEntries)",
  "function getLocalOnlyChatTimelineDelta(",
  "function beginLocalOnlyChatSuspendedTimeline(currentSignatures, currentRows)",
  "function advanceLocalOnlyChatNativeTimeline(nativeRows, mutatedNativeRows = null)",
  "function getLocalOnlyChatNativeRowsNewestFirst(nativeRows)",
  "const rowMatch = matchLocalOnlyChatTimelineEntries(",
  "const newestRowContentChanged = Boolean(",
  "const hasStableSignatureOverlap = signatureMatch.overlap >= 2;",
  "const hasRowIdentityOverlap = rowMatch.overlap > 0;",
  "hasStableSignatureOverlap ? signatureMatch.offset : 0",
  "hasRowIdentityOverlap ? rowMatch.offset : 0",
  "localOnlyChatSuspendedTimelinePlacementAvailable",
  "if (localOnlyChatNativeTimelinePlacementSuspended)",
  "function findLocalOnlyChatPreviousMessage(",
  "function getLocalOnlyChatEffectiveRemoteSlot(message, nativeRowCount)",
  "nativeRowCount: nativeRowsNewestFirst.length",
  "function placeLocalOnlyChatMessageDuringSuspension(message, log, nativeRows)",
  "function placeLocalOnlyChatMessage(message, log, nativeRows)",
  'syncLocalOnlyChatRows({ mutatedNativeRows: nativeContentMutatedRows });',
  'row.getAttribute(LOCAL_ONLY_CHAT_ROW_ATTR) !== "true"',
  "ownedElements.some((ownedElement) => !ownedElement.isConnected)",
  ".filter(isChatMessageRow);",
  "rowContainer.append(row);",
  "rowContainer.prepend(row);",
  "annotateChatRow(row);",
  "scheduleLargeTextLayoutSync([row]);",
  "messageText.textContent = message.text;",
  "connectLocalOnlyChatInterception();",
  "syncLocalOnlyNativeComposer();"
]) {
  assertIncludes(contentSource, token, "guest frame must keep native-looking local-only input with layered send blocking");
}
for (const token of [
  "localOnlyChatField",
  "localOnlyChatRows",
  "sentinelNetworkMatches",
  "webSocketFrameSent",
  "originalRemoteRowCount",
  "preservedSnapshotRows",
  "sameLocalRowNode",
  "localRowFullyVisible",
  "receivedFramesWithUrl",
  "hasStorageAccess",
  "updatedRemoteBelowLocalCount",
  "bottommostVisibleRowKind",
  'LOCAL_ONLY_CHAT_PLACEHOLDER = "나만 보는 채팅, 실제로 전송되지 않음"',
  "LOCAL_ONLY_BUTTON_"
]) {
  assertIncludes(liveVerifySource, token, "live verifier must prove native-looking local insertion and zero sentinel sends");
}

for (const token of [
  "LOCAL_ONLY_CHAT_MAX_MESSAGES",
  "localOnlyChatMessages.push(message);",
  "removeLocalOnlyChatMessage(expiredMessage);",
  "message.newerRemoteCount += newEntryCount;",
  "keyboardEvent.isComposing",
  "keyboardEvent.keyCode === 229",
  "localOnlyChatIsComposing",
  "localOnlyChatImeSubmitPending",
  "localOnlyChatEnterHandledUntilKeyup",
  "event.isComposing",
  "getLocalOnlyChatFieldValue(field)",
  "setLocalOnlyChatFieldValue(field, \"\");",
  "localOnlyChatMessages = [];"
]) {
  assertIncludes(localOnlyChatSource, token, "local-only chat must keep ephemeral safe rendering and bounded rows");
}
for (const forbiddenToken of [
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "localStorage",
  "sessionStorage",
  "chrome.runtime.sendMessage",
  "navigator.sendBeacon",
  "innerHTML"
]) {
  assertExcludes(localOnlyChatSource, forbiddenToken, "local-only interception must not expose a send or persistence path");
}
for (const token of [
  "data-chzzk-chat-ui-toggle-local-only-original-field",
  "data-chzzk-chat-ui-toggle-local-only-original-send-button",
  "data-chzzk-chat-ui-toggle-local-only-field",
  "data-chzzk-chat-ui-toggle-local-only-send-button",
  "data-chzzk-chat-ui-toggle-local-only-row",
  ":placeholder-shown",
  "overflow-y: hidden !important;"
]) {
  assertIncludes(contentCssSource, token, "local-only chat styles must preserve the native composer layout");
}

for (const token of [
  "localBuriedAboveViewport",
  "localHasLayoutBox",
  "newerRemoteIds",
  "__repeatSignatureLocalRow",
  'duplicateNewestSignatureRow.id = "remote-row-duplicate-newest-signature";',
  "__olderEdgeOwnedMutationCount",
  'window.observer.disconnect();',
  'replacementWithSameSignature.id = "remote-row-5";',
  "remote-row-first-after-empty",
  "__virtualSliceNativeRows",
  "__virtualSliceSecondLocalRow",
  'remoteRow.id = "history-row-new";',
  'assert.equal(emptyComposerState.placeholder, "나만 보는 채팅, 실제로 전송되지 않음");'
]) {
  assertIncludes(regressionTestSource, token, "local-only regression tests must prove timeline burial and compact placeholder layout");
}
for (const staleToken of [
  "chzzk-chat-ui-toggle-local-only-chat-frame",
  "data-chzzk-chat-ui-toggle-local-only-chat-native-input",
  "data-chzzk-chat-ui-toggle-local-only-chat-viewport",
  "--chzzk-chat-ui-toggle-local-only-chat-height",
  ".local-message__marker",
  ".local-chat__composer"
]) {
  assertExcludes(contentSurface, staleToken, "separate local-only panel artifacts must stay removed");
}

const cleanBotDefaultStart = contentSource.indexOf("function applyGuestChatCleanBotDefault()");
const cleanBotDefaultEnd = contentSource.indexOf("function getGuestChatFrameTheme()", cleanBotDefaultStart);
const cleanBotDefaultSource =
  cleanBotDefaultStart >= 0 && cleanBotDefaultEnd > cleanBotDefaultStart
    ? contentSource.slice(cleanBotDefaultStart, cleanBotDefaultEnd)
    : "";

assert(
  cleanBotDefaultSource.includes("!isLocalOnlyChatContext()") &&
    cleanBotDefaultSource.indexOf("window.localStorage?.setItem") >
      cleanBotDefaultSource.indexOf("!isLocalOnlyChatContext()"),
  "guest cleanbot default must only write localStorage inside the guest iframe guard."
);
assert(
  contentSource.split("window.self !== window.top &&").length - 1 >= 2,
  "guest and mini embed markers must both activate only inside subframes."
);

const startFunctionStart = contentSource.indexOf("function start()");
const startFunctionEnd = contentSource.indexOf("start();", startFunctionStart);
const startFunctionSource =
  startFunctionStart >= 0 && startFunctionEnd > startFunctionStart
    ? contentSource.slice(startFunctionStart, startFunctionEnd)
    : "";
assert(
  startFunctionSource.indexOf("verifyLocalOnlyChatCredentiallessContext();") >= 0 &&
    startFunctionSource.indexOf("verifyLocalOnlyChatCredentiallessContext();") <
      startFunctionSource.indexOf("applyGuestChatCleanBotDefault();") &&
    startFunctionSource.indexOf("applyGuestChatCleanBotDefault();") >= 0 &&
    startFunctionSource.indexOf("applyGuestChatCleanBotDefault();") <
      startFunctionSource.indexOf("injectStyle();"),
  "guest cleanbot default must be applied before normal content script initialization."
);

for (const token of [
  "document.documentElement.dataset.chzzkChatUiToggleStyleVersion = SCRIPT_VERSION;",
  "styleVersion: document.documentElement.dataset.chzzkChatUiToggleStyleVersion || null",
  'document.documentElement.dataset.chzzkChatUiToggleVersion = SCRIPT_VERSION;',
  '"--chzzk-chat-ui-toggle-chat-font-size"',
  '"--chzzk-chat-ui-toggle-nickname-font-size"',
  '"--chzzk-chat-ui-toggle-chat-emote-size"',
  '"--chzzk-chat-ui-toggle-mini-chat-scale"',
  '"--chzzk-chat-ui-toggle-chat-text-color"',
  '"--chzzk-chat-ui-toggle-nickname-color"',
  '"--chzzk-chat-ui-toggle-auto-nickname-color"',
  '"--chzzk-chat-ui-toggle-auto-message-color"',
  "const useChatTextColor = options?.useChatTextColor === true;",
  "useNicknameColorForMessage: useChatTextColor && options?.useNicknameColorForMessage === true",
  'useAutoTextContrast: options?.useAutoTextContrast === true',
  "function syncAutoContrast(row)",
  "var autoContrastCache = new Map();",
  "AUTO_CONTRAST_CACHE_LIMIT",
  "AUTO_CONTRAST_ACCENT_COLORS",
  "function getContrastBackgroundRgb(row)",
  "function getReadableAccentContrastColor(backgroundRgb)",
  "getAutoContrastColor(",
  "getReadableContrastColor("
]) {
  assertIncludes(contentSource, token, "content script must expose status and runtime CSS variables");
}

for (const token of [
  "Static content styles extracted from content.js",
  "html:not([data-chzzk-chat-ui-toggle-ready=\"true\"])",
  "data-chzzk-chat-ui-toggle-live-chat-frame",
  "data-chzzk-chat-ui-toggle-guest-chat-embed",
  "data-chzzk-chat-ui-toggle-mini-chat-embed",
  "data-chzzk-chat-ui-toggle-chat-row=\"true\"",
  "data-chzzk-chat-ui-toggle-role~=\"nickname\"",
  "data-chzzk-chat-ui-toggle-message-text",
  "data-chzzk-chat-ui-toggle-chat-text-color",
  "data-chzzk-chat-ui-toggle-nickname-color-message",
  "data-chzzk-chat-ui-toggle-auto-contrast",
  "color: var(--chzzk-chat-ui-toggle-chat-text-color) !important;",
  "color: var(--chzzk-chat-ui-toggle-auto-nickname-color) !important;",
  "color: var(--chzzk-chat-ui-toggle-auto-message-color) !important;",
  ':not(:has(:is(.chzzk-chat-ui-toggle-timestamp, [data-chzzk-chat-ui-toggle-role~="timestamp"])))',
  "font-size: var(--chzzk-chat-ui-toggle-chat-font-size, 13pt) !important;",
  "transform: scale(var(--chzzk-chat-ui-toggle-mini-chat-scale, 1)) !important;",
  "#chzzk-chat-ui-toggle-mini-chat-panel",
  "#chzzk-chat-ui-toggle-guest-chat-frame-container"
]) {
  assertIncludes(contentCssSource, token, "content.css must keep extracted content styles");
}

assertExcludes(contentCssSource, "${", "content.css must not contain unexpanded JavaScript template placeholders");
const autoMessageSelectorIndex = contentCssSource.indexOf(
  '[data-chzzk-chat-ui-toggle-auto-contrast~="message"]'
);
assert(autoMessageSelectorIndex >= 0, "content.css must style auto-contrasted message text.");
assert(
  !contentCssSource
    .slice(Math.max(0, autoMessageSelectorIndex - 180), autoMessageSelectorIndex)
    .includes('data-chzzk-chat-ui-toggle-chat-text-color="on"'),
  "standalone auto contrast must not depend on custom chat text color being enabled."
);
assertExcludes(contentSource, "const STYLE_ID", "content script should not keep the old injected style element id.");
assertExcludes(contentSource, "style.textContent = `", "content script should not keep the old large CSS template string.");

for (const token of [
  "function getContentStatus(tabId)",
  "function refreshContent(tabId)",
  "function isCurrentContentStatus(status)",
  "status?.version === CONTENT_VERSION && status?.styleVersion === CONTENT_VERSION",
  "새로고침 필요",
  "Manifest content scripts handle Chzzk pages"
]) {
  assertIncludes(popupSource, token, "popup must use manifest-injected content scripts and show reload status");
}
assertExcludes(
  normalizedContentSource,
  "scanRows(changedRows, { contentMutated: true });",
  "row mutations must not reset generated timestamps unconditionally"
);
for (const token of [
  "function prepareCommitSnapshot()",
  "return normalizeOptions(currentOptions);",
  'window.addEventListener("pagehide", persistLatestOptionsBeforeClose);',
  "function setLocalStorage(values)",
  'const UPDATE_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_UPDATE_OPTIONS";',
  "function getChangedOptionsPatch(previousOptions, nextOptions)",
  "lastCommittedPopupSnapshot = normalizeOptions(currentOptions);",
  "patch",
  'chatPreview.style.setProperty("--preview-nickname-font"',
  "{ frameId: 0 }",
  "!menuButton.contains(event.target) && !appMenu.contains(event.target)"
]) {
  assertIncludes(popupSource, token, "popup must keep durable ordered storage and top-frame status routing");
}
for (const token of [
  "const PRESET_EXCLUDED_OPTION_KEYS = new Set([",
  "function createChatWindowOptionsPatch(options = currentOptions)",
  "function createPresetSnapshot(options)",
  "!PRESET_EXCLUDED_OPTION_KEYS.has(key)",
  "function applyPresetSnapshot(snapshot, optionsToPreserve = currentOptions)",
  "const nextCustomPresetSnapshot = createPresetSnapshot(currentOptions);",
  "? createPresetSnapshot(local[PRESET_STORAGE_KEY])"
]) {
  assertIncludes(popupSource, token, "popup presets must exclude and preserve chat window settings");
}
assertExcludes(popupSource, "chrome.scripting", "popup must not use scripting permission.");
assertExcludes(popupSource, "executeScript", "popup must not dynamically inject content scripts.");
assertIncludes(
  popupStyles,
  "font-size: var(--preview-nickname-font, var(--preview-font));",
  "popup preview must render the independent nickname font size"
);

for (const token of [
  'id="useGuestChatFrame"',
  'id="useMiniFloatingChat"',
  'id="showMiniFloatingChatButton"',
  'id="showNonChatPanels"',
  'id="showHeaderSettingsButton"',
  'id="chatFontSizePt"',
  'id="nicknameFontSizePt"',
  'id="toggleChatTextStylePanel"',
  'id="useAutoTextContrast"',
  'id="useChatTextColor"',
  'id="chatTextColorHex"',
  'id="toggleChatTextColorPanel"',
  'id="useNicknameColorForMessage"',
  'data-view="home"',
  'data-view="visibility"',
  'data-view="style"',
  'data-view="chat-mode"',
  'id="chatPreview"'
]) {
  assertIncludes(popupMarkup, token, "popup markup must keep expected controls");
}

for (const token of [
  "나만 보는 채팅",
  "원래 입력창 그대로 · 실제 전송되지 않음",
  "나만 보기 전환 버튼",
  "헤더·하단 아이콘",
  "하단 채팅 버튼 왼쪽"
]) {
  assertIncludes(popupMarkup, token, "popup must describe the renamed local-only chat mode");
}
assertIncludes(popupSource, 'guest: "나만 보는 채팅"', "popup status must use the local-only chat name");
assertIncludes(manifest.description, "나만 보는 채팅", "manifest description must mention local-only chat");
assertIncludes(manifest.description, "실제 전송 없이", "manifest description must state the no-send boundary");

for (const token of [
  "function hexToExpectedRgba(hexColor, theme)",
  "function selectPopupView(popup, targetView)",
  "function assertPopupImmediateClosePersistence",
  "function assertDirectGuestMarkerProtection",
  "function assertLocalOnlyChatFlow",
  "function collectGuestChatComposerTogglePlacement",
  "function assertGuestChatToggleBesideSendButton",
  "function assertGuestChatComposerToggleFlow",
  "await frameToggleButton.click();",
  "CHZZK_VERIFY_LOCAL_ONLY",
  "composerVisibleInViewport",
  "documentScrollTop",
  "webSocketFrameSent",
  "sentinelNetworkMatches",
  "function assertMiniChatDefaultPosition",
  "function waitForMiniChatFrameState",
  "function assertSyntheticNativeTimestamp",
  "function assertSyntheticStandaloneAutoContrast"
]) {
  assertIncludes(liveVerifySource, token, "live verifier must cover the current popup and regression contracts");
}
for (const token of [
  "unannotatedRowCount",
  "nicknameMissingRoleCount",
  "minNicknameFontSize",
  "nicknameFontSizeSpread"
]) {
  assertIncludes(liveVerifySource, token, "live verifier must reject incomplete nickname coverage");
}
assertIncludes(
  liveVerifySource,
  "singleLineTextInsetDeltas",
  "live verifier must avoid wrapped-line false positives when checking chat-box padding"
);
assertExcludes(liveVerifySource, "data-tab-target", "live verifier must not use the removed tab UI contract");

for (const token of [
  "nicknameColorOption.disabled = !isChatTextColorEnabled;",
  "nicknameColorOption.checked = currentOptions.useNicknameColorForMessage === true;",
  'nicknameColorRow?.classList.toggle("is-disabled", !isChatTextColorEnabled);'
]) {
  assertIncludes(popupSource, token, "popup must keep nickname-color message as a child of text color changes");
}

for (const token of [
  'data-popup-theme="light"',
  "html[data-popup-theme=\"dark\"]",
  ".preview-card",
  ".preset-chip",
  ".nav-tile",
  ".mode-card",
  ".color-chip",
  ".view.view--active",
  ".quick-toggle"
]) {
  assertIncludes(popupStyles, token, "popup styles must keep the redesigned settings layout");
}

for (const token of [
  'data-option="showNicknames"',
  "function navigate(viewName",
  "PRESET_DEFINITIONS",
  "function syncPreview()",
  "function syncPopupTheme()",
  "function applyPopupTheme(theme)"
]) {
  const popupUiSource = `${popupMarkup}\n${popupSource}`;
  assertIncludes(popupUiSource, token, "popup must keep the redesigned settings controller");
}

for (const token of [
  "## 나만 보는 채팅",
  "실제 채팅은 로그인 없이 그대로 볼 수 있습니다.",
  "원래 채팅 입력창과 같은 위치와 모양을 사용합니다.",
  "한글 입력 중에도 Enter를 한 번 누르거나",
  "입력 내용은 치지직 원본 입력·전송 경로와 분리된 로컬 입력에서만 처리됩니다.",
  "같은 채팅 목록에 실제 채팅처럼 표시되지만 치지직에는 전송되지 않습니다.",
  "다른 시청자와 스트리머에게는 보이지 않습니다.",
  "닉네임, 시간, 채팅 박스, 굵기, 글자색과 글자 크기 설정이 실제 채팅과 같은 방식으로 적용됩니다.",
  "글씨 크기/닉네임 크기 조정(이모티콘 포함)",
  "미니 플로팅 채팅창",
  "## 빠른 전환 버튼",
  "나만 보기 전환 버튼은 하단 `채팅` 전송 버튼 바로 왼쪽에 표시됩니다.",
  "설정 버튼과 미니 채팅 버튼은 채팅 헤더에 표시됩니다.",
  "스타일 프리셋과 나만의 프리셋은 채팅창 설정(기본·나만 보기·미니, 전체화면 전용)을 저장하거나 변경하지 않습니다.",
  "본 확장 프로그램은 NAVER 및 CHZZK와 공식적으로 제휴하거나 승인받은 제품이 아닙니다.",
  "CHZZK 또는 브라우저 업데이트에 따라 일부 기능이 일시적으로 정상 작동하지 않을 수 있습니다."
]) {
  assertIncludes(readmeSource, token, "README-facing feature wording must remain accurate");
}

for (const token of [
  '"local-only-chat.html"',
  '"local-only-chat.css"',
  '"local-only-chat.js"'
]) {
  assertExcludes(packageScriptSource, token, "package script must not include removed nested local-only resources");
}

for (const token of [
  'const GUEST_CHAT_CLEANBOT_DEFAULT_ATTR = "data-chzzk-chat-ui-toggle-guest-cleanbot-default";',
  "state.frame.cleanbotDefault === \"off\"",
  "state.frame.localStorageCleanbot === \"false\""
]) {
  assertIncludes(liveVerifySource, token, "live verifier must continue checking guest cleanbot correction");
}

for (const token of [
  "chzzk-chat-ui-toggle-style",
  "document.getElementById(\"chzzk-chat-ui-toggle-style\")"
]) {
  assertExcludes(liveVerifySource, token, "live verifier must not expect the removed injected style element");
}

for (const token of [
  "eval(",
  "new Function",
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "importScripts"
]) {
  assertExcludes(`${backgroundSource}\n${contentSource}\n${popupSource}`, token, "extension code must not include remote-code-like execution or network APIs");
}

console.log("Extension manifest and root files are valid.");
