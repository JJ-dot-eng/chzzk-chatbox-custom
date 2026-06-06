import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const contentSource = await readFile(path.join(root, "content.js"), "utf8");

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
