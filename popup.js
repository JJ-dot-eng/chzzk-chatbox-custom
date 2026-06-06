const STORAGE_KEY = "chzzkChatUiToggleOptions";
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

function sendOptionsToTab(tabId, options) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tabId,
      {
        type: "CHZZK_CHAT_UI_TOGGLE_SET_OPTIONS",
        options: normalizeOptions(options)
      },
      () => {
        resolve(!chrome.runtime.lastError);
      }
    );
  });
}

async function applyToActiveTab(options) {
  const tab = await queryActiveTab();

  if (!tab?.id || !tab.url?.startsWith("https://chzzk.naver.com/")) {
    setStatus("치지직 탭 아님");
    return;
  }

  const applied = await sendOptionsToTab(tab.id, options);
  setStatus(applied ? "적용됨" : "새로고침 필요");
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
