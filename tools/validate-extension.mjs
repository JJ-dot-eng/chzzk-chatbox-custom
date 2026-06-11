import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const packageLock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
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

if (manifest.name !== "치지직 채팅 커스텀") {
  throw new Error("manifest name must be 치지직 채팅 커스텀.");
}

if (manifest.short_name !== "채팅 커스텀") {
  throw new Error("manifest short_name must be 채팅 커스텀.");
}

if (manifest.version !== packageJson.version) {
  throw new Error("manifest and package versions must match.");
}

if (packageLock.version !== manifest.version || packageLock.packages?.[""]?.version !== manifest.version) {
  throw new Error("package-lock root versions must match manifest version.");
}

if (!contentSource.includes(`const SCRIPT_VERSION = "${manifest.version}";`)) {
  throw new Error("content script version must match manifest version.");
}

if (!popupSource.includes(`const CONTENT_VERSION = "${manifest.version}";`)) {
  throw new Error("popup content version must match manifest version.");
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

const removedFloatingSettingsTokens = [
  "FLOATING_SETTINGS",
  "chzzk-chat-ui-floating",
  "chzzk-chat-ui-toggle-settings-popover"
];

for (const token of removedFloatingSettingsTokens) {
  if (contentSource.includes(token)) {
    throw new Error(`content script must not reintroduce the in-page floating settings panel: ${token}`);
  }
}

const requiredHeaderPopupContentTokens = [
  'const OPEN_POPUP_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_POPUP";',
  'const HEADER_SETTINGS_BUTTON_ID = "chzzk-chat-ui-toggle-header-settings";',
  "showHeaderSettingsButton: true",
  'showHeaderSettingsButton: "chzzkChatUiToggleHeaderSettingsButton"',
  "function sendOpenPopupMessage()",
  "function createHeaderSettingsButton()",
  "function openExtensionPopupFromHeader(button)",
  "sendOpenPopupMessage()",
  ".filter((element) => element.id !== HEADER_SETTINGS_BUTTON_ID)",
  "target.container.insertBefore(settingsButton, target.before);",
  "target.container.insertBefore(button, nextSibling);"
];

for (const token of requiredHeaderPopupContentTokens) {
  if (!contentSource.includes(token)) {
    throw new Error(`content script must open the existing extension popup from the chat header: ${token}`);
  }
}

const requiredHeaderPopupBackgroundTokens = [
  'const OPEN_POPUP_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_POPUP";',
  "function openExtensionPopup(sendResponse)",
  "chrome.action.openPopup()",
  "message?.type === OPEN_POPUP_MESSAGE",
  "return openExtensionPopup(sendResponse);"
];

for (const token of requiredHeaderPopupBackgroundTokens) {
  if (!backgroundSource.includes(token)) {
    throw new Error(`background script must open the existing extension popup on request: ${token}`);
  }
}

const removedDetachedMiniChatTokens = [
  "OPEN_DETACHED_MINI_CHAT_MESSAGE",
  "DETACHED_MINI_CHAT_BOUNDS_KEY",
  "chzzkChatUiToggleDetachedMiniChatBounds",
  "openDetachedMiniChat",
  "getDetachedMiniChatUrl",
  "saveDetachedMiniChatWindowBounds",
  "detachedMiniChatWindowId",
  "MINI_CHAT_PANEL_DETACH_CLASS",
  "chzzk-chat-ui-toggle-mini-chat__detach",
  "detachButton",
  "documentPictureInPicture",
  "PictureInPicture",
  "requestWindow({",
  "picture-in-picture",
  "chzzk-mini-chat-pip",
  "chrome.windows.create(",
  "chrome.windows.onBoundsChanged.addListener"
];

for (const token of removedDetachedMiniChatTokens) {
  if (backgroundSource.includes(token) || contentSource.includes(token)) {
    throw new Error(`detached mini chat popup feature must remain removed: ${token}`);
  }
}

const requiredGuestChatTokens = [
  "useGuestChatFrame: false",
  "showGuestChatToggleButton: true",
  'useGuestChatFrame: "chzzkChatUiToggleGuestChatFrame"',
  'showGuestChatToggleButton: "chzzkChatUiToggleGuestChatToggleButton"',
  'const GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";',
  'const GUEST_CHAT_TOGGLE_BUTTON_ID = "chzzk-chat-ui-toggle-guest-chat-toggle";',
  'const GUEST_CHAT_CONTROL_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-control-host";',
  'const GUEST_CHAT_THEME_ATTR = "data-chzzk-chat-ui-toggle-guest-theme";',
  'const GUEST_CHAT_EMBED_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-embed";',
  'const GUEST_CHAT_CLEANBOT_DEFAULT_ATTR = "data-chzzk-chat-ui-toggle-guest-cleanbot-default";',
  'const GUEST_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleGuest";',
  'const GUEST_CHAT_NATIVE_THEME_CLASSES = ["light", "dark", "theme_light", "theme_dark"];',
  'const GUEST_CHAT_CLEANBOT_STORAGE_KEY = "cleanbot";',
  'const GUEST_CHAT_CLEANBOT_DISABLED_VALUE = "false";',
  'const READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";',
  'const SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";',
  'const APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";',
  "const PAGE_THEME_BACKGROUND_SELECTORS = [",
  "const CHAT_THEME_CHROME_SELECTORS = [",
  "const CHAT_THEME_FOREGROUND_SELECTORS = [",
  "function writeOptionsToStorageLocal(options)",
  "function syncGuestChatFrame()",
  "function syncGuestChatTheme()",
  "function detectPageTheme()",
  "function isChatThemeCandidate(element)",
  "function getGuestChatThemeFromUrl(url)",
  "function getThemeFromChatChromeBackground()",
  "function getThemeFromChatChromeForeground()",
  "function getThemeFromForegroundElement(element)",
  "function applyNativeGuestChatThemeClass(theme)",
  "function syncNativeGuestChatThemeClass(theme)",
  "function isNativeGuestChatThemeClassSynced(theme)",
  "function scheduleNativeGuestChatThemeClassRetries(theme)",
  "function clearNativeGuestChatThemeClassRetries({ keepTheme = false } = {})",
  "function applyGuestChatCleanBotDefault()",
  "window.localStorage?.setItem(GUEST_CHAT_CLEANBOT_STORAGE_KEY, GUEST_CHAT_CLEANBOT_DISABLED_VALUE);",
  'document.documentElement.setAttribute(GUEST_CHAT_CLEANBOT_DEFAULT_ATTR, "off");',
  "applyGuestChatCleanBotDefault();",
  "let nativeGuestChatThemeRetryTimers = [];",
  "clearNativeGuestChatThemeClassRetries({ keepTheme: true });",
  "for (const delay of [50, 150, 400, 1000, 2500])",
  "hasExpectedClasses && !hasConflictingClasses && hasExpectedColorScheme",
  "classList.remove(...GUEST_CHAT_NATIVE_THEME_CLASSES);",
  "classList.add(expectedThemeClass, expectedPrefixedThemeClass);",
  "function applyGuestChatTheme(theme",
  "function isGuestChatFrameEmbedUrl(url)",
  'frameUrl.searchParams.set(GUEST_CHAT_FRAME_MARKER_PARAM, "1");',
  'html[${LIVE_CHAT_FRAME_ATTR}="true"][${GUEST_CHAT_EMBED_ATTR}="true"]',
  '[class*="live_chatting_header" i]',
  'document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource = "chat-chrome-foreground";',
  'document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource = "chat-chrome";',
  "const frameUrl = new URL(`${CHZZK_ORIGIN}/live/${channelId}/chat`);",
  "const theme = getGuestChatFrameTheme();",
  'frameUrl.searchParams.set("theme", theme);',
  "if (previousGuestChatTheme !== detectedTheme) {",
  "function ensureGuestChatToggleButton()",
  "function toggleGuestChatFrame(button)",
  "function findGuestChatToggleTarget()",
  "function findGuestChatControlHost(guestHost, header = null)",
  "function markGuestChatControlHost(guestHost, header = null)",
  "markGuestChatControlHost(host);",
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

const cleanBotDefaultStart = contentSource.indexOf("function applyGuestChatCleanBotDefault()");
const cleanBotDefaultEnd = contentSource.indexOf("function getGuestChatFrameTheme()", cleanBotDefaultStart);
const cleanBotDefaultSource =
  cleanBotDefaultStart >= 0 && cleanBotDefaultEnd > cleanBotDefaultStart
    ? contentSource.slice(cleanBotDefaultStart, cleanBotDefaultEnd)
    : "";

if (
  !cleanBotDefaultSource.includes("if (!isGuestChatFrameEmbedUrl(window.location.href))") ||
  cleanBotDefaultSource.indexOf("window.localStorage?.setItem") <
    cleanBotDefaultSource.indexOf("if (!isGuestChatFrameEmbedUrl(window.location.href))")
) {
  throw new Error("guest cleanbot default must only write localStorage inside the guest iframe guard.");
}

const startFunctionStart = contentSource.indexOf("function start()");
const startFunctionEnd = contentSource.indexOf("start();", startFunctionStart);
const startFunctionSource =
  startFunctionStart >= 0 && startFunctionEnd > startFunctionStart
    ? contentSource.slice(startFunctionStart, startFunctionEnd)
    : "";
const cleanBotDefaultCallIndex = startFunctionSource.indexOf("applyGuestChatCleanBotDefault();");
const injectStyleCallIndex = startFunctionSource.indexOf("injectStyle();");

if (cleanBotDefaultCallIndex < 0 || injectStyleCallIndex < 0 || cleanBotDefaultCallIndex > injectStyleCallIndex) {
  throw new Error("guest cleanbot default must be applied before normal content script initialization.");
}

const syncGuestChatFrameStart = contentSource.indexOf("function syncGuestChatFrame()");
const syncGuestChatFrameEnd = contentSource.indexOf("function findChatHeaderTarget", syncGuestChatFrameStart);
const syncGuestChatFrameSource =
  syncGuestChatFrameStart >= 0 && syncGuestChatFrameEnd > syncGuestChatFrameStart
    ? contentSource.slice(syncGuestChatFrameStart, syncGuestChatFrameEnd)
    : "";
const markControlHostIndex = syncGuestChatFrameSource.indexOf("markGuestChatControlHost(host);");
const setGuestHostIndex = syncGuestChatFrameSource.indexOf(`host.setAttribute(GUEST_CHAT_HOST_ATTR, "true");`);

if (markControlHostIndex < 0 || setGuestHostIndex < 0 || markControlHostIndex > setGuestHostIndex) {
  throw new Error("guest chat header control host must be marked before hiding native chat children.");
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

if (!backgroundSource.includes("showGuestChatToggleButton: options?.showGuestChatToggleButton !== false")) {
  throw new Error("background script must normalize the guest chat button visibility option.");
}

if (!backgroundSource.includes("showHeaderSettingsButton: options?.showHeaderSettingsButton !== false")) {
  throw new Error("background script must normalize the header settings button visibility option.");
}

if (!backgroundSource.includes("showDonationRanking: options?.showDonationRanking !== false")) {
  throw new Error("background script must normalize the donation ranking visibility option.");
}

if (!backgroundSource.includes("useMiniFloatingChat: options?.useMiniFloatingChat === true")) {
  throw new Error("background script must normalize the mini floating chat option.");
}

if (!backgroundSource.includes("miniFloatingChatFullscreenOnly: options?.miniFloatingChatFullscreenOnly === true")) {
  throw new Error("background script must normalize the mini floating chat fullscreen-only option.");
}

if (!backgroundSource.includes("showMiniFloatingChatButton: options?.showMiniFloatingChatButton !== false")) {
  throw new Error("background script must normalize the mini floating chat button visibility option.");
}

if (!backgroundSource.includes("miniFloatingChatBounds: normalizeMiniChatBounds(options?.miniFloatingChatBounds, {")) {
  throw new Error("background script must preserve mini floating chat bounds.");
}

if (!backgroundSource.includes("miniFloatingChatInputOnly")) {
  throw new Error("background script must preserve the mini floating chat input-only option.");
}

if (!backgroundSource.includes("miniFloatingChatExpandedBounds: normalizeOptionalMiniChatBounds(options?.miniFloatingChatExpandedBounds)")) {
  throw new Error("background script must preserve mini floating chat expanded bounds.");
}

if (!backgroundSource.includes("miniFloatingChatScale: normalizeMiniChatScale(options?.miniFloatingChatScale)")) {
  throw new Error("background script must normalize the mini floating chat scale option.");
}

if (!popupSource.includes("miniFloatingChatInputOnly")) {
  throw new Error("popup script must preserve the mini floating chat input-only option.");
}

if (!popupSource.includes("miniFloatingChatExpandedBounds: normalizeOptionalMiniChatBounds(options?.miniFloatingChatExpandedBounds)")) {
  throw new Error("popup script must preserve mini floating chat expanded bounds.");
}

if (!popupSource.includes("miniFloatingChatScale: normalizeMiniChatScale(options?.miniFloatingChatScale)")) {
  throw new Error("popup script must preserve the mini floating chat scale option.");
}

if (!popupSource.includes("miniFloatingChatFullscreenOnly: options?.miniFloatingChatFullscreenOnly === true")) {
  throw new Error("popup script must preserve the mini floating chat fullscreen-only option.");
}

if (!contentSource.includes("showDonationRanking: true")) {
  throw new Error("content script must default the donation ranking visibility option on.");
}

if (!contentSource.includes('showDonationRanking: "chzzkChatUiToggleDonationRanking"')) {
  throw new Error("content script must expose the donation ranking option as a dataset flag.");
}

if (!contentSource.includes('html[data-chzzk-chat-ui-toggle-donation-ranking="off"]')) {
  throw new Error("content script must hide donation ranking when the option is off.");
}

if (!contentSource.includes('[class*="live_chatting_ranking_container" i]')) {
  throw new Error("content script must target the CHZZK live chat ranking container.");
}

const requiredMiniChatContentTokens = [
  "useMiniFloatingChat: false",
  "miniFloatingChatFullscreenOnly: false",
  "showMiniFloatingChatButton: true",
  "miniFloatingChatInputOnly: false",
  "miniFloatingChatBounds: normalizeMiniChatBounds(options?.miniFloatingChatBounds, {",
  "miniFloatingChatExpandedBounds: normalizeOptionalMiniChatBounds(options?.miniFloatingChatExpandedBounds)",
  "miniFloatingChatScale: normalizeMiniChatScale(options?.miniFloatingChatScale)",
  'const MINI_CHAT_PANEL_ID = "chzzk-chat-ui-toggle-mini-chat-panel";',
  'const MINI_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-mini-chat-frame";',
  'const MINI_CHAT_BUTTON_ID = "chzzk-chat-ui-toggle-mini-chat-button";',
  'const MINI_CHAT_PANEL_CONTROLS_CLASS = "chzzk-chat-ui-toggle-mini-chat__controls";',
  'const MINI_CHAT_PANEL_SCALE_CLASS = "chzzk-chat-ui-toggle-mini-chat__scale";',
  'const MINI_CHAT_PANEL_MODE_CLASS = "chzzk-chat-ui-toggle-mini-chat__mode";',
  'const MINI_CHAT_PANEL_INPUT_ONLY_CLASS = "chzzk-chat-ui-toggle-mini-chat__input-only";',
  'const MINI_CHAT_PANEL_RESIZE_CLASS = "chzzk-chat-ui-toggle-mini-chat__resize";',
  'const MINI_CHAT_HIDDEN_CONTROL_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-hidden-control";',
  'const MINI_CHAT_COMPACT_INPUT_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-compact-input";',
  'const MINI_CHAT_INPUT_ONLY_PATH_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-path";',
  'const MINI_CHAT_INPUT_ONLY_KEEP_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-keep";',
  'const MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-hidden";',
  'const MINI_CHAT_FULLSCREEN_HOST_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-fullscreen-host";',
  'const MINI_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleMini";',
  'const FULLSCREEN_UNSUPPORTED_MINI_CHAT_HOST_TAG_NAMES = new Set(["VIDEO", "AUDIO", "CANVAS", "IFRAME", "IMG"]);',
  "const MINI_CHAT_MIN_HEIGHT = 28;",
  "const MINI_CHAT_INPUT_ONLY_HEIGHT = 116;",
  "const MINI_CHAT_INPUT_ONLY_BOX_HEIGHT = 52;",
  "const MINI_CHAT_INPUT_ONLY_FIELD_MAX_HEIGHT = 36;",
  "const MINI_CHAT_INPUT_ONLY_CONTROL_INSET = 24;",
  "const MINI_CHAT_SCALE_MIN = 50;",
  "const MINI_CHAT_SCALE_MAX = 150;",
  "const MINI_CHAT_SCALE_STEP = 10;",
  "const MINI_CHAT_SCALE_DEFAULT = 100;",
  "function normalizeMiniChatScale(value)",
  "function getMiniChatFrameUrl()",
  "function createMiniFloatingChatPanel()",
  "function syncMiniFloatingChatPanel()",
  "function createMiniChatToggleButton()",
  "function getMiniChatLayoutTopForVisualTop(visualTop, height, scale = currentOptions.miniFloatingChatScale)",
  "function toggleMiniChatInputOnly()",
  "function updateMiniChatScale(delta)",
  "function canHostMiniChatFullscreenPanel(element)",
  "function getMiniChatPanelHost()",
  "function moveMiniChatPanelToHost(panel, host)",
  "function handleMiniChatFullscreenChange()",
  "function shouldRenderMiniFloatingChatPanel()",
  "currentOptions.miniFloatingChatFullscreenOnly",
  "function annotateMiniChatHiddenControls()",
  "function markMiniChatInputOnlyLayout()",
  "function findMiniChatInputOnlyContainer(root = document)",
  "function hasMiniChatInputField(element)",
  "function findMiniChatCompactInputContainer(actionRow)",
  "markMiniChatCompactInputContainer(actionRow);",
  "!hasMiniChatInputField(current)",
  "transform: scale(var(--chzzk-chat-ui-toggle-mini-chat-scale, 1)) !important;",
  "transform-origin: left bottom !important;",
  "function getMiniChatScaleRatio(scale = currentOptions.miniFloatingChatScale)",
  "clampMiniChatBoundsToViewport(currentBounds, {",
  "scale: nextScale,",
  "applyMiniChatPanelBounds(panel, nextBounds, {",
  "miniFloatingChatBounds: nextBounds",
  "getMiniChatInputOnlyBounds(expandedBounds, { visualTop });",
  "patch.miniFloatingChatExpandedBounds = getMiniChatExpandedBoundsFromInputOnly(nextBounds);",
  "#${MINI_CHAT_PANEL_ID}[data-input-only=\"true\"]",
  "data-chzzk-chat-ui-toggle-mini-floating-chat-input-only=\"on\"",
  "border-color: transparent !important;",
  "box-shadow: none !important;",
  "top: Number.isFinite(styledTop) ? styledTop : rect.bottom - height",
  "visualTop: rect.top",
  "visualTop - height * (1 - miniChatResizeState.scaleRatio)",
  "\"--chzzk-chat-ui-toggle-mini-chat-scale\",",
  "scaleControls.dataset.miniChatScaleControls = \"true\";",
  "modeControls.dataset.miniChatMode = \"true\";",
  "actions.append(closeButton);",
  ".chzzk-chat-ui-toggle-mini-chat-button[aria-pressed=\"true\"]",
  ".chzzk-chat-ui-toggle-mini-chat-button:hover",
  "background: transparent !important;",
  "color: rgba(32, 36, 40, 0.72) !important;",
  "background: rgba(0, 196, 113, 0.14) !important;",
  ".${MINI_CHAT_BUTTON_ICON_CLASS} svg",
  "M5.2 4.2h7.6c1.35 0 2.2.85 2.2 2.05",
  "circle cx=\"7.2\" cy=\"8.35\" r=\"0.8\"",
  ":fullscreen #${MINI_CHAT_PANEL_ID}",
  "panel.setAttribute(MINI_CHAT_FULLSCREEN_HOST_ATTR, \"true\");",
  "moveMiniChatPanelToHost(panel, panelHost);",
  "document.addEventListener(\"fullscreenchange\", handleMiniChatFullscreenChange);",
  "inputOnlyButton.textContent = \"ㅁ\";",
  "inputOnlyButton.setAttribute(\"aria-pressed\", String(isInputOnly));",
  "scaleDownButton.dataset.miniChatScaleDelta = String(-MINI_CHAT_SCALE_STEP);",
  "scaleUpButton.dataset.miniChatScaleDelta = String(MINI_CHAT_SCALE_STEP);",
  "*::-webkit-scrollbar",
  "scrollbar-width: none !important;",
  "background: transparent !important;",
  "[${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}=\"true\"]:focus-within",
  "[${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}=\"true\"] textarea",
  "#${MINI_CHAT_PANEL_ID}[data-input-only=\"true\"] .${MINI_CHAT_PANEL_CONTROLS_CLASS}",
  "width: calc(100% - ${MINI_CHAT_INPUT_ONLY_CONTROL_INSET * 2}px) !important;",
  "margin: 0 ${MINI_CHAT_INPUT_ONLY_CONTROL_INSET}px !important;",
  "border-radius: 0 0 6px 6px !important;",
  "#${MINI_CHAT_PANEL_ID}[data-input-only=\"true\"] .${MINI_CHAT_PANEL_RESIZE_CLASS}",
  "right: ${MINI_CHAT_INPUT_ONLY_CONTROL_INSET}px !important;",
  "height: auto !important;",
  "max-height: ${MINI_CHAT_INPUT_ONLY_FIELD_MAX_HEIGHT}px !important;",
  "line-height: normal !important;",
  "resize: none !important;",
  "getCompactText(control).includes(\"후원하기\")",
  "getCompactText(control) === \"채팅\"",
  "annotateMiniChatHiddenControls();",
  "function handleMiniChatResizeStart(event)",
  "function handleMiniChatResizeMove(event)",
  "function handleMiniChatResizeEnd(event)",
  'panel.setAttribute("aria-label", "미니 채팅");',
  "controlsBar.addEventListener(\"pointerdown\", handleMiniChatDragStart);",
  "resizeHandle.addEventListener(\"pointerdown\", handleMiniChatResizeStart);",
  "controlsBar.append(scaleControls, modeControls, actions);",
  "panel.append(body, controlsBar, resizeHandle);",
  "isExistingPanel ? readMiniChatPanelBounds(panel) : currentOptions.miniFloatingChatBounds",
  "frameUrl.searchParams.set(MINI_CHAT_FRAME_MARKER_PARAM, \"1\");",
  "syncMiniFloatingChatPanel();"
];

for (const token of requiredMiniChatContentTokens) {
  if (!contentSource.includes(token)) {
    throw new Error(`content script must implement mini floating chat: ${token}`);
  }
}

const forbiddenMiniChatContentTokens = [
  "MINI_CHAT_PANEL_COLLAPSE_CLASS",
  "mini-chat-collapse",
  "collapseButton"
];

for (const token of forbiddenMiniChatContentTokens) {
  if (contentSource.includes(token)) {
    throw new Error(`content script must not include the removed mini chat collapse control: ${token}`);
  }
}

const miniChatInputOnlyKeepRuleMatch = contentSource.match(
  /\[\$\{MINI_CHAT_INPUT_ONLY_KEEP_ATTR\}="true"\]\s*\{([\s\S]*?)\n\s*\}/
);
if (!miniChatInputOnlyKeepRuleMatch) {
  throw new Error("content script must preserve the mini floating chat input-only keep rule.");
}
const miniChatInputOnlyKeepRule = miniChatInputOnlyKeepRuleMatch[1];
for (const requiredKeepToken of [
  "height: ${MINI_CHAT_INPUT_ONLY_BOX_HEIGHT}px !important;",
  "background: rgba(226, 227, 232, 0.98) !important;",
  "overflow: hidden !important;"
]) {
  if (!miniChatInputOnlyKeepRule.includes(requiredKeepToken)) {
    throw new Error("input-only mode must pin the chat input box size and background.");
  }
}
for (const forbiddenKeepToken of [
  "background: transparent !important;",
  "border-color: transparent !important;",
  "box-shadow: none !important;"
]) {
  if (miniChatInputOnlyKeepRule.includes(forbiddenKeepToken)) {
    throw new Error("input-only mode must keep the original chat input box styling.");
  }
}

if (contentSource.includes("전송은 치지직 원래 채팅창에서 처리됩니다")) {
  throw new Error("mini floating chat must not render the explanatory footer text.");
}

if (
  contentSource.includes("MINI_CHAT_PANEL_HEADER_CLASS") ||
  contentSource.includes("MINI_CHAT_PANEL_TITLE_ID") ||
  contentSource.includes('title.textContent = "미니 채팅"')
) {
  throw new Error("mini floating chat must not render the old top title bar.");
}

const guestChatToggleVisibilityStart = contentSource.indexOf("function ensureGuestChatToggleButton()");
const guestChatToggleTargetStart = contentSource.indexOf("function hasChatLikeText", guestChatToggleVisibilityStart);
const guestChatToggleVisibilitySource =
  guestChatToggleVisibilityStart >= 0 && guestChatToggleTargetStart > guestChatToggleVisibilityStart
    ? contentSource.slice(guestChatToggleVisibilityStart, guestChatToggleTargetStart)
    : "";

if (!guestChatToggleVisibilitySource.includes("if (currentOptions.showGuestChatToggleButton)")) {
  throw new Error("content script must gate only the guest chat header button behind its visibility option.");
}

if (!guestChatToggleVisibilitySource.includes("existingButton?.remove();")) {
  throw new Error("content script must remove the guest chat header button when its visibility option is off.");
}

if (!guestChatToggleVisibilitySource.includes("const nextSibling = settingsButton instanceof HTMLButtonElement ? settingsButton : target.before;")) {
  throw new Error("content script must keep the settings button to the right of the guest chat header button.");
}

if (!guestChatToggleVisibilitySource.includes("target.container.insertBefore(settingsButton, target.before);")) {
  throw new Error("content script must keep the settings button available when the guest chat button is hidden.");
}

if (!guestChatToggleVisibilitySource.includes("currentOptions.showHeaderSettingsButton && canRenderHeaderSettingsButton()")) {
  throw new Error("content script must gate the header settings button behind its visibility option.");
}

if (!guestChatToggleVisibilitySource.includes("if (currentOptions.showMiniFloatingChatButton)")) {
  throw new Error("content script must gate the mini floating chat header button behind its visibility option.");
}

if (!guestChatToggleVisibilitySource.includes("existingMiniChatButton?.remove();")) {
  throw new Error("content script must remove the mini floating chat button when its visibility option is off.");
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

if (!popupMarkup.includes('id="settingsTab"') || !popupMarkup.includes('id="settingsPanel"')) {
  throw new Error("popup must include a settings tab.");
}

if (!popupMarkup.includes('id="showGuestChatToggleButton"')) {
  throw new Error("popup must include a guest chat button visibility toggle.");
}

if (!popupSource.includes('"showGuestChatToggleButton"')) {
  throw new Error("popup script must store and apply the guest chat button visibility option.");
}

if (!popupMarkup.includes('id="showHeaderSettingsButton"')) {
  throw new Error("popup must include a header settings button visibility toggle.");
}

if (!popupSource.includes('"showHeaderSettingsButton"')) {
  throw new Error("popup script must store and apply the header settings button visibility option.");
}

if (!popupMarkup.includes('id="useMiniFloatingChat"')) {
  throw new Error("popup must include a mini floating chat toggle.");
}

if (!popupSource.includes('"useMiniFloatingChat"')) {
  throw new Error("popup script must store and apply the mini floating chat option.");
}

if (!popupMarkup.includes('id="miniFloatingChatFullscreenOnly"')) {
  throw new Error("popup must include a mini floating chat fullscreen-only toggle.");
}

if (!popupSource.includes('"miniFloatingChatFullscreenOnly"')) {
  throw new Error("popup script must store and apply the mini floating chat fullscreen-only option.");
}

if (!popupMarkup.includes('id="showMiniFloatingChatButton"')) {
  throw new Error("popup must include a mini floating chat button visibility toggle.");
}

if (!popupSource.includes('"showMiniFloatingChatButton"')) {
  throw new Error("popup script must store and apply the mini floating chat button visibility option.");
}

if (!popupSource.includes("...currentOptions")) {
  throw new Error("popup script must preserve mini floating chat bounds when toggles change.");
}

if (!popupMarkup.includes('id="showDonationRanking"')) {
  throw new Error("popup must include a donation ranking visibility toggle.");
}

if (!popupSource.includes('"showDonationRanking"')) {
  throw new Error("popup script must store and apply the donation ranking visibility option.");
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

const scanRowsStart = contentSource.indexOf("function scanRows(rows)");
const scanRowsEnd = contentSource.indexOf("function scan()", scanRowsStart);
const scanRowsSource =
  scanRowsStart >= 0 && scanRowsEnd > scanRowsStart
    ? contentSource.slice(scanRowsStart, scanRowsEnd)
    : "";

if (!scanRowsSource.includes("cleanupRows(uniqueRows);")) {
  throw new Error("content script must keep row-level scans scoped to the collected chat rows.");
}

if (scanRowsSource.includes("cleanupUnscopedAnnotations();")) {
  throw new Error("content script must not run full-document cleanup for each row-level scan.");
}

const observerStart = contentSource.indexOf("observer = new MutationObserver");
const observerEnd = contentSource.indexOf("observer.observe(target", observerStart);
const observerSource =
  observerStart >= 0 && observerEnd > observerStart
    ? contentSource.slice(observerStart, observerEnd)
    : "";

if (!observerSource.includes("scheduleScan();")) {
  throw new Error("content script must coalesce non-row mutation fallback scans.");
}

if (observerSource.includes("} else {\n          scan();")) {
  throw new Error("content script must not run immediate full scans for non-row mutations.");
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
