const STORAGE_KEY = "chzzkChatUiToggleOptions";
const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
const DEFAULT_CHAT_BOX_COLOR = "#808080";
const NAMED_CHAT_BOX_COLORS = {
  gray: "#808080",
  green: "#00c471",
  blue: "#4b8bff",
  purple: "#8b5cf6",
  yellow: "#f5bd23"
};

const DEFAULT_OPTIONS = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true,
  showLargeText: false,
  showBoldText: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

function normalizeHexColor(value) {
  if (typeof value !== "string") {
    return DEFAULT_CHAT_BOX_COLOR;
  }

  const mappedValue = NAMED_CHAT_BOX_COLORS[value] || value;
  const trimmed = mappedValue.trim();
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }

  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return hex.toLowerCase();
  }

  return DEFAULT_CHAT_BOX_COLOR;
}

function normalizeOptions(options) {
  const legacyBoldText = options?.showBoldText === undefined && options?.showLargeText === true;

  return {
    showNicknames: options?.showNicknames !== false,
    showBadges: options?.showBadges !== false,
    showTimestamps: options?.showTimestamps !== false,
    showChatBoxes: options?.showChatBoxes !== false,
    showLargeText: options?.showLargeText === true,
    showBoldText: options?.showBoldText === true || legacyBoldText,
    chatBoxColor: normalizeHexColor(options?.chatBoxColor)
  };
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object ?? {}, key);
}

function getStoredOptions(sendResponse) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const error = chrome.runtime.lastError;

    if (error) {
      sendResponse({ ok: false, error: error.message || "storage-local-error" });
      return;
    }

    const found = hasOwn(result, STORAGE_KEY);

    sendResponse({
      ok: true,
      found,
      options: normalizeOptions(found ? result[STORAGE_KEY] : DEFAULT_OPTIONS)
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  // Keeps a stable MV3 service worker target available for extension verification.
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== READ_OPTIONS_MESSAGE) {
    return false;
  }

  getStoredOptions(sendResponse);
  return true;
});
