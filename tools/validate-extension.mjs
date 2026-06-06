import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const contentSource = await readFile(path.join(root, "content.js"), "utf8");
const backgroundSource = await readFile(path.join(root, "background.js"), "utf8");
const popupMarkup = await readFile(path.join(root, "popup.html"), "utf8");
const popupSource = await readFile(path.join(root, "popup.js"), "utf8");

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

if (!contentSource.includes("Promise.all([\n      readOptionsFromStorageLocal(),\n      readOptionsFromBackground()\n    ])")) {
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

if (!backgroundSource.includes('const OPEN_INCOGNITO_CHAT_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_INCOGNITO_CHAT";')) {
  throw new Error("background script must define the incognito chat popup message.");
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

const requiredIncognitoChatTokens = [
  "function getLiveChatPopupUrl(pageUrl)",
  "function openIncognitoChatPopup(pageUrl, sendResponse)",
  '`${CHZZK_ORIGIN}/live/${channelId}/chat`',
  "chrome.windows.create(",
  'type: "popup"',
  "incognito: true"
];

for (const token of requiredIncognitoChatTokens) {
  if (!backgroundSource.includes(token)) {
    throw new Error(`background script must open CHZZK chat in an incognito popup: ${token}`);
  }
}

const requiredContentIncognitoChatTokens = [
  'const OPEN_INCOGNITO_CHAT_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_INCOGNITO_CHAT";',
  'const INCOGNITO_CHAT_BUTTON_ID = "chzzk-chat-ui-toggle-incognito-chat-button";',
  "function createIncognitoChatButton()",
  "function ensureIncognitoChatButton()",
  "function openCurrentIncognitoChat(button)",
  "function findHeaderIncognitoChatTarget()",
  "ensureIncognitoChatButton();"
];

for (const token of requiredContentIncognitoChatTokens) {
  if (!contentSource.includes(token)) {
    throw new Error(`content script must render an incognito chat icon button: ${token}`);
  }
}

const requiredGuestChatTokens = [
  "useGuestChatFrame: false",
  'useGuestChatFrame: "chzzkChatUiToggleGuestChatFrame"',
  'const GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";',
  "function syncGuestChatFrame()",
  "function supportsCredentiallessIframe()",
  "function isGuestChatFrameEligibleContext()",
  "iframe.credentialless = true",
  "syncGuestChatFrame();"
];

for (const token of requiredGuestChatTokens) {
  if (!contentSource.includes(token)) {
    throw new Error(`content script must support the credentialless guest chat experiment: ${token}`);
  }
}

if (!backgroundSource.includes("useGuestChatFrame: options?.useGuestChatFrame === true")) {
  throw new Error("background script must normalize the guest chat option.");
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
  if (contentSource.includes(selector)) {
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
  if (!contentSource.includes(selector)) {
    throw new Error(`content script must apply style before annotation with ${selector}`);
  }
}

console.log("Extension manifest and root files are valid.");
