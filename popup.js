const STORAGE_KEY = "chzzkChatUiToggleOptions";
const CONTENT_VERSION = "0.1.1";

const DEFAULT_OPTIONS = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true
};

const controlIds = ["showNicknames", "showBadges", "showTimestamps", "showChatBoxes"];
const controls = Object.fromEntries(controlIds.map((id) => [id, document.getElementById(id)]));
const statusElement = document.getElementById("status");

function normalizeOptions(options) {
  return {
    showNicknames: options?.showNicknames !== false,
    showBadges: options?.showBadges !== false,
    showTimestamps: options?.showTimestamps !== false,
    showChatBoxes: options?.showChatBoxes !== false
  };
}

function setStatus(message) {
  statusElement.textContent = message;
}

function setControls(options) {
  const normalized = normalizeOptions(options);

  for (const id of controlIds) {
    controls[id].checked = normalized[id];
  }
}

function readControls() {
  return normalizeOptions({
    showNicknames: controls.showNicknames.checked,
    showBadges: controls.showBadges.checked,
    showTimestamps: controls.showTimestamps.checked,
    showChatBoxes: controls.showChatBoxes.checked
  });
}

function getStoredOptions() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(normalizeOptions(result?.[STORAGE_KEY] ?? DEFAULT_OPTIONS));
    });
  });
}

function setStoredOptions(options) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: normalizeOptions(options) }, resolve);
  });
}

function queryActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      resolve(tab);
    });
  });
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }

      resolve(response ?? null);
    });
  });
}

function executeContentScript(tabId) {
  return new Promise((resolve) => {
    if (!chrome.scripting?.executeScript) {
      resolve(false);
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId, allFrames: true },
        files: ["content.js"]
      },
      () => {
        resolve(!chrome.runtime.lastError);
      }
    );
  });
}

function getContentStatus(tabId) {
  return sendMessageToTab(tabId, {
    type: "CHZZK_CHAT_UI_TOGGLE_GET_STATUS"
  });
}

function refreshContent(tabId) {
  return sendMessageToTab(tabId, {
    type: "CHZZK_CHAT_UI_TOGGLE_REFRESH"
  });
}

function sendOptionsToTab(tabId, options) {
  return sendMessageToTab(tabId, {
    type: "CHZZK_CHAT_UI_TOGGLE_SET_OPTIONS",
    options: normalizeOptions(options)
  });
}

function isCurrentContentStatus(status) {
  return status?.version === CONTENT_VERSION && status?.styleVersion === CONTENT_VERSION;
}

async function ensureCurrentContentScript(tabId) {
  let status = await getContentStatus(tabId);

  if (isCurrentContentStatus(status)) {
    return true;
  }

  if (status?.version === CONTENT_VERSION) {
    status = await refreshContent(tabId);
    return isCurrentContentStatus(status);
  }

  const injected = await executeContentScript(tabId);

  if (!injected) {
    return false;
  }

  status = await getContentStatus(tabId);
  return isCurrentContentStatus(status);
}

async function applyToActiveTab(options) {
  const tab = await queryActiveTab();

  if (!tab?.id || !tab.url?.startsWith("https://chzzk.naver.com/")) {
    setStatus("치지직 탭 아님");
    return;
  }

  const ready = await ensureCurrentContentScript(tab.id);
  const applied = await sendOptionsToTab(tab.id, options);
  setStatus(ready && applied?.ok ? "적용됨" : "새로고침 필요");
}

async function handleControlChange() {
  const options = readControls();
  await setStoredOptions(options);
  await applyToActiveTab(options);
}

async function init() {
  const options = await getStoredOptions();
  setControls(options);
  await applyToActiveTab(options);

  for (const id of controlIds) {
    controls[id].addEventListener("change", handleControlChange);
  }
}

init().catch(() => {
  setControls(DEFAULT_OPTIONS);
  setStatus("초기화 실패");
});
