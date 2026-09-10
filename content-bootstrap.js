var SCRIPT_VERSION = "0.8.0";
var GLOBAL_KEY = `__chzzkChatUiToggleLoaded_${SCRIPT_VERSION}`;
var CHZZK_CHAT_UI_TOGGLE_SHOULD_START = !window[GLOBAL_KEY];

var STORAGE_KEY = "chzzkChatUiToggleOptions";
var ROLE_ATTR = "data-chzzk-chat-ui-toggle-role";
var CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-chat-row";
var NATIVE_CHAT_ROW_SELECTOR = `:is([class*="live_chatting_list_item" i], [role="log"] [class*="_item_" i]):has(:is([class*="live_chatting_message_container" i], [class*="_chatting_message_" i]))`;
var CHAT_ROW_SCOPE_SELECTOR = `:is([class*="live_chatting_list_item" i], [role="log"] [class*="_item_" i])[${CHAT_ROW_ATTR}="true"]`;
var CACHE_KEY = "chzzkChatUiToggleOptionsCache";
var READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
var UPDATE_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_UPDATE_OPTIONS";
var OPEN_POPUP_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_OPEN_POPUP";
var READ_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_GUEST_CHAT_THEME";
var SET_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_SET_GUEST_CHAT_THEME";
var APPLY_GUEST_CHAT_THEME_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_APPLY_GUEST_CHAT_THEME";
var CHZZK_ORIGIN = "https://chzzk.naver.com";
var STORAGE_READ_TIMEOUT_MS = 700;
var OPTIONS_LOAD_RETRY_MS = 250;
var OPTIONS_LOAD_MAX_ATTEMPTS = 20;
var SCAN_DELAY_MS = 50;
var SCAN_MIN_INTERVAL_MS = 1000;
var SCAN_INTERVAL_MS = 5000;
var MINI_CHAT_SCAN_INTERVAL_MS = 30000;
var FULL_CLEANUP_INTERVAL_MS = 10000;
var UI_SYNC_DELAY_MS = 100;
var THEME_SYNC_INTERVAL_MS = 3000;
var GENERATED_TIMESTAMP_ATTR = "data-chzzk-chat-ui-toggle-generated-timestamp";
var MESSAGE_PREFIX_ATTR = "data-chzzk-chat-ui-toggle-prefix";
var MESSAGE_TEXT_ATTR = "data-chzzk-chat-ui-toggle-message-text";
var NICKNAME_COLOR_MESSAGE_ATTR = "data-chzzk-chat-ui-toggle-nickname-color-message";
var AUTO_CONTRAST_ATTR = "data-chzzk-chat-ui-toggle-auto-contrast";
var GUEST_CHAT_FRAME_CONTAINER_ID = "chzzk-chat-ui-toggle-guest-chat-frame-container";
var GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";
var MINI_CHAT_PANEL_ID = "chzzk-chat-ui-toggle-mini-chat-panel";
var MINI_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-mini-chat-frame";
var MINI_CHAT_BUTTON_ID = "chzzk-chat-ui-toggle-mini-chat-button";
var MINI_CHAT_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-mini-chat-button__icon";
var MINI_CHAT_PANEL_CONTROLS_CLASS = "chzzk-chat-ui-toggle-mini-chat__controls";
var MINI_CHAT_PANEL_DRAG_HANDLE_CLASS = "chzzk-chat-ui-toggle-mini-chat__drag-handle";
var MINI_CHAT_PANEL_ACTIONS_CLASS = "chzzk-chat-ui-toggle-mini-chat__actions";
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
var LOCAL_ONLY_CHAT_ACTIVE_ATTR = "data-chzzk-chat-ui-toggle-local-only-chat";
var LOCAL_ONLY_CHAT_FIELD_ATTR = "data-chzzk-chat-ui-toggle-local-only-field";
var LOCAL_ONLY_CHAT_ORIGINAL_FIELD_ATTR = "data-chzzk-chat-ui-toggle-local-only-original-field";
var LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR = "data-chzzk-chat-ui-toggle-local-only-send-button";
var LOCAL_ONLY_CHAT_ORIGINAL_SEND_BUTTON_ATTR = "data-chzzk-chat-ui-toggle-local-only-original-send-button";
var LOCAL_ONLY_CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-local-only-row";
var LOCAL_ONLY_CHAT_MESSAGE_ID_ATTR = "data-chzzk-chat-ui-toggle-local-only-message-id";
var MINI_CHAT_EMBED_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-embed";
var MINI_CHAT_HIDDEN_CONTROL_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-hidden-control";
var MINI_CHAT_TRANSPARENT_SURFACE_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-transparent-surface";
var NON_CHAT_PANEL_ATTR = "data-chzzk-chat-ui-toggle-non-chat-panel";
var MINI_CHAT_COMPACT_INPUT_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-compact-input";
var MINI_CHAT_INPUT_ONLY_PATH_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-path";
var MINI_CHAT_INPUT_ONLY_KEEP_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-keep";
var MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-hidden";
var MINI_CHAT_INPUT_ONLY_LAYOUT_HIDDEN_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-input-only-layout-hidden";
var MINI_CHAT_FULLSCREEN_HOST_ATTR = "data-chzzk-chat-ui-toggle-mini-chat-fullscreen-host";
var LIVE_CHAT_FRAME_ATTR = "data-chzzk-chat-ui-toggle-live-chat-frame";
var GUEST_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleGuest";
var MINI_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleMini";
var GUEST_CHAT_CLEANBOT_STORAGE_KEY = "cleanbot";
var GUEST_CHAT_CLEANBOT_DISABLED_VALUE = "false";
var LOCAL_ONLY_CHAT_PLACEHOLDER = "나만 보는 채팅, 실제로 전송되지 않음";
var LOCAL_ONLY_CHAT_MAX_MESSAGE_LENGTH = 200;
var LOCAL_ONLY_CHAT_MAX_MESSAGES = 100;
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
var CHAT_TEXT_COLOR_DEFAULT = "#101418";
var CHAT_BOX_OPACITY_MIN = 0;
var CHAT_BOX_OPACITY_MAX = 100;
var CHAT_BOX_OPACITY_DEFAULT = 100;
var CHAT_BOX_HOVER_ALPHA_BONUS = 0.08;
var CHAT_BOX_COLOR_DEFAULT_REVISION = 2;
var AUTO_CONTRAST_MIN_RATIO = 3;
var AUTO_CONTRAST_NEAR_COLOR_DISTANCE = 96;
var AUTO_CONTRAST_NEUTRAL_CHANNEL_DELTA = 32;
var AUTO_CONTRAST_CACHE_LIMIT = 180;
var AUTO_CONTRAST_ACCENT_COLORS = [
  "#312e81",
  "#bef264",
  "#2563eb",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#d97706",
  "#16a34a",
  "#38bdf8",
  "#f59e0b",
  "#22c55e",
  "#a78bfa"
];
var GUEST_CHAT_NATIVE_THEME_CLASSES = ["light", "dark", "theme_light", "theme_dark"];
var GUEST_CHAT_TOGGLE_BUTTON_ID = "chzzk-chat-ui-toggle-guest-chat-toggle";
var GUEST_CHAT_TOGGLE_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-guest-chat-toggle__icon";
var GUEST_CHAT_TOGGLE_BUTTON_SLASH_CLASS = "chzzk-chat-ui-toggle-guest-chat-toggle__slash";
var HEADER_SETTINGS_BUTTON_ID = "chzzk-chat-ui-toggle-header-settings";
var HEADER_SETTINGS_BUTTON_ICON_CLASS = "chzzk-chat-ui-toggle-header-settings__icon";
var AUDIO_COMPRESSOR_STATE_DATASET_KEY = "chzzkChatUiToggleAudioCompressorState";
var LIVE_CHANNEL_ID_PATTERN = /^[0-9a-f]{32}$/i;
var FULLSCREEN_UNSUPPORTED_MINI_CHAT_HOST_TAG_NAMES = new Set(["VIDEO", "AUDIO", "CANVAS", "IFRAME", "IMG"]);

var DEFAULT_OPTIONS = {
  showNicknames: true,
  useRandomNicknames: false,
  randomNicknameMode: "random",
  randomNicknamePrefix: "시청자",
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
  useAutoTextContrast: true,
  useChatTextColor: false,
  chatTextColor: CHAT_TEXT_COLOR_DEFAULT,
  useNicknameColorForMessage: false,
  chatBoxColor: "#dfdfdf",
  chatBoxColorDefaultRevision: CHAT_BOX_COLOR_DEFAULT_REVISION,
  chatBoxOpacity: CHAT_BOX_OPACITY_DEFAULT,
  useAudioCompressor: false,
  audioCompressorThreshold: -50,
  audioCompressorKnee: 40,
  audioCompressorRatio: 12,
  audioCompressorAttack: 0,
  audioCompressorRelease: 0.25,
  audioCompressorGain: 1
};

var DATASET_KEYS = {
  showNicknames: "chzzkChatUiToggleNicknames",
  useRandomNicknames: "chzzkChatUiToggleRandomNicknames",
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
  useAutoTextContrast: "chzzkChatUiToggleAutoTextContrast",
  useChatTextColor: "chzzkChatUiToggleChatTextColor",
  useNicknameColorForMessage: "chzzkChatUiToggleNicknameColorMessage",
  useAudioCompressor: "chzzkChatUiToggleAudioCompressor"
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

var LOCAL_ONLY_CHAT_INPUT_FIELD_SELECTORS = [
  "aside#aside-chatting textarea",
  "aside#aside-chatting [contenteditable='true']",
  "aside#aside-chatting [role='textbox']",
  "aside:has([role='log']) textarea",
  "aside:has([role='log']) [contenteditable='true']",
  "aside:has([role='log']) [role='textbox']"
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
var lastScanAt = 0;
var uiSyncTimer = 0;
var optionsLoadTimer = 0;
var optionsLoadGeneration = 0;
var optionsStateRevision = 0;
var scanIntervalTimer = 0;
var scanIntervalDelayMs = 0;
var isScanning = false;
var observer = null;
var lastFullCleanupAt = 0;
var messagesConnected = false;
var storageListenerConnected = false;
var themeSyncTimer = 0;
var largeTextLayoutFrame = 0;
var largeTextLayoutRows = new Set();
var largeTextLayoutSyncAll = false;
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
var localOnlyChatInterceptionConnected = false;
var localOnlyChatCredentiallessVerificationStarted = false;
var localOnlyChatCredentiallessVerified = false;
var localOnlyChatAllowLineBreakUntil = 0;
var localOnlyChatIsComposing = false;
var localOnlyChatImeSubmitPending = false;
var localOnlyChatEnterHandledUntilKeyup = false;
var localOnlyChatMessageSequence = 0;
var localOnlyChatMessages = [];
var localOnlyChatRowTemplate = null;
var localOnlyChatNativeTimelineInitialized = false;
var localOnlyChatNativeTimelineBaselineWasEmpty = false;
var localOnlyChatNativeTimelinePlacementSuspended = false;
var localOnlyChatNativeTimelineSnapshot = [];
var localOnlyChatNativeTimelineRowsSnapshot = [];
var localOnlyChatSuspendedTimelinePlacementAvailable = false;
var localOnlyChatSuspendedTimelineSnapshot = [];
var localOnlyChatSuspendedTimelineRowsSnapshot = [];
var localOnlyChatOriginalFieldStates = new WeakMap();
var localOnlyChatOriginalSendButtonStates = new WeakMap();
var audioCompressorState = {
  context: null,
  compressor: null,
  gain: null,
  video: null,
  source: null,
  sources: new WeakMap(),
  graphMode: "off",
  syncTimer: 0,
  resumeListenerConnected: false,
  lastError: ""
};
