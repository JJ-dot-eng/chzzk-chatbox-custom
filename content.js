(() => {
  const SCRIPT_VERSION = "0.3.14";
  const GLOBAL_KEY = `__chzzkChatUiToggleLoaded_${SCRIPT_VERSION}`;

  if (window[GLOBAL_KEY]) {
    return;
  }

  window[GLOBAL_KEY] = true;

  const STORAGE_KEY = "chzzkChatUiToggleOptions";
  const ROLE_ATTR = "data-chzzk-chat-ui-toggle-role";
  const CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-chat-row";
  const NATIVE_CHAT_ROW_SELECTOR = `:is([class*="live_chatting_list_item" i], [role="log"] [class*="_item_" i]):has(:is([class*="live_chatting_message_container" i], [class*="_chatting_message_" i]))`;
  const CHAT_ROW_SCOPE_SELECTOR = `:is([class*="live_chatting_list_item" i], [role="log"] [class*="_item_" i])[${CHAT_ROW_ATTR}="true"]`;
  const STYLE_ID = "chzzk-chat-ui-toggle-style";
  const CACHE_KEY = "chzzkChatUiToggleOptionsCache";
  const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
  const OPEN_POPUP_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_POPUP";
  const READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";
  const SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";
  const APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";
  const CHZZK_ORIGIN = "https://chzzk.naver.com";
  const STORAGE_READ_TIMEOUT_MS = 700;
  const OPTIONS_LOAD_RETRY_MS = 250;
  const OPTIONS_LOAD_MAX_ATTEMPTS = 20;
  const SCAN_DELAY_MS = 50;
  const SCAN_INTERVAL_MS = 5000;
  const FULL_CLEANUP_INTERVAL_MS = 10000;
  const UI_SYNC_DELAY_MS = 100;
  const THEME_SYNC_INTERVAL_MS = 3000;
  const GENERATED_TIMESTAMP_ATTR = "data-chzzk-chat-ui-toggle-generated-timestamp";
  const MESSAGE_PREFIX_ATTR = "data-chzzk-chat-ui-toggle-prefix";
  const GUEST_CHAT_FRAME_CONTAINER_ID = "chzzk-chat-ui-toggle-guest-chat-frame-container";
  const GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";
  const MINI_CHAT_PANEL_ID = "chzzk-chat-ui-toggle-mini-chat-panel";
  const MINI_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-mini-chat-frame";
  const MINI_CHAT_BUTTON_ID = "chzzk-chat-ui-toggle-mini-chat-button";
  const MINI_CHAT_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-mini-chat-button__icon";
  const MINI_CHAT_PANEL_CONTROLS_CLASS = "chzzk-chat-ui-toggle-mini-chat__controls";
  const MINI_CHAT_PANEL_SCALE_CLASS = "chzzk-chat-ui-toggle-mini-chat__scale";
  const MINI_CHAT_PANEL_SCALE_BUTTON_CLASS = "chzzk-chat-ui-toggle-mini-chat__scale-button";
  const MINI_CHAT_PANEL_SCALE_VALUE_CLASS = "chzzk-chat-ui-toggle-mini-chat__scale-value";
  const MINI_CHAT_PANEL_MODE_CLASS = "chzzk-chat-ui-toggle-mini-chat__mode";
  const MINI_CHAT_PANEL_INPUT_ONLY_CLASS = "chzzk-chat-ui-toggle-mini-chat__input-only";
  const MINI_CHAT_PANEL_MINIMIZE_CLASS = "chzzk-chat-ui-toggle-mini-chat__minimize";
  const MINI_CHAT_PANEL_CLOSE_CLASS = "chzzk-chat-ui-toggle-mini-chat__close";
  const MINI_CHAT_PANEL_RESIZE_CLASS = "chzzk-chat-ui-toggle-mini-chat__resize";
  const MINI_CHAT_BUBBLE_ID = "chzzk-chat-ui-toggle-mini-chat-bubble";
  const MINI_CHAT_BUBBLE_ICON_CLASS = "chzzk-chat-ui-toggle-mini-chat-bubble__icon";
  const GUEST_CHAT_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-host";
  const GUEST_CHAT_CONTROL_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-control-host";
  const GUEST_CHAT_THEME_ATTR = "data-chzzk-chat-ui-toggle-guest-theme";
  const GUEST_CHAT_EMBED_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-embed";
  const MINI_CHAT_EMBED_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-embed";
  const MINI_CHAT_HIDDEN_CONTROL_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-hidden-control";
  const MINI_CHAT_NON_CHAT_PANEL_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-non-chat-panel";
  const MINI_CHAT_COMPACT_INPUT_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-compact-input";
  const MINI_CHAT_INPUT_ONLY_PATH_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-path";
  const MINI_CHAT_INPUT_ONLY_KEEP_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-keep";
  const MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-hidden";
  const MINI_CHAT_FULLSCREEN_HOST_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-fullscreen-host";
  const GUEST_CHAT_CLEANBOT_DEFAULT_ATTR = "data-chzzk-chat-ui-toggle-guest-cleanbot-default";
  const LIVE_CHAT_FRAME_ATTR = "data-chzzk-chat-ui-toggle-live-chat-frame";
  const GUEST_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleGuest";
  const MINI_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleMini";
  const MINI_CHAT_MIN_WIDTH = 280;
  const MINI_CHAT_MIN_HEIGHT = 28;
  const MINI_CHAT_INPUT_ONLY_HEIGHT = 116;
  const MINI_CHAT_INPUT_ONLY_BOX_HEIGHT = 52;
  const MINI_CHAT_INPUT_ONLY_FIELD_MAX_HEIGHT = 36;
  const MINI_CHAT_INPUT_ONLY_CONTROL_INSET = 24;
  const MINI_CHAT_BUBBLE_SIZE = 44;
  const MINI_CHAT_MAX_WIDTH = 720;
  const MINI_CHAT_MAX_HEIGHT = 900;
  const MINI_CHAT_DEFAULT_WIDTH = 360;
  const MINI_CHAT_DEFAULT_HEIGHT = 520;
  const MINI_CHAT_VIEWPORT_MARGIN = 8;
  const MINI_CHAT_SCALE_MIN = 50;
  const MINI_CHAT_SCALE_MAX = 150;
  const MINI_CHAT_SCALE_STEP = 10;
  const MINI_CHAT_SCALE_DEFAULT = 100;
  const CHAT_FONT_SIZE_PT_MIN = 8;
  const CHAT_FONT_SIZE_PT_MAX = 36;
  const CHAT_FONT_SIZE_PT_DEFAULT = 13;
  const GUEST_CHAT_NATIVE_THEME_CLASSES = ["light", "dark", "theme_light", "theme_dark"];
  const GUEST_CHAT_CLEANBOT_STORAGE_KEY = "cleanbot";
  const GUEST_CHAT_CLEANBOT_DISABLED_VALUE = "false";
  const GUEST_CHAT_TOGGLE_BUTTON_ID = "chzzk-chat-ui-toggle-guest-chat-toggle";
  const GUEST_CHAT_TOGGLE_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-guest-chat-toggle__icon";
  const GUEST_CHAT_TOGGLE_BUTTON_SLASH_CLASS = "chzzk-chat-ui-toggle-guest-chat-toggle__slash";
  const HEADER_SETTINGS_BUTTON_ID = "chzzk-chat-ui-toggle-header-settings";
  const HEADER_SETTINGS_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-header-settings__icon";
  const LIVE_CHANNEL_ID_PATTERN = /^[0-9a-f]{32}$/i;
  const FULLSCREEN_UNSUPPORTED_MINI_CHAT_HOST_TAG_NAMES = new Set(["VIDEO", "AUDIO", "CANVAS", "IFRAME", "IMG"]);

  const DEFAULT_OPTIONS = {
    showNicknames: true,
    showBadges: true,
    showTimestamps: true,
    showDonationRanking: true,
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
    chatBoxColor: "#808080"
  };

  const DATASET_KEYS = {
    showNicknames: "chzzkChatUiToggleNicknames",
    showBadges: "chzzkChatUiToggleBadges",
    showTimestamps: "chzzkChatUiToggleTimestamps",
    showDonationRanking: "chzzkChatUiToggleDonationRanking",
    showChatBoxes: "chzzkChatUiToggleChatBoxes",
    useGuestChatFrame: "chzzkChatUiToggleGuestChatFrame",
    useMiniFloatingChat: "chzzkChatUiToggleMiniFloatingChat",
    miniFloatingChatFullscreenOnly: "chzzkChatUiToggleMiniFloatingChatFullscreenOnly",
    showGuestChatToggleButton: "chzzkChatUiToggleGuestChatToggleButton",
    showHeaderSettingsButton: "chzzkChatUiToggleHeaderSettingsButton",
    showMiniFloatingChatButton: "chzzkChatUiToggleMiniFloatingChatButton",
    miniFloatingChatInputOnly: "chzzkChatUiToggleMiniFloatingChatInputOnly",
    showLargeText: "chzzkChatUiToggleLargeText",
    useNicknameFontSize: "chzzkChatUiToggleNicknameFontSize",
    showBoldText: "chzzkChatUiToggleBoldText"
  };

  const NAMED_CHAT_BOX_COLORS = {
    gray: "#808080",
    green: "#00c471",
    blue: "#4b8bff",
    purple: "#8b5cf6",
    yellow: "#f5bd23"
  };

  const CHAT_ROOT_SELECTORS = [
    "[class*='live_chatting' i]",
    "[class*='chatting_area' i]",
    "[class*='chatting_list' i]",
    "[class*='chat_list' i]",
    "[class*='chat_area' i]",
    "[role='log']",
    "[aria-live]"
  ];

  const CHAT_ROW_SELECTORS = [
    "[class*='live_chatting_list_item' i]",
    "[role='log'] [class*='_item_' i]:has([class*='_chatting_message_' i])",
    "[class*='_item_' i]:has([class*='_chatting_message_' i])"
  ];

  const CHAT_HEADER_SELECTORS = [
    "[class*='live_chatting_header_menu' i]",
    "[class*='live_chatting_header_wrapper' i]",
    "[class*='live_chatting_header_container' i]"
  ];

  const CHAT_HEADER_ACTION_BUTTON_SELECTORS = [
    "button",
    "[role='button']",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])"
  ];

  const CHAT_ACTION_HOST_SELECTORS = [
    "aside#aside-chatting",
    "[class*='live_chatting_header_container' i]",
    "[class*='live_chatting' i]",
    "[class*='chatting_area' i]",
    "[class*='chat_area' i]",
    "aside:has([role='log'])"
  ];

  const MINI_CHAT_INPUT_CONTAINER_SELECTORS = [
    "[class*='live_chatting_input_container' i]",
    "[class*='chatting_input_container' i]",
    "[class*='live_chatting_input' i]",
    "[class*='chatting_input' i]"
  ];

  const MINI_CHAT_NON_CHAT_PANEL_SELECTORS = [
    "[class*='_fixed_' i]:has(button)",
    "section:has([aria-controls*='broadcast-information-sports' i])",
    "[aria-controls*='broadcast-information-sports' i]",
    "button:has([class*='title_text' i])",
    "[class*='status_text' i]"
  ];

  const PAGE_THEME_BACKGROUND_SELECTORS = [
    "[class*='gnb' i]",
    "[class*='header' i]",
    "[class*='navigation' i]",
    "[class*='live_container' i]",
    "[class*='live_content' i]",
    "[class*='live_detail' i]",
    "[class*='content' i]",
    "main"
  ];

  const CHAT_THEME_CHROME_SELECTORS = [
    `[${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]`,
    "[class*='live_chatting_header_container' i]",
    "[class*='live_chatting_header_wrapper' i]",
    "[class*='live_chatting_header' i]",
    "[class*='chatting_header' i]"
  ];

  const CHAT_THEME_FOREGROUND_SELECTORS = [
    "button",
    "[role='button']",
    "svg",
    "span",
    "strong",
    "h1",
    "h2",
    "h3",
    "[class*='title' i]"
  ];

  const TARGET_SELECTORS = {
    nickname: [
      "[data-testid*='nickname' i]",
      "[aria-label*='닉네임' i]",
      "[class*='nickname' i]",
      "[class*='live_chatting_username' i]",
      "button[class*='live_chatting_message_nickname' i] [class*='name_text' i]"
    ],
    badge: [
      "[data-testid*='badge' i]",
      "[aria-label*='배지' i]",
      "[alt*='배지' i]",
      "[class*='badge' i]",
      "[class*='grade' i]",
      "img[src*='badge' i]",
      "img[src*='/glive/icon/' i]",
      "svg[aria-label*='배지' i]"
    ],
    timestamp: [
      "time",
      "[data-testid*='time' i]",
      "[data-testid*='timestamp' i]",
      "[aria-label*='시간' i]",
      "[class*='timestamp' i]",
      "[class*='time' i]"
    ]
  };

  let currentOptions = { ...DEFAULT_OPTIONS };
  let scanTimer = 0;
  let uiSyncTimer = 0;
  let optionsLoadTimer = 0;
  let scanIntervalTimer = 0;
  let isScanning = false;
  let observer = null;
  let lastFullCleanupAt = 0;
  let messagesConnected = false;
  let storageListenerConnected = false;
  let themeSyncTimer = 0;
  let largeTextLayoutFrame = 0;
  let lastOptionsSource = "default";
  let lastOptionsLoadError = "";
  let currentGuestChatTheme = null;
  let lastPublishedGuestChatThemeKey = "";
  let lastPublishedGuestChatThemeAt = 0;
  let nativeGuestChatThemeRetryTimers = [];
  let miniChatDragState = null;
  let miniChatResizeState = null;
  let miniChatBubbleDragState = null;
  let miniChatBubbleIgnoreNextClick = false;
  let miniChatMinimized = false;
  let miniChatBubbleBounds = null;
  let miniChatRestoreBounds = null;
  let miniChatBoundsSaveTimer = 0;
  let miniChatInputOnlyScrollFrame = 0;

  function getRuntime() {
    if (typeof chrome === "undefined") {
      return null;
    }

    return chrome;
  }

  function normalizeHexColor(value) {
    if (typeof value !== "string") {
      return DEFAULT_OPTIONS.chatBoxColor;
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

    return DEFAULT_OPTIONS.chatBoxColor;
  }

  function hexToRgb(hexColor) {
    const hex = normalizeHexColor(hexColor).slice(1);

    return {
      red: Number.parseInt(hex.slice(0, 2), 16),
      green: Number.parseInt(hex.slice(2, 4), 16),
      blue: Number.parseInt(hex.slice(4, 6), 16)
    };
  }

  function hexToRgba(hexColor, alpha) {
    const { red, green, blue } = hexToRgb(hexColor);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, number));
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
    const width = clampNumber(
      bounds?.width,
      MINI_CHAT_MIN_WIDTH,
      MINI_CHAT_MAX_WIDTH,
      MINI_CHAT_DEFAULT_WIDTH
    );
    const height = clampNumber(
      bounds?.height,
      minHeight,
      MINI_CHAT_MAX_HEIGHT,
      fallbackHeight
    );

    return {
      left: normalizeOptionalCoordinate(bounds?.left),
      top: normalizeOptionalCoordinate(bounds?.top),
      width,
      height
    };
  }

  function normalizeOptionalMiniChatBounds(bounds) {
    if (!bounds || typeof bounds !== "object") {
      return null;
    }

    return normalizeMiniChatBounds(bounds);
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

  function normalizeOptions(options) {
    const legacyBoldText = options?.showBoldText === undefined && options?.showLargeText === true;
    const miniFloatingChatInputOnly = options?.miniFloatingChatInputOnly === true;

    return {
      showNicknames: options?.showNicknames !== false,
      showBadges: options?.showBadges !== false,
      showTimestamps: options?.showTimestamps !== false,
      showDonationRanking: options?.showDonationRanking !== false,
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
      chatBoxColor: normalizeHexColor(options?.chatBoxColor)
    };
  }

  function getMiniChatScaleRatio(scale = currentOptions.miniFloatingChatScale) {
    return normalizeMiniChatScale(scale) / 100;
  }

  function readCachedOptions() {
    try {
      const raw = window.localStorage?.getItem(CACHE_KEY);

      return raw ? normalizeOptions(JSON.parse(raw)) : null;
    } catch (_error) {
      return null;
    }
  }

  function writeCachedOptions(options) {
    try {
      window.localStorage?.setItem(CACHE_KEY, JSON.stringify(normalizeOptions(options)));
    } catch (_error) {
      // Storage can be blocked in some contexts. chrome.storage remains authoritative.
    }
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object ?? {}, key);
  }

  function createTimeoutResult(resolve, settled, timeoutMs, error) {
    return window.setTimeout(() => {
      if (settled.value) {
        return;
      }

      settled.value = true;
      resolve({ ok: false, error });
    }, timeoutMs);
  }

  function readOptionsFromStorageLocal() {
    const runtime = getRuntime();

    if (!runtime?.storage?.local) {
      return Promise.resolve({ ok: false, error: "storage-local-unavailable" });
    }

    return new Promise((resolve) => {
      const settled = { value: false };
      const timeout = createTimeoutResult(
        resolve,
        settled,
        STORAGE_READ_TIMEOUT_MS,
        "storage-local-timeout"
      );

      try {
        runtime.storage.local.get(STORAGE_KEY, (result) => {
          if (settled.value) {
            return;
          }

          settled.value = true;
          window.clearTimeout(timeout);

          const error = runtime.runtime?.lastError;

          if (error) {
            resolve({ ok: false, error: error.message || "storage-local-error" });
            return;
          }

          const found = hasOwn(result, STORAGE_KEY);

          resolve({
            ok: true,
            found,
            source: "storage-local",
            options: normalizeOptions(found ? result[STORAGE_KEY] : DEFAULT_OPTIONS)
          });
        });
      } catch (error) {
        if (settled.value) {
          return;
        }

        settled.value = true;
        window.clearTimeout(timeout);
        resolve({ ok: false, error: String(error?.message || error) });
      }
    });
  }

  function readOptionsFromBackground() {
    const runtime = getRuntime();

    if (!runtime?.runtime?.sendMessage) {
      return Promise.resolve({ ok: false, error: "runtime-message-unavailable" });
    }

    return new Promise((resolve) => {
      const settled = { value: false };
      const timeout = createTimeoutResult(
        resolve,
        settled,
        STORAGE_READ_TIMEOUT_MS,
        "background-options-timeout"
      );

      try {
        runtime.runtime.sendMessage({ type: READ_OPTIONS_MESSAGE }, (response) => {
          if (settled.value) {
            return;
          }

          settled.value = true;
          window.clearTimeout(timeout);

          const error = runtime.runtime?.lastError;

          if (error) {
            resolve({ ok: false, error: error.message || "background-options-error" });
            return;
          }

          if (!response?.ok) {
            resolve({ ok: false, error: response?.error || "background-options-empty" });
            return;
          }

          resolve({
            ok: true,
            found: response.found === true,
            source: "background",
            options: normalizeOptions(response.options)
          });
        });
      } catch (error) {
        if (settled.value) {
          return;
        }

        settled.value = true;
        window.clearTimeout(timeout);
        resolve({ ok: false, error: String(error?.message || error) });
      }
    });
  }

  function sendOpenPopupMessage() {
    const runtime = getRuntime();

    if (!runtime?.runtime?.sendMessage) {
      return Promise.resolve({ ok: false, error: "runtime-message-unavailable" });
    }

    return new Promise((resolve) => {
      try {
        runtime.runtime.sendMessage({ type: OPEN_POPUP_MESSAGE }, (response) => {
          const error = runtime.runtime?.lastError;

          if (error) {
            resolve({ ok: false, error: error.message || "open-popup-message-error" });
            return;
          }

          resolve(response || { ok: false, error: "open-popup-empty-response" });
        });
      } catch (error) {
        resolve({ ok: false, error: String(error?.message || error) });
      }
    });
  }

  async function readOptions() {
    const [localResult, backgroundResult] = await Promise.all([
      readOptionsFromStorageLocal(),
      readOptionsFromBackground()
    ]);

    if (localResult.ok && localResult.found) {
      return localResult;
    }

    if (backgroundResult.ok && backgroundResult.found) {
      return backgroundResult;
    }

    if (localResult.ok) {
      return localResult;
    }

    if (backgroundResult.ok) {
      return backgroundResult;
    }

    return {
      ok: false,
      error: `${localResult.error || "storage-local-failed"}; ${backgroundResult.error || "background-failed"}`
    };
  }

  function writeOptionsToStorageLocal(options) {
    const runtime = getRuntime();
    const normalizedOptions = normalizeOptions(options);

    if (!runtime?.storage?.local) {
      return Promise.resolve({ ok: false, error: "storage-local-unavailable" });
    }

    return new Promise((resolve) => {
      try {
        runtime.storage.local.set({ [STORAGE_KEY]: normalizedOptions }, () => {
          const error = runtime.runtime?.lastError;

          if (error) {
            resolve({ ok: false, error: error.message || "storage-local-set-error" });
            return;
          }

          resolve({ ok: true, options: normalizedOptions });
        });
      } catch (error) {
        resolve({ ok: false, error: String(error?.message || error) });
      }
    });
  }

  function normalizeGuestChatTheme(value) {
    return value === "dark" || value === "light" ? value : null;
  }

  function getGuestChatThemeFromUrl(url) {
    try {
      return normalizeGuestChatTheme(new URL(url).searchParams.get("theme"));
    } catch (_error) {
      return null;
    }
  }

  function getThemeFromText(value) {
    const text = String(value || "").toLowerCase();

    if (!text) {
      return null;
    }

    if (/(^|[^a-z])dark([^a-z]|$)|darkmode|theme[-_]?dark|color[-_]?scheme:\s*dark/.test(text)) {
      return "dark";
    }

    if (/(^|[^a-z])light([^a-z]|$)|lightmode|theme[-_]?light|color[-_]?scheme:\s*light/.test(text)) {
      return "light";
    }

    return null;
  }

  function getThemeFromElementHints(element) {
    if (!(element instanceof HTMLElement)) {
      return null;
    }

    const hintAttributes = [
      "data-theme",
      "data-color-theme",
      "data-color-mode",
      "data-theme-mode",
      "data-dark",
      "class",
      "style"
    ];

    for (const attribute of hintAttributes) {
      const theme = getThemeFromText(element.getAttribute(attribute));

      if (theme) {
        return theme;
      }
    }

    return null;
  }

  function parseRgbColor(value) {
    const match = String(value || "").match(/rgba?\(([^)]+)\)/i);

    if (!match) {
      return null;
    }

    const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));

    if (parts.length < 3 || parts.slice(0, 3).some((part) => !Number.isFinite(part))) {
      return null;
    }

    const alpha = parts.length >= 4 && Number.isFinite(parts[3]) ? parts[3] : 1;

    if (alpha < 0.4) {
      return null;
    }

    return {
      red: Math.max(0, Math.min(255, parts[0])),
      green: Math.max(0, Math.min(255, parts[1])),
      blue: Math.max(0, Math.min(255, parts[2]))
    };
  }

  function getRelativeLuminance({ red, green, blue }) {
    const channels = [red, green, blue].map((channel) => {
      const normalized = channel / 255;

      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });

    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function getThemeFromBackgroundElement(element) {
    if (!(element instanceof HTMLElement)) {
      return null;
    }

    const color = parseRgbColor(window.getComputedStyle(element).backgroundColor);

    if (!color) {
      return null;
    }

    const luminance = getRelativeLuminance(color);

    if (luminance <= 0.28) {
      return "dark";
    }

    if (luminance >= 0.72) {
      return "light";
    }

    return null;
  }

  function getThemeFromForegroundElement(element) {
    if (!(element instanceof HTMLElement)) {
      return null;
    }

    const color = parseRgbColor(window.getComputedStyle(element).color);

    if (!color) {
      return null;
    }

    const luminance = getRelativeLuminance(color);

    if (luminance <= 0.28) {
      return "light";
    }

    if (luminance >= 0.72) {
      return "dark";
    }

    return null;
  }

  function getThemeFromComputedBackground() {
    const candidates = [
      ...queryAllSafe(document, PAGE_THEME_BACKGROUND_SELECTORS)
        .filter((element) => element instanceof HTMLElement)
        .slice(0, 12)
    ].filter((element) => element instanceof HTMLElement && !isChatThemeCandidate(element));

    for (const element of candidates) {
      const theme = getThemeFromBackgroundElement(element);

      if (theme) {
        return theme;
      }
    }

    return null;
  }

  function closestSafe(element, selector) {
    try {
      return element.closest(selector);
    } catch (_error) {
      return null;
    }
  }

  function isChatThemeCandidate(element) {
    if (!(element instanceof HTMLElement)) {
      return true;
    }

    if (
      closestSafe(
        element,
        `#${GUEST_CHAT_FRAME_CONTAINER_ID}, [${GUEST_CHAT_HOST_ATTR}="true"], [${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]`
      )
    ) {
      return true;
    }

    return Boolean(
      closestSafe(
        element,
        "[class*='live_chatting' i], [class*='chatting_area' i], [class*='chatting_list' i], [class*='chat_list' i], [class*='chat_area' i]"
      )
    );
  }

  function getThemeFromChatChromeBackground() {
    if (window.self !== window.top) {
      return null;
    }

    const candidates = [
      findChatHeaderTarget(),
      ...queryAllSafe(document, CHAT_THEME_CHROME_SELECTORS)
    ].filter((element) => element instanceof HTMLElement && isElementVisible(element));
    const surfaces = [];

    for (const candidate of candidates) {
      for (
        let element = candidate, depth = 0;
        element instanceof HTMLElement && element !== document.body && depth < 6;
        element = element.parentElement, depth += 1
      ) {
        if (closestSafe(element, `#${GUEST_CHAT_FRAME_CONTAINER_ID}`)) {
          break;
        }

        surfaces.push(element);
      }
    }

    for (const element of [...new Set(surfaces)]) {
      const theme = getThemeFromBackgroundElement(element);

      if (theme) {
        return theme;
      }
    }

    return null;
  }

  function getThemeFromChatChromeForeground() {
    if (window.self !== window.top) {
      return null;
    }

    const candidates = [
      findChatHeaderTarget(),
      ...queryAllSafe(document, CHAT_THEME_CHROME_SELECTORS)
    ].filter((element) => element instanceof HTMLElement && isElementVisible(element));
    const foregroundElements = [];

    for (const candidate of candidates) {
      if (closestSafe(candidate, `#${GUEST_CHAT_FRAME_CONTAINER_ID}`)) {
        continue;
      }

      foregroundElements.push(candidate);
      foregroundElements.push(
        ...queryAllSafe(candidate, CHAT_THEME_FOREGROUND_SELECTORS)
          .filter((element) => element instanceof HTMLElement)
          .filter(isElementVisible)
          .slice(0, 24)
      );
    }

    for (const element of [...new Set(foregroundElements)]) {
      const theme = getThemeFromForegroundElement(element);

      if (theme) {
        return theme;
      }
    }

    return null;
  }

  function detectPageTheme() {
    const chatChromeForegroundTheme = getThemeFromChatChromeForeground();

    if (chatChromeForegroundTheme) {
      document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource = "chat-chrome-foreground";
      return chatChromeForegroundTheme;
    }

    const chatChromeTheme = getThemeFromChatChromeBackground();

    if (chatChromeTheme) {
      document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource = "chat-chrome";
      return chatChromeTheme;
    }

    const hintElements = [document.documentElement, document.body].filter(
      (element) => element instanceof HTMLElement
    );

    for (const element of hintElements) {
      const theme = getThemeFromElementHints(element);

      if (theme) {
        document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource = "page-hint";
        return theme;
      }
    }

    const computedTheme = getThemeFromComputedBackground();

    if (computedTheme) {
      document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource = "page-background";
      return computedTheme;
    }

    if (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches) {
      document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource = "system";
      return "dark";
    }

    document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource = "fallback";
    return "light";
  }

  function getCurrentChannelId() {
    return extractLiveChannelIdFromUrl(getCurrentLivePageUrl() || window.location.href);
  }

  function applyGuestChatTheme(theme, { source = "direct" } = {}) {
    const normalizedTheme = normalizeGuestChatTheme(theme);
    currentGuestChatTheme = normalizedTheme;

    if (isLiveChatFrameUrl(window.location.href)) {
      document.documentElement.setAttribute(LIVE_CHAT_FRAME_ATTR, "true");

      if (isGuestChatFrameEmbedUrl(window.location.href)) {
        document.documentElement.setAttribute(GUEST_CHAT_EMBED_ATTR, "true");
      } else {
        document.documentElement.removeAttribute(GUEST_CHAT_EMBED_ATTR);
      }

      if (isMiniChatFrameEmbedUrl(window.location.href)) {
        document.documentElement.setAttribute(MINI_CHAT_EMBED_ATTR, "true");
      } else {
        document.documentElement.removeAttribute(MINI_CHAT_EMBED_ATTR);
      }

      applyNativeGuestChatThemeClass(normalizedTheme);

      if (normalizedTheme) {
        document.documentElement.setAttribute(GUEST_CHAT_THEME_ATTR, normalizedTheme);
        document.documentElement.dataset.chzzkChatUiToggleGuestThemeSource = source;
      } else {
        document.documentElement.removeAttribute(GUEST_CHAT_THEME_ATTR);
        delete document.documentElement.dataset.chzzkChatUiToggleGuestThemeSource;
      }

      return;
    }

    document.documentElement.removeAttribute(LIVE_CHAT_FRAME_ATTR);
    document.documentElement.removeAttribute(GUEST_CHAT_EMBED_ATTR);
    document.documentElement.removeAttribute(MINI_CHAT_EMBED_ATTR);
    document.documentElement.removeAttribute(GUEST_CHAT_THEME_ATTR);
    delete document.documentElement.dataset.chzzkChatUiToggleGuestThemeSource;
  }

  function applyNativeGuestChatThemeClass(theme) {
    const normalizedTheme = normalizeGuestChatTheme(theme);

    if (!isGuestChatFrameEmbedUrl(window.location.href)) {
      clearNativeGuestChatThemeClassRetries();
      return;
    }

    document.documentElement.dataset.chzzkChatUiToggleNativeTheme = normalizedTheme || "";
    syncNativeGuestChatThemeClass(normalizedTheme);

    if (!normalizedTheme) {
      clearNativeGuestChatThemeClassRetries();
      return;
    }

    scheduleNativeGuestChatThemeClassRetries(normalizedTheme);
  }

  function syncNativeGuestChatThemeClass(theme) {
    const normalizedTheme = normalizeGuestChatTheme(theme);
    const classList = document.documentElement.classList;

    if (!normalizedTheme) {
      if (!GUEST_CHAT_NATIVE_THEME_CLASSES.some((className) => classList.contains(className))) {
        document.documentElement.style.removeProperty("color-scheme");
        return;
      }

      classList.remove(...GUEST_CHAT_NATIVE_THEME_CLASSES);
      document.documentElement.style.removeProperty("color-scheme");
      return;
    }

    const expectedThemeClass = normalizedTheme;
    const expectedPrefixedThemeClass = `theme_${normalizedTheme}`;

    if (isNativeGuestChatThemeClassSynced(normalizedTheme)) {
      return;
    }

    classList.remove(...GUEST_CHAT_NATIVE_THEME_CLASSES);
    classList.add(expectedThemeClass, expectedPrefixedThemeClass);
    document.documentElement.style.colorScheme = normalizedTheme;
  }

  function isNativeGuestChatThemeClassSynced(theme) {
    const normalizedTheme = normalizeGuestChatTheme(theme);
    const classList = document.documentElement.classList;

    if (!normalizedTheme) {
      return !GUEST_CHAT_NATIVE_THEME_CLASSES.some((className) => classList.contains(className));
    }

    const expectedThemeClass = normalizedTheme;
    const expectedPrefixedThemeClass = `theme_${normalizedTheme}`;
    const hasExpectedClasses =
      classList.contains(expectedThemeClass) &&
      classList.contains(expectedPrefixedThemeClass);
    const hasConflictingClasses = GUEST_CHAT_NATIVE_THEME_CLASSES.some(
      (className) =>
        className !== expectedThemeClass &&
        className !== expectedPrefixedThemeClass &&
        classList.contains(className)
    );
    const hasExpectedColorScheme = document.documentElement.style.colorScheme === normalizedTheme;

    return hasExpectedClasses && !hasConflictingClasses && hasExpectedColorScheme;
  }

  function scheduleNativeGuestChatThemeClassRetries(theme) {
    const normalizedTheme = normalizeGuestChatTheme(theme);
    clearNativeGuestChatThemeClassRetries({ keepTheme: true });

    if (!normalizedTheme) {
      return;
    }

    for (const delay of [50, 150, 400, 1000, 2500]) {
      nativeGuestChatThemeRetryTimers.push(
        window.setTimeout(() => {
          if (!isGuestChatFrameEmbedUrl(window.location.href)) {
            clearNativeGuestChatThemeClassRetries();
            return;
          }

          const currentTheme = normalizeGuestChatTheme(
            document.documentElement.dataset.chzzkChatUiToggleNativeTheme
          );

          if (currentTheme && !isNativeGuestChatThemeClassSynced(currentTheme)) {
            syncNativeGuestChatThemeClass(currentTheme);
          }
        }, delay)
      );
    }
  }

  function clearNativeGuestChatThemeClassRetries({ keepTheme = false } = {}) {
    for (const timer of nativeGuestChatThemeRetryTimers) {
      window.clearTimeout(timer);
    }

    nativeGuestChatThemeRetryTimers = [];

    if (keepTheme) {
      return;
    }

    delete document.documentElement.dataset.chzzkChatUiToggleNativeTheme;
  }

  function readGuestChatThemeFromBackground() {
    const runtime = getRuntime();
    const channelId = getCurrentChannelId();

    if (!channelId || !runtime?.runtime?.sendMessage) {
      return;
    }

    try {
      runtime.runtime.sendMessage(
        {
          type: READ_GUEST_CHAT_THEME_MESSAGE,
          channelId
        },
        (response) => {
          if (runtime.runtime?.lastError || !response?.ok || response.found !== true) {
            return;
          }

          applyGuestChatTheme(response.theme, { source: response.source || "background" });
        }
      );
    } catch (_error) {
      // Theme sync is cosmetic. A blocked runtime message should not affect chat rendering.
    }
  }

  function publishGuestChatThemeToBackground(theme) {
    const runtime = getRuntime();
    const channelId = getCurrentChannelId();
    const normalizedTheme = normalizeGuestChatTheme(theme);
    const publishKey = `${channelId || ""}:${normalizedTheme || ""}`;
    const now = Date.now();

    if (
      !channelId ||
      !normalizedTheme ||
      (publishKey === lastPublishedGuestChatThemeKey && now - lastPublishedGuestChatThemeAt < 10000)
    ) {
      return;
    }

    lastPublishedGuestChatThemeKey = publishKey;
    lastPublishedGuestChatThemeAt = now;

    if (!runtime?.runtime?.sendMessage) {
      return;
    }

    try {
      runtime.runtime.sendMessage(
        {
          type: SET_GUEST_CHAT_THEME_MESSAGE,
          channelId,
          theme: normalizedTheme
        },
        () => {
          void runtime.runtime?.lastError;
        }
      );
    } catch (_error) {
      // Theme sync is best-effort and must never affect the local display toggles.
    }
  }

  function syncGuestChatTheme() {
    if (isLiveChatFrameUrl(window.location.href)) {
      document.documentElement.setAttribute(LIVE_CHAT_FRAME_ATTR, "true");

      if (isGuestChatFrameEmbedUrl(window.location.href)) {
        document.documentElement.setAttribute(GUEST_CHAT_EMBED_ATTR, "true");
      } else {
        document.documentElement.removeAttribute(GUEST_CHAT_EMBED_ATTR);
      }

      if (isMiniChatFrameEmbedUrl(window.location.href)) {
        document.documentElement.setAttribute(MINI_CHAT_EMBED_ATTR, "true");
      } else {
        document.documentElement.removeAttribute(MINI_CHAT_EMBED_ATTR);
      }

      applyNativeGuestChatThemeClass(getGuestChatThemeFromUrl(window.location.href));
      readGuestChatThemeFromBackground();
      return;
    }

    if (window.self !== window.top || !extractLiveChannelIdFromUrl(window.location.href)) {
      return;
    }

    const detectedTheme = detectPageTheme();
    const previousGuestChatTheme = currentGuestChatTheme;
    currentGuestChatTheme = detectedTheme;
    document.documentElement.dataset.chzzkChatUiToggleDetectedTheme = detectedTheme;
    publishGuestChatThemeToBackground(detectedTheme);

    if (previousGuestChatTheme !== detectedTheme) {
      syncGuestChatFrame();
      syncMiniFloatingChatPanel();
    }
  }

  function injectStyle() {
    const existingStyle = document.getElementById(STYLE_ID);

    if (existingStyle?.dataset.chzzkChatUiToggleVersion === SCRIPT_VERSION) {
      return;
    }

    if (existingStyle && !(existingStyle instanceof HTMLStyleElement)) {
      existingStyle.remove();
    }

    const style = existingStyle instanceof HTMLStyleElement ? existingStyle : document.createElement("style");
    style.id = STYLE_ID;
    style.dataset.chzzkChatUiToggleVersion = SCRIPT_VERSION;
    style.textContent = `
      html {
        --chzzk-chat-ui-toggle-box-bg: rgba(128, 128, 128, 0.18);
        --chzzk-chat-ui-toggle-box-bg-hover: rgba(128, 128, 128, 0.24);
      }

      html:not([data-chzzk-chat-ui-toggle-ready="true"])
        ${NATIVE_CHAT_ROW_SELECTOR} {
        visibility: hidden !important;
      }

      .chzzk-chat-ui-toggle-timestamp {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        margin-right: 4px;
        color: color-mix(in srgb, currentColor 62%, transparent);
        font-size: 0.9em;
        line-height: inherit;
        white-space: nowrap;
        user-select: none;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${GUEST_CHAT_EMBED_ATTR}="true"]
        [class*="live_chatting_header" i],
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${GUEST_CHAT_EMBED_ATTR}="true"]
        [class*="chatting_header" i],
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${GUEST_CHAT_EMBED_ATTR}="true"]
        aside#aside-chatting > :first-child {
        display: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"] {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        background: transparent !important;
        overflow: hidden !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"] body {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        overflow: hidden !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"] body > div {
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: hidden !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"] *,
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"] *::before,
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"] *::after {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"] *::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"]
        [class*="live_chatting_header" i],
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"]
        [class*="chatting_header" i] {
        display: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"]
        [class*="live_chatting" i],
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"]
        [class*="chatting_area" i],
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"]
        [class*="chat_area" i] {
        max-height: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"]
        [${MINI_CHAT_HIDDEN_CONTROL_ATTR}="true"] {
        display: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"]
        [${MINI_CHAT_NON_CHAT_PANEL_ATTR}="true"] {
        display: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"]
        [${MINI_CHAT_COMPACT_INPUT_ATTR}="true"] {
        flex: 0 0 auto !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        margin-bottom: 0 !important;
        padding-bottom: 8px !important;
        box-sizing: border-box !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR}="true"] {
        display: none !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        body,
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        body > div,
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_PATH_ATTR}="true"] {
        display: flex !important;
        flex: 1 1 auto !important;
        flex-direction: column !important;
        justify-content: flex-end !important;
        height: 100% !important;
        min-height: 0 !important;
        max-height: 100% !important;
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
        outline: 0 !important;
        overflow: hidden !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] {
        flex: 0 0 ${MINI_CHAT_INPUT_ONLY_BOX_HEIGHT}px !important;
        align-self: center !important;
        display: flex !important;
        align-items: center !important;
        width: calc(100% - 20px) !important;
        max-width: calc(100% - 20px) !important;
        height: ${MINI_CHAT_INPUT_ONLY_BOX_HEIGHT}px !important;
        min-height: ${MINI_CHAT_INPUT_ONLY_BOX_HEIGHT}px !important;
        max-height: ${MINI_CHAT_INPUT_ONLY_BOX_HEIGHT}px !important;
        margin: auto 10px 0 !important;
        padding: 0 8px !important;
        position: relative !important;
        inset: auto !important;
        transform: none !important;
        border-radius: 10px !important;
        background: rgba(226, 227, 232, 0.98) !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
      }

      @media (prefers-color-scheme: dark) {
        html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
          [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] {
          background: rgba(47, 51, 58, 0.98) !important;
        }
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][${GUEST_CHAT_THEME_ATTR}="dark"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"],
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][${GUEST_CHAT_THEME_ATTR}="dark"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"]:focus-within {
        background: rgba(47, 51, 58, 0.98) !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][${GUEST_CHAT_THEME_ATTR}="light"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"],
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][${GUEST_CHAT_THEME_ATTR}="light"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"]:focus-within {
        background: rgba(226, 227, 232, 0.98) !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] [class*="live_chatting_input" i],
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] [class*="chatting_input" i] {
        max-width: 100% !important;
        min-height: 0 !important;
        max-height: 100% !important;
        background: transparent !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] button {
        flex: 0 0 auto !important;
        align-self: center !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] button[class*="setting_button" i] {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 32px !important;
        min-width: 32px !important;
        max-width: 32px !important;
        height: 32px !important;
        min-height: 32px !important;
        max-height: 32px !important;
        margin: 0 8px 0 0 !important;
        padding: 0 !important;
        position: relative !important;
        inset: auto !important;
        transform: none !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] button[class*="setting_button" i] img,
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] button[class*="setting_button" i] svg {
        display: block !important;
        width: 32px !important;
        height: 32px !important;
        margin: 0 !important;
        flex: 0 0 auto !important;
      }

      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] textarea,
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] input:not([type="button"]):not([type="submit"]):not([type="reset"]),
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] [contenteditable="true"],
      html[${LIVE_CHAT_FRAME_ATTR}="true"][${MINI_CHAT_EMBED_ATTR}="true"][data-chzzk-chat-ui-toggle-mini-floating-chat-input-only="on"]
        [${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}="true"] [role="textbox"] {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        min-height: 0 !important;
        max-height: ${MINI_CHAT_INPUT_ONLY_FIELD_MAX_HEIGHT}px !important;
        margin: 0 !important;
        line-height: normal !important;
        align-self: center !important;
        background: transparent !important;
        overflow: hidden !important;
        resize: none !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
      }

      .chzzk-chat-ui-toggle-guest-chat-toggle {
        position: relative !important;
        display: inline-flex !important;
        flex: 0 0 auto !important;
        align-self: center !important;
        align-items: center !important;
        justify-content: center !important;
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        min-height: 28px !important;
        margin: 0 2px !important;
        padding: 0 !important;
        left: -3px !important;
        top: 8px !important;
        border: 0 !important;
        border-radius: 6px !important;
        background: transparent !important;
        color: rgba(32, 36, 40, 0.72) !important;
        box-shadow: none !important;
        cursor: pointer !important;
        z-index: 2147483646 !important;
      }

      .chzzk-chat-ui-toggle-guest-chat-toggle:hover {
        background: rgba(32, 36, 40, 0.08) !important;
        color: rgba(32, 36, 40, 0.92) !important;
      }

      .chzzk-chat-ui-toggle-guest-chat-toggle:focus-visible {
        outline: 2px solid rgba(0, 196, 113, 0.42) !important;
        outline-offset: 2px !important;
      }

      .chzzk-chat-ui-toggle-guest-chat-toggle[aria-pressed="true"] {
        background: rgba(0, 196, 113, 0.14) !important;
        color: #00a862 !important;
      }

      .chzzk-chat-ui-toggle-guest-chat-toggle[data-state="loading"] {
        cursor: wait !important;
        opacity: 0.68 !important;
      }

      .chzzk-chat-ui-toggle-guest-chat-toggle[data-state="error"] {
        background: rgba(224, 49, 49, 0.12) !important;
        color: #c92a2a !important;
      }

      .chzzk-chat-ui-toggle-header-settings {
        position: relative !important;
        display: inline-flex !important;
        flex: 0 0 auto !important;
        align-self: center !important;
        align-items: center !important;
        justify-content: center !important;
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        min-height: 28px !important;
        margin: 0 2px !important;
        padding: 0 !important;
        left: -3px !important;
        top: 8px !important;
        border: 0 !important;
        border-radius: 6px !important;
        background: transparent !important;
        color: rgba(32, 36, 40, 0.72) !important;
        box-shadow: none !important;
        cursor: pointer !important;
        z-index: 2147483646 !important;
      }

      .chzzk-chat-ui-toggle-header-settings:hover {
        background: rgba(32, 36, 40, 0.08) !important;
        color: rgba(32, 36, 40, 0.92) !important;
      }

      .chzzk-chat-ui-toggle-header-settings:focus-visible {
        outline: 2px solid rgba(0, 196, 113, 0.42) !important;
        outline-offset: 2px !important;
      }

      .chzzk-chat-ui-toggle-header-settings[data-state="loading"] {
        cursor: wait !important;
        opacity: 0.68 !important;
      }

      .chzzk-chat-ui-toggle-header-settings[data-state="error"] {
        background: rgba(224, 49, 49, 0.12) !important;
        color: #c92a2a !important;
      }

      .chzzk-chat-ui-toggle-mini-chat-button {
        position: relative !important;
        display: inline-flex !important;
        flex: 0 0 auto !important;
        align-self: center !important;
        align-items: center !important;
        justify-content: center !important;
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        min-height: 28px !important;
        margin: 0 2px !important;
        padding: 0 !important;
        left: -3px !important;
        top: 8px !important;
        border: 0 !important;
        border-radius: 6px !important;
        background: transparent !important;
        color: rgba(32, 36, 40, 0.72) !important;
        box-shadow: none !important;
        cursor: pointer !important;
        transition:
          background-color 120ms ease,
          color 120ms ease !important;
        z-index: 2147483646 !important;
      }

      .chzzk-chat-ui-toggle-mini-chat-button:hover {
        background: rgba(32, 36, 40, 0.08) !important;
        color: rgba(32, 36, 40, 0.92) !important;
      }

      .chzzk-chat-ui-toggle-mini-chat-button:focus-visible {
        outline: 2px solid rgba(0, 196, 113, 0.42) !important;
        outline-offset: 2px !important;
      }

      .chzzk-chat-ui-toggle-mini-chat-button[aria-pressed="true"] {
        background: rgba(0, 196, 113, 0.14) !important;
        color: #008f55 !important;
      }

      .chzzk-chat-ui-toggle-mini-chat-button[data-state="loading"] {
        cursor: wait !important;
        opacity: 0.68 !important;
      }

      .chzzk-chat-ui-toggle-mini-chat-button[data-state="error"] {
        background: rgba(224, 49, 49, 0.12) !important;
        color: #c92a2a !important;
      }

      html[data-chzzk-chat-ui-toggle-detected-theme="dark"]
        :is(
          .chzzk-chat-ui-toggle-guest-chat-toggle,
          .chzzk-chat-ui-toggle-header-settings,
          .chzzk-chat-ui-toggle-mini-chat-button
        ) {
        background: rgba(255, 255, 255, 0.07) !important;
        color: rgba(255, 255, 255, 0.86) !important;
      }

      html[data-chzzk-chat-ui-toggle-detected-theme="dark"]
        :is(
          .chzzk-chat-ui-toggle-guest-chat-toggle,
          .chzzk-chat-ui-toggle-header-settings,
          .chzzk-chat-ui-toggle-mini-chat-button
        ):hover {
        background: rgba(255, 255, 255, 0.16) !important;
        color: #ffffff !important;
      }

      html[data-chzzk-chat-ui-toggle-detected-theme="dark"]
        :is(
          .chzzk-chat-ui-toggle-guest-chat-toggle,
          .chzzk-chat-ui-toggle-mini-chat-button
        )[aria-pressed="true"] {
        background: rgba(0, 196, 113, 0.24) !important;
        color: #8fffd2 !important;
      }

      html[data-chzzk-chat-ui-toggle-detected-theme="dark"]
        :is(
          .chzzk-chat-ui-toggle-guest-chat-toggle,
          .chzzk-chat-ui-toggle-header-settings,
          .chzzk-chat-ui-toggle-mini-chat-button
        )[data-state="error"] {
        background: rgba(255, 107, 107, 0.18) !important;
        color: #ffc9c9 !important;
      }

      .${HEADER_SETTINGS_BUTTON_ICON_CLASS} {
        display: block !important;
        width: 18px !important;
        height: 18px !important;
        color: inherit !important;
        pointer-events: none !important;
      }

      .${HEADER_SETTINGS_BUTTON_ICON_CLASS} svg {
        display: block !important;
        width: 18px !important;
        height: 18px !important;
        stroke: currentColor !important;
      }

      .${MINI_CHAT_BUTTON_ICON_CLASS} {
        display: block !important;
        width: 18px !important;
        height: 18px !important;
        color: inherit !important;
        pointer-events: none !important;
        line-height: 0 !important;
      }

      .${MINI_CHAT_BUTTON_ICON_CLASS} svg {
        display: block !important;
        width: 18px !important;
        height: 18px !important;
        overflow: visible !important;
      }

      .${MINI_CHAT_BUTTON_ICON_CLASS} path {
        fill: none !important;
        stroke: currentColor !important;
        stroke-width: 1.55 !important;
        stroke-linejoin: round !important;
        vector-effect: non-scaling-stroke !important;
      }

      .${MINI_CHAT_BUTTON_ICON_CLASS} circle {
        fill: currentColor !important;
      }

      .${GUEST_CHAT_TOGGLE_BUTTON_ICON_CLASS} {
        position: relative !important;
        display: block !important;
        width: 17px !important;
        height: 17px !important;
        color: inherit !important;
      }

      .${GUEST_CHAT_TOGGLE_BUTTON_ICON_CLASS}::before {
        content: "" !important;
        position: absolute !important;
        top: 2px !important;
        left: 5px !important;
        width: 5px !important;
        height: 5px !important;
        border: 1.8px solid currentColor !important;
        border-radius: 50% !important;
        box-sizing: border-box !important;
      }

      .${GUEST_CHAT_TOGGLE_BUTTON_ICON_CLASS}::after {
        content: "" !important;
        position: absolute !important;
        left: 2px !important;
        bottom: 2px !important;
        width: 11px !important;
        height: 6px !important;
        border: 1.8px solid currentColor !important;
        border-radius: 9px 9px 3px 3px !important;
        box-sizing: border-box !important;
      }

      .${GUEST_CHAT_TOGGLE_BUTTON_SLASH_CLASS} {
        position: absolute !important;
        left: 1px !important;
        top: 8px !important;
        width: 16px !important;
        height: 2px !important;
        border-radius: 999px !important;
        background: currentColor !important;
        transform: rotate(-45deg) !important;
        transform-origin: center !important;
      }

      html[data-chzzk-chat-ui-toggle-guest-chat-frame="on"]
        [${GUEST_CHAT_HOST_ATTR}="true"] {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 360px !important;
        overflow: hidden !important;
      }

      html[data-chzzk-chat-ui-toggle-guest-chat-frame="on"]
        [${GUEST_CHAT_HOST_ATTR}="true"] > :not(#${GUEST_CHAT_FRAME_CONTAINER_ID}):not([${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]) {
        display: none !important;
      }

      html[data-chzzk-chat-ui-toggle-guest-chat-frame="on"]
        [${GUEST_CHAT_HOST_ATTR}="true"] > [${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]
        [class*="live_chatting_list" i],
      html[data-chzzk-chat-ui-toggle-guest-chat-frame="on"]
        [${GUEST_CHAT_HOST_ATTR}="true"] > [${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]
        [class*="chatting_list" i],
      html[data-chzzk-chat-ui-toggle-guest-chat-frame="on"]
        [${GUEST_CHAT_HOST_ATTR}="true"] > [${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]
        [class*="live_chatting_input" i],
      html[data-chzzk-chat-ui-toggle-guest-chat-frame="on"]
        [${GUEST_CHAT_HOST_ATTR}="true"] > [${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]
        [class*="chatting_input" i] {
        display: none !important;
      }

      #${GUEST_CHAT_FRAME_CONTAINER_ID} {
        display: flex !important;
        flex: 1 1 auto !important;
        width: 100% !important;
        min-width: 0 !important;
        min-height: 360px !important;
        height: 100% !important;
        background: transparent !important;
      }

      #${GUEST_CHAT_FRAME_ID} {
        display: block !important;
        flex: 1 1 auto !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 360px !important;
        border: 0 !important;
        background: transparent !important;
      }

      #${MINI_CHAT_PANEL_ID} {
        position: fixed !important;
        display: flex !important;
        flex-direction: column !important;
        min-width: ${MINI_CHAT_MIN_WIDTH}px !important;
        min-height: ${MINI_CHAT_MIN_HEIGHT}px !important;
        max-width: calc(100vw - ${MINI_CHAT_VIEWPORT_MARGIN * 2}px) !important;
        max-height: calc(100vh - ${MINI_CHAT_VIEWPORT_MARGIN * 2}px) !important;
        border: 1px solid rgba(20, 26, 34, 0.16) !important;
        border-radius: 8px !important;
        background: #111820 !important;
        box-shadow: 0 16px 42px rgba(0, 0, 0, 0.32) !important;
        color: #ffffff !important;
        overflow: hidden !important;
        resize: none !important;
        transform: scale(var(--chzzk-chat-ui-toggle-mini-chat-scale, 1)) !important;
        transform-origin: left bottom !important;
        z-index: 2147483647 !important;
      }

      :fullscreen #${MINI_CHAT_PANEL_ID},
      #${MINI_CHAT_PANEL_ID}[${MINI_CHAT_FULLSCREEN_HOST_ATTR}="true"] {
        pointer-events: auto !important;
        z-index: 2147483647 !important;
      }

      #${MINI_CHAT_BUBBLE_ID} {
        position: fixed !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: ${MINI_CHAT_BUBBLE_SIZE}px !important;
        height: ${MINI_CHAT_BUBBLE_SIZE}px !important;
        min-width: ${MINI_CHAT_BUBBLE_SIZE}px !important;
        min-height: ${MINI_CHAT_BUBBLE_SIZE}px !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 1px solid rgba(255, 255, 255, 0.28) !important;
        border-radius: 999px !important;
        background: rgba(82, 88, 98, 0.66) !important;
        color: rgba(255, 255, 255, 0.92) !important;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24) !important;
        cursor: grab !important;
        touch-action: none !important;
        user-select: none !important;
        pointer-events: auto !important;
        z-index: 2147483647 !important;
        backdrop-filter: blur(8px) !important;
      }

      :fullscreen #${MINI_CHAT_BUBBLE_ID},
      #${MINI_CHAT_BUBBLE_ID}[${MINI_CHAT_FULLSCREEN_HOST_ATTR}="true"] {
        pointer-events: auto !important;
        z-index: 2147483647 !important;
      }

      #${MINI_CHAT_BUBBLE_ID}:hover {
        background: rgba(82, 88, 98, 0.78) !important;
        color: #ffffff !important;
      }

      #${MINI_CHAT_BUBBLE_ID}:focus-visible {
        outline: 2px solid rgba(0, 196, 113, 0.58) !important;
        outline-offset: 3px !important;
      }

      #${MINI_CHAT_BUBBLE_ID}[data-dragging="true"] {
        cursor: grabbing !important;
      }

      #${MINI_CHAT_BUBBLE_ID} .${MINI_CHAT_BUBBLE_ICON_CLASS} {
        display: block !important;
        width: 22px !important;
        height: 22px !important;
        color: inherit !important;
        pointer-events: none !important;
        line-height: 0 !important;
      }

      #${MINI_CHAT_BUBBLE_ID} .${MINI_CHAT_BUBBLE_ICON_CLASS} svg {
        display: block !important;
        width: 22px !important;
        height: 22px !important;
        overflow: visible !important;
      }

      #${MINI_CHAT_BUBBLE_ID} .${MINI_CHAT_BUBBLE_ICON_CLASS} path {
        fill: none !important;
        stroke: currentColor !important;
        stroke-width: 1.7 !important;
        stroke-linejoin: round !important;
        vector-effect: non-scaling-stroke !important;
      }

      #${MINI_CHAT_BUBBLE_ID} .${MINI_CHAT_BUBBLE_ICON_CLASS} circle {
        fill: currentColor !important;
      }

      #${MINI_CHAT_PANEL_ID}[data-input-only="true"] {
        min-height: ${MINI_CHAT_INPUT_ONLY_HEIGHT}px !important;
        border-color: transparent !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_CONTROLS_CLASS} {
        position: relative !important;
        display: flex !important;
        flex: 0 0 16px !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 2px !important;
        height: 16px !important;
        min-height: 16px !important;
        padding: 0 24px 0 6px !important;
        border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        background: rgba(17, 24, 32, 0.98) !important;
        box-sizing: border-box !important;
        cursor: grab !important;
        user-select: none !important;
        touch-action: none !important;
      }

      #${MINI_CHAT_PANEL_ID}[data-dragging="true"] .${MINI_CHAT_PANEL_CONTROLS_CLASS} {
        cursor: grabbing !important;
      }

      #${MINI_CHAT_PANEL_ID}[data-resizing="true"] {
        user-select: none !important;
      }

      #${MINI_CHAT_PANEL_ID} [data-mini-chat-actions="true"] {
        display: flex !important;
        flex: 0 0 auto !important;
        align-items: center !important;
        gap: 2px !important;
        height: 100% !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_SCALE_CLASS} {
        display: flex !important;
        flex: 0 0 auto !important;
        align-items: center !important;
        gap: 2px !important;
        height: 100% !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_MODE_CLASS} {
        position: absolute !important;
        left: 50% !important;
        top: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        height: 100% !important;
        transform: translate(-50%, -50%) !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_SCALE_VALUE_CLASS} {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 34px !important;
        min-width: 34px !important;
        height: 14px !important;
        color: rgba(255, 255, 255, 0.72) !important;
        font: 700 10px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        letter-spacing: 0 !important;
        pointer-events: none !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_SCALE_BUTTON_CLASS},
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_INPUT_ONLY_CLASS},
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_MINIMIZE_CLASS},
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_CLOSE_CLASS} {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 16px !important;
        height: 14px !important;
        min-width: 16px !important;
        min-height: 14px !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 4px !important;
        background: transparent !important;
        color: rgba(255, 255, 255, 0.78) !important;
        font: 700 12px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        cursor: pointer !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_SCALE_BUTTON_CLASS}:hover,
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_INPUT_ONLY_CLASS}:hover,
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_MINIMIZE_CLASS}:hover,
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_CLOSE_CLASS}:hover {
        background: rgba(255, 255, 255, 0.12) !important;
        color: #ffffff !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_SCALE_BUTTON_CLASS}:focus-visible,
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_INPUT_ONLY_CLASS}:focus-visible,
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_MINIMIZE_CLASS}:focus-visible,
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_CLOSE_CLASS}:focus-visible {
        outline: 2px solid rgba(0, 196, 113, 0.58) !important;
        outline-offset: 2px !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_SCALE_BUTTON_CLASS}:disabled {
        color: rgba(255, 255, 255, 0.28) !important;
        cursor: default !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_SCALE_BUTTON_CLASS}:disabled:hover {
        background: transparent !important;
      }

      #${MINI_CHAT_PANEL_ID}[data-input-only="true"] .${MINI_CHAT_PANEL_INPUT_ONLY_CLASS} {
        background: rgba(0, 196, 113, 0.22) !important;
        color: #ffffff !important;
      }

      #${MINI_CHAT_PANEL_ID}[data-input-only="true"] .${MINI_CHAT_PANEL_CONTROLS_CLASS} {
        align-self: center !important;
        width: calc(100% - ${MINI_CHAT_INPUT_ONLY_CONTROL_INSET * 2}px) !important;
        max-width: calc(100% - ${MINI_CHAT_INPUT_ONLY_CONTROL_INSET * 2}px) !important;
        margin: 0 ${MINI_CHAT_INPUT_ONLY_CONTROL_INSET}px !important;
        border-radius: 0 0 6px 6px !important;
      }

      #${MINI_CHAT_PANEL_ID} [data-mini-chat-body="true"] {
        display: flex !important;
        flex: 1 1 auto !important;
        min-height: 0 !important;
        background: transparent !important;
      }

      #${MINI_CHAT_FRAME_ID} {
        display: block !important;
        flex: 1 1 auto !important;
        width: 100% !important;
        min-width: 0 !important;
        height: 100% !important;
        min-height: 0 !important;
        border: 0 !important;
        background: transparent !important;
      }

      #${MINI_CHAT_PANEL_ID}[data-input-only="true"] [data-mini-chat-body="true"] {
        position: relative !important;
        flex: 1 1 auto !important;
        overflow: hidden !important;
      }

      #${MINI_CHAT_PANEL_ID}[data-input-only="true"] #${MINI_CHAT_FRAME_ID} {
        position: static !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        max-height: 100% !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_RESIZE_CLASS} {
        position: absolute !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 22px !important;
        height: 22px !important;
        border: 0 !important;
        background: transparent !important;
        cursor: nwse-resize !important;
        touch-action: none !important;
        z-index: 2 !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_RESIZE_CLASS}::before,
      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_RESIZE_CLASS}::after {
        content: "" !important;
        position: absolute !important;
        right: 6px !important;
        bottom: 5px !important;
        width: 10px !important;
        height: 1.5px !important;
        border-radius: 999px !important;
        background: rgba(255, 255, 255, 0.48) !important;
        transform: rotate(-45deg) !important;
        transform-origin: right center !important;
      }

      #${MINI_CHAT_PANEL_ID} .${MINI_CHAT_PANEL_RESIZE_CLASS}::after {
        right: 5px !important;
        bottom: 10px !important;
        width: 6px !important;
      }

      #${MINI_CHAT_PANEL_ID}[data-input-only="true"] .${MINI_CHAT_PANEL_RESIZE_CLASS} {
        right: ${MINI_CHAT_INPUT_ONLY_CONTROL_INSET}px !important;
      }

      html[data-chzzk-chat-ui-toggle-chat-boxes="on"]
        ${NATIVE_CHAT_ROW_SELECTOR} {
        width: fit-content !important;
        max-width: calc(100% - 16px) !important;
        margin: 3px 8px !important;
        padding: 4px 8px !important;
        border-radius: 8px !important;
        background: var(--chzzk-chat-ui-toggle-box-bg) !important;
        box-sizing: border-box !important;
        overflow-wrap: anywhere !important;
      }

      html[data-chzzk-chat-ui-toggle-chat-boxes="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}:hover {
        background: var(--chzzk-chat-ui-toggle-box-bg-hover) !important;
      }

      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR} {
        display: flex !important;
        font-size: var(--chzzk-chat-ui-toggle-chat-font-size, 13pt) !important;
        line-height: 1.45 !important;
        height: auto !important;
        min-height: var(
          --chzzk-chat-ui-toggle-row-dynamic-height,
          var(--chzzk-chat-ui-toggle-chat-row-min-height, 33px)
        ) !important;
        align-items: flex-start !important;
        flex-wrap: wrap !important;
        gap: 0 4px !important;
        contain: none !important;
        overflow: visible !important;
      }

      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        :where(
          [class*="live_chatting_message_container" i],
          [class*="_chatting_message_" i],
          button[class*="live_chatting_message_nickname" i],
          button[class*="nickname" i],
          [class*="live_chatting_username_container" i],
          [class*="live_chatting_username_wrapper" i],
          [${MESSAGE_PREFIX_ATTR}]
        ) {
        height: auto !important;
        min-height: var(--chzzk-chat-ui-toggle-chat-line-height, 25px) !important;
        max-width: 100% !important;
        min-width: 0 !important;
        line-height: inherit !important;
        align-items: flex-start !important;
        overflow: visible !important;
        max-height: none !important;
      }

      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [class*="live_chatting_message_text" i],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [class*="_chatting_message_" i] [class*="_text_" i],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [class*="live_chatting_username_nickname" i],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        button[class*="nickname" i] [class*="nickname" i],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [class*="name_text" i],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [${MESSAGE_PREFIX_ATTR}],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [${MESSAGE_PREFIX_ATTR}] :where(span, button),
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [${ROLE_ATTR}~="nickname"],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        .chzzk-chat-ui-toggle-timestamp {
        font-size: inherit !important;
        line-height: inherit !important;
        height: auto !important;
        overflow: visible !important;
        max-height: none !important;
      }

      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        :where(
          [class*="live_chatting_message_text" i],
          [class*="_chatting_message_" i] [class*="_text_" i],
          [class*="message_text" i],
          [class*="message" i] [class*="text" i]
        ) {
        font-size: inherit !important;
        line-height: inherit !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
      }

      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        :where(
          [class*="live_chatting_message_text" i],
          [class*="_chatting_message_" i] [class*="_text_" i],
          [class*="message_text" i],
          [class*="message" i] [class*="text" i]
        )
        :where(img, [class*="emoticon" i], [class*="emote" i], [class*="emoji" i]),
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        :where(
          [class*="live_chatting_message_container" i],
          [class*="_chatting_message_" i]
        )
        img:not([class*="badge" i]):not([class*="grade" i]):not([class*="profile" i]):not([src*="badge" i]):not([src*="profile_image" i]):not([src*="/glive/icon/" i]) {
        width: auto !important;
        height: var(--chzzk-chat-ui-toggle-chat-emote-size, 20px) !important;
        max-width: min(100%, calc(var(--chzzk-chat-ui-toggle-chat-emote-size, 20px) * 4)) !important;
        max-height: var(--chzzk-chat-ui-toggle-chat-emote-size, 20px) !important;
        object-fit: contain !important;
        vertical-align: middle !important;
      }

      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        :where(
          [class*="live_chatting_username_nickname" i],
          button[class*="nickname" i] [class*="nickname" i],
          [class*="name_text" i],
          [${ROLE_ATTR}~="nickname"],
          .chzzk-chat-ui-toggle-timestamp
        ) {
        font-size: inherit !important;
        line-height: inherit !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        white-space: nowrap !important;
      }

      html[data-chzzk-chat-ui-toggle-large-text="on"][data-chzzk-chat-ui-toggle-nickname-font-size="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        :where(
          [class*="live_chatting_username_nickname" i],
          button[class*="nickname" i] [class*="nickname" i],
          [class*="name_text" i],
          [${ROLE_ATTR}~="nickname"]
        ),
      html[data-chzzk-chat-ui-toggle-large-text="on"][data-chzzk-chat-ui-toggle-nickname-font-size="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        :where(
          [class*="live_chatting_username_nickname" i],
          button[class*="nickname" i] [class*="nickname" i],
          [class*="name_text" i],
          [${ROLE_ATTR}~="nickname"]
        ) * {
        font-size: var(
          --chzzk-chat-ui-toggle-nickname-font-size,
          var(--chzzk-chat-ui-toggle-chat-font-size, 13pt)
        ) !important;
        line-height: inherit !important;
      }

      html[data-chzzk-chat-ui-toggle-bold-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR},
      html[data-chzzk-chat-ui-toggle-bold-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR} :where(
          [class*="live_chatting_message_text" i],
          [class*="live_chatting_message_text" i] *,
          [class*="_chatting_message_" i] [class*="_text_" i],
          [class*="_chatting_message_" i] [class*="_text_" i] *,
          [class*="message_text" i],
          [class*="message_text" i] *,
          [class*="live_chatting_username_nickname" i],
          [class*="live_chatting_username_nickname" i] *,
          button[class*="nickname" i] [class*="nickname" i],
          button[class*="nickname" i] [class*="nickname" i] *,
          [class*="name_text" i],
          [class*="name_text" i] *,
          .chzzk-chat-ui-toggle-timestamp
        ) {
        font-weight: 650 !important;
      }

      html[data-chzzk-chat-ui-toggle-timestamps="on"]
        ${CHAT_ROW_SCOPE_SELECTOR}:has(:is([class*="live_chatting_message_nickname" i], button[class*="nickname" i])):not(:has(.chzzk-chat-ui-toggle-timestamp)) {
        visibility: hidden !important;
      }

      html[data-chzzk-chat-ui-toggle-donation-ranking="off"]
        [class*="live_chatting_ranking_container" i],
      html[data-chzzk-chat-ui-toggle-donation-ranking="off"]
        aside#aside-chatting > :has([class*="ranking" i]) {
        display: none !important;
      }

      html[data-chzzk-chat-ui-toggle-nicknames="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        [class*="live_chatting_username_nickname" i],
      html[data-chzzk-chat-ui-toggle-nicknames="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="nickname" i] [class*="nickname" i],
      html[data-chzzk-chat-ui-toggle-nicknames="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        [class*="name_text" i] {
        display: none !important;
      }

      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="live_chatting_message_nickname" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="nickname" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        [class*="live_chatting_username_container" i] {
        column-gap: 0 !important;
        gap: 0 !important;
      }

      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="live_chatting_message_nickname" i]
        [class*="live_chatting_username_wrapper" i]:has(img, svg),
      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="live_chatting_message_nickname" i]
        [class*="live_chatting_username_icon" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="live_chatting_message_nickname" i]
        [class*="badge_container" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="live_chatting_message_nickname" i]
        img[src*="badge" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="live_chatting_message_nickname" i]
        svg {
        display: none !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="nickname" i]
        img[src*="/glive/" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        button[class*="nickname" i]
        svg {
        display: none !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      html[data-chzzk-chat-ui-toggle-nicknames="off"] ${CHAT_ROW_SCOPE_SELECTOR} [${ROLE_ATTR}~="nickname"],
      html[data-chzzk-chat-ui-toggle-badges="off"] ${CHAT_ROW_SCOPE_SELECTOR} [${ROLE_ATTR}~="badge"],
      html[data-chzzk-chat-ui-toggle-timestamps="off"] ${CHAT_ROW_SCOPE_SELECTOR} [${ROLE_ATTR}~="timestamp"] {
        display: none !important;
      }

      html[data-chzzk-chat-ui-toggle-badges="off"] ${CHAT_ROW_SCOPE_SELECTOR} [${MESSAGE_PREFIX_ATTR}] {
        column-gap: 0 !important;
        gap: 0 !important;
      }

      html[data-chzzk-chat-ui-toggle-badges="off"] ${CHAT_ROW_SCOPE_SELECTOR} [${ROLE_ATTR}~="badge"] {
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      html[data-chzzk-chat-ui-toggle-nicknames="off"][data-chzzk-chat-ui-toggle-badges="off"][data-chzzk-chat-ui-toggle-timestamps="off"]
        ${CHAT_ROW_SCOPE_SELECTOR} [${MESSAGE_PREFIX_ATTR}] {
        display: none !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      html[data-chzzk-chat-ui-toggle-nicknames="off"][data-chzzk-chat-ui-toggle-badges="off"][data-chzzk-chat-ui-toggle-timestamps="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        [class*="live_chatting_message_container" i],
      html[data-chzzk-chat-ui-toggle-nicknames="off"][data-chzzk-chat-ui-toggle-badges="off"][data-chzzk-chat-ui-toggle-timestamps="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        [class*="_chatting_message_" i],
      html[data-chzzk-chat-ui-toggle-nicknames="off"][data-chzzk-chat-ui-toggle-badges="off"][data-chzzk-chat-ui-toggle-timestamps="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        [class*="live_chatting_message_text" i] {
        column-gap: 0 !important;
        gap: 0 !important;
        margin-left: 0 !important;
        padding-left: 0 !important;
      }
    `;

    if (!style.parentElement) {
      document.documentElement.appendChild(style);
    }
  }

  function markReady() {
    document.documentElement.dataset.chzzkChatUiToggleReady = "true";
  }

  function applyOptions(options, { markAsReady = true, cache = true, source = "direct" } = {}) {
    cleanupUnscopedAnnotations();
    lastFullCleanupAt = Date.now();
    currentOptions = normalizeOptions(options);
    lastOptionsSource = source;
    lastOptionsLoadError = "";

    if (cache) {
      writeCachedOptions(currentOptions);
    }

    document.documentElement.dataset.chzzkChatUiToggleVersion = SCRIPT_VERSION;
    document.documentElement.dataset.chzzkChatUiToggleChatBoxColor = currentOptions.chatBoxColor;
    document.documentElement.dataset.chzzkChatUiToggleChatFontSizePt =
      String(currentOptions.chatFontSizePt);
    document.documentElement.dataset.chzzkChatUiToggleNicknameFontSizePt =
      String(currentOptions.nicknameFontSizePt);
    document.documentElement.dataset.chzzkChatUiToggleMiniFloatingChatScale =
      String(currentOptions.miniFloatingChatScale);

    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-box-bg",
      hexToRgba(currentOptions.chatBoxColor, 0.18)
    );
    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-box-bg-hover",
      hexToRgba(currentOptions.chatBoxColor, 0.26)
    );
    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-mini-chat-scale",
      String(currentOptions.miniFloatingChatScale / 100)
    );
    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-chat-font-size",
      `${currentOptions.chatFontSizePt}pt`
    );
    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-nickname-font-size",
      `${currentOptions.nicknameFontSizePt}pt`
    );
    const chatTextFontSizePx = currentOptions.chatFontSizePt * 96 / 72;
    const chatEmoteSizePx = Math.max(20, chatTextFontSizePx);
    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-chat-emote-size",
      `${chatEmoteSizePx.toFixed(2)}px`
    );
    const effectiveNicknameFontSizePt = currentOptions.useNicknameFontSize
      ? currentOptions.nicknameFontSizePt
      : currentOptions.chatFontSizePt;
    const maxChatLineFontSizePt = Math.max(currentOptions.chatFontSizePt, effectiveNicknameFontSizePt);
    const chatLineTextHeightPx = maxChatLineFontSizePt * 96 / 72 * 1.45;
    const chatLineHeightPx = Math.max(chatLineTextHeightPx, chatEmoteSizePx);
    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-chat-line-height",
      `${chatLineHeightPx.toFixed(2)}px`
    );
    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-chat-row-min-height",
      `${(chatLineHeightPx + 8).toFixed(2)}px`
    );

    for (const [optionKey, datasetKey] of Object.entries(DATASET_KEYS)) {
      document.documentElement.dataset[datasetKey] = currentOptions[optionKey] ? "on" : "off";
    }

    syncGuestChatUi();
    scheduleLargeTextLayoutSync();

    if (markAsReady) {
      markReady();
    }
  }

  function getStatus() {
    return {
      ok: true,
      version: SCRIPT_VERSION,
      styleVersion: document.getElementById(STYLE_ID)?.dataset.chzzkChatUiToggleVersion || null,
      options: currentOptions,
      optionsSource: lastOptionsSource,
      optionsLoadError: lastOptionsLoadError,
      guestChatTheme: currentGuestChatTheme,
      guestCleanBotDefault: document.documentElement.getAttribute(GUEST_CHAT_CLEANBOT_DEFAULT_ATTR),
      detectedTheme: document.documentElement.dataset.chzzkChatUiToggleDetectedTheme || null,
      detectedThemeSource: document.documentElement.dataset.chzzkChatUiToggleDetectedThemeSource || null
    };
  }

  function queryAllSafe(root, selectorList) {
    const results = [];

    for (const selector of selectorList) {
      try {
        results.push(...root.querySelectorAll(selector));
      } catch (_error) {
        // Chzzk class names can change. A bad selector must not break the page.
      }
    }

    return [...new Set(results)];
  }

  function queryAllIncludingRootSafe(root, selectorList) {
    const results = [];

    if (root instanceof Element && matchesAnySafe(root, selectorList)) {
      results.push(root);
    }

    results.push(...queryAllSafe(root, selectorList));
    return [...new Set(results)];
  }

  function extractLiveChannelIdFromUrl(url) {
    try {
      const parsedUrl = new URL(url);
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

  function getTopLocationHref() {
    try {
      return window.top?.location?.href || "";
    } catch (_error) {
      return "";
    }
  }

  function getCurrentLivePageUrl() {
    const topHref = getTopLocationHref();

    if (extractLiveChannelIdFromUrl(topHref)) {
      return topHref;
    }

    return extractLiveChannelIdFromUrl(window.location.href) ? window.location.href : null;
  }

  function isLiveChatFrameUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

      return pathParts[0] === "live" && LIVE_CHANNEL_ID_PATTERN.test(pathParts[1] || "") && pathParts[2] === "chat";
    } catch (_error) {
      return false;
    }
  }

  function isGuestChatFrameEmbedUrl(url) {
    try {
      const parsedUrl = new URL(url);

      return isLiveChatFrameUrl(url) && parsedUrl.searchParams.get(GUEST_CHAT_FRAME_MARKER_PARAM) === "1";
    } catch (_error) {
      return false;
    }
  }

  function isMiniChatFrameEmbedUrl(url) {
    try {
      const parsedUrl = new URL(url);

      return isLiveChatFrameUrl(url) && parsedUrl.searchParams.get(MINI_CHAT_FRAME_MARKER_PARAM) === "1";
    } catch (_error) {
      return false;
    }
  }

  function applyGuestChatCleanBotDefault() {
    if (!isGuestChatFrameEmbedUrl(window.location.href)) {
      document.documentElement.removeAttribute(GUEST_CHAT_CLEANBOT_DEFAULT_ATTR);
      return;
    }

    try {
      window.localStorage?.setItem(GUEST_CHAT_CLEANBOT_STORAGE_KEY, GUEST_CHAT_CLEANBOT_DISABLED_VALUE);
      document.documentElement.setAttribute(GUEST_CHAT_CLEANBOT_DEFAULT_ATTR, "off");
    } catch (_error) {
      document.documentElement.setAttribute(GUEST_CHAT_CLEANBOT_DEFAULT_ATTR, "blocked");
    }
  }

  function getGuestChatFrameTheme() {
    if (window.self === window.top && !isLiveChatFrameUrl(window.location.href)) {
      return detectPageTheme();
    }

    return normalizeGuestChatTheme(currentGuestChatTheme);
  }

  function getGuestChatFrameUrl() {
    const pageUrl = getCurrentLivePageUrl();
    const channelId = extractLiveChannelIdFromUrl(pageUrl);

    if (!channelId) {
      return null;
    }

    const frameUrl = new URL(`${CHZZK_ORIGIN}/live/${channelId}/chat`);
    const theme = getGuestChatFrameTheme();

    frameUrl.searchParams.set(GUEST_CHAT_FRAME_MARKER_PARAM, "1");

    if (theme) {
      frameUrl.searchParams.set("theme", theme);
    }

    return frameUrl.toString();
  }

  function getMiniChatFrameUrl() {
    const pageUrl = getCurrentLivePageUrl();
    const channelId = extractLiveChannelIdFromUrl(pageUrl);

    if (!channelId) {
      return null;
    }

    const frameUrl = new URL(`${CHZZK_ORIGIN}/live/${channelId}/chat`);
    const theme = getGuestChatFrameTheme();

    frameUrl.searchParams.set(MINI_CHAT_FRAME_MARKER_PARAM, "1");

    if (theme) {
      frameUrl.searchParams.set("theme", theme);
    }

    return frameUrl.toString();
  }

  function isMiniFloatingChatEligibleContext() {
    if (window.self !== window.top) {
      return false;
    }

    return Boolean(getMiniChatFrameUrl()) && !isLiveChatFrameUrl(window.location.href);
  }

  function getViewportBounds() {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
  }

  function clampMiniChatBoundsToViewport(
    bounds,
    { scale = currentOptions.miniFloatingChatScale, inputOnly = currentOptions.miniFloatingChatInputOnly } = {}
  ) {
    const normalizedBounds = normalizeMiniChatBounds(bounds, { inputOnly });
    const viewport = getViewportBounds();
    const scaleRatio = getMiniChatScaleRatio(scale);
    const minHeight = getMiniChatMinHeight(inputOnly);
    const fallbackHeight = inputOnly ? MINI_CHAT_INPUT_ONLY_HEIGHT : MINI_CHAT_DEFAULT_HEIGHT;
    const maxWidth = Math.max(
      MINI_CHAT_MIN_WIDTH,
      Math.min(MINI_CHAT_MAX_WIDTH, (viewport.width - MINI_CHAT_VIEWPORT_MARGIN * 2) / scaleRatio)
    );
    const maxHeight = Math.max(
      minHeight,
      Math.min(MINI_CHAT_MAX_HEIGHT, (viewport.height - MINI_CHAT_VIEWPORT_MARGIN * 2) / scaleRatio)
    );
    const width = clampNumber(normalizedBounds.width, MINI_CHAT_MIN_WIDTH, maxWidth, MINI_CHAT_DEFAULT_WIDTH);
    const height = clampNumber(normalizedBounds.height, minHeight, maxHeight, fallbackHeight);
    const visibleWidth = width * scaleRatio;
    const visibleHeight = height * scaleRatio;
    const fallbackLeft = viewport.width - visibleWidth - 20;
    const fallbackTop = viewport.height - height - 20;
    const maxLeft = Math.max(MINI_CHAT_VIEWPORT_MARGIN, viewport.width - visibleWidth - MINI_CHAT_VIEWPORT_MARGIN);
    const minTop = MINI_CHAT_VIEWPORT_MARGIN - height + visibleHeight;
    const maxTop = Math.max(minTop, viewport.height - height - MINI_CHAT_VIEWPORT_MARGIN);
    const left = clampNumber(
      normalizedBounds.left,
      MINI_CHAT_VIEWPORT_MARGIN,
      maxLeft,
      Math.max(MINI_CHAT_VIEWPORT_MARGIN, fallbackLeft)
    );
    const top = clampNumber(
      normalizedBounds.top,
      minTop,
      maxTop,
      Math.max(minTop, Math.min(maxTop, fallbackTop))
    );

    return { left, top, width, height };
  }

  function applyMiniChatPanelBounds(panel, bounds, clampOptions) {
    const nextBounds = clampMiniChatBoundsToViewport(bounds, clampOptions);

    panel.style.left = `${nextBounds.left}px`;
    panel.style.top = `${nextBounds.top}px`;
    panel.style.width = `${nextBounds.width}px`;
    panel.style.height = `${nextBounds.height}px`;
  }

  function readMiniChatPanelBounds(panel) {
    const rect = panel.getBoundingClientRect();
    const scaleRatio = getMiniChatScaleRatio();
    const styledLeft = Number.parseFloat(panel.style.left);
    const styledTop = Number.parseFloat(panel.style.top);
    const height = rect.height / scaleRatio;

    return normalizeMiniChatBounds({
      left: Number.isFinite(styledLeft) ? styledLeft : rect.left,
      top: Number.isFinite(styledTop) ? styledTop : rect.bottom - height,
      width: rect.width / scaleRatio,
      height
    }, { inputOnly: currentOptions.miniFloatingChatInputOnly });
  }

  function clampMiniChatBubbleBounds(bounds) {
    const viewport = getViewportBounds();
    const maxLeft = Math.max(MINI_CHAT_VIEWPORT_MARGIN, viewport.width - MINI_CHAT_BUBBLE_SIZE - MINI_CHAT_VIEWPORT_MARGIN);
    const maxTop = Math.max(MINI_CHAT_VIEWPORT_MARGIN, viewport.height - MINI_CHAT_BUBBLE_SIZE - MINI_CHAT_VIEWPORT_MARGIN);

    return {
      left: clampNumber(bounds?.left, MINI_CHAT_VIEWPORT_MARGIN, maxLeft, maxLeft),
      top: clampNumber(bounds?.top, MINI_CHAT_VIEWPORT_MARGIN, maxTop, maxTop)
    };
  }

  function applyMiniChatBubbleBounds(button, bounds) {
    const nextBounds = clampMiniChatBubbleBounds(bounds);

    miniChatBubbleBounds = nextBounds;
    button.style.left = `${nextBounds.left}px`;
    button.style.top = `${nextBounds.top}px`;
  }

  function getMiniChatBubbleBoundsFromPanel(panel) {
    const rect = panel.getBoundingClientRect();

    return clampMiniChatBubbleBounds({
      left: rect.right - MINI_CHAT_BUBBLE_SIZE,
      top: rect.bottom - MINI_CHAT_BUBBLE_SIZE
    });
  }

  function getMiniChatRestoreBoundsFromBubble(bounds, restoreBounds = miniChatRestoreBounds) {
    const baseBounds = normalizeMiniChatBounds(restoreBounds || currentOptions.miniFloatingChatBounds, {
      inputOnly: currentOptions.miniFloatingChatInputOnly
    });
    const bubbleBounds = clampMiniChatBubbleBounds(bounds);
    const scaleRatio = getMiniChatScaleRatio();
    const left = bubbleBounds.left + MINI_CHAT_BUBBLE_SIZE - baseBounds.width * scaleRatio;
    const top = bubbleBounds.top + MINI_CHAT_BUBBLE_SIZE - baseBounds.height;

    return clampMiniChatBoundsToViewport({
      ...baseBounds,
      left,
      top
    });
  }

  function resetMiniChatMinimizeState() {
    miniChatMinimized = false;
    miniChatBubbleBounds = null;
    miniChatRestoreBounds = null;
    miniChatBubbleIgnoreNextClick = false;
    miniChatBubbleDragState = null;
  }

  function removeMiniChatBubbleButton({ reset = false } = {}) {
    miniChatBubbleDragState = null;
    document.getElementById(MINI_CHAT_BUBBLE_ID)?.remove();

    if (reset) {
      resetMiniChatMinimizeState();
    }
  }

  function setMiniChatBubbleButtonState(button) {
    button.title = "미니 채팅창 펼치기";
    button.setAttribute("aria-label", button.title);
  }

  function handleMiniChatBubbleDragStart(event) {
    if (event.button !== 0) {
      return;
    }

    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const bounds = clampMiniChatBubbleBounds(miniChatBubbleBounds || {
      left: button.getBoundingClientRect().left,
      top: button.getBoundingClientRect().top
    });

    miniChatBubbleDragState = {
      pointerId: event.pointerId,
      button,
      startX: event.clientX,
      startY: event.clientY,
      left: bounds.left,
      top: bounds.top,
      moved: false
    };
    button.dataset.dragging = "true";
    button.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMiniChatBubbleDragMove(event) {
    if (!miniChatBubbleDragState || miniChatBubbleDragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - miniChatBubbleDragState.startX;
    const deltaY = event.clientY - miniChatBubbleDragState.startY;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
      miniChatBubbleDragState.moved = true;
    }

    applyMiniChatBubbleBounds(miniChatBubbleDragState.button, {
      left: miniChatBubbleDragState.left + deltaX,
      top: miniChatBubbleDragState.top + deltaY
    });
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMiniChatBubbleDragEnd(event) {
    if (!miniChatBubbleDragState || miniChatBubbleDragState.pointerId !== event.pointerId) {
      return;
    }

    const { button, moved } = miniChatBubbleDragState;
    miniChatBubbleDragState = null;
    delete button.dataset.dragging;
    button.releasePointerCapture?.(event.pointerId);

    if (moved) {
      miniChatBubbleIgnoreNextClick = true;
      window.setTimeout(() => {
        miniChatBubbleIgnoreNextClick = false;
      }, 0);
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function createMiniChatBubbleButton() {
    const button = document.createElement("button");
    const icon = document.createElement("span");

    button.id = MINI_CHAT_BUBBLE_ID;
    button.type = "button";
    icon.className = MINI_CHAT_BUBBLE_ICON_CLASS;
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `
      <svg viewBox="0 0 22 22" aria-hidden="true" focusable="false">
        <path d="M6.2 5.2h9.6c1.55 0 2.7 1.08 2.7 2.52v5.18c0 1.44-1.15 2.52-2.7 2.52H9.5L5.6 17.7v-2.28c-1.3-.17-2.1-1.18-2.1-2.52V7.72c0-1.44 1.15-2.52 2.7-2.52Z"></path>
        <circle cx="8.5" cy="10.35" r="0.95"></circle>
        <circle cx="13.5" cy="10.35" r="0.95"></circle>
      </svg>
    `;
    button.append(icon);
    setMiniChatBubbleButtonState(button);
    button.addEventListener("pointerdown", handleMiniChatBubbleDragStart);
    button.addEventListener("pointermove", handleMiniChatBubbleDragMove);
    button.addEventListener("pointerup", handleMiniChatBubbleDragEnd);
    button.addEventListener("pointercancel", handleMiniChatBubbleDragEnd);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (miniChatBubbleIgnoreNextClick) {
        miniChatBubbleIgnoreNextClick = false;
        return;
      }

      restoreMiniFloatingChatFromBubble();
    });

    return button;
  }

  function syncMiniChatBubbleButton(host) {
    if (!(host instanceof HTMLElement)) {
      return null;
    }

    const button = document.getElementById(MINI_CHAT_BUBBLE_ID) instanceof HTMLButtonElement
      ? document.getElementById(MINI_CHAT_BUBBLE_ID)
      : createMiniChatBubbleButton();

    if (button.parentElement !== host) {
      host.append(button);
    }

    if (host === document.body) {
      button.removeAttribute(MINI_CHAT_FULLSCREEN_HOST_ATTR);
    } else {
      button.setAttribute(MINI_CHAT_FULLSCREEN_HOST_ATTR, "true");
    }

    setMiniChatBubbleButtonState(button);
    applyMiniChatBubbleBounds(button, miniChatBubbleBounds || {
      left: getViewportBounds().width - MINI_CHAT_BUBBLE_SIZE - 20,
      top: getViewportBounds().height - MINI_CHAT_BUBBLE_SIZE - 20
    });

    return button;
  }

  function minimizeMiniFloatingChatToBubble(panel) {
    if (!(panel instanceof HTMLElement)) {
      return;
    }

    miniChatRestoreBounds = readMiniChatPanelBounds(panel);
    miniChatBubbleBounds = getMiniChatBubbleBoundsFromPanel(panel);
    miniChatMinimized = true;
    panel.remove();
    syncMiniFloatingChatPanel();
  }

  async function restoreMiniFloatingChatFromBubble() {
    const button = document.getElementById(MINI_CHAT_BUBBLE_ID);
    const bounds = button instanceof HTMLElement
      ? clampMiniChatBubbleBounds({
        left: button.getBoundingClientRect().left,
        top: button.getBoundingClientRect().top
      })
      : clampMiniChatBubbleBounds(miniChatBubbleBounds);
    const nextBounds = getMiniChatRestoreBoundsFromBubble(bounds);
    const patch = {
      miniFloatingChatBounds: nextBounds
    };

    if (currentOptions.miniFloatingChatInputOnly) {
      patch.miniFloatingChatExpandedBounds = getMiniChatExpandedBoundsFromInputOnly(nextBounds);
    }

    miniChatMinimized = false;
    miniChatBubbleBounds = null;
    miniChatRestoreBounds = null;
    removeMiniChatBubbleButton();

    const result = await updateMiniChatOptions(patch, "mini-chat-bubble-restore");

    if (!result.ok) {
      miniChatMinimized = true;
      miniChatBubbleBounds = bounds;
      miniChatRestoreBounds = nextBounds;
      syncMiniFloatingChatPanel();
    }
  }

  async function updateMiniChatOptions(patch, source) {
    const previousOptions = currentOptions;
    const nextOptions = normalizeOptions({
      ...currentOptions,
      ...patch
    });
    const result = await writeOptionsToStorageLocal(nextOptions);

    if (!result.ok) {
      applyOptions(previousOptions, { source: `${source}-error` });
      return result;
    }

    applyOptions(result.options, { source });
    return result;
  }

  function getMiniChatLayoutTopForVisualTop(visualTop, height, scale = currentOptions.miniFloatingChatScale) {
    const scaleRatio = getMiniChatScaleRatio(scale);

    return visualTop - height * (1 - scaleRatio);
  }

  function getMiniChatInputOnlyBounds(expandedBounds, { visualTop = null } = {}) {
    const baseBounds = clampMiniChatBoundsToViewport(expandedBounds, {
      inputOnly: false
    });
    const inputOnlyBounds = {
      ...baseBounds,
      top: Number.isFinite(visualTop)
        ? getMiniChatLayoutTopForVisualTop(visualTop, MINI_CHAT_INPUT_ONLY_HEIGHT)
        : baseBounds.top,
      height: MINI_CHAT_INPUT_ONLY_HEIGHT
    };

    return clampMiniChatBoundsToViewport(inputOnlyBounds, {
      inputOnly: true
    });
  }

  function getMiniChatExpandedBoundsFromInputOnly(inputOnlyBounds, { visualTop = null } = {}) {
    const compactBounds = clampMiniChatBoundsToViewport(inputOnlyBounds, {
      inputOnly: true
    });
    const storedExpandedBounds = currentOptions.miniFloatingChatExpandedBounds;
    const expandedBase = storedExpandedBounds || {
      ...compactBounds,
      height: MINI_CHAT_DEFAULT_HEIGHT
    };
    const expandedHeight = normalizeMiniChatBounds(expandedBase).height;
    const expandedBounds = {
      ...expandedBase,
      left: compactBounds.left,
      top: Number.isFinite(visualTop)
        ? getMiniChatLayoutTopForVisualTop(visualTop, expandedHeight)
        : compactBounds.top,
      width: compactBounds.width,
      height: expandedHeight
    };

    return clampMiniChatBoundsToViewport(expandedBounds, {
      inputOnly: false
    });
  }

  function toggleMiniChatInputOnly() {
    const panel = document.getElementById(MINI_CHAT_PANEL_ID);
    const visualTop = panel instanceof HTMLElement ? panel.getBoundingClientRect().top : null;
    const activeBounds = panel instanceof HTMLElement
      ? readMiniChatPanelBounds(panel)
      : currentOptions.miniFloatingChatBounds;

    if (currentOptions.miniFloatingChatInputOnly) {
      const expandedBounds = getMiniChatExpandedBoundsFromInputOnly(activeBounds, { visualTop });

      if (panel instanceof HTMLElement) {
        panel.dataset.inputOnly = "false";
        applyMiniChatPanelBounds(panel, expandedBounds, { inputOnly: false });
      }

      updateMiniChatOptions(
        {
          miniFloatingChatInputOnly: false,
          miniFloatingChatBounds: expandedBounds,
          miniFloatingChatExpandedBounds: expandedBounds
        },
        "mini-chat-input-only"
      );
      return;
    }

    const expandedBounds = clampMiniChatBoundsToViewport(activeBounds, {
      inputOnly: false
    });
    const inputOnlyBounds = getMiniChatInputOnlyBounds(expandedBounds, { visualTop });

    if (panel instanceof HTMLElement) {
      panel.dataset.inputOnly = "true";
      applyMiniChatPanelBounds(panel, inputOnlyBounds, { inputOnly: true });
    }

    updateMiniChatOptions(
      {
        miniFloatingChatInputOnly: true,
        miniFloatingChatBounds: inputOnlyBounds,
        miniFloatingChatExpandedBounds: expandedBounds
      },
      "mini-chat-input-only"
    );
  }

  function updateMiniChatScale(delta) {
    const nextScale = normalizeMiniChatScale(currentOptions.miniFloatingChatScale + delta);

    if (nextScale === currentOptions.miniFloatingChatScale) {
      return;
    }

    const panel = document.getElementById(MINI_CHAT_PANEL_ID);
    const currentBounds = panel instanceof HTMLElement
      ? readMiniChatPanelBounds(panel)
      : currentOptions.miniFloatingChatBounds;
    const nextBounds = clampMiniChatBoundsToViewport(currentBounds, {
      scale: nextScale,
      inputOnly: currentOptions.miniFloatingChatInputOnly
    });

    if (panel instanceof HTMLElement) {
      applyMiniChatPanelBounds(panel, nextBounds, {
        scale: nextScale,
        inputOnly: currentOptions.miniFloatingChatInputOnly
      });
    }

    const patch = {
      miniFloatingChatScale: nextScale,
      miniFloatingChatBounds: nextBounds
    };

    if (currentOptions.miniFloatingChatInputOnly) {
      patch.miniFloatingChatExpandedBounds = getMiniChatExpandedBoundsFromInputOnly(nextBounds);
    }

    updateMiniChatOptions(patch, "mini-chat-scale");
  }

  function saveMiniChatPanelBounds(panel, { immediate = false } = {}) {
    window.clearTimeout(miniChatBoundsSaveTimer);

    const save = () => {
      if (!panel.isConnected) {
        return;
      }

      const nextBounds = readMiniChatPanelBounds(panel);
      const patch = {
        miniFloatingChatBounds: nextBounds
      };

      if (currentOptions.miniFloatingChatInputOnly) {
        patch.miniFloatingChatExpandedBounds = getMiniChatExpandedBoundsFromInputOnly(nextBounds);
      }

      updateMiniChatOptions(patch, "mini-chat-bounds");
    };

    if (immediate) {
      save();
      return;
    }

    miniChatBoundsSaveTimer = window.setTimeout(save, 240);
  }

  function supportsCredentiallessIframe() {
    return typeof HTMLIFrameElement !== "undefined" && "credentialless" in HTMLIFrameElement.prototype;
  }

  function isGuestChatFrameEligibleContext() {
    if (window.self !== window.top) {
      return false;
    }

    return Boolean(getGuestChatFrameUrl()) && !isLiveChatFrameUrl(window.location.href);
  }

  function isElementVisible(element) {
    return element instanceof HTMLElement && element.getClientRects().length > 0;
  }

  function clearGuestChatHosts(activeHost = null) {
    const hosts = document.querySelectorAll(`[${GUEST_CHAT_HOST_ATTR}="true"]`);

    for (const host of hosts) {
      if (host !== activeHost) {
        host.removeAttribute(GUEST_CHAT_HOST_ATTR);
      }
    }
  }

  function removeGuestChatFrame() {
    document.getElementById(GUEST_CHAT_FRAME_CONTAINER_ID)?.remove();
    clearGuestChatHosts();
    clearGuestChatControlHosts();
  }

  function removeMiniFloatingChatPanel({ resetMinimized = false } = {}) {
    window.clearTimeout(miniChatBoundsSaveTimer);
    miniChatDragState = null;
    miniChatResizeState = null;
    document.getElementById(MINI_CHAT_PANEL_ID)?.remove();

    if (resetMinimized) {
      removeMiniChatBubbleButton({ reset: true });
    }
  }

  // Mini chat mode names (user-facing Korean terms):
  // - Chat view mode / "채팅 보기 모드": shows the chat list with the input box.
  // - Input-only mode / "입력 전용 모드": shows only the chat input/send box.
  function setMiniFloatingChatPanelState(panel) {
    const isInputOnly = currentOptions.miniFloatingChatInputOnly === true;
    const scale = currentOptions.miniFloatingChatScale;
    const minimizeButton = panel.querySelector(`.${MINI_CHAT_PANEL_MINIMIZE_CLASS}`);
    const closeButton = panel.querySelector(`.${MINI_CHAT_PANEL_CLOSE_CLASS}`);
    const inputOnlyButton = panel.querySelector(`.${MINI_CHAT_PANEL_INPUT_ONLY_CLASS}`);
    const scaleValue = panel.querySelector(`.${MINI_CHAT_PANEL_SCALE_VALUE_CLASS}`);
    const scaleDownButton = panel.querySelector(`[data-mini-chat-scale-delta="-${MINI_CHAT_SCALE_STEP}"]`);
    const scaleUpButton = panel.querySelector(`[data-mini-chat-scale-delta="${MINI_CHAT_SCALE_STEP}"]`);

    panel.dataset.inputOnly = String(isInputOnly);
    panel.dataset.scale = String(scale);

    if (scaleValue instanceof HTMLElement) {
      scaleValue.textContent = `${scale}%`;
      scaleValue.title = `채팅 배율 ${scale}%`;
    }

    if (scaleDownButton instanceof HTMLButtonElement) {
      scaleDownButton.disabled = scale <= MINI_CHAT_SCALE_MIN;
      scaleDownButton.title = `채팅 배율 줄이기 (${Math.max(MINI_CHAT_SCALE_MIN, scale - MINI_CHAT_SCALE_STEP)}%)`;
      scaleDownButton.setAttribute("aria-label", scaleDownButton.title);
    }

    if (scaleUpButton instanceof HTMLButtonElement) {
      scaleUpButton.disabled = scale >= MINI_CHAT_SCALE_MAX;
      scaleUpButton.title = `채팅 배율 키우기 (${Math.min(MINI_CHAT_SCALE_MAX, scale + MINI_CHAT_SCALE_STEP)}%)`;
      scaleUpButton.setAttribute("aria-label", scaleUpButton.title);
    }

    if (inputOnlyButton instanceof HTMLButtonElement) {
      inputOnlyButton.textContent = "ㅁ";
      inputOnlyButton.title = isInputOnly ? "채팅 목록 보기" : "입력창만 보기";
      inputOnlyButton.setAttribute("aria-label", inputOnlyButton.title);
      inputOnlyButton.setAttribute("aria-pressed", String(isInputOnly));
    }

    if (minimizeButton instanceof HTMLButtonElement) {
      minimizeButton.textContent = "−";
      minimizeButton.title = "말풍선으로 최소화";
      minimizeButton.setAttribute("aria-label", minimizeButton.title);
    }

    if (closeButton instanceof HTMLButtonElement) {
      closeButton.title = "미니 채팅창 닫기";
      closeButton.setAttribute("aria-label", closeButton.title);
    }
  }

  function handleMiniChatDragStart(event) {
    if (event.button !== 0 || event.target?.closest?.("button")) {
      return;
    }

    const dragHandle = event.currentTarget;
    const panel = dragHandle.closest(`#${MINI_CHAT_PANEL_ID}`);

    if (!(panel instanceof HTMLElement)) {
      return;
    }

    const bounds = readMiniChatPanelBounds(panel);
    miniChatDragState = {
      pointerId: event.pointerId,
      panel,
      startX: event.clientX,
      startY: event.clientY,
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height
    };
    panel.dataset.dragging = "true";
    dragHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handleMiniChatDragMove(event) {
    if (!miniChatDragState || miniChatDragState.pointerId !== event.pointerId) {
      return;
    }

    const nextBounds = clampMiniChatBoundsToViewport({
      left: miniChatDragState.left + event.clientX - miniChatDragState.startX,
      top: miniChatDragState.top + event.clientY - miniChatDragState.startY,
      width: miniChatDragState.width,
      height: miniChatDragState.height
    }, {
      inputOnly: currentOptions.miniFloatingChatInputOnly
    });

    miniChatDragState.panel.style.left = `${nextBounds.left}px`;
    miniChatDragState.panel.style.top = `${nextBounds.top}px`;
    event.preventDefault();
  }

  function handleMiniChatDragEnd(event) {
    if (!miniChatDragState || miniChatDragState.pointerId !== event.pointerId) {
      return;
    }

    const { panel } = miniChatDragState;
    miniChatDragState = null;
    delete panel.dataset.dragging;
    saveMiniChatPanelBounds(panel, { immediate: true });
    event.preventDefault();
  }

  function handleMiniChatResizeStart(event) {
    if (event.button !== 0) {
      return;
    }

    const handle = event.currentTarget;
    const panel = handle.closest(`#${MINI_CHAT_PANEL_ID}`);

    if (!(panel instanceof HTMLElement)) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const scaleRatio = getMiniChatScaleRatio();
    miniChatResizeState = {
      pointerId: event.pointerId,
      panel,
      scaleRatio,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      visualTop: rect.top,
      width: rect.width / scaleRatio,
      height: rect.height / scaleRatio
    };
    panel.dataset.resizing = "true";
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMiniChatResizeMove(event) {
    if (!miniChatResizeState || miniChatResizeState.pointerId !== event.pointerId) {
      return;
    }

    const viewport = getViewportBounds();
    const maxWidth = Math.max(
      MINI_CHAT_MIN_WIDTH,
      Math.min(
        MINI_CHAT_MAX_WIDTH,
        (viewport.width - miniChatResizeState.left - MINI_CHAT_VIEWPORT_MARGIN) /
          miniChatResizeState.scaleRatio
      )
    );
    const maxHeight = Math.max(
      MINI_CHAT_MIN_HEIGHT,
      Math.min(
        MINI_CHAT_MAX_HEIGHT,
        (viewport.height - miniChatResizeState.visualTop - MINI_CHAT_VIEWPORT_MARGIN) /
          miniChatResizeState.scaleRatio
      )
    );
    const width = clampNumber(
      miniChatResizeState.width + (event.clientX - miniChatResizeState.startX) / miniChatResizeState.scaleRatio,
      MINI_CHAT_MIN_WIDTH,
      maxWidth,
      miniChatResizeState.width
    );
    const height = currentOptions.miniFloatingChatInputOnly
      ? MINI_CHAT_INPUT_ONLY_HEIGHT
      : clampNumber(
        miniChatResizeState.height + (event.clientY - miniChatResizeState.startY) / miniChatResizeState.scaleRatio,
        MINI_CHAT_MIN_HEIGHT,
        maxHeight,
        miniChatResizeState.height
      );
    const top = miniChatResizeState.visualTop - height * (1 - miniChatResizeState.scaleRatio);

    miniChatResizeState.panel.style.left = `${miniChatResizeState.left}px`;
    miniChatResizeState.panel.style.top = `${top}px`;
    miniChatResizeState.panel.style.width = `${width}px`;
    miniChatResizeState.panel.style.height = `${height}px`;
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMiniChatResizeEnd(event) {
    if (!miniChatResizeState || miniChatResizeState.pointerId !== event.pointerId) {
      return;
    }

    const { panel } = miniChatResizeState;
    miniChatResizeState = null;
    delete panel.dataset.resizing;
    saveMiniChatPanelBounds(panel, { immediate: true });
    event.preventDefault();
    event.stopPropagation();
  }

  function createMiniFloatingChatPanel() {
    const panel = document.createElement("section");
    const controlsBar = document.createElement("div");
    const scaleControls = document.createElement("div");
    const scaleDownButton = document.createElement("button");
    const scaleValue = document.createElement("span");
    const scaleUpButton = document.createElement("button");
    const modeControls = document.createElement("div");
    const inputOnlyButton = document.createElement("button");
    const actions = document.createElement("div");
    const minimizeButton = document.createElement("button");
    const closeButton = document.createElement("button");
    const body = document.createElement("div");
    const iframe = document.createElement("iframe");
    const resizeHandle = document.createElement("div");

    panel.id = MINI_CHAT_PANEL_ID;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "미니 채팅");

    controlsBar.className = MINI_CHAT_PANEL_CONTROLS_CLASS;
    controlsBar.addEventListener("pointerdown", handleMiniChatDragStart);
    controlsBar.addEventListener("pointermove", handleMiniChatDragMove);
    controlsBar.addEventListener("pointerup", handleMiniChatDragEnd);
    controlsBar.addEventListener("pointercancel", handleMiniChatDragEnd);

    actions.dataset.miniChatActions = "true";
    modeControls.className = MINI_CHAT_PANEL_MODE_CLASS;
    modeControls.dataset.miniChatMode = "true";
    scaleControls.className = MINI_CHAT_PANEL_SCALE_CLASS;
    scaleControls.dataset.miniChatScaleControls = "true";

    scaleDownButton.type = "button";
    scaleDownButton.className = MINI_CHAT_PANEL_SCALE_BUTTON_CLASS;
    scaleDownButton.dataset.miniChatScaleDelta = String(-MINI_CHAT_SCALE_STEP);
    scaleDownButton.textContent = "-";
    scaleDownButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      updateMiniChatScale(-MINI_CHAT_SCALE_STEP);
    });

    scaleValue.className = MINI_CHAT_PANEL_SCALE_VALUE_CLASS;
    scaleValue.setAttribute("aria-live", "polite");

    scaleUpButton.type = "button";
    scaleUpButton.className = MINI_CHAT_PANEL_SCALE_BUTTON_CLASS;
    scaleUpButton.dataset.miniChatScaleDelta = String(MINI_CHAT_SCALE_STEP);
    scaleUpButton.textContent = "+";
    scaleUpButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      updateMiniChatScale(MINI_CHAT_SCALE_STEP);
    });

    inputOnlyButton.type = "button";
    inputOnlyButton.className = MINI_CHAT_PANEL_INPUT_ONLY_CLASS;
    inputOnlyButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleMiniChatInputOnly();
    });

    minimizeButton.type = "button";
    minimizeButton.className = MINI_CHAT_PANEL_MINIMIZE_CLASS;
    minimizeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      minimizeMiniFloatingChatToBubble(panel);
    });

    closeButton.type = "button";
    closeButton.className = MINI_CHAT_PANEL_CLOSE_CLASS;
    closeButton.textContent = "×";
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      updateMiniChatOptions(
        {
          useMiniFloatingChat: false
        },
        "mini-chat-close"
      );
    });

    body.dataset.miniChatBody = "true";
    iframe.id = MINI_CHAT_FRAME_ID;
    iframe.title = "미니 치지직 채팅";
    iframe.referrerPolicy = "origin";
    body.append(iframe);

    resizeHandle.className = MINI_CHAT_PANEL_RESIZE_CLASS;
    resizeHandle.setAttribute("role", "presentation");
    resizeHandle.addEventListener("pointerdown", handleMiniChatResizeStart);
    resizeHandle.addEventListener("pointermove", handleMiniChatResizeMove);
    resizeHandle.addEventListener("pointerup", handleMiniChatResizeEnd);
    resizeHandle.addEventListener("pointercancel", handleMiniChatResizeEnd);

    scaleControls.append(scaleDownButton, scaleValue, scaleUpButton);
    modeControls.append(inputOnlyButton);
    actions.append(minimizeButton, closeButton);
    controlsBar.append(scaleControls, modeControls, actions);
    panel.append(body, controlsBar, resizeHandle);
    setMiniFloatingChatPanelState(panel);

    return panel;
  }

  function canHostMiniChatFullscreenPanel(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    return !FULLSCREEN_UNSUPPORTED_MINI_CHAT_HOST_TAG_NAMES.has(element.tagName);
  }

  function getMiniChatPanelHost() {
    if (canHostMiniChatFullscreenPanel(document.fullscreenElement)) {
      return document.fullscreenElement;
    }

    return document.body || null;
  }

  function moveMiniChatPanelToHost(panel, host) {
    if (!(panel instanceof HTMLElement) || !(host instanceof HTMLElement)) {
      return;
    }

    if (panel.parentElement !== host) {
      host.append(panel);
    }

    if (host === document.body) {
      panel.removeAttribute(MINI_CHAT_FULLSCREEN_HOST_ATTR);
      return;
    }

    panel.setAttribute(MINI_CHAT_FULLSCREEN_HOST_ATTR, "true");
  }

  function handleMiniChatFullscreenChange() {
    scheduleGuestChatUiSync();
  }

  function isPageFullscreenActive() {
    return Boolean(document.fullscreenElement);
  }

  function shouldRenderGuestChatFrame() {
    return currentOptions.useGuestChatFrame && !isPageFullscreenActive();
  }

  function isMiniFloatingChatTemporarilyDisabledByGuestChat() {
    return currentOptions.useGuestChatFrame;
  }

  function shouldRenderMiniFloatingChatPanel() {
    if (!currentOptions.useMiniFloatingChat || !isMiniFloatingChatEligibleContext()) {
      return false;
    }

    if (isMiniFloatingChatTemporarilyDisabledByGuestChat()) {
      return false;
    }

    if (!currentOptions.miniFloatingChatFullscreenOnly) {
      return true;
    }

    return canHostMiniChatFullscreenPanel(document.fullscreenElement);
  }

  function syncMiniFloatingChatPanel() {
    const existingPanel = document.getElementById(MINI_CHAT_PANEL_ID);

    if (!currentOptions.useMiniFloatingChat || !isMiniFloatingChatEligibleContext()) {
      removeMiniFloatingChatPanel({ resetMinimized: true });
      return;
    }

    const panelHost = getMiniChatPanelHost();

    if (!panelHost) {
      removeMiniFloatingChatPanel();
      removeMiniChatBubbleButton();
      return;
    }

    const frameUrl = getMiniChatFrameUrl();

    if (!frameUrl) {
      removeMiniFloatingChatPanel({ resetMinimized: true });
      return;
    }

    if (!shouldRenderMiniFloatingChatPanel()) {
      removeMiniFloatingChatPanel();
      removeMiniChatBubbleButton();
      return;
    }

    if (miniChatMinimized) {
      removeMiniFloatingChatPanel();
      syncMiniChatBubbleButton(panelHost);
      return;
    }

    removeMiniChatBubbleButton();

    const isExistingPanel = existingPanel instanceof HTMLElement;
    const panel = isExistingPanel ? existingPanel : createMiniFloatingChatPanel();
    const iframe = panel.querySelector(`#${MINI_CHAT_FRAME_ID}`);
    const nextBounds = isExistingPanel ? readMiniChatPanelBounds(panel) : currentOptions.miniFloatingChatBounds;

    if (iframe instanceof HTMLIFrameElement && iframe.src !== frameUrl) {
      iframe.src = frameUrl;
    }

    setMiniFloatingChatPanelState(panel);
    moveMiniChatPanelToHost(panel, panelHost);
    applyMiniChatPanelBounds(panel, nextBounds);
  }

  function createGuestChatFrameContainer() {
    const container = document.createElement("div");
    const iframe = document.createElement("iframe");

    container.id = GUEST_CHAT_FRAME_CONTAINER_ID;
    iframe.id = GUEST_CHAT_FRAME_ID;
    iframe.title = "비로그인 치지직 채팅";
    iframe.referrerPolicy = "origin";
    iframe.setAttribute("credentialless", "");
    iframe.credentialless = true;
    container.append(iframe);

    return container;
  }

  function isDonationRankingPanel(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    const text = getCompactText(element);

    return (
      text.includes("랭킹") &&
      (element.matches("aside#aside-chatting > *") ||
        element.closest("aside#aside-chatting") ||
        element.querySelector("[class*='ranking' i]"))
    );
  }

  function isChatHeaderCandidate(element, { includeHidden = false } = {}) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (!includeHidden && !isElementVisible(element)) {
      return false;
    }

    if (isDonationRankingPanel(element)) {
      return false;
    }

    const className = getClassName(element);
    const text = getCompactText(element);
    const hasChatTitleText = text === "채팅" || /^채팅(?:방)?$/u.test(text) || /\bchat\b/i.test(text);
    const hasLegacyChatHeaderClass = /live_chatting_header_/i.test(className);

    return hasChatTitleText || hasLegacyChatHeaderClass;
  }

  function findChatHeaderInHost(host, { includeHidden = false } = {}) {
    if (!(host instanceof HTMLElement)) {
      return null;
    }

    const firstChild = host.firstElementChild;

    if (isChatHeaderCandidate(firstChild, { includeHidden })) {
      return firstChild;
    }

    for (const child of [...host.children]) {
      if (child.getAttribute("role") === "log") {
        break;
      }

      if (isChatHeaderCandidate(child, { includeHidden })) {
        return child;
      }
    }

    return null;
  }

  function findGuestChatHostFrom(element) {
    for (let current = element; current && current !== document.body; current = current.parentElement) {
      if (!(current instanceof HTMLElement)) {
        continue;
      }

      const className = getClassName(current);
      const hasChatShellClass = /live_chatting|chatting_area|chat_area/i.test(className);
      const isHeaderOnly = /live_chatting_header_/i.test(className);
      const isKnownChatAside = current.tagName === "ASIDE" && current.id === "aside-chatting";
      const hasModernChatShell = current.tagName === "ASIDE" && Boolean(current.querySelector("[role='log']"));
      const hasChatParts = Boolean(
        current.querySelector(
          "[class*='live_chatting_header_container' i], [class*='live_chatting_input_container' i], [class*='live_chatting_list_item' i], [role='log'], [class*='_chatting_message_' i]"
        )
      ) || isChatHeaderCandidate(current.firstElementChild, { includeHidden: true });

      if ((hasChatShellClass && !isHeaderOnly && hasChatParts) || hasModernChatShell || (isKnownChatAside && hasChatParts)) {
        return current;
      }
    }

    return null;
  }

  function findGuestChatHost() {
    const rowHost = findGuestChatHostFromRows();

    if (rowHost && rowHost !== document.body) {
      return rowHost;
    }

    const headerTarget = findChatHeaderTarget();
    const headerHost = headerTarget ? findGuestChatHostFrom(headerTarget) : null;

    if (headerHost) {
      return headerHost;
    }

    const actionHost = queryAllSafe(document, CHAT_ACTION_HOST_SELECTORS)
      .filter((element) => element instanceof HTMLElement)
      .filter(isElementVisible)
      .map(findGuestChatHostFrom)
      .find((element) => element instanceof HTMLElement);

    return actionHost || null;
  }

  function syncGuestChatFrame() {
    if (!shouldRenderGuestChatFrame() || !isGuestChatFrameEligibleContext() || !supportsCredentiallessIframe()) {
      removeGuestChatFrame();
      return;
    }

    const frameUrl = getGuestChatFrameUrl();
    const host = findGuestChatHost();

    if (!frameUrl || !host) {
      return;
    }

    const container =
      document.getElementById(GUEST_CHAT_FRAME_CONTAINER_ID) || createGuestChatFrameContainer();
    const iframe = container.querySelector(`#${GUEST_CHAT_FRAME_ID}`);

    if (iframe instanceof HTMLIFrameElement && iframe.src !== frameUrl) {
      iframe.src = frameUrl;
    }

    markGuestChatControlHost(host);
    host.setAttribute(GUEST_CHAT_HOST_ATTR, "true");
    clearGuestChatHosts(host);

    if (container.parentElement !== host) {
      host.append(container);
    }
  }

  function findChatHeaderFromChatAside({ includeHidden = false } = {}) {
    const hosts = queryAllSafe(document, ["aside#aside-chatting"])
      .filter((element) => element instanceof HTMLElement);

    for (const host of hosts) {
      const header = findChatHeaderInHost(host, { includeHidden });

      if (header) {
        return header;
      }
    }

    return null;
  }

  function findChatHeaderFromLog({ includeHidden = false } = {}) {
    const logs = queryAllSafe(document, ["[role='log']"])
      .filter((element) => element instanceof HTMLElement);

    for (const log of logs) {
      const host = log.closest("aside");
      const hostHeader = host?.firstElementChild instanceof HTMLElement ? host.firstElementChild : null;

      if (isChatHeaderCandidate(hostHeader, { includeHidden })) {
        return hostHeader;
      }

      for (
        let candidate = log.previousElementSibling;
        candidate instanceof HTMLElement;
        candidate = candidate.previousElementSibling
      ) {
        if (isDonationRankingPanel(candidate)) {
          continue;
        }

        if (isChatHeaderCandidate(candidate, { includeHidden })) {
          return candidate;
        }
      }
    }

    return null;
  }

  function findChatHeaderTarget({ includeHidden = false } = {}) {
    const candidates = queryAllSafe(document, CHAT_HEADER_SELECTORS)
      .filter((element) => element instanceof HTMLElement)
      .filter((element) => isChatHeaderCandidate(element, { includeHidden }));

    return candidates[0] || findChatHeaderFromChatAside({ includeHidden }) || findChatHeaderFromLog({ includeHidden });
  }

  function findGuestChatHostFromRows() {
    const rows = queryAllSafe(document, CHAT_ROW_SELECTORS)
      .filter((element) => element instanceof HTMLElement)
      .filter(isChatMessageRow)
      .slice(-20)
      .reverse();

    for (const row of rows) {
      let fallback = null;

      for (let element = row.parentElement; element && element !== document.body; element = element.parentElement) {
        if (!(element instanceof HTMLElement)) {
          continue;
        }

        const className = getClassName(element);
        const isChatContainer = /live_chatting|chatting_area|chat_area/i.test(className);
        const isChatRow = /live_chatting_list_item/i.test(className);
        const isModernChatLog = element.getAttribute("role") === "log";
        const isModernChatHost = element.tagName === "ASIDE" && Boolean(element.querySelector("[role='log']"));

        if (isChatContainer && !isChatRow) {
          fallback ??= element;
        }

        if (isModernChatLog || isModernChatHost) {
          fallback ??= isModernChatHost ? element : element.closest("aside") || element;
        }

        if (
          fallback &&
          (queryAllSafe(element, CHAT_HEADER_SELECTORS).some((candidate) => candidate instanceof HTMLElement) ||
            findChatHeaderFromLog({ includeHidden: true }))
        ) {
          return isModernChatHost ? element : fallback;
        }
      }

      if (fallback) {
        return fallback;
      }
    }

    return null;
  }

  function clearGuestChatControlHosts(activeHost = null) {
    const hosts = document.querySelectorAll(`[${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]`);

    for (const host of hosts) {
      if (host !== activeHost) {
        host.removeAttribute(GUEST_CHAT_CONTROL_HOST_ATTR);
      }
    }
  }

  function findGuestChatControlHost(guestHost, header = null) {
    if (!(guestHost instanceof HTMLElement)) {
      return null;
    }

    const headerElement = header instanceof HTMLElement
      ? header
      : queryAllSafe(guestHost, CHAT_HEADER_SELECTORS)
        .filter((element) => element instanceof HTMLElement)
        .find((element) => isChatHeaderCandidate(element, { includeHidden: true })) ||
        findChatHeaderInHost(guestHost, { includeHidden: true }) ||
        findChatHeaderFromChatAside({ includeHidden: true }) ||
        findChatHeaderFromLog({ includeHidden: true }) ||
        null;

    if (!(headerElement instanceof HTMLElement)) {
      return null;
    }

    let controlHost = headerElement;

    while (controlHost.parentElement && controlHost.parentElement !== guestHost) {
      controlHost = controlHost.parentElement;
    }

    return controlHost.parentElement === guestHost ? controlHost : null;
  }

  function markGuestChatControlHost(guestHost, header = null) {
    const controlHost = findGuestChatControlHost(guestHost, header);

    if (!controlHost) {
      return false;
    }

    controlHost.setAttribute(GUEST_CHAT_CONTROL_HOST_ATTR, "true");
    clearGuestChatControlHosts(controlHost);
    return true;
  }

  function getChatHeaderBar() {
    const target = findChatHeaderTarget();

    if (!target) {
      return null;
    }

    for (let current = target; current && current !== document.body; current = current.parentElement) {
      if (!(current instanceof HTMLElement)) {
        continue;
      }

      if (/live_chatting_header_(container|wrapper)/i.test(getClassName(current))) {
        return current;
      }
    }

    return target;
  }

  function isNestedHeaderAction(element, actions) {
    return actions.some((candidate) => candidate !== element && candidate.contains(element));
  }

  function findGuestChatToggleTarget() {
    if (!isGuestChatFrameEligibleContext()) {
      return null;
    }

    const header = getChatHeaderBar();

    if (!header) {
      return null;
    }

    const headerRect = header.getBoundingClientRect();
    const rightSideStart = headerRect.left + headerRect.width * 0.45;
    const actions = queryAllSafe(header, CHAT_HEADER_ACTION_BUTTON_SELECTORS)
      .filter((element) => element instanceof HTMLElement)
      .filter((element) => element.id !== GUEST_CHAT_TOGGLE_BUTTON_ID)
      .filter((element) => element.id !== HEADER_SETTINGS_BUTTON_ID)
      .filter((element) => element.id !== MINI_CHAT_BUTTON_ID)
      .filter((element) => !element.closest(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`))
      .filter((element) => !element.closest(`#${HEADER_SETTINGS_BUTTON_ID}`))
      .filter((element) => !element.closest(`#${MINI_CHAT_BUTTON_ID}`))
      .filter(isElementVisible);

    const candidates = actions
      .filter((element) => !isNestedHeaderAction(element, actions))
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0 && rect.left >= rightSideStart)
      .sort((left, right) => right.rect.right - left.rect.right || right.rect.left - left.rect.left);

    const before = candidates[0]?.element || null;
    const container = before?.parentElement instanceof HTMLElement ? before.parentElement : header;

    return { before, container, header };
  }

  function markGuestChatToggleControlHost(header) {
    if (!currentOptions.useGuestChatFrame) {
      clearGuestChatControlHosts();
      return;
    }

    const guestHost = findGuestChatHost();

    if (!guestHost || !header) {
      return;
    }

    markGuestChatControlHost(guestHost, header);
  }

  function setGuestChatToggleButtonState(button, state = currentOptions.useGuestChatFrame ? "on" : "off") {
    const labels = {
      off: "비로그인 채팅 켜기",
      on: "비로그인 채팅 끄기",
      loading: "비로그인 채팅 변경 중",
      error: "비로그인 채팅 변경 실패"
    };
    const isOn = currentOptions.useGuestChatFrame === true;
    const label = labels[state] || labels.off;

    button.dataset.state = state;
    button.disabled = state === "loading";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(isOn));
  }

  function resetGuestChatToggleButtonStateLater(button) {
    window.setTimeout(() => {
      if (button.isConnected && button.dataset.state !== "loading") {
        setGuestChatToggleButtonState(button);
      }
    }, 1800);
  }

  function setHeaderSettingsButtonState(button, state = "idle") {
    const labels = {
      idle: "채팅 설정 열기",
      loading: "채팅 설정 여는 중",
      error: "채팅 설정 열기 실패"
    };
    const label = labels[state] || labels.idle;

    button.dataset.state = state;
    button.disabled = state === "loading";
    button.title = label;
    button.setAttribute("aria-label", label);
  }

  function setMiniChatToggleButtonState(button, state = "idle") {
    const labels = {
      idle: currentOptions.useMiniFloatingChat ? "미니 채팅창 닫기" : "미니 채팅창 열기",
      loading: "미니 채팅창 변경 중",
      error: "미니 채팅창 변경 실패"
    };
    const label = labels[state] || labels.idle;

    button.dataset.state = state;
    button.disabled = state === "loading";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(currentOptions.useMiniFloatingChat === true));
  }

  function resetHeaderSettingsButtonStateLater(button) {
    window.setTimeout(() => {
      if (button.isConnected && button.dataset.state !== "loading") {
        setHeaderSettingsButtonState(button);
      }
    }, 1800);
  }

  function resetMiniChatToggleButtonStateLater(button) {
    window.setTimeout(() => {
      if (button.isConnected && button.dataset.state !== "loading") {
        setMiniChatToggleButtonState(button);
      }
    }, 1800);
  }

  async function openExtensionPopupFromHeader(button) {
    setHeaderSettingsButtonState(button, "loading");

    const result = await sendOpenPopupMessage();

    if (!result.ok) {
      setHeaderSettingsButtonState(button, "error");
      resetHeaderSettingsButtonStateLater(button);
      return;
    }

    setHeaderSettingsButtonState(button);
  }

  async function toggleGuestChatFrame(button) {
    const previousOptions = currentOptions;
    const nextOptions = normalizeOptions({
      ...currentOptions,
      useGuestChatFrame: !currentOptions.useGuestChatFrame
    });

    setGuestChatToggleButtonState(button, "loading");

    const result = await writeOptionsToStorageLocal(nextOptions);

    if (!result.ok) {
      applyOptions(previousOptions, { source: "header-toggle-error" });
      scan();
      setGuestChatToggleButtonState(button, "error");
      resetGuestChatToggleButtonStateLater(button);
      return;
    }

    applyOptions(result.options, { source: "header-toggle" });
    scan();
  }

  async function toggleMiniFloatingChat(button) {
    setMiniChatToggleButtonState(button, "loading");

    const result = await updateMiniChatOptions(
      {
        useMiniFloatingChat: !currentOptions.useMiniFloatingChat,
        miniFloatingChatCollapsed: false
      },
      "mini-chat-header-toggle"
    );

    if (!result.ok) {
      setMiniChatToggleButtonState(button, "error");
      resetMiniChatToggleButtonStateLater(button);
      return;
    }

    setMiniChatToggleButtonState(button);
  }

  function createGuestChatToggleButton() {
    const button = document.createElement("button");
    const icon = document.createElement("span");
    const slash = document.createElement("span");

    button.id = GUEST_CHAT_TOGGLE_BUTTON_ID;
    button.type = "button";
    button.className = "chzzk-chat-ui-toggle-guest-chat-toggle";
    icon.className = GUEST_CHAT_TOGGLE_BUTTON_ICON_CLASS;
    slash.className = GUEST_CHAT_TOGGLE_BUTTON_SLASH_CLASS;
    icon.setAttribute("aria-hidden", "true");
    slash.setAttribute("aria-hidden", "true");
    icon.append(slash);
    button.append(icon);
    setGuestChatToggleButtonState(button);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleGuestChatFrame(button);
    });

    return button;
  }

  function canRenderHeaderSettingsButton() {
    return document.readyState !== "loading";
  }

  function createMiniChatToggleButton() {
    const button = document.createElement("button");
    const icon = document.createElement("span");

    button.id = MINI_CHAT_BUTTON_ID;
    button.type = "button";
    button.className = "chzzk-chat-ui-toggle-mini-chat-button";
    icon.className = MINI_CHAT_BUTTON_ICON_CLASS;
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `
      <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
        <path d="M5.2 4.2h7.6c1.35 0 2.2.85 2.2 2.05v4.15c0 1.2-.85 2.05-2.2 2.05H8.1L5.2 14.3v-1.85c-1.35 0-2.2-.85-2.2-2.05V6.25c0-1.2.85-2.05 2.2-2.05Z"></path>
        <circle cx="7.2" cy="8.35" r="0.8"></circle>
        <circle cx="10.8" cy="8.35" r="0.8"></circle>
      </svg>
    `;
    button.append(icon);
    setMiniChatToggleButtonState(button);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleMiniFloatingChat(button);
    });

    return button;
  }

  function createHeaderSettingsButton() {
    const button = document.createElement("button");
    const icon = document.createElement("span");

    button.id = HEADER_SETTINGS_BUTTON_ID;
    button.type = "button";
    button.className = "chzzk-chat-ui-toggle-header-settings";
    icon.className = HEADER_SETTINGS_BUTTON_ICON_CLASS;
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.52a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.52a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>`;
    button.append(icon);
    setHeaderSettingsButtonState(button);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openExtensionPopupFromHeader(button);
    });

    return button;
  }

  function ensureGuestChatToggleButton() {
    const existingButton = document.getElementById(GUEST_CHAT_TOGGLE_BUTTON_ID);
    const existingSettingsButton = document.getElementById(HEADER_SETTINGS_BUTTON_ID);
    const existingMiniChatButton = document.getElementById(MINI_CHAT_BUTTON_ID);

    if (!isGuestChatFrameEligibleContext()) {
      existingButton?.remove();
      existingSettingsButton?.remove();
      existingMiniChatButton?.remove();
      clearGuestChatControlHosts();
      return;
    }

    const target = findGuestChatToggleTarget();

    if (!target) {
      if (existingButton instanceof HTMLButtonElement) {
        setGuestChatToggleButtonState(existingButton);
      }

      if (existingSettingsButton instanceof HTMLButtonElement) {
        setHeaderSettingsButtonState(existingSettingsButton);
      }

      if (existingMiniChatButton instanceof HTMLButtonElement) {
        setMiniChatToggleButtonState(existingMiniChatButton);
      }

      if (currentOptions.useGuestChatFrame) {
        const guestHost = findGuestChatHost();

        if (guestHost) {
          markGuestChatControlHost(guestHost);
        }
      } else {
        clearGuestChatControlHosts();
      }
      return;
    }

    const settingsButton = currentOptions.showHeaderSettingsButton && canRenderHeaderSettingsButton()
      ? existingSettingsButton instanceof HTMLButtonElement
        ? existingSettingsButton
        : createHeaderSettingsButton()
      : null;

    if (settingsButton instanceof HTMLButtonElement) {
      setHeaderSettingsButtonState(settingsButton);

      if (settingsButton.parentElement !== target.container || settingsButton.nextSibling !== target.before) {
        target.container.insertBefore(settingsButton, target.before);
      }
    } else {
      existingSettingsButton?.remove();
    }

    let guestButton = null;

    if (currentOptions.showGuestChatToggleButton) {
      guestButton =
        existingButton instanceof HTMLButtonElement ? existingButton : createGuestChatToggleButton();
      const nextSibling = settingsButton instanceof HTMLButtonElement ? settingsButton : target.before;

      setGuestChatToggleButtonState(guestButton);

      if (guestButton.parentElement !== target.container || guestButton.nextSibling !== nextSibling) {
        target.container.insertBefore(guestButton, nextSibling);
      }
    } else {
      existingButton?.remove();
    }

    if (currentOptions.showMiniFloatingChatButton) {
      const button =
        existingMiniChatButton instanceof HTMLButtonElement ? existingMiniChatButton : createMiniChatToggleButton();
      const nextSibling =
        guestButton instanceof HTMLButtonElement && guestButton.isConnected
          ? guestButton
          : settingsButton instanceof HTMLButtonElement
            ? settingsButton
            : target.before;

      setMiniChatToggleButtonState(button);

      if (button.parentElement !== target.container || button.nextSibling !== nextSibling) {
        target.container.insertBefore(button, nextSibling);
      }
    } else {
      existingMiniChatButton?.remove();
    }

    markGuestChatToggleControlHost(target.header);
  }

  function hasChatLikeText(element) {
    const text = element.textContent?.trim() ?? "";

    return text.length > 0 && text.length < 1000;
  }

  function getChatRoots() {
    const roots = queryAllSafe(document, CHAT_ROOT_SELECTORS)
      .filter(hasChatLikeText)
      .slice(0, 20);

    return roots.length > 0 ? roots : [document.body ?? document.documentElement];
  }

  function getChatRows(root) {
    const rows = queryAllSafe(root, CHAT_ROW_SELECTORS)
      .filter((element) => element instanceof HTMLElement)
      .filter(hasChatLikeText)
      .slice(-250);

    return rows.length > 0 ? rows : [root];
  }

  function addRole(element, role) {
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
      return;
    }

    if (element === document.documentElement || element === document.body) {
      return;
    }

    const roles = new Set((element.getAttribute(ROLE_ATTR) ?? "").split(/\s+/).filter(Boolean));
    roles.add(role);
    element.setAttribute(ROLE_ATTR, [...roles].join(" "));
  }

  function removeAnnotations(element) {
    element.removeAttribute(ROLE_ATTR);
    element.removeAttribute(MESSAGE_PREFIX_ATTR);
    element.removeAttribute(MINI_CHAT_HIDDEN_CONTROL_ATTR);
    element.removeAttribute(MINI_CHAT_NON_CHAT_PANEL_ATTR);
    element.removeAttribute(MINI_CHAT_COMPACT_INPUT_ATTR);
    element.removeAttribute(MINI_CHAT_INPUT_ONLY_PATH_ATTR);
    element.removeAttribute(MINI_CHAT_INPUT_ONLY_KEEP_ATTR);
    element.removeAttribute(MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR);

    if (element.getAttribute(CHAT_ROW_ATTR) === "true") {
      element.removeAttribute(CHAT_ROW_ATTR);
    }

    if (element instanceof HTMLElement) {
      clearLargeTextRowLayout(element);
    }

    if (element.hasAttribute(GENERATED_TIMESTAMP_ATTR)) {
      element.remove();
    }
  }

  function getCompactText(element) {
    return (element.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getMiniChatActionControls(root = document) {
    return queryAllSafe(root, [
      "button",
      "[role='button']",
      "a[href]"
    ]).filter((element) => element instanceof HTMLElement);
  }

  function markMiniChatHiddenControl(element) {
    if (element instanceof HTMLElement) {
      element.setAttribute(MINI_CHAT_HIDDEN_CONTROL_ATTR, "true");
    }
  }

  function markMiniChatNonChatPanel(element) {
    if (element instanceof HTMLElement) {
      element.setAttribute(MINI_CHAT_NON_CHAT_PANEL_ATTR, "true");
    }
  }

  function hasMiniChatMessageContent(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    try {
      return Boolean(
        element.getAttribute("role") === "log" ||
        element.matches(NATIVE_CHAT_ROW_SELECTOR) ||
        element.querySelector(
          `[${CHAT_ROW_ATTR}="true"], [class*="live_chatting_message_container" i], [class*="_chatting_message_" i]`
        )
      );
    } catch (_error) {
      return false;
    }
  }

  function hasMiniChatNonChatPanelSignal(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    const text = getCompactText(element);
    const hasPredictionPanelText = /승부예측|참여\s*마감|파워가\s*걸린/u.test(text);
    const hasSportsPanelText = /스포츠\s*중계\s*정보|중계\s*정보\s*펼치기|(?:전반|후반)\s*\d+'?/u.test(text);

    if (hasPredictionPanelText) {
      return true;
    }

    if (!hasSportsPanelText) {
      return false;
    }

    try {
      return Boolean(
        element.querySelector("[aria-controls*='broadcast-information-sports' i], img[src*='sports-phinf' i]") ||
        element.matches("[aria-controls*='broadcast-information-sports' i], section")
      );
    } catch (_error) {
      return false;
    }
  }

  function isMiniChatNonChatPanelCandidate(element) {
    return (
      element instanceof HTMLElement &&
      !hasMiniChatInputField(element) &&
      !hasMiniChatMessageContent(element) &&
      hasMiniChatNonChatPanelSignal(element)
    );
  }

  function findMiniChatNonChatPanelRoot(element) {
    let candidate = element instanceof HTMLElement ? element : null;

    for (
      let current = candidate, depth = 0;
      current && current !== document.body && depth < 5;
      current = current.parentElement, depth += 1
    ) {
      if (!(current instanceof HTMLElement)) {
        break;
      }

      if (hasMiniChatInputField(current) || hasMiniChatMessageContent(current)) {
        break;
      }

      if (hasMiniChatNonChatPanelSignal(current)) {
        candidate = current;
      }

      const parent = current.parentElement;

      if (
        !(parent instanceof HTMLElement) ||
        parent === document.body ||
        parent.getAttribute("role") === "log" ||
        Boolean(parent.querySelector("[role='log']"))
      ) {
        break;
      }
    }

    return candidate;
  }

  function hasMiniChatInputField(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    try {
      return Boolean(
        element.matches("textarea, input, [contenteditable='true'], [role='textbox']") ||
        element.querySelector("textarea, input, [contenteditable='true'], [role='textbox']")
      );
    } catch (_error) {
      return false;
    }
  }

  function isMiniChatTextEntryField(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    try {
      if (element instanceof HTMLInputElement) {
        const type = String(element.type || "text").toLowerCase();

        if (/^(?:button|checkbox|color|file|hidden|image|radio|range|reset|submit)$/.test(type)) {
          return false;
        }
      } else if (
        !(element instanceof HTMLTextAreaElement) &&
        element.getAttribute("contenteditable") !== "true" &&
        element.getAttribute("role") !== "textbox"
      ) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    } catch (_error) {
      return false;
    }
  }

  function isReasonableMiniChatInputContainer(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    try {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return (
        element !== document.documentElement &&
        element !== document.body &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.height <= 160 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    } catch (_error) {
      return false;
    }
  }

  function findMiniChatCompactInputContainer(actionRow) {
    let fallbackContainer = null;

    for (
      let current = actionRow.parentElement, depth = 0;
      current && current !== document.body && depth < 6;
      current = current.parentElement, depth += 1
    ) {
      if (!(current instanceof HTMLElement) || !hasMiniChatInputField(current)) {
        continue;
      }

      if (matchesAnySafe(current, MINI_CHAT_INPUT_CONTAINER_SELECTORS)) {
        return current;
      }

      fallbackContainer ??= current;
    }

    return fallbackContainer;
  }

  function markMiniChatCompactInputContainer(actionRow) {
    const inputContainer = findMiniChatCompactInputContainer(actionRow);

    if (inputContainer instanceof HTMLElement) {
      inputContainer.setAttribute(MINI_CHAT_COMPACT_INPUT_ATTR, "true");
    }
  }

  function findMiniChatInputOnlyContainer(root = document) {
    const inputFields = queryAllSafe(root, [
      "textarea",
      "input",
      "[contenteditable='true']",
      "[role='textbox']"
    ])
      .filter((element) => element instanceof HTMLElement)
      .filter(isMiniChatTextEntryField);
    let fallbackContainer = null;
    let actionFallbackContainer = null;

    for (const field of inputFields) {
      for (
        let current = field.parentElement, depth = 0;
        current && current !== document.body && depth < 8;
        current = current.parentElement, depth += 1
      ) {
        if (!isReasonableMiniChatInputContainer(current)) {
          continue;
        }

        if (matchesAnySafe(current, MINI_CHAT_INPUT_CONTAINER_SELECTORS)) {
          return current;
        }

        if (!actionFallbackContainer && getMiniChatActionControls(current).length > 0) {
          actionFallbackContainer = current;
        }

        fallbackContainer ??= current;
      }
    }

    const inputContainers = queryAllSafe(root, MINI_CHAT_INPUT_CONTAINER_SELECTORS)
      .filter((element) => element instanceof HTMLElement)
      .filter(hasMiniChatInputField)
      .filter(isReasonableMiniChatInputContainer);

    if (inputContainers.length > 0) {
      return inputContainers[0];
    }

    return actionFallbackContainer || fallbackContainer;
  }

  function shouldLockMiniChatInputOnlyScroll() {
    return isMiniChatFrameEmbedUrl(window.location.href) && currentOptions.miniFloatingChatInputOnly === true;
  }

  function resetMiniChatInputOnlyScroll() {
    miniChatInputOnlyScrollFrame = 0;

    if (!shouldLockMiniChatInputOnlyScroll()) {
      return;
    }

    for (const scroller of [document.scrollingElement, document.documentElement, document.body]) {
      if (!(scroller instanceof Element)) {
        continue;
      }

      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;
    }

    if (window.scrollX !== 0 || window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
  }

  function scheduleMiniChatInputOnlyScrollReset() {
    if (!shouldLockMiniChatInputOnlyScroll() || miniChatInputOnlyScrollFrame) {
      return;
    }

    miniChatInputOnlyScrollFrame = window.requestAnimationFrame(resetMiniChatInputOnlyScroll);
  }

  function connectMiniChatInputOnlyScrollGuard() {
    if (!isMiniChatFrameEmbedUrl(window.location.href)) {
      return;
    }

    document.addEventListener("focusin", scheduleMiniChatInputOnlyScrollReset, true);
    document.addEventListener("input", scheduleMiniChatInputOnlyScrollReset, true);
  }

  function markMiniChatInputOnlyLayout() {
    const inputContainer = findMiniChatInputOnlyContainer();

    if (!(inputContainer instanceof HTMLElement)) {
      return;
    }

    inputContainer.setAttribute(MINI_CHAT_COMPACT_INPUT_ATTR, "true");
    inputContainer.setAttribute(MINI_CHAT_INPUT_ONLY_KEEP_ATTR, "true");

    for (
      let current = inputContainer;
      current && current !== document.body;
      current = current.parentElement
    ) {
      if (!(current instanceof HTMLElement)) {
        break;
      }

      if (current !== inputContainer) {
        current.setAttribute(MINI_CHAT_INPUT_ONLY_PATH_ATTR, "true");
      }

      const parent = current.parentElement;

      if (!(parent instanceof HTMLElement)) {
        continue;
      }

      for (const sibling of parent.children) {
        if (sibling !== current && sibling instanceof HTMLElement) {
          sibling.setAttribute(MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR, "true");
        }
      }
    }

    scheduleMiniChatInputOnlyScrollReset();
  }

  function findMiniChatActionControlRow(control) {
    for (
      let current = control.parentElement, depth = 0;
      current && current !== document.body && depth < 6;
      current = current.parentElement, depth += 1
    ) {
      const controls = getMiniChatActionControls(current);
      const text = getCompactText(current);

      if (
        controls.length >= 3 &&
        text.includes("후원하기") &&
        !text.includes("채팅을 입력") &&
        !hasMiniChatInputField(current)
      ) {
        return current;
      }
    }

    return null;
  }

  function annotateMiniChatHiddenControls() {
    if (!isMiniChatFrameEmbedUrl(window.location.href)) {
      return;
    }

    for (const element of document.querySelectorAll(`[${MINI_CHAT_HIDDEN_CONTROL_ATTR}]`)) {
      element.removeAttribute(MINI_CHAT_HIDDEN_CONTROL_ATTR);
    }

    for (const element of document.querySelectorAll(`[${MINI_CHAT_NON_CHAT_PANEL_ATTR}]`)) {
      element.removeAttribute(MINI_CHAT_NON_CHAT_PANEL_ATTR);
    }

    for (const element of document.querySelectorAll(`[${MINI_CHAT_COMPACT_INPUT_ATTR}]`)) {
      element.removeAttribute(MINI_CHAT_COMPACT_INPUT_ATTR);
    }

    for (const element of document.querySelectorAll(`[${MINI_CHAT_INPUT_ONLY_PATH_ATTR}]`)) {
      element.removeAttribute(MINI_CHAT_INPUT_ONLY_PATH_ATTR);
    }

    for (const element of document.querySelectorAll(`[${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}]`)) {
      element.removeAttribute(MINI_CHAT_INPUT_ONLY_KEEP_ATTR);
    }

    for (const element of document.querySelectorAll(`[${MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR}]`)) {
      element.removeAttribute(MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR);
    }

    const controls = getMiniChatActionControls();
    const donationControls = controls.filter((control) => getCompactText(control).includes("후원하기"));

    for (const control of donationControls) {
      const actionRow = findMiniChatActionControlRow(control);

      if (actionRow) {
        markMiniChatHiddenControl(actionRow);
        markMiniChatCompactInputContainer(actionRow);

        for (const rowControl of getMiniChatActionControls(actionRow)) {
          markMiniChatHiddenControl(rowControl);
        }
      } else {
        markMiniChatHiddenControl(control);
      }
    }

    for (const control of controls) {
      if (getCompactText(control) === "채팅") {
        markMiniChatHiddenControl(control);
      }
    }

    for (const element of queryAllSafe(document, MINI_CHAT_NON_CHAT_PANEL_SELECTORS)) {
      const panel = findMiniChatNonChatPanelRoot(element);

      if (isMiniChatNonChatPanelCandidate(panel)) {
        markMiniChatNonChatPanel(panel);
      }
    }

    markMiniChatInputOnlyLayout();
  }

  function looksLikeTimestamp(element) {
    const text = element.textContent?.trim() ?? "";

    return /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(text);
  }

  function formatTimestamp(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  function getClassName(element) {
    return String(element.getAttribute("class") ?? "");
  }

  function getMessageContainerElement(row) {
    return row.querySelector(
      "[class*='live_chatting_message_container' i], [class*='_chatting_message_' i]"
    );
  }

  function getNicknameButtonElement(row) {
    return row.querySelector(
      "button[class*='live_chatting_message_nickname' i], button[class*='nickname' i]"
    );
  }

  function getMessageTextElement(row) {
    const messageContainer = getMessageContainerElement(row);

    if (messageContainer instanceof HTMLElement) {
      const messageText = queryAllSafe(messageContainer, [
        "[class*='live_chatting_message_text' i]",
        "[class*='message_text' i]",
        "[class*='_text_' i]"
      ]).find((element) => !isInsideLiveChatNicknameShell(element));

      if (messageText instanceof HTMLElement) {
        return messageText;
      }
    }

    return row.querySelector("[class*='live_chatting_message_text' i], [class*='message_text' i]");
  }

  function isBeforeMessageText(row, element) {
    const messageText = getMessageTextElement(row);

    if (!messageText) {
      return true;
    }

    if (messageText.contains(element)) {
      return false;
    }

    return Boolean(element.compareDocumentPosition(messageText) & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  function isLikelyBadge(element) {
    const tagName = element.tagName.toLowerCase();
    const className = getClassName(element);
    const source = String(element.getAttribute("src") ?? "");
    const alt = String(element.getAttribute("alt") ?? "");
    const label = String(element.getAttribute("aria-label") ?? "");

    if (/badge|grade/i.test(className) || /배지/.test(alt) || /배지/.test(label)) {
      return true;
    }

    if (tagName === "img" && /badge|emblem|grade|\/glive\/icon\//i.test(source)) {
      return true;
    }

    if ((tagName === "img" || tagName === "svg") && isInsideLiveChatNicknameShell(element)) {
      return true;
    }

    return tagName === "svg" && /badge|grade/i.test(className);
  }

  function isInsideLiveChatNicknameShell(element) {
    return Boolean(
      element.closest(
        "button[class*='live_chatting_message_nickname' i], [class*='live_chatting_username_container' i], button[class*='nickname' i]"
      )
    );
  }

  function isLikelyNickname(element) {
    const tagName = element.tagName.toLowerCase();
    const className = getClassName(element);
    const testId = String(element.getAttribute("data-testid") ?? "");
    const text = element.textContent?.trim() ?? "";

    if (!text || text.length > 80 || looksLikeTimestamp(element)) {
      return false;
    }

    if (element.querySelector("img, svg, [class*='badge' i], [class*='icon' i]")) {
      return false;
    }

    if (/container|wrapper|icon|badge|grade|profile/i.test(className)) {
      return false;
    }

    if (tagName === "button" && element.childElementCount > 0) {
      return false;
    }

    return (
      /live_chatting_username_nickname|live_chatting_nickname|(?:^|[_-])nickname(?:__|[_-]|$)/i.test(
        `${className} ${testId}`
      ) ||
      isInsideLiveChatNicknameShell(element)
    );
  }

  function annotateSelectorTargets(row, role) {
    const candidates = queryAllSafe(row, TARGET_SELECTORS[role]);
    const nicknameCandidates =
      role === "nickname" ? candidates.filter((element) => isLikelyNickname(element)) : [];

    for (const element of candidates) {
      if (role === "timestamp" && !looksLikeTimestamp(element)) {
        continue;
      }

      if (role === "badge" && (!isBeforeMessageText(row, element) || !isLikelyBadge(element))) {
        continue;
      }

      if (role === "nickname" && !isLikelyNickname(element)) {
        continue;
      }

      if (role === "nickname" && !isBeforeMessageText(row, element)) {
        continue;
      }

      if (role === "nickname" && nicknameCandidates.some((candidate) => candidate !== element && element.contains(candidate))) {
        continue;
      }

      addRole(element, role);

      if (role === "badge") {
        annotateBadgeAncestors(row, element);
      }
    }
  }

  function annotateTimestampLeaves(row) {
    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.textContent?.trim() ?? "";

        if (!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(text)) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;

        if (!parent || parent.childElementCount > 0 || parent.textContent?.trim() !== text) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const parents = [];
    let node = walker.nextNode();

    while (node) {
      if (node.parentElement) {
        parents.push(node.parentElement);
      }

      node = walker.nextNode();
    }

    parents.forEach((element) => addRole(element, "timestamp"));
  }

  function hasTimestamp(row) {
    return Boolean(row.querySelector(`[${ROLE_ATTR}~="timestamp"], [${GENERATED_TIMESTAMP_ATTR}]`));
  }

  function isChatMessageRow(row) {
    if (!(row instanceof HTMLElement)) {
      return false;
    }

    if (row === document.body || row === document.documentElement) {
      return false;
    }

    const className = getClassName(row);

    if (/fixed|header|input|textarea|notice|banner/i.test(className)) {
      return false;
    }

    const nicknameButton = getNicknameButtonElement(row);
    const messageContainer = getMessageContainerElement(row);
    const messageText = getMessageTextElement(row);
    const hasLegacyChatMessageShell = Boolean(
      /live_chatting_list_item/i.test(className) &&
        nicknameButton &&
        messageContainer &&
        messageText
    );
    const hasModernChatMessageShell = Boolean(
      row.closest("[role='log']") &&
        /(?:^|\s)_item_/i.test(className) &&
        nicknameButton &&
        messageContainer &&
        messageText
    );
    const hasChatMessageShell = hasLegacyChatMessageShell || hasModernChatMessageShell;

    if (!hasChatMessageShell) {
      return false;
    }

    const nickname = queryAllSafe(row, TARGET_SELECTORS.nickname).find(isLikelyNickname);

    return Boolean(nickname && messageText);
  }

  function getNicknameTextElement(row) {
    const candidates = queryAllSafe(row, TARGET_SELECTORS.nickname).filter(isLikelyNickname);

    return candidates.find((element) => !candidates.some((candidate) => candidate !== element && element.contains(candidate)));
  }

  function getMessagePrefixAnchor(row, nickname) {
    let anchor = nickname;
    let current = nickname;

    while (current.parentElement && current.parentElement !== row) {
      const parent = current.parentElement;
      const parentClass = getClassName(parent);

      if (getMessageTextElement(row)?.contains(parent)) {
        break;
      }

      if (/message_nickname|username_container|chatting_name|author|nickname/i.test(parentClass)) {
        anchor = parent;
      }

      current = parent;
    }

    if (anchor instanceof HTMLElement) {
      anchor.setAttribute(MESSAGE_PREFIX_ATTR, "true");
    }

    return anchor;
  }

  function ensureGeneratedTimestamp(row) {
    if (!isChatMessageRow(row) || hasTimestamp(row)) {
      return;
    }

    const nickname = getNicknameTextElement(row);

    if (!nickname?.parentElement) {
      return;
    }

    const anchor = getMessagePrefixAnchor(row, nickname);

    const timestamp = document.createElement("span");
    timestamp.className = "chzzk-chat-ui-toggle-timestamp";
    timestamp.textContent = formatTimestamp(new Date());
    timestamp.setAttribute(GENERATED_TIMESTAMP_ATTR, "true");
    addRole(timestamp, "timestamp");

    anchor.insertAdjacentElement("beforebegin", timestamp);
  }

  function annotateBadgeAncestors(row, element) {
    let current = element.parentElement;
    let depth = 0;

    while (current && current !== row && depth < 4) {
      if (!isBeforeMessageText(row, current)) {
        break;
      }

      const className = getClassName(current);
      const text = current.textContent?.trim() ?? "";
      const hasMedia = Boolean(current.querySelector("img, svg"));

      if (/badge|grade|profile|icon/i.test(className) || (hasMedia && text.length === 0)) {
        addRole(current, "badge");
        current = current.parentElement;
        depth += 1;
        continue;
      }

      break;
    }
  }

  function annotateLeadingBadges(row) {
    const mediaCandidates = [...row.querySelectorAll("img, svg")]
      .filter((element) => element instanceof HTMLElement || element instanceof SVGElement)
      .filter((element) => isBeforeMessageText(row, element))
      .slice(0, 8);

    for (const element of mediaCandidates) {
      if (isLikelyBadge(element)) {
        addRole(element, "badge");
        annotateBadgeAncestors(row, element);
      }
    }
  }

  function annotateChatRow(row) {
    if (!isChatMessageRow(row)) {
      return;
    }

    row.setAttribute(CHAT_ROW_ATTR, "true");
    annotateSelectorTargets(row, "timestamp");
    annotateTimestampLeaves(row);
    ensureGeneratedTimestamp(row);
    annotateSelectorTargets(row, "badge");
    annotateLeadingBadges(row);
    annotateSelectorTargets(row, "nickname");
  }

  function clearLargeTextRowLayout(row) {
    row.style.removeProperty("--chzzk-chat-ui-toggle-row-dynamic-height");
  }

  function getLargeTextLayoutElements(row) {
    return queryAllSafe(row, [
      `[${ROLE_ATTR}]`,
      `[${MESSAGE_PREFIX_ATTR}]`,
      ".chzzk-chat-ui-toggle-timestamp",
      "[class*='live_chatting_message_container' i]",
      "[class*='live_chatting_message_text' i]",
      "[class*='live_chatting_message_text' i] img",
      "[class*='_chatting_message_' i]",
      "[class*='_chatting_message_' i] img",
      "[class*='message_text' i]",
      "[class*='message_text' i] img",
      "[class*='message' i] [class*='text' i]",
      "[class*='message' i] [class*='text' i] img",
      "[class*='live_chatting_username' i]",
      "[class*='name_text' i]",
      "button[class*='nickname' i]"
    ]).filter((element) => element instanceof Element);
  }

  function syncLargeTextRowLayout() {
    largeTextLayoutFrame = 0;

    for (const row of queryAllSafe(document, [`[${CHAT_ROW_ATTR}="true"]`])) {
      if (!(row instanceof HTMLElement)) {
        continue;
      }

      if (!currentOptions.showLargeText) {
        clearLargeTextRowLayout(row);
        continue;
      }

      const rowRect = row.getBoundingClientRect();

      if (rowRect.width <= 0 && rowRect.height <= 0) {
        continue;
      }

      const effectiveNicknameFontSizePt = currentOptions.useNicknameFontSize
        ? currentOptions.nicknameFontSizePt
        : currentOptions.chatFontSizePt;
      const maxChatLineFontSizePt = Math.max(currentOptions.chatFontSizePt, effectiveNicknameFontSizePt);
      const chatEmoteSizePx = Math.max(20, currentOptions.chatFontSizePt * 96 / 72);
      const minimumHeight = Math.max(maxChatLineFontSizePt * 96 / 72 * 1.45, chatEmoteSizePx) + 8;
      let contentBottom = rowRect.top + minimumHeight - 8;

      for (const element of getLargeTextLayoutElements(row)) {
        for (const rect of element.getClientRects()) {
          if (rect.width > 0 || rect.height > 0) {
            contentBottom = Math.max(contentBottom, rect.bottom);
          }
        }
      }

      const measuredHeight = Math.ceil(contentBottom - rowRect.top + 8);
      const dynamicHeight = Math.max(minimumHeight, measuredHeight);
      row.style.setProperty("--chzzk-chat-ui-toggle-row-dynamic-height", `${dynamicHeight.toFixed(2)}px`);
    }
  }

  function scheduleLargeTextLayoutSync() {
    if (largeTextLayoutFrame) {
      return;
    }

    largeTextLayoutFrame = window.requestAnimationFrame(syncLargeTextRowLayout);
  }

  function cleanupUnscopedAnnotations(root = document) {
    const annotatedElements = queryAllIncludingRootSafe(root, [
      `[${CHAT_ROW_ATTR}="true"]`,
      `[${ROLE_ATTR}]`,
      `[${MESSAGE_PREFIX_ATTR}]`,
      `[${GENERATED_TIMESTAMP_ATTR}]`
    ]);

    for (const element of annotatedElements) {
      if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
        continue;
      }

      const scopedRow = element instanceof HTMLElement && element.getAttribute(CHAT_ROW_ATTR) === "true"
        ? element
        : element.closest(`[${CHAT_ROW_ATTR}="true"]`);

      if (!(scopedRow instanceof HTMLElement) || !isChatMessageRow(scopedRow)) {
        removeAnnotations(element);
      }
    }
  }

  function cleanupRows(rows) {
    for (const row of [...new Set(rows)].filter((element) => element instanceof HTMLElement)) {
      cleanupUnscopedAnnotations(row);
    }
  }

  function cleanupUnscopedAnnotationsWhenDue() {
    const now = Date.now();

    if (now - lastFullCleanupAt < FULL_CLEANUP_INTERVAL_MS) {
      return;
    }

    lastFullCleanupAt = now;
    cleanupUnscopedAnnotations();
  }

  function scanRows(rows) {
    const uniqueRows = [...new Set(rows)].filter((element) => element instanceof HTMLElement);

    cleanupRows(uniqueRows);

    for (const row of uniqueRows.filter(hasChatLikeText)) {
      annotateChatRow(row);
    }

    annotateMiniChatHiddenControls();
    scheduleLargeTextLayoutSync();
  }

  function scan() {
    if (isScanning) {
      return;
    }

    isScanning = true;
    const roots = getChatRoots();

    try {
      cleanupUnscopedAnnotationsWhenDue();

      for (const root of roots) {
        scanRows(getChatRows(root));
      }

      annotateMiniChatHiddenControls();
      syncGuestChatUi();
    } finally {
      isScanning = false;
    }
  }

  function matchesAnySafe(element, selectors) {
    for (const selector of selectors) {
      try {
        if (element.matches(selector)) {
          return true;
        }
      } catch (_error) {
        // A selector mismatch should not break processing for new chat rows.
      }
    }

    return false;
  }

  function closestAnySafe(element, selectors) {
    for (const selector of selectors) {
      try {
        const closest = element.closest(selector);

        if (closest instanceof HTMLElement) {
          return closest;
        }
      } catch (_error) {
        // A selector mismatch should not break processing for new chat rows.
      }
    }

    return null;
  }

  function collectAddedChatRows(mutations) {
    const rows = [];

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        const element = node instanceof Element ? node : node.parentElement;

        if (!element) {
          continue;
        }

        if (element instanceof HTMLElement && matchesAnySafe(element, CHAT_ROW_SELECTORS)) {
          rows.push(element);
        }

        rows.push(...queryAllSafe(element, CHAT_ROW_SELECTORS).filter((row) => row instanceof HTMLElement));

        const closestRow = closestAnySafe(element, CHAT_ROW_SELECTORS);

        if (closestRow) {
          rows.push(closestRow);
        }
      }
    }

    return rows;
  }

  function scheduleScan() {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(scan, SCAN_DELAY_MS);
  }

  function syncGuestChatUi() {
    if (uiSyncTimer) {
      window.clearTimeout(uiSyncTimer);
      uiSyncTimer = 0;
    }

    syncMiniFloatingChatPanel();
    syncGuestChatFrame();
    ensureGuestChatToggleButton();
  }

  function scheduleGuestChatUiSync() {
    if (uiSyncTimer) {
      return;
    }

    uiSyncTimer = window.setTimeout(() => {
      uiSyncTimer = 0;
      syncGuestChatUi();
    }, UI_SYNC_DELAY_MS);
  }

  function connectObserver() {
    const target = document.body ?? document.documentElement;

    if (observer || !target) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
        const addedRows = collectAddedChatRows(mutations);

        if (addedRows.length > 0) {
          scanRows(addedRows);
          scheduleGuestChatUiSync();
        } else {
          scheduleScan();
        }
      }
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });
  }

  function connectMessages() {
    if (messagesConnected) {
      return;
    }

    const runtime = getRuntime();

    if (!runtime?.runtime?.onMessage) {
      return;
    }

    messagesConnected = true;

    runtime.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "CHZZK_CHAT_UI_TOGGLE_GET_STATUS") {
        sendResponse(getStatus());
        return false;
      }

      if (message?.type === "CHZZK_CHAT_UI_TOGGLE_GET_OPTIONS") {
        sendResponse(getStatus());
        return false;
      }

      if (message?.type === "CHZZK_CHAT_UI_TOGGLE_REFRESH") {
        injectStyle();
        loadStoredOptions(1, { allowFallback: true }).then(() => {
          scan();
          markReady();
          sendResponse(getStatus());
        });
        return true;
      }

      if (message?.type === "CHZZK_CHAT_UI_TOGGLE_SET_OPTIONS") {
        injectStyle();
        applyOptions(message.options, { source: "popup-message" });
        scan();
        sendResponse(getStatus());
        return false;
      }

      if (message?.type === APPLY_GUEST_CHAT_THEME_MESSAGE) {
        const channelId = getCurrentChannelId();

        if (!message.channelId || !channelId || message.channelId === channelId) {
          applyGuestChatTheme(message.theme, { source: "background-push" });
        }

        sendResponse(getStatus());
        return false;
      }

      return false;
    });
  }

  function connectStorageListener() {
    if (storageListenerConnected) {
      return;
    }

    const runtime = getRuntime();

    if (!runtime?.storage?.onChanged) {
      return;
    }

    storageListenerConnected = true;

    runtime.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes[STORAGE_KEY]) {
        return;
      }

      applyOptions(changes[STORAGE_KEY].newValue, { source: "storage-change" });
      scan();
    });
  }

  async function loadStoredOptions(attempt = 1, { allowFallback = false } = {}) {
    window.clearTimeout(optionsLoadTimer);
    connectMessages();
    connectStorageListener();

    const result = await readOptions();

    if (result.ok) {
      applyOptions(result.options, {
        markAsReady: false,
        cache: true,
        source: result.source || "stored-options"
      });
      scan();
      markReady();
      return true;
    }

    lastOptionsLoadError = result.error || "stored-options-unavailable";

    if (attempt < OPTIONS_LOAD_MAX_ATTEMPTS) {
      optionsLoadTimer = window.setTimeout(() => {
        loadStoredOptions(attempt + 1, { allowFallback });
      }, OPTIONS_LOAD_RETRY_MS);
      return false;
    }

    if (allowFallback) {
      const cachedOptions = readCachedOptions();

      applyOptions(cachedOptions || DEFAULT_OPTIONS, {
        markAsReady: false,
        cache: false,
        source: cachedOptions ? "cache-fallback" : "default-fallback"
      });
      scan();
      markReady();
    }

    return false;
  }

  function start() {
    applyGuestChatCleanBotDefault();
    injectStyle();
    connectMessages();
    connectStorageListener();
    connectMiniChatInputOnlyScrollGuard();

    const cachedOptions = readCachedOptions();

    if (cachedOptions) {
      applyOptions(cachedOptions, { markAsReady: false, cache: false, source: "page-cache" });
      scan();
    }

    connectObserver();
    window.addEventListener("resize", scheduleGuestChatUiSync);
    document.addEventListener("fullscreenchange", handleMiniChatFullscreenChange);
    syncGuestChatTheme();
    scheduleScan();
    loadStoredOptions(1, { allowFallback: true });

    if (!scanIntervalTimer) {
      scanIntervalTimer = window.setInterval(scan, SCAN_INTERVAL_MS);
    }

    if (!themeSyncTimer) {
      themeSyncTimer = window.setInterval(syncGuestChatTheme, THEME_SYNC_INTERVAL_MS);
    }
  }

  start();
})();
