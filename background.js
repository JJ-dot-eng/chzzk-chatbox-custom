const STORAGE_KEY = "chzzkChatUiToggleOptions";
const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
const SET_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_OPTIONS";
const OPEN_INCOGNITO_CHAT_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_INCOGNITO_CHAT";
const CONTENT_SCRIPT_FILE = "content.js";
const CHZZK_ORIGIN = "https://chzzk.naver.com";
const CHZZK_HOST_SUFFIX = ".chzzk.naver.com";
const INJECTION_DELAYS_MS = [0, 250, 1000, 2500, 5000];
const LIVE_CHANNEL_ID_PATTERN = /^[0-9a-f]{32}$/i;
const CHAT_POPUP_WINDOW = {
  width: 400,
  height: 550,
  left: 50,
  top: 50
};
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

function readStoredOptions(callback) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const error = chrome.runtime.lastError;

    if (error) {
      callback(null);
      return;
    }

    const found = hasOwn(result, STORAGE_KEY);
    callback(normalizeOptions(found ? result[STORAGE_KEY] : DEFAULT_OPTIONS));
  });
}

function isChzzkUrl(url) {
  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === "https:" &&
      (parsedUrl.hostname === "chzzk.naver.com" || parsedUrl.hostname.endsWith(CHZZK_HOST_SUFFIX))
    );
  } catch (_error) {
    return false;
  }
}

function extractLiveChannelId(url) {
  try {
    const parsedUrl = new URL(url);

    if (!isChzzkUrl(url)) {
      return null;
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (pathParts[0] === "live" && LIVE_CHANNEL_ID_PATTERN.test(pathParts[1] || "")) {
      return pathParts[1].toLowerCase();
    }

    if (pathParts.length === 1 && LIVE_CHANNEL_ID_PATTERN.test(pathParts[0])) {
      return pathParts[0].toLowerCase();
    }

    return null;
  } catch (_error) {
    return null;
  }
}

function getLiveChatPopupUrl(pageUrl) {
  const channelId = extractLiveChannelId(pageUrl);

  return channelId ? `${CHZZK_ORIGIN}/live/${channelId}/chat` : null;
}

function openIncognitoChatPopup(pageUrl, sendResponse) {
  const chatUrl = getLiveChatPopupUrl(pageUrl);

  if (!chatUrl) {
    sendResponse({ ok: false, error: "unsupported-url" });
    return;
  }

  if (!chrome.windows?.create) {
    sendResponse({ ok: false, error: "windows-api-unavailable" });
    return;
  }

  chrome.windows.create(
    {
      url: chatUrl,
      type: "popup",
      incognito: true,
      focused: true,
      ...CHAT_POPUP_WINDOW
    },
    (window) => {
      const error = chrome.runtime.lastError;

      if (error) {
        sendResponse({ ok: false, error: error.message || "window-create-failed" });
        return;
      }

      sendResponse({
        ok: true,
        url: chatUrl,
        windowId: Number.isInteger(window?.id) ? window.id : null
      });
    }
  );
}

function injectContentScript(tabId) {
  if (!Number.isInteger(tabId) || tabId < 0 || !chrome.scripting?.executeScript) {
    return;
  }

  chrome.scripting.executeScript(
    {
      target: { tabId, allFrames: true },
      files: [CONTENT_SCRIPT_FILE]
    },
    () => {
      // Some subframes can be unavailable or outside granted origins during navigation.
      // The manifest content script still handles matched frames; this is only a repair pass.
      void chrome.runtime.lastError;
      pushStoredOptionsToTab(tabId);
    }
  );
}

function pushStoredOptionsToTab(tabId) {
  readStoredOptions((options) => {
    if (!options) {
      return;
    }

    chrome.tabs.sendMessage(
      tabId,
      {
        type: SET_OPTIONS_MESSAGE,
        options
      },
      () => {
        // The content script may not be ready yet. Scheduled retries will try again.
        void chrome.runtime.lastError;
      }
    );
  });
}

function scheduleContentScriptInjection(tabId) {
  for (const delay of INJECTION_DELAYS_MS) {
    setTimeout(() => injectContentScript(tabId), delay);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  // Keeps a stable MV3 service worker target available for extension verification.
});

chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({ url: ["https://chzzk.naver.com/*", "https://*.chzzk.naver.com/*"] }, (tabs) => {
    if (chrome.runtime.lastError) {
      return;
    }

    for (const tab of tabs) {
      scheduleContentScriptInjection(tab.id);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isChzzkUrl(changeInfo.url || tab.url || "")) {
    return;
  }

  if (changeInfo.status && changeInfo.status !== "loading" && changeInfo.status !== "complete") {
    return;
  }

  scheduleContentScriptInjection(tabId);
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0 || !isChzzkUrl(details.url)) {
    return;
  }

  scheduleContentScriptInjection(details.tabId);
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0 || !isChzzkUrl(details.url)) {
    return;
  }

  scheduleContentScriptInjection(details.tabId);
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0 || !isChzzkUrl(details.url)) {
    return;
  }

  scheduleContentScriptInjection(details.tabId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === READ_OPTIONS_MESSAGE) {
    getStoredOptions(sendResponse);
    return true;
  }

  if (message?.type === OPEN_INCOGNITO_CHAT_MESSAGE) {
    openIncognitoChatPopup(message.pageUrl, sendResponse);
    return true;
  }

  return false;
});
