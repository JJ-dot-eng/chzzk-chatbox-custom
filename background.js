const STORAGE_KEY = "chzzkChatUiToggleOptions";
const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
const OPEN_POPUP_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_POPUP";
const READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";
const SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";
const APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";
const LIVE_CHANNEL_ID_PATTERN = /^[0-9a-f]{32}$/i;
const DEFAULT_CHAT_BOX_COLOR = "#808080";
const MINI_CHAT_MIN_WIDTH = 280;
const MINI_CHAT_MIN_HEIGHT = 28;
const MINI_CHAT_INPUT_ONLY_HEIGHT = 116;
const MINI_CHAT_MAX_WIDTH = 720;
const MINI_CHAT_MAX_HEIGHT = 900;
const MINI_CHAT_DEFAULT_WIDTH = 360;
const MINI_CHAT_DEFAULT_HEIGHT = 520;
const MINI_CHAT_SCALE_MIN = 50;
const MINI_CHAT_SCALE_MAX = 150;
const MINI_CHAT_SCALE_STEP = 10;
const MINI_CHAT_SCALE_DEFAULT = 100;
const CHAT_FONT_SIZE_PT_MIN = 8;
const CHAT_FONT_SIZE_PT_MAX = 36;
const CHAT_FONT_SIZE_PT_DEFAULT = 13;
const DEFAULT_CHAT_TEXT_COLOR = "#101418";
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
  showNonChatPanels: true,
  showChatBoxes: true,
  useGuestChatFrame: false,
  useMiniFloatingChat: false,
  miniFloatingChatFullscreenOnly: false,
  showGuestChatToggleButton: true,
  showHeaderSettingsButton: true,
  showMiniFloatingChatButton: true,
  miniFloatingChatCollapsed: false,
  miniFloatingChatInputOnly: false,
  miniFloatingChatBounds: {
    left: null,
    top: null,
    width: MINI_CHAT_DEFAULT_WIDTH,
    height: MINI_CHAT_DEFAULT_HEIGHT
  },
  miniFloatingChatExpandedBounds: null,
  miniFloatingChatScale: MINI_CHAT_SCALE_DEFAULT,
  showLargeText: false,
  chatFontSizePt: CHAT_FONT_SIZE_PT_DEFAULT,
  useNicknameFontSize: false,
  nicknameFontSizePt: CHAT_FONT_SIZE_PT_DEFAULT,
  showBoldText: false,
  useChatTextColor: false,
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const guestChatThemesByTab = new Map();

function normalizeHexColor(value, fallback = DEFAULT_CHAT_BOX_COLOR) {
  if (typeof value !== "string") {
    return fallback;
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

  return fallback;
}

function normalizeOptions(options) {
  const legacyBoldText = options?.showBoldText === undefined && options?.showLargeText === true;
  const miniFloatingChatInputOnly = options?.miniFloatingChatInputOnly === true;
  const showNonChatPanels =
    options?.showNonChatPanels !== undefined
      ? options.showNonChatPanels !== false
      : options?.showDonationRanking !== false;

  return {
    showNicknames: options?.showNicknames !== false,
    showBadges: options?.showBadges !== false,
    showTimestamps: options?.showTimestamps !== false,
    showNonChatPanels,
    showChatBoxes: options?.showChatBoxes !== false,
    useGuestChatFrame: options?.useGuestChatFrame === true,
    useMiniFloatingChat: options?.useMiniFloatingChat === true,
    miniFloatingChatFullscreenOnly: options?.miniFloatingChatFullscreenOnly === true,
    showGuestChatToggleButton: options?.showGuestChatToggleButton !== false,
    showHeaderSettingsButton: options?.showHeaderSettingsButton !== false,
    showMiniFloatingChatButton: options?.showMiniFloatingChatButton !== false,
    miniFloatingChatCollapsed: false,
    miniFloatingChatInputOnly,
    miniFloatingChatBounds: normalizeMiniChatBounds(options?.miniFloatingChatBounds, {
      inputOnly: miniFloatingChatInputOnly
    }),
    miniFloatingChatExpandedBounds: normalizeOptionalMiniChatBounds(options?.miniFloatingChatExpandedBounds),
    miniFloatingChatScale: normalizeMiniChatScale(options?.miniFloatingChatScale),
    showLargeText: options?.showLargeText === true,
    chatFontSizePt: normalizeChatFontSizePt(options?.chatFontSizePt),
    useNicknameFontSize: options?.useNicknameFontSize === true,
    nicknameFontSizePt: normalizeChatFontSizePt(options?.nicknameFontSizePt),
    showBoldText: options?.showBoldText === true || legacyBoldText,
    useChatTextColor: options?.useChatTextColor === true,
    chatTextColor: normalizeHexColor(options?.chatTextColor, DEFAULT_CHAT_TEXT_COLOR),
    useNicknameColorForMessage: options?.useNicknameColorForMessage === true,
    chatBoxColor: normalizeHexColor(options?.chatBoxColor, DEFAULT_CHAT_BOX_COLOR)
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, number));
}

function normalizeMiniChatScale(value) {
  const clampedScale = clampNumber(
    value,
    MINI_CHAT_SCALE_MIN,
    MINI_CHAT_SCALE_MAX,
    MINI_CHAT_SCALE_DEFAULT
  );
  const steppedScale = Math.round(clampedScale / MINI_CHAT_SCALE_STEP) * MINI_CHAT_SCALE_STEP;

  return clampNumber(
    steppedScale,
    MINI_CHAT_SCALE_MIN,
    MINI_CHAT_SCALE_MAX,
    MINI_CHAT_SCALE_DEFAULT
  );
}

function normalizeChatFontSizePt(value) {
  const clampedFontSize = clampNumber(
    value,
    CHAT_FONT_SIZE_PT_MIN,
    CHAT_FONT_SIZE_PT_MAX,
    CHAT_FONT_SIZE_PT_DEFAULT
  );

  return clampNumber(
    Math.round(clampedFontSize),
    CHAT_FONT_SIZE_PT_MIN,
    CHAT_FONT_SIZE_PT_MAX,
    CHAT_FONT_SIZE_PT_DEFAULT
  );
}

function normalizeOptionalCoordinate(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getMiniChatMinHeight(inputOnly = false) {
  return inputOnly ? MINI_CHAT_INPUT_ONLY_HEIGHT : MINI_CHAT_MIN_HEIGHT;
}

function normalizeMiniChatBounds(bounds, { inputOnly = false } = {}) {
  const minHeight = getMiniChatMinHeight(inputOnly);
  const fallbackHeight = inputOnly ? MINI_CHAT_INPUT_ONLY_HEIGHT : MINI_CHAT_DEFAULT_HEIGHT;

  return {
    left: normalizeOptionalCoordinate(bounds?.left),
    top: normalizeOptionalCoordinate(bounds?.top),
    width: clampNumber(
      bounds?.width,
      MINI_CHAT_MIN_WIDTH,
      MINI_CHAT_MAX_WIDTH,
      MINI_CHAT_DEFAULT_WIDTH
    ),
    height: clampNumber(
      bounds?.height,
      minHeight,
      MINI_CHAT_MAX_HEIGHT,
      fallbackHeight
    )
  };
}

function normalizeOptionalMiniChatBounds(bounds) {
  if (!bounds || typeof bounds !== "object") {
    return null;
  }

  return normalizeMiniChatBounds(bounds);
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

function openExtensionPopup(sendResponse) {
  if (!chrome.action?.openPopup) {
    sendResponse({ ok: false, error: "open-popup-unavailable" });
    return false;
  }

  try {
    const result = chrome.action.openPopup();

    if (result && typeof result.then === "function") {
      result
        .then(() => sendResponse({ ok: true }))
        .catch((error) => {
          sendResponse({ ok: false, error: error?.message || String(error) });
        });
      return true;
    }

    sendResponse({ ok: true });
    return false;
  } catch (error) {
    sendResponse({ ok: false, error: error?.message || String(error) });
    return false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  // Keeps a stable MV3 service worker target available for extension verification.
});

chrome.tabs.onRemoved.addListener((tabId) => {
  guestChatThemesByTab.delete(tabId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === READ_OPTIONS_MESSAGE) {
    getStoredOptions(sendResponse);
    return true;
  }

  if (message?.type === OPEN_POPUP_MESSAGE) {
    return openExtensionPopup(sendResponse);
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
