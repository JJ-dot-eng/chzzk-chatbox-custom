var SCRIPT_VERSION = "0.4.2";
var GLOBAL_KEY = `__chzzkChatUiToggleLoaded_${SCRIPT_VERSION}`;
var CHZZK_CHAT_UI_TOGGLE_SHOULD_START = !window[GLOBAL_KEY];

var STORAGE_KEY = "chzzkChatUiToggleOptions";
var ROLE_ATTR = "data-chzzk-chat-ui-toggle-role";
var CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-chat-row";
var NATIVE_CHAT_ROW_SELECTOR = `:is([class*="live_chatting_list_item" i], [role="log"] [class*="_item_" i]):has(:is([class*="live_chatting_message_container" i], [class*="_chatting_message_" i]))`;
var CHAT_ROW_SCOPE_SELECTOR = `:is([class*="live_chatting_list_item" i], [role="log"] [class*="_item_" i])[${CHAT_ROW_ATTR}="true"]`;
var CACHE_KEY = "chzzkChatUiToggleOptionsCache";
var READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
var OPEN_POPUP_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_POPUP";
var READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";
var SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";
var APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";
var CHZZK_ORIGIN = "https://chzzk.naver.com";
var STORAGE_READ_TIMEOUT_MS = 700;
var OPTIONS_LOAD_RETRY_MS = 250;
var OPTIONS_LOAD_MAX_ATTEMPTS = 20;
var SCAN_DELAY_MS = 50;
var SCAN_INTERVAL_MS = 5000;
var FULL_CLEANUP_INTERVAL_MS = 10000;
var UI_SYNC_DELAY_MS = 100;
var THEME_SYNC_INTERVAL_MS = 3000;
var GENERATED_TIMESTAMP_ATTR = "data-chzzk-chat-ui-toggle-generated-timestamp";
var MESSAGE_PREFIX_ATTR = "data-chzzk-chat-ui-toggle-prefix";
var NICKNAME_COLOR_MESSAGE_ATTR = "data-chzzk-chat-ui-toggle-nickname-color-message";
var GUEST_CHAT_FRAME_CONTAINER_ID = "chzzk-chat-ui-toggle-guest-chat-frame-container";
var GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";
var MINI_CHAT_PANEL_ID = "chzzk-chat-ui-toggle-mini-chat-panel";
var MINI_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-mini-chat-frame";
var MINI_CHAT_BUTTON_ID = "chzzk-chat-ui-toggle-mini-chat-button";
var MINI_CHAT_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-mini-chat-button__icon";
var MINI_CHAT_PANEL_CONTROLS_CLASS = "chzzk-chat-ui-toggle-mini-chat__controls";
var MINI_CHAT_PANEL_SCALE_CLASS = "chzzk-chat-ui-toggle-mini-chat__scale";
var MINI_CHAT_PANEL_SCALE_BUTTON_CLASS = "chzzk-chat-ui-toggle-mini-chat__scale-button";
var MINI_CHAT_PANEL_SCALE_VALUE_CLASS = "chzzk-chat-ui-toggle-mini-chat__scale-value";
var MINI_CHAT_PANEL_MODE_CLASS = "chzzk-chat-ui-toggle-mini-chat__mode";
var MINI_CHAT_PANEL_INPUT_ONLY_CLASS = "chzzk-chat-ui-toggle-mini-chat__input-only";
var MINI_CHAT_PANEL_MINIMIZE_CLASS = "chzzk-chat-ui-toggle-mini-chat__minimize";
var MINI_CHAT_PANEL_CLOSE_CLASS = "chzzk-chat-ui-toggle-mini-chat__close";
var MINI_CHAT_PANEL_RESIZE_CLASS = "chzzk-chat-ui-toggle-mini-chat__resize";
var MINI_CHAT_BUBBLE_ID = "chzzk-chat-ui-toggle-mini-chat-bubble";
var MINI_CHAT_BUBBLE_ICON_CLASS = "chzzk-chat-ui-toggle-mini-chat-bubble__icon";
var GUEST_CHAT_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-host";
var GUEST_CHAT_CONTROL_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-control-host";
var GUEST_CHAT_THEME_ATTR = "data-chzzk-chat-ui-toggle-guest-theme";
var GUEST_CHAT_EMBED_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-embed";
var GUEST_CHAT_CLEANBOT_DEFAULT_ATTR = "data-chzzk-chat-ui-toggle-guest-cleanbot-default";
var MINI_CHAT_EMBED_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-embed";
var MINI_CHAT_HIDDEN_CONTROL_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-hidden-control";
var NON_CHAT_PANEL_ATTR = "data-chzzk-chat-ui-toggle-non-chat-panel";
var MINI_CHAT_COMPACT_INPUT_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-compact-input";
var MINI_CHAT_INPUT_ONLY_PATH_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-path";
var MINI_CHAT_INPUT_ONLY_KEEP_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-keep";
var MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-hidden";
var MINI_CHAT_FULLSCREEN_HOST_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-fullscreen-host";
var LIVE_CHAT_FRAME_ATTR = "data-chzzk-chat-ui-toggle-live-chat-frame";
var GUEST_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleGuest";
var MINI_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleMini";
var GUEST_CHAT_CLEANBOT_STORAGE_KEY = "cleanbot";
var GUEST_CHAT_CLEANBOT_DISABLED_VALUE = "false";
var MINI_CHAT_MIN_WIDTH = 280;
var MINI_CHAT_MIN_HEIGHT = 28;
var MINI_CHAT_INPUT_ONLY_HEIGHT = 116;
var MINI_CHAT_INPUT_ONLY_BOX_HEIGHT = 52;
var MINI_CHAT_INPUT_ONLY_FIELD_MAX_HEIGHT = 36;
var MINI_CHAT_INPUT_ONLY_CONTROL_INSET = 24;
var MINI_CHAT_BUBBLE_SIZE = 44;
var MINI_CHAT_MAX_WIDTH = 720;
var MINI_CHAT_MAX_HEIGHT = 900;
var MINI_CHAT_DEFAULT_WIDTH = 360;
var MINI_CHAT_DEFAULT_HEIGHT = 520;
var MINI_CHAT_VIEWPORT_MARGIN = 8;
var MINI_CHAT_SCALE_MIN = 50;
var MINI_CHAT_SCALE_MAX = 150;
var MINI_CHAT_SCALE_STEP = 10;
var MINI_CHAT_SCALE_DEFAULT = 100;
var CHAT_FONT_SIZE_PT_MIN = 8;
var CHAT_FONT_SIZE_PT_MAX = 36;
var CHAT_FONT_SIZE_PT_DEFAULT = 13;
var GUEST_CHAT_NATIVE_THEME_CLASSES = ["light", "dark", "theme_light", "theme_dark"];
var GUEST_CHAT_TOGGLE_BUTTON_ID = "chzzk-chat-ui-toggle-guest-chat-toggle";
var GUEST_CHAT_TOGGLE_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-guest-chat-toggle__icon";
var GUEST_CHAT_TOGGLE_BUTTON_SLASH_CLASS = "chzzk-chat-ui-toggle-guest-chat-toggle__slash";
var HEADER_SETTINGS_BUTTON_ID = "chzzk-chat-ui-toggle-header-settings";
var HEADER_SETTINGS_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-header-settings__icon";
var LIVE_CHANNEL_ID_PATTERN = /^[0-9a-f]{32}$/i;
var FULLSCREEN_UNSUPPORTED_MINI_CHAT_HOST_TAG_NAMES = new Set(["VIDEO", "AUDIO", "CANVAS", "IFRAME", "IMG"]);

var DEFAULT_OPTIONS = {
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
  useNicknameColorForMessage: false,
  chatBoxColor: "#808080"
};

var DATASET_KEYS = {
  showNicknames: "chzzkChatUiToggleNicknames",
  showBadges: "chzzkChatUiToggleBadges",
  showTimestamps: "chzzkChatUiToggleTimestamps",
  showNonChatPanels: "chzzkChatUiToggleNonChatPanels",
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
  showBoldText: "chzzkChatUiToggleBoldText",
  useNicknameColorForMessage: "chzzkChatUiToggleNicknameColorMessage"
};

var NAMED_CHAT_BOX_COLORS = {
  gray: "#808080",
  green: "#00c471",
  blue: "#4b8bff",
  purple: "#8b5cf6",
  yellow: "#f5bd23"
};

var CHAT_ROOT_SELECTORS = [
  "[class*='live_chatting' i]",
  "[class*='chatting_area' i]",
  "[class*='chatting_list' i]",
  "[class*='chat_list' i]",
  "[class*='chat_area' i]",
  "[role='log']",
  "[aria-live]"
];

var CHAT_ROW_SELECTORS = [
  "[class*='live_chatting_list_item' i]",
  "[role='log'] [class*='_item_' i]:has([class*='_chatting_message_' i])",
  "[class*='_item_' i]:has([class*='_chatting_message_' i])"
];

var CHAT_HEADER_SELECTORS = [
  "[class*='live_chatting_header_menu' i]",
  "[class*='live_chatting_header_wrapper' i]",
  "[class*='live_chatting_header_container' i]"
];

var CHAT_HEADER_ACTION_BUTTON_SELECTORS = [
  "button",
  "[role='button']",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])"
];

var CHAT_ACTION_HOST_SELECTORS = [
  "aside#aside-chatting",
  "[class*='live_chatting_header_container' i]",
  "[class*='live_chatting' i]",
  "[class*='chatting_area' i]",
  "[class*='chat_area' i]",
  "aside:has([role='log'])"
];

var MINI_CHAT_INPUT_CONTAINER_SELECTORS = [
  "[class*='live_chatting_input_container' i]",
  "[class*='chatting_input_container' i]",
  "[class*='live_chatting_input' i]",
  "[class*='chatting_input' i]"
];

var NON_CHAT_PANEL_SELECTORS = [
  "[class*='live_chatting_ranking_container' i]",
  "aside#aside-chatting > :has([class*='ranking' i])",
  "[class*='_fixed_' i]:has(button)",
  "section:has([aria-controls*='broadcast-information-sports' i])",
  "[aria-controls*='broadcast-information-sports' i]",
  "button:has([class*='title_text' i])",
  "[class*='status_text' i]"
];

var PAGE_THEME_BACKGROUND_SELECTORS = [
  "[class*='gnb' i]",
  "[class*='header' i]",
  "[class*='navigation' i]",
  "[class*='live_container' i]",
  "[class*='live_content' i]",
  "[class*='live_detail' i]",
  "[class*='content' i]",
  "main"
];

var CHAT_THEME_CHROME_SELECTORS = [
  `[${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]`,
  "[class*='live_chatting_header_container' i]",
  "[class*='live_chatting_header_wrapper' i]",
  "[class*='live_chatting_header' i]",
  "[class*='chatting_header' i]"
];

var CHAT_THEME_FOREGROUND_SELECTORS = [
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

var TARGET_SELECTORS = {
  nickname: [
    "[data-testid*='nickname' i]",
    "[aria-label*='닉네임' i]",
    "[class*='nickname' i]",
    "[class*='live_chatting_username' i]",
    "button[class*='live_chatting_message_nickname' i] [class*='name_text' i]",
    "button[class*='live_chatting_message_nickname' i] [class*='_text_' i]",
    "button[class*='nickname' i] [class*='_text_' i]"
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

var currentOptions = { ...DEFAULT_OPTIONS };
var scanTimer = 0;
var uiSyncTimer = 0;
var optionsLoadTimer = 0;
var scanIntervalTimer = 0;
var isScanning = false;
var observer = null;
var lastFullCleanupAt = 0;
var messagesConnected = false;
var storageListenerConnected = false;
var themeSyncTimer = 0;
var largeTextLayoutFrame = 0;
var lastOptionsSource = "default";
var lastOptionsLoadError = "";
var currentGuestChatTheme = null;
var lastPublishedGuestChatThemeKey = "";
var lastPublishedGuestChatThemeAt = 0;
var nativeGuestChatThemeRetryTimers = [];
var miniChatDragState = null;
var miniChatResizeState = null;
var miniChatBubbleDragState = null;
var miniChatBubbleIgnoreNextClick = false;
var miniChatMinimized = false;
var miniChatBubbleBounds = null;
var miniChatRestoreBounds = null;
var miniChatBoundsSaveTimer = 0;
var miniChatInputOnlyScrollFrame = 0;
