import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const contentSource = await readFile(path.join(root, "content.js"), "utf8");
const backgroundSource = await readFile(path.join(root, "background.js"), "utf8");
const popupMarkup = await readFile(path.join(root, "popup.html"), "utf8");
const popupSource = await readFile(path.join(root, "popup.js"), "utf8");
const normalizedContentSource = contentSource.replace(/\r\n/g, "\n");

const requiredRootFiles = [
  "manifest.json",
  "background.js",
  "content.js",
  "popup.html",
  "popup.css",
  "popup.js",
  "README.md"
];

const iconSizes = ["16", "32", "48", "128"];

for (const file of requiredRootFiles) {
  await access(path.join(root, file));
}

if (manifest.manifest_version !== 3) {
  throw new Error("manifest_version must be 3.");
}

if (manifest.name !== "치지직 채팅 UI 설정") {
  throw new Error("manifest name must be 치지직 채팅 UI 설정.");
}

if (manifest.short_name !== "치지직 채팅 설정") {
  throw new Error("manifest short_name must be 치지직 채팅 설정.");
}

if (!manifest.permissions?.includes("storage")) {
  throw new Error("storage permission is required.");
}

if (!manifest.permissions?.includes("scripting")) {
  throw new Error("scripting permission is required for stale content-script refresh.");
}

if (!manifest.permissions?.includes("webNavigation")) {
  throw new Error("webNavigation permission is required for automatic CHZZK navigation reinjection.");
}

if (!manifest.host_permissions?.includes("https://chzzk.naver.com/*")) {
  throw new Error("CHZZK host permission is missing.");
}

if (!manifest.host_permissions?.includes("https://*.chzzk.naver.com/*")) {
  throw new Error("CHZZK wildcard host permission is missing.");
}

if (manifest.action?.default_popup !== "popup.html") {
  throw new Error("default popup must point to popup.html.");
}

for (const size of iconSizes) {
  const manifestIcon = manifest.icons?.[size];
  const actionIcon = manifest.action?.default_icon?.[size];
  const expectedPath = `icons/icon-${size}.png`;

  if (manifestIcon !== expectedPath) {
    throw new Error(`manifest icon ${size} must point to ${expectedPath}.`);
  }

  if (actionIcon !== expectedPath) {
    throw new Error(`action icon ${size} must point to ${expectedPath}.`);
  }

  await access(path.join(root, expectedPath));
}

if (manifest.background?.service_worker !== "background.js") {
  throw new Error("background service worker must point to background.js.");
}

const contentScript = manifest.content_scripts?.[0];

if (!contentScript?.all_frames) {
  throw new Error("content script should run in all CHZZK frames.");
}

if (contentScript.run_at !== "document_start") {
  throw new Error("content script must run at document_start to avoid raw chat flashes.");
}

if (!contentSource.includes('const CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-chat-row";')) {
  throw new Error("content script must define a chat-row scope attribute.");
}

if (!contentSource.includes('const CHAT_ROW_SCOPE_SELECTOR = `[class*="live_chatting_list_item" i][${CHAT_ROW_ATTR}="true"]`;')) {
  throw new Error("content script must scope styling to native live chat row elements.");
}

if (!contentSource.includes('const NATIVE_CHAT_ROW_SELECTOR = `[class*="live_chatting_list_item" i]:has([class*="live_chatting_message_container" i])`;')) {
  throw new Error("content script must define a native chat-row selector for non-hiding styles.");
}

if (!contentSource.includes('const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";')) {
  throw new Error("content script must define the background options-read message.");
}

if (!contentSource.includes("function readOptionsFromBackground()")) {
  throw new Error("content script must fall back to background options loading.");
}

if (!normalizedContentSource.includes("Promise.all([\n      readOptionsFromStorageLocal(),\n      readOptionsFromBackground()\n    ])")) {
  throw new Error("content script must load direct and background options in parallel.");
}

if (!contentSource.includes("OPTIONS_LOAD_MAX_ATTEMPTS")) {
  throw new Error("content script must retry stored option loading.");
}

const startIndex = contentSource.indexOf("function start()");
const connectMessagesIndex = contentSource.indexOf("connectMessages();", startIndex);
const connectStorageListenerIndex = contentSource.indexOf("connectStorageListener();", startIndex);
const cachedOptionsIndex = contentSource.indexOf("const cachedOptions = readCachedOptions();", startIndex);

if (
  startIndex < 0 ||
  connectMessagesIndex < 0 ||
  connectStorageListenerIndex < 0 ||
  cachedOptionsIndex < 0 ||
  connectMessagesIndex > cachedOptionsIndex ||
  connectStorageListenerIndex > cachedOptionsIndex
) {
  throw new Error("content script must connect listeners before stored options finish loading.");
}

if (!backgroundSource.includes('const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";')) {
  throw new Error("background script must define the options-read message.");
}

if (!backgroundSource.includes('const SET_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_OPTIONS";')) {
  throw new Error("background script must define the options-push message.");
}

if (!backgroundSource.includes("chrome.runtime.onMessage.addListener")) {
  throw new Error("background script must answer content-script option requests.");
}

if (!backgroundSource.includes("chrome.storage.local.get(STORAGE_KEY")) {
  throw new Error("background script must read stored options from chrome.storage.local.");
}

if (backgroundSource.includes("chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_OPTIONS })")) {
  throw new Error("background script must not overwrite saved options with defaults.");
}

const requiredBackgroundInjectionTokens = [
  'const CONTENT_SCRIPT_FILE = "content.js";',
  "function scheduleContentScriptInjection(tabId)",
  "function pushStoredOptionsToTab(tabId)",
  "target: { tabId, allFrames: true }",
  "chrome.tabs.sendMessage(",
  "chrome.tabs.onUpdated.addListener",
  "chrome.webNavigation.onCommitted.addListener",
  "chrome.webNavigation.onHistoryStateUpdated.addListener",
  "chrome.webNavigation.onCompleted.addListener"
];

for (const token of requiredBackgroundInjectionTokens) {
  if (!backgroundSource.includes(token)) {
    throw new Error(`background script must automatically reinject content script: ${token}`);
  }
}

const removedIncognitoChatTokens = [
  "CHZZK_CHAT_UI_TOGGLE_OPEN_INCOGNITO_CHAT",
  "OPEN_INCOGNITO_CHAT_MESSAGE",
  "INCOGNITO_CHAT_BUTTON_ID",
  "chzzk-chat-ui-toggle-incognito-chat-button",
  "getLiveChatPopupUrl",
  "openIncognitoChatPopup",
  "createIncognitoChatButton",
  "ensureIncognitoChatButton",
  "openCurrentIncognitoChat",
  "findHeaderIncognitoChatTarget",
  "chrome.windows.create(",
  "incognito: true"
];

for (const token of removedIncognitoChatTokens) {
  if (
    backgroundSource.includes(token) ||
    contentSource.includes(token) ||
    popupMarkup.includes(token) ||
    popupSource.includes(token)
  ) {
    throw new Error(`incognito chat popup feature must remain removed: ${token}`);
  }
}

const requiredGuestChatTokens = [
  "useGuestChatFrame: false",
  'useGuestChatFrame: "chzzkChatUiToggleGuestChatFrame"',
  'const GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";',
  'const GUEST_CHAT_TOGGLE_BUTTON_ID = "chzzk-chat-ui-toggle-guest-chat-toggle";',
  'const GUEST_CHAT_CONTROL_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-control-host";',
  'const GUEST_CHAT_THEME_ATTR = "data-chzzk-chat-ui-toggle-guest-theme";',
  'const GUEST_CHAT_EMBED_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-embed";',
  'const GUEST_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleGuest";',
  'const READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";',
  'const SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";',
  'const APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";',
  "const PAGE_THEME_BACKGROUND_SELECTORS = [",
  "const CHAT_THEME_CHROME_SELECTORS = [",
  "function writeOptionsToStorageLocal(options)",
  "function syncGuestChatFrame()",
  "function syncGuestChatTheme()",
  "function detectPageTheme()",
  "function isChatThemeCandidate(element)",
  "function getThemeFromChatChromeBackground()",
  "function applyGuestChatTheme(theme",
  "function isGuestChatFrameEmbedUrl(url)",
  'frameUrl.searchParams.set(GUEST_CHAT_FRAME_MARKER_PARAM, "1");',
  'html[${LIVE_CHAT_FRAME_ATTR}="true"][${GUEST_CHAT_EMBED_ATTR}="true"]',
  '[class*="live_chatting_header" i]',
  'document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource = "chat-chrome";',
  "const frameUrl = new URL(`${CHZZK_ORIGIN}/live/${channelId}/chat`);",
  "const theme = getGuestChatFrameTheme();",
  'frameUrl.searchParams.set("theme", theme);',
  "if (previousGuestChatTheme !== detectedTheme) {",
  "function ensureGuestChatToggleButton()",
  "function toggleGuestChatFrame(button)",
  "function findGuestChatToggleTarget()",
  "function supportsCredentiallessIframe()",
  "function isGuestChatFrameEligibleContext()",
  "iframe.credentialless = true",
  "runtime.storage.local.set({ [STORAGE_KEY]: normalizedOptions }",
  'button.id = GUEST_CHAT_TOGGLE_BUTTON_ID;',
  "syncGuestChatFrame();",
  "ensureGuestChatToggleButton();"
];

for (const token of requiredGuestChatTokens) {
  if (!contentSource.includes(token)) {
    throw new Error(`content script must support the credentialless guest chat experiment: ${token}`);
  }
}

const unsafeGuestChatThemeSelectors = [
  '[${GUEST_CHAT_THEME_ATTR}="light"] [class*="live_chatting" i]',
  '[${GUEST_CHAT_THEME_ATTR}="dark"] [class*="live_chatting" i]',
  'html[${LIVE_CHAT_FRAME_ATTR}="true"][${GUEST_CHAT_THEME_ATTR}] ${NATIVE_CHAT_ROW_SELECTOR} *',
  'html[${LIVE_CHAT_FRAME_ATTR}="true"][${GUEST_CHAT_THEME_ATTR}="light"]',
  'html[${LIVE_CHAT_FRAME_ATTR}="true"][${GUEST_CHAT_THEME_ATTR}="dark"]'
];

for (const selector of unsafeGuestChatThemeSelectors) {
  if (contentSource.includes(selector)) {
    throw new Error(`guest chat theme must be delegated to the native iframe theme parameter: ${selector}`);
  }
}

const computedThemeStart = contentSource.indexOf("function getThemeFromComputedBackground()");
const computedThemeEnd = contentSource.indexOf("function closestSafe(", computedThemeStart);
const computedThemeSource =
  computedThemeStart >= 0 && computedThemeEnd > computedThemeStart
    ? contentSource.slice(computedThemeStart, computedThemeEnd)
    : "";

for (const token of ["live_chatting", "chatting_area", "chat_area"]) {
  if (computedThemeSource.includes(token)) {
    throw new Error(`outer page theme detection must not sample chat UI backgrounds: ${token}`);
  }
}

for (const token of ["document.documentElement", "document.body", 'document.getElementById("root")']) {
  if (computedThemeSource.includes(token)) {
    throw new Error(`outer page theme detection must not sample broad page shell backgrounds: ${token}`);
  }
}

if (!backgroundSource.includes("useGuestChatFrame: options?.useGuestChatFrame === true")) {
  throw new Error("background script must normalize the guest chat option.");
}

const requiredGuestChatThemeBackgroundTokens = [
  'const READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";',
  'const SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";',
  'const APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";',
  "const guestChatThemesByTab = new Map();",
  "function setGuestChatTheme(tabId, channelId, theme)",
  "function broadcastGuestChatTheme(tabId, entry)",
  "chrome.tabs.onRemoved.addListener",
  "message?.type === SET_GUEST_CHAT_THEME_MESSAGE",
  "message?.type === READ_GUEST_CHAT_THEME_MESSAGE"
];

for (const token of requiredGuestChatThemeBackgroundTokens) {
  if (!backgroundSource.includes(token)) {
    throw new Error(`background script must relay guest chat theme without cookies: ${token}`);
  }
}

if (!popupMarkup.includes('id="useGuestChatFrame"')) {
  throw new Error("popup must include a guest chat frame toggle.");
}

if (!popupSource.includes('"useGuestChatFrame"')) {
  throw new Error("popup script must store and apply the guest chat option.");
}

const unsafeRoleSelectors = [
  'html[data-chzzk-chat-ui-toggle-nicknames="off"] [${ROLE_ATTR}~="nickname"]',
  'html[data-chzzk-chat-ui-toggle-badges="off"] [${ROLE_ATTR}~="badge"]',
  'html[data-chzzk-chat-ui-toggle-timestamps="off"] [${ROLE_ATTR}~="timestamp"]'
];

for (const selector of unsafeRoleSelectors) {
  if (contentSource.includes(selector)) {
    throw new Error(`content script has an unsafe global role selector: ${selector}`);
  }
}

const scopedRoleSelectors = [
  '${CHAT_ROW_SCOPE_SELECTOR} [${ROLE_ATTR}~="nickname"]',
  '${CHAT_ROW_SCOPE_SELECTOR} [${ROLE_ATTR}~="badge"]',
  '${CHAT_ROW_SCOPE_SELECTOR} [${ROLE_ATTR}~="timestamp"]'
];

for (const selector of scopedRoleSelectors) {
  if (!contentSource.includes(selector)) {
    throw new Error(`content script is missing scoped role selector: ${selector}`);
  }
}

const unsafeLiveChatClassRules = [
  'html[data-chzzk-chat-ui-toggle-nicknames="off"]\n        [class*="live_chatting_list_item" i]',
  'html[data-chzzk-chat-ui-toggle-badges="off"]\n        [class*="live_chatting_list_item" i]',
  'html[data-chzzk-chat-ui-toggle-large-text="on"]\n        [class*="live_chatting_list_item" i]',
  'html[data-chzzk-chat-ui-toggle-bold-text="on"]\n        [class*="live_chatting_list_item" i]'
];

for (const selector of unsafeLiveChatClassRules) {
  if (normalizedContentSource.includes(selector)) {
    throw new Error(`content script has an unsafe unscoped live-chat class rule: ${selector}`);
  }
}

if (!contentSource.includes("function cleanupUnscopedAnnotations")) {
  throw new Error("content script must clean stale annotations outside confirmed chat rows.");
}

const unsafeDetectionTokens = [
  "[role='listitem']",
  '"li"',
  "[class*='author' i]",
  "[class*='username' i]",
  "[class*='user_name' i]",
  "img[src*='profile_image' i]",
  "badge|profile_image|emblem|grade"
];

for (const token of unsafeDetectionTokens) {
  if (contentSource.includes(token)) {
    throw new Error(`content script has an unsafe broad detection token: ${token}`);
  }
}

if (contentSource.includes('html[data-chzzk-chat-ui-toggle-nicknames="off"] [${CHAT_ROW_ATTR}="true"]')) {
  throw new Error("nickname hiding must use CHAT_ROW_SCOPE_SELECTOR, not bare CHAT_ROW_ATTR.");
}

const nativeStyleSelectors = [
  `html[data-chzzk-chat-ui-toggle-bold-text="on"]
        \${NATIVE_CHAT_ROW_SELECTOR}`,
  `html[data-chzzk-chat-ui-toggle-large-text="on"]
        \${NATIVE_CHAT_ROW_SELECTOR}`,
  `html[data-chzzk-chat-ui-toggle-chat-boxes="on"]
        \${NATIVE_CHAT_ROW_SELECTOR}`
];

for (const selector of nativeStyleSelectors) {
  if (!normalizedContentSource.includes(selector)) {
    throw new Error(`content script must apply style before annotation with ${selector}`);
  }
}

console.log("Extension manifest and root files are valid.");
