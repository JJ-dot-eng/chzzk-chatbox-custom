import { access, readFile } from "node:fs/promises";
import path from "node:path";

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
const liveVerifySource = await readText(path.join("tools", "verify-live-edge.cjs"));
const normalizedContentSource = contentSource.replace(/\r\n/g, "\n");
const contentSurface = `${contentSource}\n${contentCssSource}`;

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
assertIncludes(contentSource, `var SCRIPT_VERSION = "${manifest.version}";`, "content script version must match manifest version");
assertIncludes(popupSource, `const CONTENT_VERSION = "${manifest.version}";`, "popup content version must match manifest version");

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
  'const OPEN_POPUP_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_POPUP";',
  'const READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";',
  'const SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";',
  'const APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";',
  "chrome.runtime.onMessage.addListener",
  "chrome.action.openPopup()",
  "chrome.storage.local.get(STORAGE_KEY",
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
  "function scanRows(rows)",
  "observer = new MutationObserver"
]) {
  assertIncludes(normalizedContentSource, token, "content script must keep core chat and option wiring");
}

for (const token of [
  'var GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";',
  'var GUEST_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleGuest";',
  'var GUEST_CHAT_CLEANBOT_DEFAULT_ATTR = "data-chzzk-chat-ui-toggle-guest-cleanbot-default";',
  'var GUEST_CHAT_CLEANBOT_STORAGE_KEY = "cleanbot";',
  'var GUEST_CHAT_CLEANBOT_DISABLED_VALUE = "false";',
  "function applyGuestChatCleanBotDefault()",
  "if (!isGuestChatFrameEmbedUrl(window.location.href))",
  "window.localStorage?.setItem(GUEST_CHAT_CLEANBOT_STORAGE_KEY, GUEST_CHAT_CLEANBOT_DISABLED_VALUE);",
  'document.documentElement.setAttribute(GUEST_CHAT_CLEANBOT_DEFAULT_ATTR, "off");',
  "applyGuestChatCleanBotDefault();",
  "iframe.credentialless = true",
  "frameUrl.searchParams.set(GUEST_CHAT_FRAME_MARKER_PARAM, \"1\");"
]) {
  assertIncludes(contentSource, token, "guest chat frame must keep iframe-scoped CleanBot display correction");
}

const cleanBotDefaultStart = contentSource.indexOf("function applyGuestChatCleanBotDefault()");
const cleanBotDefaultEnd = contentSource.indexOf("function getGuestChatFrameTheme()", cleanBotDefaultStart);
const cleanBotDefaultSource =
  cleanBotDefaultStart >= 0 && cleanBotDefaultEnd > cleanBotDefaultStart
    ? contentSource.slice(cleanBotDefaultStart, cleanBotDefaultEnd)
    : "";

assert(
  cleanBotDefaultSource.includes("if (!isGuestChatFrameEmbedUrl(window.location.href))") &&
    cleanBotDefaultSource.indexOf("window.localStorage?.setItem") >
      cleanBotDefaultSource.indexOf("if (!isGuestChatFrameEmbedUrl(window.location.href))"),
  "guest cleanbot default must only write localStorage inside the guest iframe guard."
);

const startFunctionStart = contentSource.indexOf("function start()");
const startFunctionEnd = contentSource.indexOf("start();", startFunctionStart);
const startFunctionSource =
  startFunctionStart >= 0 && startFunctionEnd > startFunctionStart
    ? contentSource.slice(startFunctionStart, startFunctionEnd)
    : "";
assert(
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
  "font-size: var(--chzzk-chat-ui-toggle-chat-font-size, 13pt) !important;",
  "transform: scale(var(--chzzk-chat-ui-toggle-mini-chat-scale, 1)) !important;",
  "#chzzk-chat-ui-toggle-mini-chat-panel",
  "#chzzk-chat-ui-toggle-guest-chat-frame-container"
]) {
  assertIncludes(contentCssSource, token, "content.css must keep extracted content styles");
}

assertExcludes(contentCssSource, "${", "content.css must not contain unexpanded JavaScript template placeholders");
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
assertExcludes(popupSource, "chrome.scripting", "popup must not use scripting permission.");
assertExcludes(popupSource, "executeScript", "popup must not dynamically inject content scripts.");

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
  'id="useNicknameColorForMessage"'
]) {
  assertIncludes(popupMarkup, token, "popup markup must keep expected controls");
}

for (const token of [
  "controls.useNicknameColorForMessage.disabled = !isChatTextColorEnabled;",
  "controls.useNicknameColorForMessage.checked = false;",
  "nicknameColorMessageToggleRow?.classList.toggle(\"is-disabled\", !isChatTextColorEnabled);"
]) {
  assertIncludes(popupSource, token, "popup must keep nickname-color message as a child of text color changes");
}

for (const token of [
  "body.is-chat-font-size-panel-expanded",
  "body.is-chat-box-color-panel-expanded",
  "body.is-chat-text-style-panel-expanded",
  ".disclosure-button",
  ".text-style-control",
  ".color-picker--sub",
  ".font-size-control__nested"
]) {
  assertIncludes(popupStyles, token, "popup styles must keep the adaptive settings layout");
}

for (const token of [
  "비로그인 상태로 전환하여 읽기 전용 채팅창",
  "글씨 크기/닉네임 크기 조정(이모티콘 포함)",
  "미니 플로팅 채팅창"
]) {
  assertIncludes(readmeSource, token, "README-facing feature wording must remain accurate");
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
