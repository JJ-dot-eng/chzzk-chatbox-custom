(() => {
  const SCRIPT_VERSION = "0.2.5";
  const GLOBAL_KEY = `__chzzkChatUiToggleLoaded_${SCRIPT_VERSION}`;

  if (window[GLOBAL_KEY]) {
    return;
  }

  window[GLOBAL_KEY] = true;

  const STORAGE_KEY = "chzzkChatUiToggleOptions";
  const ROLE_ATTR = "data-chzzk-chat-ui-toggle-role";
  const CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-chat-row";
  const NATIVE_CHAT_ROW_SELECTOR = `[class*="live_chatting_list_item" i]:has([class*="live_chatting_message_container" i])`;
  const CHAT_ROW_SCOPE_SELECTOR = `[class*="live_chatting_list_item" i][${CHAT_ROW_ATTR}="true"]`;
  const STYLE_ID = "chzzk-chat-ui-toggle-style";
  const CACHE_KEY = "chzzkChatUiToggleOptionsCache";
  const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
  const READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";
  const SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";
  const APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";
  const CHZZK_ORIGIN = "https://chzzk.naver.com";
  const STORAGE_READ_TIMEOUT_MS = 700;
  const OPTIONS_LOAD_RETRY_MS = 250;
  const OPTIONS_LOAD_MAX_ATTEMPTS = 20;
  const SCAN_DELAY_MS = 0;
  const SCAN_INTERVAL_MS = 2000;
  const THEME_SYNC_INTERVAL_MS = 3000;
  const GENERATED_TIMESTAMP_ATTR = "data-chzzk-chat-ui-toggle-generated-timestamp";
  const MESSAGE_PREFIX_ATTR = "data-chzzk-chat-ui-toggle-prefix";
  const GUEST_CHAT_FRAME_CONTAINER_ID = "chzzk-chat-ui-toggle-guest-chat-frame-container";
  const GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";
  const GUEST_CHAT_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-host";
  const GUEST_CHAT_CONTROL_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-control-host";
  const GUEST_CHAT_THEME_ATTR = "data-chzzk-chat-ui-toggle-guest-theme";
  const GUEST_CHAT_EMBED_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-embed";
  const GUEST_CHAT_CLEANBOT_DEFAULT_ATTR = "data-chzzk-chat-ui-toggle-guest-cleanbot-default";
  const LIVE_CHAT_FRAME_ATTR = "data-chzzk-chat-ui-toggle-live-chat-frame";
  const GUEST_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleGuest";
  const GUEST_CHAT_NATIVE_THEME_CLASSES = ["light", "dark", "theme_light", "theme_dark"];
  const GUEST_CHAT_CLEANBOT_STORAGE_KEY = "cleanbot";
  const GUEST_CHAT_CLEANBOT_DISABLED_VALUE = "false";
  const GUEST_CHAT_TOGGLE_BUTTON_ID = "chzzk-chat-ui-toggle-guest-chat-toggle";
  const GUEST_CHAT_TOGGLE_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-guest-chat-toggle__icon";
  const GUEST_CHAT_TOGGLE_BUTTON_SLASH_CLASS = "chzzk-chat-ui-toggle-guest-chat-toggle__slash";
  const GUEST_CHAT_SETTINGS_BUTTON_ID = "chzzk-chat-ui-toggle-guest-chat-settings";
  const GUEST_CHAT_SETTINGS_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-guest-chat-settings__icon";
  const FLOATING_SETTINGS_PANEL_ID = "chzzk-chat-ui-toggle-settings-popover";
  const FLOATING_SETTINGS_OPTION_ATTR = "data-chzzk-chat-ui-toggle-settings-option";
  const FLOATING_SETTINGS_TAB_TARGET_ATTR = "data-chzzk-chat-ui-toggle-settings-tab-target";
  const FLOATING_SETTINGS_PANEL_ATTR = "data-chzzk-chat-ui-toggle-settings-panel";
  const LIVE_CHANNEL_ID_PATTERN = /^[0-9a-f]{32}$/i;

  const DEFAULT_OPTIONS = {
    showNicknames: true,
    showBadges: true,
    showTimestamps: true,
    showChatBoxes: true,
    useGuestChatFrame: false,
    showGuestChatToggleButton: true,
    showLargeText: false,
    showBoldText: false,
    chatBoxColor: "#808080"
  };

  const DATASET_KEYS = {
    showNicknames: "chzzkChatUiToggleNicknames",
    showBadges: "chzzkChatUiToggleBadges",
    showTimestamps: "chzzkChatUiToggleTimestamps",
    showChatBoxes: "chzzkChatUiToggleChatBoxes",
    useGuestChatFrame: "chzzkChatUiToggleGuestChatFrame",
    showGuestChatToggleButton: "chzzkChatUiToggleGuestChatToggleButton",
    showLargeText: "chzzkChatUiToggleLargeText",
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
    "[class*='live_chatting_list_item' i]"
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
    "[class*='live_chatting_header_container' i]",
    "[class*='live_chatting' i]",
    "[class*='chatting_area' i]",
    "[class*='chat_area' i]"
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
  let optionsLoadTimer = 0;
  let scanIntervalTimer = 0;
  let isScanning = false;
  let observer = null;
  let messagesConnected = false;
  let storageListenerConnected = false;
  let themeSyncTimer = 0;
  let lastOptionsSource = "default";
  let lastOptionsLoadError = "";
  let currentGuestChatTheme = null;
  let lastPublishedGuestChatThemeKey = "";
  let lastPublishedGuestChatThemeAt = 0;
  let nativeGuestChatThemeRetryTimers = [];
  let floatingSettingsColor = DEFAULT_OPTIONS.chatBoxColor;
  let floatingSettingsHsv = { hue: 0, saturation: 0, value: 0.5 };
  let floatingSettingsColorApplyTimer = 0;
  let floatingSettingsPanelAnchor = null;

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

  function isValidHexInput(value) {
    const trimmed = String(value || "").trim();

    return /^#?[0-9a-f]{3}$/i.test(trimmed) || /^#?[0-9a-f]{6}$/i.test(trimmed);
  }

  function isCompleteHexInput(value) {
    return /^#?[0-9a-f]{6}$/i.test(String(value || "").trim());
  }

  function isPendingHexInput(value) {
    return /^#?[0-9a-f]{0,6}$/i.test(String(value || "").trim());
  }

  function rgbToHex({ red, green, blue }) {
    return `#${[red, green, blue]
      .map((value) => Math.round(value).toString(16).padStart(2, "0"))
      .join("")}`;
  }

  function rgbToHsv({ red, green, blue }) {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let hue = 0;

    if (delta > 0) {
      if (max === r) {
        hue = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        hue = 60 * ((b - r) / delta + 2);
      } else {
        hue = 60 * ((r - g) / delta + 4);
      }
    }

    return {
      hue: Math.round((hue + 360) % 360),
      saturation: max === 0 ? 0 : delta / max,
      value: max
    };
  }

  function hsvToRgb({ hue, saturation, value }) {
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = value - chroma;
    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) {
      r = chroma;
      g = x;
    } else if (hue < 120) {
      r = x;
      g = chroma;
    } else if (hue < 180) {
      g = chroma;
      b = x;
    } else if (hue < 240) {
      g = x;
      b = chroma;
    } else if (hue < 300) {
      r = x;
      b = chroma;
    } else {
      r = chroma;
      b = x;
    }

    return {
      red: (r + m) * 255,
      green: (g + m) * 255,
      blue: (b + m) * 255
    };
  }

  function hueToHex(hue) {
    return rgbToHex(hsvToRgb({ hue, saturation: 1, value: 1 }));
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
        [class*="live_chatting_list_item" i]:has([class*="live_chatting_message_container" i]) {
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
        [class*="chatting_header" i] {
        display: none !important;
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

      .chzzk-chat-ui-toggle-guest-chat-settings {
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

      .chzzk-chat-ui-toggle-guest-chat-settings:hover,
      .chzzk-chat-ui-toggle-guest-chat-settings[aria-expanded="true"] {
        background: rgba(32, 36, 40, 0.08) !important;
        color: rgba(32, 36, 40, 0.92) !important;
      }

      .chzzk-chat-ui-toggle-guest-chat-settings:focus-visible {
        outline: 2px solid rgba(0, 196, 113, 0.42) !important;
        outline-offset: 2px !important;
      }

      .${GUEST_CHAT_SETTINGS_BUTTON_ICON_CLASS} {
        display: block !important;
        width: 18px !important;
        height: 18px !important;
        pointer-events: none !important;
      }

      .${GUEST_CHAT_SETTINGS_BUTTON_ICON_CLASS} svg {
        display: block !important;
        width: 18px !important;
        height: 18px !important;
        stroke: currentColor !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} {
        position: fixed !important;
        width: 320px !important;
        max-width: calc(100vw - 16px) !important;
        max-height: calc(100vh - 16px) !important;
        overflow: auto !important;
        padding: 14px !important;
        border: 1px solid #dfe4ea !important;
        border-radius: 8px !important;
        background: #f7f8fa !important;
        color: #101418 !important;
        box-shadow: 0 16px 38px rgba(10, 18, 28, 0.22) !important;
        color-scheme: light !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        z-index: 2147483647 !important;
        --chzzk-chat-ui-floating-surface: #ffffff;
        --chzzk-chat-ui-floating-text: #101418;
        --chzzk-chat-ui-floating-muted: #66707c;
        --chzzk-chat-ui-floating-line: #dfe4ea;
        --chzzk-chat-ui-floating-accent: #00c471;
        --chzzk-chat-ui-floating-accent-strong: #009f5b;
        --chzzk-chat-ui-floating-shadow: 0 10px 26px rgba(10, 18, 28, 0.12);
      }

      #${FLOATING_SETTINGS_PANEL_ID}[hidden] {
        display: none !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID},
      #${FLOATING_SETTINGS_PANEL_ID} * {
        box-sizing: border-box !important;
        letter-spacing: 0 !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-header {
        display: flex !important;
        align-items: flex-start !important;
        justify-content: space-between !important;
        gap: 12px !important;
        margin-bottom: 12px !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-title {
        margin: 0 !important;
        color: var(--chzzk-chat-ui-floating-text) !important;
        font-size: 16px !important;
        line-height: 1.25 !important;
        font-weight: 700 !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-header-actions {
        display: flex !important;
        align-items: flex-start !important;
        gap: 8px !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-status {
        max-width: 92px !important;
        margin: 1px 0 0 !important;
        color: var(--chzzk-chat-ui-floating-muted) !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
        text-align: right !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-close {
        position: relative !important;
        flex: 0 0 auto !important;
        width: 24px !important;
        height: 24px !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 6px !important;
        background: transparent !important;
        cursor: pointer !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-close::before,
      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-close::after {
        content: "" !important;
        position: absolute !important;
        left: 6px !important;
        top: 11px !important;
        width: 12px !important;
        height: 2px !important;
        border-radius: 999px !important;
        background: var(--chzzk-chat-ui-floating-muted) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-close::before {
        transform: rotate(45deg) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-close::after {
        transform: rotate(-45deg) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-tabs {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 4px !important;
        margin-bottom: 10px !important;
        padding: 4px !important;
        border: 1px solid var(--chzzk-chat-ui-floating-line) !important;
        border-radius: 8px !important;
        background: #edf1f5 !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-tab {
        min-width: 0 !important;
        height: 34px !important;
        border: 0 !important;
        border-radius: 6px !important;
        background: transparent !important;
        color: var(--chzzk-chat-ui-floating-muted) !important;
        font: inherit !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-tab.is-active {
        background: var(--chzzk-chat-ui-floating-surface) !important;
        color: var(--chzzk-chat-ui-floating-text) !important;
        box-shadow: 0 1px 5px rgba(10, 18, 28, 0.12) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-tab:focus-visible,
      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-close:focus-visible {
        box-shadow: 0 0 0 3px rgba(0, 196, 113, 0.22) !important;
        outline: none !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-panel[hidden] {
        display: none !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-toggles {
        display: grid !important;
        gap: 8px !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-toggle-row {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 16px !important;
        min-height: 46px !important;
        padding: 9px 12px !important;
        border: 1px solid var(--chzzk-chat-ui-floating-line) !important;
        border-radius: 8px !important;
        background: var(--chzzk-chat-ui-floating-surface) !important;
        box-shadow: var(--chzzk-chat-ui-floating-shadow) !important;
        cursor: pointer !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-toggle-row span {
        min-width: 0 !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-toggle-row strong {
        color: var(--chzzk-chat-ui-floating-text) !important;
        font-size: 13px !important;
        line-height: 1.25 !important;
        font-weight: 700 !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-toggle-row input {
        appearance: none !important;
        position: relative !important;
        flex: 0 0 auto !important;
        width: 42px !important;
        height: 24px !important;
        margin: 0 !important;
        border: 1px solid #c8d0d8 !important;
        border-radius: 999px !important;
        background: #d9dee4 !important;
        outline: none !important;
        transition: background-color 140ms ease, border-color 140ms ease !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-toggle-row input::after {
        content: "" !important;
        position: absolute !important;
        top: 2px !important;
        left: 2px !important;
        width: 18px !important;
        height: 18px !important;
        border-radius: 50% !important;
        background: #ffffff !important;
        box-shadow: 0 1px 4px rgba(10, 18, 28, 0.24) !important;
        transition: transform 140ms ease !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-toggle-row input:checked {
        border-color: var(--chzzk-chat-ui-floating-accent-strong) !important;
        background: var(--chzzk-chat-ui-floating-accent) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-toggle-row input:checked::after {
        transform: translateX(18px) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-toggle-row input:focus-visible {
        box-shadow: 0 0 0 3px rgba(0, 196, 113, 0.22) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-color-picker {
        display: grid !important;
        gap: 10px !important;
        margin-top: 10px !important;
        padding: 10px 12px !important;
        border: 1px solid var(--chzzk-chat-ui-floating-line) !important;
        border-radius: 8px !important;
        background: var(--chzzk-chat-ui-floating-surface) !important;
        box-shadow: var(--chzzk-chat-ui-floating-shadow) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-color-picker strong {
        color: var(--chzzk-chat-ui-floating-text) !important;
        font-size: 13px !important;
        line-height: 1.25 !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-color-controls {
        display: grid !important;
        grid-template-columns: 38px 1fr 56px !important;
        gap: 8px !important;
        align-items: center !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-color-preview {
        width: 38px !important;
        height: 34px !important;
        border: 1px solid rgba(10, 18, 28, 0.18) !important;
        border-radius: 8px !important;
        background: var(--chzzk-chat-ui-floating-current-color, #808080) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-hex-input,
      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-default-button {
        min-width: 0 !important;
        height: 34px !important;
        border: 1px solid #c8d0d8 !important;
        border-radius: 8px !important;
        background: #ffffff !important;
        color: var(--chzzk-chat-ui-floating-text) !important;
        font: inherit !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-hex-input {
        padding: 0 9px !important;
        font-size: 13px !important;
        text-transform: lowercase !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-hex-input:focus {
        border-color: var(--chzzk-chat-ui-floating-accent) !important;
        box-shadow: 0 0 0 3px rgba(0, 196, 113, 0.18) !important;
        outline: none !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-hex-input.is-invalid {
        border-color: #e03131 !important;
        box-shadow: 0 0 0 3px rgba(224, 49, 49, 0.14) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-default-button {
        padding: 0 10px !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-color-body {
        display: grid !important;
        grid-template-columns: 1fr 28px !important;
        gap: 10px !important;
        min-height: 172px !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-color-field {
        position: relative !important;
        min-width: 0 !important;
        min-height: 172px !important;
        border: 1px solid rgba(10, 18, 28, 0.18) !important;
        border-radius: 8px !important;
        background:
          linear-gradient(to top, #000000, transparent),
          linear-gradient(to right, #ffffff, var(--chzzk-chat-ui-floating-field-hue, #ff0000)) !important;
        cursor: crosshair !important;
        outline: none !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-color-field:focus-visible {
        box-shadow: 0 0 0 3px rgba(0, 196, 113, 0.22) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-color-handle {
        position: absolute !important;
        left: calc(var(--chzzk-chat-ui-floating-field-x, 0.5) * 100%) !important;
        top: calc(var(--chzzk-chat-ui-floating-field-y, 0.5) * 100%) !important;
        width: 18px !important;
        height: 18px !important;
        border: 2px solid #ffffff !important;
        border-radius: 50% !important;
        box-shadow: 0 0 0 1px rgba(10, 18, 28, 0.58), 0 1px 4px rgba(10, 18, 28, 0.32) !important;
        transform: translate(-50%, -50%) !important;
        pointer-events: none !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-hue-slider {
        width: 28px !important;
        height: 172px !important;
        margin: 0 !important;
        accent-color: var(--chzzk-chat-ui-floating-current-color, #808080) !important;
        cursor: pointer !important;
        writing-mode: vertical-lr !important;
        direction: rtl !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-hue-slider::-webkit-slider-runnable-track {
        width: 12px !important;
        border-radius: 999px !important;
        background: linear-gradient(to top, #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000) !important;
      }

      #${FLOATING_SETTINGS_PANEL_ID} .chzzk-chat-ui-floating-hue-slider::-webkit-slider-thumb {
        margin-left: -6px !important;
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
        font-size: 17px !important;
        line-height: 1.45 !important;
      }

      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [class*="live_chatting_message_text" i],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [class*="live_chatting_username_nickname" i],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR}
        [class*="name_text" i],
      html[data-chzzk-chat-ui-toggle-large-text="on"]
        .chzzk-chat-ui-toggle-timestamp {
        font-size: inherit !important;
        line-height: inherit !important;
      }

      html[data-chzzk-chat-ui-toggle-bold-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR},
      html[data-chzzk-chat-ui-toggle-bold-text="on"]
        ${NATIVE_CHAT_ROW_SELECTOR} :where(
          [class*="live_chatting_message_text" i],
          [class*="live_chatting_message_text" i] *,
          [class*="message_text" i],
          [class*="message_text" i] *,
          [class*="live_chatting_username_nickname" i],
          [class*="live_chatting_username_nickname" i] *,
          [class*="name_text" i],
          [class*="name_text" i] *,
          .chzzk-chat-ui-toggle-timestamp
        ) {
        font-weight: 650 !important;
      }

      html[data-chzzk-chat-ui-toggle-timestamps="on"]
        ${CHAT_ROW_SCOPE_SELECTOR}:has([class*="live_chatting_message_nickname" i]):not(:has(.chzzk-chat-ui-toggle-timestamp)) {
        visibility: hidden !important;
      }

      html[data-chzzk-chat-ui-toggle-nicknames="off"]
        ${CHAT_ROW_SCOPE_SELECTOR}
        [class*="live_chatting_username_nickname" i],
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
    currentOptions = normalizeOptions(options);
    lastOptionsSource = source;
    lastOptionsLoadError = "";

    if (cache) {
      writeCachedOptions(currentOptions);
    }

    document.documentElement.dataset.chzzkChatUiToggleVersion = SCRIPT_VERSION;
    document.documentElement.dataset.chzzkChatUiToggleChatBoxColor = currentOptions.chatBoxColor;

    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-box-bg",
      hexToRgba(currentOptions.chatBoxColor, 0.18)
    );
    document.documentElement.style.setProperty(
      "--chzzk-chat-ui-toggle-box-bg-hover",
      hexToRgba(currentOptions.chatBoxColor, 0.26)
    );

    for (const [optionKey, datasetKey] of Object.entries(DATASET_KEYS)) {
      document.documentElement.dataset[datasetKey] = currentOptions[optionKey] ? "on" : "off";
    }

    syncGuestChatFrame();
    ensureGuestChatToggleButton();
    syncFloatingSettingsPanelState({ syncColorInput: source !== "floating-settings-color" });

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

  function findGuestChatHostFrom(element) {
    for (let current = element; current && current !== document.body; current = current.parentElement) {
      if (!(current instanceof HTMLElement)) {
        continue;
      }

      const className = getClassName(current);
      const hasChatShellClass = /live_chatting|chatting_area|chat_area/i.test(className);
      const isHeaderOnly = /live_chatting_header_/i.test(className);
      const hasChatParts = Boolean(
        current.querySelector(
          "[class*='live_chatting_header_container' i], [class*='live_chatting_input_container' i], [class*='live_chatting_list_item' i]"
        )
      );

      if (hasChatShellClass && !isHeaderOnly && hasChatParts) {
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
    if (!currentOptions.useGuestChatFrame || !isGuestChatFrameEligibleContext() || !supportsCredentiallessIframe()) {
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

  function findChatHeaderTarget({ includeHidden = false } = {}) {
    let candidates = queryAllSafe(document, CHAT_HEADER_SELECTORS)
      .filter((element) => element instanceof HTMLElement)
      .filter((element) => /live_chatting_header_/i.test(getClassName(element)));

    if (!includeHidden) {
      candidates = candidates.filter(isElementVisible);
    }

    return candidates[0] || null;
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

        if (isChatContainer && !isChatRow) {
          fallback ??= element;
        }

        if (
          fallback &&
          queryAllSafe(element, CHAT_HEADER_SELECTORS).some((candidate) => candidate instanceof HTMLElement)
        ) {
          return element;
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
        .find((element) => /live_chatting_header_/i.test(getClassName(element))) || null;

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
      .filter((element) => !element.closest(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`))
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
    const guestHost = findGuestChatHost();

    if (!guestHost || !header) {
      if (!currentOptions.useGuestChatFrame) {
        clearGuestChatControlHosts();
      }
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

  function getFloatingSettingsOptionId(optionKey) {
    return `${FLOATING_SETTINGS_PANEL_ID}-${optionKey}`;
  }

  function createFloatingToggleMarkup(optionKey, label) {
    return `
          <label class="chzzk-chat-ui-floating-toggle-row">
            <span><strong>${label}</strong></span>
            <input type="checkbox" id="${getFloatingSettingsOptionId(optionKey)}" ${FLOATING_SETTINGS_OPTION_ATTR}="${optionKey}">
          </label>`;
  }

  function createFloatingSettingsPanel() {
    if (!document.body) {
      return null;
    }

    const panel = document.createElement("section");

    panel.id = FLOATING_SETTINGS_PANEL_ID;
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "채팅 설정");
    panel.innerHTML = `
      <header class="chzzk-chat-ui-floating-header">
        <h1 class="chzzk-chat-ui-floating-title">채팅 설정</h1>
        <div class="chzzk-chat-ui-floating-header-actions">
          <p id="${FLOATING_SETTINGS_PANEL_ID}-status" class="chzzk-chat-ui-floating-status" aria-live="polite">대기 중</p>
          <button type="button" class="chzzk-chat-ui-floating-close" aria-label="설정 닫기"></button>
        </div>
      </header>

      <nav class="chzzk-chat-ui-floating-tabs" role="tablist" aria-label="설정 분류">
        <button type="button" class="chzzk-chat-ui-floating-tab is-active" role="tab" aria-selected="true" aria-controls="${FLOATING_SETTINGS_PANEL_ID}-text-panel" ${FLOATING_SETTINGS_TAB_TARGET_ATTR}="${FLOATING_SETTINGS_PANEL_ID}-text-panel">텍스트</button>
        <button type="button" class="chzzk-chat-ui-floating-tab" role="tab" aria-selected="false" aria-controls="${FLOATING_SETTINGS_PANEL_ID}-style-panel" ${FLOATING_SETTINGS_TAB_TARGET_ATTR}="${FLOATING_SETTINGS_PANEL_ID}-style-panel">꾸미기</button>
        <button type="button" class="chzzk-chat-ui-floating-tab" role="tab" aria-selected="false" aria-controls="${FLOATING_SETTINGS_PANEL_ID}-settings-panel" ${FLOATING_SETTINGS_TAB_TARGET_ATTR}="${FLOATING_SETTINGS_PANEL_ID}-settings-panel">설정</button>
      </nav>

      <section id="${FLOATING_SETTINGS_PANEL_ID}-text-panel" class="chzzk-chat-ui-floating-panel is-active" role="tabpanel" ${FLOATING_SETTINGS_PANEL_ATTR}="true">
        <div class="chzzk-chat-ui-floating-toggles" aria-label="텍스트 옵션">
${createFloatingToggleMarkup("showNicknames", "닉네임")}
${createFloatingToggleMarkup("showBadges", "배지")}
${createFloatingToggleMarkup("showTimestamps", "타임스탬프")}
        </div>
      </section>

      <section id="${FLOATING_SETTINGS_PANEL_ID}-style-panel" class="chzzk-chat-ui-floating-panel" role="tabpanel" ${FLOATING_SETTINGS_PANEL_ATTR}="true" hidden>
        <div class="chzzk-chat-ui-floating-toggles" aria-label="꾸미기 옵션">
${createFloatingToggleMarkup("useGuestChatFrame", "비로그인 채팅")}
${createFloatingToggleMarkup("showChatBoxes", "채팅 박스")}
${createFloatingToggleMarkup("showLargeText", "큰 글씨")}
${createFloatingToggleMarkup("showBoldText", "굵게")}
        </div>

        <section class="chzzk-chat-ui-floating-color-picker" aria-label="채팅 박스 색상">
          <div>
            <strong>박스 색상</strong>
          </div>

          <div class="chzzk-chat-ui-floating-color-controls">
            <span id="${FLOATING_SETTINGS_PANEL_ID}-color-preview" class="chzzk-chat-ui-floating-color-preview" aria-hidden="true"></span>
            <input type="text" id="${FLOATING_SETTINGS_PANEL_ID}-chat-box-color-hex" class="chzzk-chat-ui-floating-hex-input" inputmode="text" maxlength="7" spellcheck="false" aria-label="색상 코드">
            <button type="button" id="${FLOATING_SETTINGS_PANEL_ID}-reset-chat-box-color" class="chzzk-chat-ui-floating-default-button">기본</button>
          </div>

          <div class="chzzk-chat-ui-floating-color-body">
            <button type="button" id="${FLOATING_SETTINGS_PANEL_ID}-color-field" class="chzzk-chat-ui-floating-color-field" aria-label="색상 영역">
              <span class="chzzk-chat-ui-floating-color-handle"></span>
            </button>
            <input type="range" id="${FLOATING_SETTINGS_PANEL_ID}-hue-slider" class="chzzk-chat-ui-floating-hue-slider" min="0" max="360" value="0" aria-label="색상 범위">
          </div>
        </section>
      </section>

      <section id="${FLOATING_SETTINGS_PANEL_ID}-settings-panel" class="chzzk-chat-ui-floating-panel" role="tabpanel" ${FLOATING_SETTINGS_PANEL_ATTR}="true" hidden>
        <div class="chzzk-chat-ui-floating-toggles" aria-label="설정 옵션">
${createFloatingToggleMarkup("showGuestChatToggleButton", "비로그인 버튼 표시")}
        </div>
      </section>`;

    connectFloatingSettingsPanel(panel);
    document.body.append(panel);
    return panel;
  }

  function getFloatingSettingsPanel() {
    const existingPanel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);

    return existingPanel instanceof HTMLElement ? existingPanel : createFloatingSettingsPanel();
  }

  function canRenderFloatingSettingsControls() {
    return document.readyState !== "loading" && Boolean(document.body);
  }

  function getFloatingSettingsControls(panel) {
    const controls = {};

    for (const input of panel.querySelectorAll(`[${FLOATING_SETTINGS_OPTION_ATTR}]`)) {
      if (input instanceof HTMLInputElement) {
        controls[input.getAttribute(FLOATING_SETTINGS_OPTION_ATTR)] = input;
      }
    }

    return controls;
  }

  function getFloatingSettingsElement(id) {
    return document.getElementById(`${FLOATING_SETTINGS_PANEL_ID}-${id}`);
  }

  function setFloatingSettingsStatus(message) {
    const status = getFloatingSettingsElement("status");

    if (status) {
      status.textContent = message;
    }
  }

  function updateFloatingSettingsColorUi(hexColor, { syncInput = true } = {}) {
    const panel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);
    const normalizedColor = normalizeHexColor(hexColor);
    const hexInput = getFloatingSettingsElement("chat-box-color-hex");
    const colorPreview = getFloatingSettingsElement("color-preview");
    const colorField = getFloatingSettingsElement("color-field");
    const hueSlider = getFloatingSettingsElement("hue-slider");

    floatingSettingsColor = normalizedColor;
    floatingSettingsHsv = rgbToHsv(hexToRgb(normalizedColor));

    panel?.style.setProperty("--chzzk-chat-ui-floating-current-color", normalizedColor);
    panel?.style.setProperty("--chzzk-chat-ui-floating-field-hue", hueToHex(floatingSettingsHsv.hue));
    colorField?.style.setProperty("--chzzk-chat-ui-floating-field-x", String(floatingSettingsHsv.saturation));
    colorField?.style.setProperty("--chzzk-chat-ui-floating-field-y", String(1 - floatingSettingsHsv.value));

    if (colorPreview instanceof HTMLElement) {
      colorPreview.style.backgroundColor = normalizedColor;
    }

    if (hueSlider instanceof HTMLInputElement) {
      hueSlider.value = String(floatingSettingsHsv.hue);
    }

    if (syncInput && hexInput instanceof HTMLInputElement) {
      hexInput.value = normalizedColor;
      hexInput.classList.remove("is-invalid");
    }
  }

  function setFloatingSettingsPanelControls(options, { syncColorInput = true } = {}) {
    const panel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);

    if (!(panel instanceof HTMLElement)) {
      return;
    }

    const normalizedOptions = normalizeOptions(options);
    const controls = getFloatingSettingsControls(panel);

    for (const [optionKey, input] of Object.entries(controls)) {
      input.checked = normalizedOptions[optionKey] === true;
    }

    updateFloatingSettingsColorUi(normalizedOptions.chatBoxColor, { syncInput: syncColorInput });
  }

  function readFloatingSettingsPanelOptions(panel) {
    const controls = getFloatingSettingsControls(panel);

    return normalizeOptions({
      ...currentOptions,
      showNicknames: controls.showNicknames?.checked,
      showBadges: controls.showBadges?.checked,
      showTimestamps: controls.showTimestamps?.checked,
      showChatBoxes: controls.showChatBoxes?.checked,
      useGuestChatFrame: controls.useGuestChatFrame?.checked,
      showGuestChatToggleButton: controls.showGuestChatToggleButton?.checked,
      showLargeText: controls.showLargeText?.checked,
      showBoldText: controls.showBoldText?.checked,
      chatBoxColor: floatingSettingsColor
    });
  }

  async function applyFloatingSettingsPanelOptions({ source = "floating-settings", syncColorInput = true } = {}) {
    const panel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);

    if (!(panel instanceof HTMLElement)) {
      return;
    }

    const previousOptions = currentOptions;
    const nextOptions = readFloatingSettingsPanelOptions(panel);

    setFloatingSettingsStatus("저장 중");
    const result = await writeOptionsToStorageLocal(nextOptions);

    if (!result.ok) {
      setFloatingSettingsStatus("저장 실패");
      setFloatingSettingsPanelControls(previousOptions);
      return;
    }

    applyOptions(result.options, { source });
    scan();
    setFloatingSettingsPanelControls(result.options, { syncColorInput });
    setFloatingSettingsStatus("적용됨");
    positionFloatingSettingsPanel(floatingSettingsPanelAnchor);
  }

  function setFloatingSettingsColorFromHsv(nextHsv, { commit = true } = {}) {
    floatingSettingsHsv = {
      hue: Math.max(0, Math.min(360, nextHsv.hue)),
      saturation: Math.max(0, Math.min(1, nextHsv.saturation)),
      value: Math.max(0, Math.min(1, nextHsv.value))
    };
    updateFloatingSettingsColorUi(rgbToHex(hsvToRgb(floatingSettingsHsv)));

    if (commit) {
      scheduleFloatingSettingsColorApply();
    }
  }

  function scheduleFloatingSettingsColorApply() {
    window.clearTimeout(floatingSettingsColorApplyTimer);
    floatingSettingsColorApplyTimer = window.setTimeout(() => {
      applyFloatingSettingsPanelOptions({
        source: "floating-settings-color",
        syncColorInput: false
      });
    }, 100);
  }

  function updateFloatingSettingsColorFromField(event) {
    const colorField = getFloatingSettingsElement("color-field");

    if (!(colorField instanceof HTMLElement)) {
      return;
    }

    const rect = colorField.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

    setFloatingSettingsColorFromHsv({
      hue: floatingSettingsHsv.hue,
      saturation: x,
      value: 1 - y
    });
  }

  function handleFloatingSettingsHexInput(input) {
    if (!input.value.trim()) {
      input.classList.remove("is-invalid");
      return;
    }

    if (isCompleteHexInput(input.value)) {
      updateFloatingSettingsColorUi(normalizeHexColor(input.value), { syncInput: false });
      input.classList.remove("is-invalid");
      scheduleFloatingSettingsColorApply();
      return;
    }

    input.classList.toggle("is-invalid", !isPendingHexInput(input.value));
  }

  function commitFloatingSettingsHexInput(input) {
    if (!isValidHexInput(input.value)) {
      input.classList.add("is-invalid");
      return;
    }

    updateFloatingSettingsColorUi(normalizeHexColor(input.value));
    applyFloatingSettingsPanelOptions({ source: "floating-settings-hex" });
  }

  function selectFloatingSettingsTab(panel, targetId) {
    for (const button of panel.querySelectorAll(`[${FLOATING_SETTINGS_TAB_TARGET_ATTR}]`)) {
      const isSelected = button.getAttribute(FLOATING_SETTINGS_TAB_TARGET_ATTR) === targetId;
      button.classList.toggle("is-active", isSelected);
      button.setAttribute("aria-selected", String(isSelected));
    }

    for (const tabPanel of panel.querySelectorAll(`[${FLOATING_SETTINGS_PANEL_ATTR}]`)) {
      const isSelected = tabPanel.id === targetId;
      tabPanel.classList.toggle("is-active", isSelected);
      tabPanel.hidden = !isSelected;
    }

    positionFloatingSettingsPanel(floatingSettingsPanelAnchor);
  }

  function connectFloatingSettingsPanel(panel) {
    if (panel.dataset.chzzkChatUiToggleSettingsConnected === "true") {
      return;
    }

    panel.dataset.chzzkChatUiToggleSettingsConnected = "true";

    panel.addEventListener("click", (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const tabButton = target.closest(`[${FLOATING_SETTINGS_TAB_TARGET_ATTR}]`);

      if (tabButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        selectFloatingSettingsTab(panel, tabButton.getAttribute(FLOATING_SETTINGS_TAB_TARGET_ATTR));
        return;
      }

      if (target.closest(".chzzk-chat-ui-floating-close")) {
        event.preventDefault();
        event.stopPropagation();
        closeFloatingSettingsPanel();
        return;
      }

      if (target.closest(`#${FLOATING_SETTINGS_PANEL_ID}-reset-chat-box-color`)) {
        event.preventDefault();
        event.stopPropagation();
        updateFloatingSettingsColorUi(DEFAULT_OPTIONS.chatBoxColor);
        applyFloatingSettingsPanelOptions({ source: "floating-settings-reset-color" });
      }
    });

    panel.addEventListener("change", (event) => {
      const target = event.target;

      if (target instanceof HTMLInputElement && target.hasAttribute(FLOATING_SETTINGS_OPTION_ATTR)) {
        applyFloatingSettingsPanelOptions();
      }
    });

    panel.addEventListener("input", (event) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      if (target.id === `${FLOATING_SETTINGS_PANEL_ID}-hue-slider`) {
        setFloatingSettingsColorFromHsv({
          hue: Number(target.value),
          saturation: floatingSettingsHsv.saturation,
          value: floatingSettingsHsv.value
        });
        return;
      }

      if (target.id === `${FLOATING_SETTINGS_PANEL_ID}-chat-box-color-hex`) {
        handleFloatingSettingsHexInput(target);
      }
    });

    panel.addEventListener("keydown", (event) => {
      const target = event.target;

      if (event.key === "Enter" && target instanceof HTMLInputElement && target.id === `${FLOATING_SETTINGS_PANEL_ID}-chat-box-color-hex`) {
        commitFloatingSettingsHexInput(target);
        target.blur();
      }
    });

    panel.addEventListener("focusout", (event) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement) || target.id !== `${FLOATING_SETTINGS_PANEL_ID}-chat-box-color-hex`) {
        return;
      }

      if (isValidHexInput(target.value)) {
        commitFloatingSettingsHexInput(target);
        return;
      }

      updateFloatingSettingsColorUi(floatingSettingsColor);
    });

    panel.addEventListener("pointerdown", (event) => {
      const colorField = getFloatingSettingsElement("color-field");

      if (event.target === colorField && colorField instanceof HTMLElement) {
        colorField.setPointerCapture(event.pointerId);
        updateFloatingSettingsColorFromField(event);
      }
    });

    panel.addEventListener("pointermove", (event) => {
      const colorField = getFloatingSettingsElement("color-field");

      if (colorField instanceof HTMLElement && colorField.hasPointerCapture(event.pointerId)) {
        updateFloatingSettingsColorFromField(event);
      }
    });
  }

  function handleFloatingSettingsDocumentPointerDown(event) {
    const panel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);
    const settingsButton = document.getElementById(GUEST_CHAT_SETTINGS_BUTTON_ID);
    const target = event.target;

    if (!(panel instanceof HTMLElement) || panel.hidden || !(target instanceof Node)) {
      return;
    }

    if (panel.contains(target) || settingsButton?.contains(target)) {
      return;
    }

    closeFloatingSettingsPanel();
  }

  function handleFloatingSettingsKeyDown(event) {
    if (event.key === "Escape") {
      closeFloatingSettingsPanel();
    }
  }

  function handleFloatingSettingsReposition() {
    positionFloatingSettingsPanel(floatingSettingsPanelAnchor);
  }

  function connectFloatingSettingsGlobalEvents() {
    document.addEventListener("pointerdown", handleFloatingSettingsDocumentPointerDown, true);
    document.addEventListener("keydown", handleFloatingSettingsKeyDown, true);
    window.addEventListener("resize", handleFloatingSettingsReposition, true);
    window.addEventListener("scroll", handleFloatingSettingsReposition, true);
  }

  function disconnectFloatingSettingsGlobalEvents() {
    document.removeEventListener("pointerdown", handleFloatingSettingsDocumentPointerDown, true);
    document.removeEventListener("keydown", handleFloatingSettingsKeyDown, true);
    window.removeEventListener("resize", handleFloatingSettingsReposition, true);
    window.removeEventListener("scroll", handleFloatingSettingsReposition, true);
  }

  function positionFloatingSettingsPanel(anchorButton) {
    const panel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);

    if (!(panel instanceof HTMLElement) || panel.hidden) {
      return;
    }

    if (!(anchorButton instanceof HTMLElement) || !anchorButton.isConnected) {
      closeFloatingSettingsPanel();
      return;
    }

    const gap = 8;
    const safeMargin = 8;
    const anchorRect = anchorButton.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const panelWidth = Math.min(panelRect.width || 320, window.innerWidth - safeMargin * 2);
    const panelHeight = Math.min(panelRect.height || 360, window.innerHeight - safeMargin * 2);
    const maxLeft = Math.max(safeMargin, window.innerWidth - panelWidth - safeMargin);
    const maxTop = Math.max(safeMargin, window.innerHeight - panelHeight - safeMargin);
    let left = Math.min(maxLeft, Math.max(safeMargin, anchorRect.right - panelWidth));
    let top = anchorRect.bottom + gap;

    if (top + panelHeight > window.innerHeight - safeMargin) {
      top = anchorRect.top - panelHeight - gap;
    }

    top = Math.min(maxTop, Math.max(safeMargin, top));

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }

  function openFloatingSettingsPanel(anchorButton) {
    const panel = getFloatingSettingsPanel();

    if (!(panel instanceof HTMLElement)) {
      return;
    }

    floatingSettingsPanelAnchor = anchorButton;
    setFloatingSettingsPanelControls(currentOptions);
    setFloatingSettingsStatus("대기 중");
    panel.hidden = false;
    positionFloatingSettingsPanel(anchorButton);
    connectFloatingSettingsGlobalEvents();
    setGuestChatSettingsButtonState(anchorButton);
  }

  function closeFloatingSettingsPanel() {
    const panel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);

    if (panel instanceof HTMLElement) {
      panel.hidden = true;
    }

    window.clearTimeout(floatingSettingsColorApplyTimer);
    disconnectFloatingSettingsGlobalEvents();
    floatingSettingsPanelAnchor = null;

    const settingsButton = document.getElementById(GUEST_CHAT_SETTINGS_BUTTON_ID);

    if (settingsButton instanceof HTMLButtonElement) {
      setGuestChatSettingsButtonState(settingsButton);
    }
  }

  function syncFloatingSettingsPanelState({ syncColorInput = true } = {}) {
    const panel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);

    if (!(panel instanceof HTMLElement)) {
      return;
    }

    setFloatingSettingsPanelControls(currentOptions, { syncColorInput });

    if (!panel.hidden) {
      positionFloatingSettingsPanel(floatingSettingsPanelAnchor);
    }
  }

  function setGuestChatSettingsButtonState(button) {
    const panel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);
    const isOpen = panel instanceof HTMLElement && !panel.hidden;
    const label = isOpen ? "채팅 설정 닫기" : "채팅 설정 열기";

    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-expanded", String(isOpen));
  }

  function createGuestChatSettingsButton() {
    const button = document.createElement("button");
    const icon = document.createElement("span");

    button.id = GUEST_CHAT_SETTINGS_BUTTON_ID;
    button.type = "button";
    button.className = "chzzk-chat-ui-toggle-guest-chat-settings";
    icon.className = GUEST_CHAT_SETTINGS_BUTTON_ICON_CLASS;
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.52a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.52a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>`;
    button.append(icon);
    setGuestChatSettingsButtonState(button);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const panel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);

      if (panel instanceof HTMLElement && !panel.hidden) {
        closeFloatingSettingsPanel();
        return;
      }

      openFloatingSettingsPanel(button);
    });

    return button;
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

  function ensureGuestChatToggleButton() {
    const existingButton = document.getElementById(GUEST_CHAT_TOGGLE_BUTTON_ID);
    const existingSettingsButton = document.getElementById(GUEST_CHAT_SETTINGS_BUTTON_ID);

    if (!isGuestChatFrameEligibleContext()) {
      existingButton?.remove();
      existingSettingsButton?.remove();
      closeFloatingSettingsPanel();
      clearGuestChatControlHosts();
      return;
    }

    const target = findGuestChatToggleTarget();

    if (!target) {
      if (existingButton instanceof HTMLButtonElement) {
        setGuestChatToggleButtonState(existingButton);
      }

      if (existingSettingsButton instanceof HTMLButtonElement) {
        setGuestChatSettingsButtonState(existingSettingsButton);
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

    const canRenderSettingsButton = canRenderFloatingSettingsControls();
    const settingsButton = canRenderSettingsButton
      ? existingSettingsButton instanceof HTMLButtonElement
        ? existingSettingsButton
        : createGuestChatSettingsButton()
      : null;

    if (!canRenderSettingsButton) {
      existingSettingsButton?.remove();
    }

    if (settingsButton instanceof HTMLButtonElement) {
      setGuestChatSettingsButtonState(settingsButton);

      if (settingsButton.parentElement !== target.container || settingsButton.nextSibling !== target.before) {
        target.container.insertBefore(settingsButton, target.before);
      }
    }

    if (currentOptions.showGuestChatToggleButton) {
      const button =
        existingButton instanceof HTMLButtonElement ? existingButton : createGuestChatToggleButton();

      setGuestChatToggleButtonState(button);

      const nextSibling = settingsButton instanceof HTMLButtonElement ? settingsButton : target.before;

      if (button.parentElement !== target.container || button.nextSibling !== nextSibling) {
        target.container.insertBefore(button, nextSibling);
      }
    } else {
      existingButton?.remove();
    }

    const settingsPanel = document.getElementById(FLOATING_SETTINGS_PANEL_ID);

    if (settingsPanel instanceof HTMLElement && !settingsPanel.hidden) {
      floatingSettingsPanelAnchor = settingsButton;
      positionFloatingSettingsPanel(settingsButton);
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

    if (element.getAttribute(CHAT_ROW_ATTR) === "true") {
      element.removeAttribute(CHAT_ROW_ATTR);
    }

    if (element.hasAttribute(GENERATED_TIMESTAMP_ATTR)) {
      element.remove();
    }
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

  function getMessageTextElement(row) {
    return row.querySelector("[class*='live_chatting_message_text' i]");
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

    if (tagName === "img" && /badge|emblem|grade/i.test(source)) {
      return true;
    }

    return tagName === "svg" && /badge|grade/i.test(className);
  }

  function isInsideLiveChatNicknameShell(element) {
    return Boolean(
      element.closest(
        "button[class*='live_chatting_message_nickname' i], [class*='live_chatting_username_container' i]"
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

    const nicknameButton = row.querySelector("button[class*='live_chatting_message_nickname' i]");
    const messageContainer = row.querySelector("[class*='live_chatting_message_container' i]");
    const messageText = getMessageTextElement(row);
    const hasChatMessageShell = Boolean(
      /live_chatting_list_item/i.test(className) &&
        nicknameButton &&
        messageContainer &&
        messageText
    );

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

  function cleanupUnscopedAnnotations(root = document) {
    const annotatedElements = queryAllSafe(root, [
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

  function scanRows(rows) {
    cleanupUnscopedAnnotations();

    for (const row of [...new Set(rows)].filter((element) => element instanceof HTMLElement && hasChatLikeText(element))) {
      annotateChatRow(row);
    }
  }

  function scan() {
    if (isScanning) {
      return;
    }

    isScanning = true;
    const roots = getChatRoots();

    try {
      for (const root of roots) {
        scanRows(getChatRows(root));
      }

      syncGuestChatFrame();
      ensureGuestChatToggleButton();
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
          syncGuestChatFrame();
          ensureGuestChatToggleButton();
        } else {
          scan();
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

    const cachedOptions = readCachedOptions();

    if (cachedOptions) {
      applyOptions(cachedOptions, { markAsReady: false, cache: false, source: "page-cache" });
      scan();
    }

    connectObserver();
    syncGuestChatTheme();
    scheduleScan();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scheduleScan, { once: true });
    }

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
