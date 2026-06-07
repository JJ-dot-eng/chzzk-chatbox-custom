const STORAGE_KEY = "chzzkChatUiToggleOptions";
const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
const SET_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_OPTIONS";
const READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";
const SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";
const APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";
const CONTENT_SCRIPT_FILE = "content.js";
const CHZZK_HOST_SUFFIX = ".chzzk.naver.com";
const INJECTION_DELAYS_MS = [0, 250, 1000, 2500, 5000];
const LIVE_CHANNEL_ID_PATTERN = /^[0-9a-f]{32}$/i;
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
  useGuestChatFrame: false,
  showGuestChatToggleButton: true,
  showLargeText: false,
  showBoldText: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const guestChatThemesByTab = new Map();

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
    useGuestChatFrame: options?.useGuestChatFrame === true,
    showGuestChatToggleButton: options?.showGuestChatToggleButton !== false,
    showLargeText: options?.showLargeText === true,
    showBoldText: options?.showBoldText === true || legacyBoldText,
    chatBoxColor: normalizeHexColor(options?.chatBoxColor)
  };
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object ?? {}, key);
}

function normalizeGuestChatTheme(value) {
  return value === "dark" || value === "light" ? value : null;
}

function normalizeChannelId(value) {
  return typeof value === "string" && LIVE_CHANNEL_ID_PATTERN.test(value)
    ? value.toLowerCase()
    : null;
}

function getGuestChatTheme(tabId, channelId) {
  const tabThemes = guestChatThemesByTab.get(tabId);

  return tabThemes?.get(channelId) || null;
}

function setGuestChatTheme(tabId, channelId, theme) {
  let tabThemes = guestChatThemesByTab.get(tabId);

  if (!tabThemes) {
    tabThemes = new Map();
    guestChatThemesByTab.set(tabId, tabThemes);
  }

  const entry = {
    channelId,
    theme,
    updatedAt: Date.now()
  };

  tabThemes.set(channelId, entry);
  return entry;
}

function broadcastGuestChatTheme(tabId, entry) {
  chrome.tabs.sendMessage(
    tabId,
    {
      type: APPLY_GUEST_CHAT_THEME_MESSAGE,
      channelId: entry.channelId,
      theme: entry.theme,
      source: "background"
    },
    () => {
      void chrome.runtime.lastError;
    }
  );
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

chrome.tabs.onRemoved.addListener((tabId) => {
  guestChatThemesByTab.delete(tabId);
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

  if (message?.type === SET_GUEST_CHAT_THEME_MESSAGE) {
    const tabId = _sender.tab?.id;
    const channelId = normalizeChannelId(message.channelId);
    const theme = normalizeGuestChatTheme(message.theme);

    if (!Number.isInteger(tabId) || !channelId || !theme) {
      sendResponse({ ok: false, error: "invalid-guest-chat-theme" });
      return false;
    }

    const entry = setGuestChatTheme(tabId, channelId, theme);
    broadcastGuestChatTheme(tabId, entry);
    sendResponse({ ok: true, theme, channelId });
    return false;
  }

  if (message?.type === READ_GUEST_CHAT_THEME_MESSAGE) {
    const tabId = _sender.tab?.id;
    const channelId = normalizeChannelId(message.channelId);

    if (!Number.isInteger(tabId) || !channelId) {
      sendResponse({ ok: false, error: "invalid-guest-chat-theme-request" });
      return false;
    }

    const entry = getGuestChatTheme(tabId, channelId);

    sendResponse({
      ok: true,
      found: Boolean(entry),
      channelId,
      theme: entry?.theme || null,
      updatedAt: entry?.updatedAt || null,
      source: "background"
    });
    return false;
  }

  return false;
});
