const STORAGE_KEY = "chzzkChatUiToggleOptions";
const PRESET_STORAGE_KEY = "chzzkChatUiToggleCustomPreset";
const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
const UPDATE_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_UPDATE_OPTIONS";
const CONTENT_VERSION = "0.8.4";
const POPUP_THEME_FALLBACK = "light";

const DEFAULT_CHAT_BOX_COLOR = "#dfdfdf";
const CHAT_BOX_COLOR_DEFAULT_REVISION = 2;
const DEFAULT_CHAT_TEXT_COLOR = "#101418";
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
const CHAT_BOX_OPACITY_MIN = 0;
const CHAT_BOX_OPACITY_MAX = 100;
const CHAT_BOX_OPACITY_DEFAULT = 100;
const CHAT_BOX_HOVER_ALPHA_BONUS = 0.08;

const COLOR_CHIPS = [
  { id: "gray", hex: "#dfdfdf" },
  { id: "green", hex: "#00c471" },
  { id: "blue", hex: "#4b8bff" },
  { id: "purple", hex: "#8b5cf6" },
  { id: "yellow", hex: "#f5bd23" },
  { id: "white", hex: "#eef2f7" },
  { id: "dark", hex: "#101418" }
];

const PREVIEW_NICKNAME_COLORS = ["#00c471", "#4b8bff", "#e85d8f"];

const NAMED_CHAT_BOX_COLORS = {
  gray: "#808080",
  green: "#00c471",
  blue: "#4b8bff",
  purple: "#8b5cf6",
  yellow: "#f5bd23"
};

const DEFAULT_OPTIONS = {
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
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR,
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

const PRESET_DEFINITIONS = {
  default: {
    showNonChatPanels: false,
    useAutoTextContrast: true
  },
  clean: {
    showNicknames: false,
    showBadges: false,
    showTimestamps: false,
    showNonChatPanels: false,
    showChatBoxes: true,
    showBoldText: true,
    useAutoTextContrast: true
  },
  minimal: {
    showBadges: false,
    showTimestamps: false,
    showNonChatPanels: false,
    showChatBoxes: false,
    showLargeText: false,
    useAutoTextContrast: true,
    useChatTextColor: false,
    useNicknameColorForMessage: false
  }
};

const AUDIO_COMPRESSOR_PRESETS = {
  natural: {
    label: "자연스럽게",
    audioCompressorThreshold: -24,
    audioCompressorKnee: 20,
    audioCompressorRatio: 3,
    audioCompressorAttack: 0.02,
    audioCompressorRelease: 0.25
  },
  balanced: {
    label: "균형",
    audioCompressorThreshold: -30,
    audioCompressorKnee: 30,
    audioCompressorRatio: 4,
    audioCompressorAttack: 0.01,
    audioCompressorRelease: 0.25
  },
  strong: {
    label: "강하게",
    audioCompressorThreshold: -50,
    audioCompressorKnee: 40,
    audioCompressorRatio: 12,
    audioCompressorAttack: 0,
    audioCompressorRelease: 0.25
  }
};
const AUDIO_COMPRESSOR_PRESET_OPTION_KEYS = [
  "audioCompressorThreshold",
  "audioCompressorKnee",
  "audioCompressorRatio",
  "audioCompressorAttack",
  "audioCompressorRelease"
];

const PRESET_EXCLUDED_OPTION_KEYS = new Set([
  "useRandomNicknames",
  "randomNicknameMode",
  "randomNicknamePrefix",
  "useGuestChatFrame",
  "useMiniFloatingChat",
  "miniFloatingChatFullscreenOnly",
  "useAudioCompressor",
  "audioCompressorThreshold",
  "audioCompressorKnee",
  "audioCompressorRatio",
  "audioCompressorAttack",
  "audioCompressorRelease",
  "audioCompressorGain"
]);

const app = document.getElementById("app");
const statusDot = document.getElementById("statusDot");
const statusLabel = document.getElementById("statusLabel");
const chatPreview = document.getElementById("chatPreview");
const previewModeLabel = document.getElementById("previewModeLabel");
const presetRow = document.getElementById("presetRow");
const customPresetButton = document.getElementById("customPresetButton");
const saveCustomPresetButton = document.getElementById("saveCustomPresetButton");
const menuButton = document.getElementById("menuButton");
const appMenu = document.getElementById("appMenu");
const resetDefaultsButton = document.getElementById("resetDefaultsButton");
const boxColorChips = document.getElementById("boxColorChips");
const textColorChips = document.getElementById("textColorChips");
const nicknameColorRow = document.getElementById("nicknameColorRow");
const nicknameColorOption = document.getElementById("useNicknameColorForMessage");
const chatBoxOpacityValue = document.getElementById("chatBoxOpacityValue");
const chatFontSizeValue = document.getElementById("chatFontSizePtValue");
const nicknameFontSizeValue = document.getElementById("nicknameFontSizePtValue");
const audioCompressorGainValue = document.getElementById("audioCompressorGainValue");
const audioCompressorThresholdValue = document.getElementById("audioCompressorThresholdValue");
const audioCompressorKneeValue = document.getElementById("audioCompressorKneeValue");
const audioCompressorRatioValue = document.getElementById("audioCompressorRatioValue");
const audioCompressorAttackValue = document.getElementById("audioCompressorAttackValue");
const audioCompressorReleaseValue = document.getElementById("audioCompressorReleaseValue");
const audioPresetStatus = document.getElementById("audioPresetStatus");
const audioPresetButtons = [...document.querySelectorAll("[data-audio-preset]")];
const audioResetButton = document.getElementById("audioResetButton");
const colorPickerTitle = document.getElementById("colorPickerTitle");
const colorPickerSwatch = document.getElementById("colorPickerSwatch");
const colorPickerHex = document.getElementById("chatTextColorHex");
const colorPickerField = document.getElementById("colorPickerField");
const colorPickerHandle = document.getElementById("colorPickerHandle");
const colorPickerHue = document.getElementById("colorPickerHue");
const colorPickerReset = document.getElementById("colorPickerReset");

const views = [...document.querySelectorAll("[data-view]")];
const optionInputs = [...document.querySelectorAll("[data-option]")];
const sectionToggleInputs = [...document.querySelectorAll("[data-section-toggle]")];
const SECTION_OPTION_KEYS = Object.fromEntries(sectionToggleInputs.map((input) => [
  input.dataset.sectionToggle,
  [...document.querySelectorAll(`[data-view="${input.dataset.sectionToggle}"] input[type="checkbox"][data-option]`)]
    .map((option) => option.dataset.option)
]));
const chatModeRadios = [...document.querySelectorAll('input[name="chatMode"]')];

let currentOptions = normalizeOptions(DEFAULT_OPTIONS);
let activePreset = "default";
let activeView = "home";
let colorPickerTarget = null;
let colorPickerHsv = { hue: 0, saturation: 0, value: 0.5 };
let commitTimer = 0;
let pendingCommitSnapshot = null;
let latestCommitSnapshot = normalizeOptions(DEFAULT_OPTIONS);
let lastCommittedPopupSnapshot = normalizeOptions(DEFAULT_OPTIONS);
let commitQueue = [];
let commitInFlight = false;
let optionsDirty = false;
let popupIsClosing = false;
let returnViewAfterColor = "style";
let customPresetSnapshot = null;

function clampNumber(value, min, max, fallback) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, number));
}

function normalizeHexColor(value, fallback = DEFAULT_CHAT_BOX_COLOR) {
  if (typeof value !== "string") {
    return fallback;
  }

  const mappedValue = Object.prototype.hasOwnProperty.call(NAMED_CHAT_BOX_COLORS, value)
    ? NAMED_CHAT_BOX_COLORS[value]
    : value;
  if (typeof mappedValue !== "string") {
    return fallback;
  }

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

function normalizeOptionalCoordinate(value) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    return null;
  }

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
    width: clampNumber(bounds?.width, MINI_CHAT_MIN_WIDTH, MINI_CHAT_MAX_WIDTH, MINI_CHAT_DEFAULT_WIDTH),
    height: clampNumber(bounds?.height, minHeight, MINI_CHAT_MAX_HEIGHT, fallbackHeight)
  };
}

function normalizeOptionalMiniChatBounds(bounds) {
  if (!bounds || typeof bounds !== "object") {
    return null;
  }

  return normalizeMiniChatBounds(bounds);
}

function normalizeMiniChatScale(value) {
  const clampedScale = clampNumber(value, MINI_CHAT_SCALE_MIN, MINI_CHAT_SCALE_MAX, MINI_CHAT_SCALE_DEFAULT);
  const steppedScale = Math.round(clampedScale / MINI_CHAT_SCALE_STEP) * MINI_CHAT_SCALE_STEP;

  return clampNumber(steppedScale, MINI_CHAT_SCALE_MIN, MINI_CHAT_SCALE_MAX, MINI_CHAT_SCALE_DEFAULT);
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

function normalizeChatBoxOpacity(value) {
  return Math.round(clampNumber(
    value,
    CHAT_BOX_OPACITY_MIN,
    CHAT_BOX_OPACITY_MAX,
    CHAT_BOX_OPACITY_DEFAULT
  ));
}

function normalizeOptions(options) {
  const legacyBoldText = options?.showBoldText === undefined && options?.showLargeText === true;
  const miniFloatingChatInputOnly = options?.miniFloatingChatInputOnly === true;
  const useChatTextColor = options?.useChatTextColor === true;
  const normalizedChatBoxColor = normalizeHexColor(options?.chatBoxColor, DEFAULT_CHAT_BOX_COLOR);
  const chatBoxColor =
    Number(options?.chatBoxColorDefaultRevision) >= CHAT_BOX_COLOR_DEFAULT_REVISION ||
    normalizedChatBoxColor !== "#808080"
      ? normalizedChatBoxColor
      : DEFAULT_CHAT_BOX_COLOR;
  const showNonChatPanels =
    options?.showNonChatPanels !== undefined
      ? options.showNonChatPanels !== false
      : options?.showDonationRanking !== false;

  return {
    showNicknames: options?.showNicknames !== false,
    useRandomNicknames: options?.useRandomNicknames === true,
    randomNicknameMode: options?.randomNicknameMode === "custom" ? "custom" : "random",
    randomNicknamePrefix: typeof options?.randomNicknamePrefix === "string"
      ? Array.from(options.randomNicknamePrefix.replace(/[\u0000-\u001f\u007f]/g, "").trim()).slice(0, 20).join("") || "시청자"
      : "시청자",
    showBadges: options?.showBadges !== false,
    showTimestamps: options?.showTimestamps !== false,
    showNonChatPanels,
    showChatBoxes: options?.showChatBoxes !== false,
    useGuestChatFrame: options?.useGuestChatFrame === true && supportsGuestChatFrame(),
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
    useAutoTextContrast: options?.useAutoTextContrast !== false,
    useChatTextColor,
    chatTextColor: normalizeHexColor(options?.chatTextColor, DEFAULT_CHAT_TEXT_COLOR),
    useNicknameColorForMessage: useChatTextColor && options?.useNicknameColorForMessage === true,
    chatBoxColor,
    chatBoxColorDefaultRevision: CHAT_BOX_COLOR_DEFAULT_REVISION,
    chatBoxOpacity: normalizeChatBoxOpacity(options?.chatBoxOpacity),
    useAudioCompressor: options?.useAudioCompressor === true,
    audioCompressorThreshold: clampNumber(options?.audioCompressorThreshold, -100, 0, -50),
    audioCompressorKnee: clampNumber(options?.audioCompressorKnee, 0, 40, 40),
    audioCompressorRatio: clampNumber(options?.audioCompressorRatio, 1, 20, 12),
    audioCompressorAttack: clampNumber(options?.audioCompressorAttack, 0, 1, 0),
    audioCompressorRelease: clampNumber(options?.audioCompressorRelease, 0, 1, 0.25),
    audioCompressorGain: clampNumber(options?.audioCompressorGain, 0, 2, 1)
  };
}

function hexToRgb(hexColor) {
  const hex = normalizeHexColor(hexColor).slice(1);

  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16)
  };
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

function supportsGuestChatFrame() {
  return typeof HTMLIFrameElement !== "undefined" && "credentialless" in HTMLIFrameElement.prototype;
}

function getChatMode(options = currentOptions) {
  if (options.useGuestChatFrame) {
    return "guest";
  }

  if (options.useMiniFloatingChat) {
    return "mini";
  }

  return "default";
}

function createPresetExcludedOptionsPatch(options = currentOptions) {
  const normalized = normalizeOptions(options);

  return Object.fromEntries(
    [...PRESET_EXCLUDED_OPTION_KEYS].map((key) => [key, normalized[key]])
  );
}

function createPresetSnapshot(options) {
  const normalized = normalizeOptions(options);

  return Object.fromEntries(
    Object.keys(DEFAULT_OPTIONS)
      .filter((key) => !PRESET_EXCLUDED_OPTION_KEYS.has(key))
      .map((key) => [key, normalized[key]])
  );
}

function applyPresetSnapshot(snapshot, optionsToPreserve = currentOptions) {
  return normalizeOptions({
    ...DEFAULT_OPTIONS,
    ...snapshot,
    ...createPresetExcludedOptionsPatch(optionsToPreserve)
  });
}

function setChatMode(mode) {
  if (mode === "guest" && !supportsGuestChatFrame()) return;
  currentOptions.useGuestChatFrame = mode === "guest";
  currentOptions.useMiniFloatingChat = mode === "mini";
}

function setStatus(message, tone = "idle") {
  statusLabel.textContent = message;
  statusDot.classList.remove("is-ok", "is-warn");

  if (tone === "ok") {
    statusDot.classList.add("is-ok");
  } else if (tone === "warn") {
    statusDot.classList.add("is-warn");
  }
}

function normalizePopupTheme(value) {
  return value === "dark" ? "dark" : "light";
}

function applyPopupTheme(theme) {
  document.documentElement.dataset.popupTheme = normalizePopupTheme(theme);

  if (chatPreview) {
    syncPreview();
  }
}

async function resolvePopupThemeFromActiveTab() {
  const tab = await queryActiveTab();

  if (!tab?.id || !tab.url?.startsWith("https://chzzk.naver.com/")) {
    return POPUP_THEME_FALLBACK;
  }

  const status = await getContentStatus(tab.id);

  if (status?.detectedTheme) {
    return normalizePopupTheme(status.detectedTheme);
  }

  return POPUP_THEME_FALLBACK;
}

async function syncPopupTheme() {
  applyPopupTheme(await resolvePopupThemeFromActiveTab());
}

function navigate(viewName, { rememberColorReturn = false } = {}) {
  if (viewName !== "color-picker" && !rememberColorReturn) {
    returnViewAfterColor = viewName === "home" ? "style" : viewName;
  }

  activeView = viewName;

  for (const view of views) {
    const isActive = view.dataset.view === viewName;
    view.classList.toggle("view--active", isActive);
    view.hidden = !isActive;
  }
}

function getOptionValue(key) {
  if (key === "chatFontSizePt" || key === "nicknameFontSizePt") {
    return currentOptions[key];
  }

  return currentOptions[key];
}

function setOptionValue(key, value) {
  currentOptions[key] = value;
}

function syncNicknameColorDependencies() {
  const isChatTextColorEnabled = currentOptions.useChatTextColor === true;

  if (!isChatTextColorEnabled) {
    currentOptions.useNicknameColorForMessage = false;
  }

  if (nicknameColorOption) {
    nicknameColorOption.disabled = !isChatTextColorEnabled;
    nicknameColorOption.checked = currentOptions.useNicknameColorForMessage === true;
  }

  nicknameColorRow?.classList.toggle("is-disabled", !isChatTextColorEnabled);
}

function syncSectionToggles() {
  for (const input of sectionToggleInputs) {
    const keys = SECTION_OPTION_KEYS[input.dataset.sectionToggle];
    const count = keys.filter((key) => currentOptions[key] === true).length;
    const mixed = count > 0 && count < keys.length;
    input.checked = count === keys.length;
    input.indeterminate = mixed;
    input.setAttribute("aria-checked", mixed ? "mixed" : String(input.checked));
    const status = mixed ? "일부 켜짐" : input.checked ? "전체 켜짐" : "전체 꺼짐";
    input.title = `${status} · 누르면 전체 ${input.checked ? "끄기" : "켜기"}`;
  }
}

function detectAudioCompressorPreset(options = currentOptions) {
  for (const [presetId, preset] of Object.entries(AUDIO_COMPRESSOR_PRESETS)) {
    const matches = AUDIO_COMPRESSOR_PRESET_OPTION_KEYS.every(
      (key) => Math.abs(Number(options[key]) - Number(preset[key])) < 0.0001
    );

    if (matches) {
      return presetId;
    }
  }

  return "custom";
}

function syncAudioCompressorPresetButtons() {
  const activeAudioPreset = detectAudioCompressorPreset();

  for (const button of audioPresetButtons) {
    const isActive = button.dataset.audioPreset === activeAudioPreset;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  audioPresetStatus.textContent =
    AUDIO_COMPRESSOR_PRESETS[activeAudioPreset]?.label || "사용자 설정";
}

function applyAudioCompressorPreset(presetId) {
  const preset = AUDIO_COMPRESSOR_PRESETS[presetId];

  if (!preset) {
    return;
  }

  for (const key of AUDIO_COMPRESSOR_PRESET_OPTION_KEYS) {
    currentOptions[key] = preset[key];
  }

  syncControlsFromOptions();
  scheduleCommit({ immediate: true });
}

function resetAudioCompressorOptions() {
  for (const key of AUDIO_COMPRESSOR_PRESET_OPTION_KEYS) {
    currentOptions[key] = DEFAULT_OPTIONS[key];
  }

  currentOptions.audioCompressorGain = DEFAULT_OPTIONS.audioCompressorGain;
  syncControlsFromOptions();
  scheduleCommit({ immediate: true });
}

function syncConditionalBlocks() {
  document.getElementById("customNicknameSettings").hidden = currentOptions.randomNicknameMode !== "custom";
  for (const block of document.querySelectorAll("[data-when]")) {
    const key = block.dataset.when;
    const enabled = currentOptions[key] === true;
    block.classList.toggle("is-visible", enabled);
  }

  const chatMode = getChatMode();

  for (const block of document.querySelectorAll("[data-when-chat-mode]")) {
    block.classList.toggle("is-visible", block.dataset.whenChatMode === chatMode);
  }
}

function syncControlsFromOptions() {
  for (const input of optionInputs) {
    const key = input.dataset.option;

    if (!key) {
      continue;
    }

    if (input.type === "checkbox") {
      input.checked = currentOptions[key] === true;
      continue;
    }

    if (input.type === "range" || key === "randomNicknameMode" || key === "randomNicknamePrefix") {
      input.value = String(currentOptions[key]);
    }
  }

  for (const radio of chatModeRadios) {
    radio.checked = radio.value === getChatMode();
  }

  chatFontSizeValue.textContent = `${currentOptions.chatFontSizePt}pt`;
  const guestSupported = supportsGuestChatFrame();
  const guestMode = document.getElementById("useGuestChatFrame");
  guestMode.disabled = !guestSupported;
  guestMode.closest(".mode-card").classList.toggle("is-disabled", !guestSupported);
  document.getElementById("guestChatModeHint").textContent = guestSupported
    ? "원래 입력창 그대로 · 실제 전송되지 않음"
    : "이 브라우저에서는 지원되지 않습니다";
  const guestButtonOption = document.querySelector('[data-option="showGuestChatToggleButton"]');
  guestButtonOption.disabled = !guestSupported;
  guestButtonOption.closest(".setting-row").hidden = !guestSupported;

  nicknameFontSizeValue.textContent = `${currentOptions.nicknameFontSizePt}pt`;
  chatBoxOpacityValue.textContent = `${currentOptions.chatBoxOpacity}%`;
  audioCompressorGainValue.textContent = `${Math.round(currentOptions.audioCompressorGain * 100)}%`;
  audioCompressorThresholdValue.textContent = `${currentOptions.audioCompressorThreshold}dB`;
  audioCompressorKneeValue.textContent = `${currentOptions.audioCompressorKnee}dB`;
  audioCompressorRatioValue.textContent = `${currentOptions.audioCompressorRatio}:1`;
  audioCompressorAttackValue.textContent = `${currentOptions.audioCompressorAttack}s`;
  audioCompressorReleaseValue.textContent = `${currentOptions.audioCompressorRelease}s`;
  syncNicknameColorDependencies();
  syncConditionalBlocks();
  syncAudioCompressorPresetButtons();
  renderColorChips();
  syncPresetButtons();
  syncSectionToggles();
}

function syncPreview() {
  chatPreview.dataset.showNicknames = currentOptions.showNicknames ? "on" : "off";
  chatPreview.dataset.showBadges = currentOptions.showBadges ? "on" : "off";
  chatPreview.dataset.showTimestamps = currentOptions.showTimestamps ? "on" : "off";
  chatPreview.dataset.showBoxes = currentOptions.showChatBoxes ? "on" : "off";

  const fontSize = currentOptions.showLargeText
    ? currentOptions.chatFontSizePt
    : CHAT_FONT_SIZE_PT_DEFAULT;
  const nicknameFontSize = currentOptions.showLargeText && currentOptions.useNicknameFontSize
    ? currentOptions.nicknameFontSizePt
    : fontSize;
  chatPreview.style.setProperty("--preview-font", `${fontSize}px`);
  chatPreview.style.setProperty("--preview-nickname-font", `${nicknameFontSize}px`);
  chatPreview.style.setProperty("--preview-weight", currentOptions.showBoldText ? "700" : "400");
  chatPreview.style.setProperty(
    "--preview-box",
    currentOptions.showChatBoxes
      ? getChatBoxBackgroundColor(
        currentOptions.chatBoxColor,
        currentOptions.chatBoxOpacity
      )
      : "transparent"
  );

  const useCustomTextColor = currentOptions.useChatTextColor === true;
  const useNicknameMessageColor =
    useCustomTextColor && currentOptions.useNicknameColorForMessage === true;
  const customTextColor = currentOptions.chatTextColor;

  if (useCustomTextColor && !useNicknameMessageColor) {
    chatPreview.style.setProperty("--preview-text", customTextColor);
  } else {
    chatPreview.style.removeProperty("--preview-text");
  }

  const previewRows = chatPreview.querySelectorAll(".preview-row");

  previewRows.forEach((row, index) => {
    const nickColor = PREVIEW_NICKNAME_COLORS[index % PREVIEW_NICKNAME_COLORS.length];
    const nick = row.querySelector("[data-preview-nick]");
    const text = row.querySelector("[data-preview-text]");

    if (nick) {
      nick.dataset.originalName ??= nick.textContent;
      nick.textContent = currentOptions.useRandomNicknames
        ? (currentOptions.randomNicknameMode === "custom"
          ? `${currentOptions.randomNicknamePrefix} ${index + 1}`
          : ["초록 여우 1", "하늘 수달 2", "노랑 고래 3"][index % 3])
        : nick.dataset.originalName;
      nick.style.color = nickColor;
    }

    if (!text) {
      return;
    }

    if (useNicknameMessageColor) {
      text.style.color = nickColor;
      return;
    }

    if (useCustomTextColor) {
      text.style.color = customTextColor;
      return;
    }

    text.style.removeProperty("color");
  });

  const modeLabels = {
    default: "기본 채팅",
    guest: "나만 보는 채팅",
    mini: "미니 플로팅"
  };
  previewModeLabel.textContent = modeLabels[getChatMode()] || modeLabels.default;
}

function hexToRgba(hexColor, alpha) {
  const { red, green, blue } = hexToRgb(hexColor);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getChatBoxAlpha(opacity, { hover = false } = {}) {
  const alpha = normalizeChatBoxOpacity(opacity) / 100;
  const hoverAlpha = hover ? alpha + CHAT_BOX_HOVER_ALPHA_BONUS : alpha;

  return Math.min(1, hoverAlpha);
}

function getChatBoxBackgroundColor(hexColor, opacity, { hover = false } = {}) {
  return hexToRgba(hexColor, Number(getChatBoxAlpha(opacity, { hover }).toFixed(2)));
}

function renderColorChips() {
  renderChipGroup(boxColorChips, currentOptions.chatBoxColor, "box");
  renderChipGroup(textColorChips, currentOptions.chatTextColor, "text");
}

function renderChipGroup(container, activeHex, target) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  for (const chip of COLOR_CHIPS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-chip";
    button.style.backgroundColor = chip.hex;
    button.title = chip.hex;
    button.setAttribute("aria-label", chip.hex);
    button.classList.toggle("is-active", normalizeHexColor(activeHex) === chip.hex);

    button.addEventListener("click", () => {
      if (target === "box") {
        currentOptions.chatBoxColor = chip.hex;
      } else {
        currentOptions.chatTextColor = chip.hex;
      }

      renderColorChips();
      syncPreview();
      scheduleCommit({ immediate: true });
    });

    container.append(button);
  }
}

function syncPresetButtons() {
  for (const button of presetRow.querySelectorAll("[data-preset]")) {
    const isActive = activePreset !== "" && button.dataset.preset === activePreset;
    button.classList.toggle("is-active", isActive);
  }

  const hasCustomPreset = Boolean(customPresetSnapshot);
  customPresetButton.classList.toggle("is-empty", !hasCustomPreset);
  customPresetButton.classList.toggle("is-saved", hasCustomPreset);
  customPresetButton.title = hasCustomPreset
    ? "클릭: 저장한 나만의 프리셋 불러오기"
    : "저장 버튼으로 지금 설정을 먼저 저장하세요";
  customPresetButton.setAttribute(
    "aria-label",
    hasCustomPreset
      ? "나만의 프리셋 불러오기"
      : "나만의 프리셋이 비어 있습니다. 옆의 저장 버튼으로 현재 설정을 저장하세요."
  );
  saveCustomPresetButton.title = "지금 설정을 나만의 프리셋으로 저장";
}

function detectPreset(options) {
  const snapshot = createPresetSnapshot(options);

  if (
    customPresetSnapshot &&
    JSON.stringify(snapshot) === JSON.stringify(createPresetSnapshot(customPresetSnapshot))
  ) {
    return "custom";
  }

  for (const [presetId, patch] of Object.entries(PRESET_DEFINITIONS)) {
    const candidate = createPresetSnapshot({ ...DEFAULT_OPTIONS, ...patch });

    if (JSON.stringify(snapshot) === JSON.stringify(candidate)) {
      return presetId;
    }
  }

  return "";
}

function loadCustomPreset() {
  if (!customPresetSnapshot) {
    setStatus("저장된 나만의 프리셋 없음 · 저장 버튼 사용", "warn");
    return;
  }

  applyPreset("custom");
  setStatus("나만의 프리셋 불러옴", "ok");
}

function applyPreset(presetId) {
  if (presetId === "custom") {
    if (!customPresetSnapshot) {
      return;
    }

    currentOptions = applyPresetSnapshot(customPresetSnapshot);
  } else {
    currentOptions = applyPresetSnapshot(
      { ...DEFAULT_OPTIONS, ...PRESET_DEFINITIONS[presetId] }
    );
  }

  activePreset = presetId;
  syncControlsFromOptions();
  syncPreview();
  scheduleCommit({ immediate: true });
}

async function saveCustomPreset() {
  const nextCustomPresetSnapshot = createPresetSnapshot(currentOptions);

  try {
    await setLocalStorage({ [PRESET_STORAGE_KEY]: nextCustomPresetSnapshot });
    customPresetSnapshot = nextCustomPresetSnapshot;
    activePreset = "custom";
    syncPresetButtons();
    setStatus("나만의 프리셋 저장됨", "ok");
  } catch {
    setStatus("프리셋 저장 실패", "warn");
  }
}

function prepareCommitSnapshot() {
  currentOptions = normalizeOptions(currentOptions);
  syncNicknameColorDependencies();
  activePreset = detectPreset(currentOptions);
  syncPresetButtons();
  syncPreview();

  return normalizeOptions(currentOptions);
}

function scheduleCommit({ immediate = false } = {}) {
  window.clearTimeout(commitTimer);
  commitTimer = 0;
  pendingCommitSnapshot = prepareCommitSnapshot();
  latestCommitSnapshot = pendingCommitSnapshot;
  optionsDirty = true;

  if (immediate) {
    return flushScheduledCommit();
  }

  commitTimer = window.setTimeout(() => {
    flushScheduledCommit();
  }, 120);

  return Promise.resolve(true);
}

function flushScheduledCommit() {
  window.clearTimeout(commitTimer);
  commitTimer = 0;

  if (!pendingCommitSnapshot) {
    return Promise.resolve(true);
  }

  const snapshot = pendingCommitSnapshot;
  pendingCommitSnapshot = null;

  return enqueueCommit(snapshot);
}

function enqueueCommit(snapshot) {
  return new Promise((resolve) => {
    commitQueue.push({ snapshot, resolve });
    drainCommitQueue();
  });
}

function drainCommitQueue() {
  if (commitInFlight || popupIsClosing) {
    return;
  }

  const nextCommit = commitQueue.shift();

  if (!nextCommit) {
    return;
  }

  commitInFlight = true;
  performCommit(nextCommit.snapshot)
    .then(nextCommit.resolve, () => nextCommit.resolve(false))
    .finally(() => {
      commitInFlight = false;
      drainCommitQueue();
    });
}

function getLocalStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      const storageError = chrome.runtime.lastError;

      if (storageError) {
        reject(new Error(storageError.message || "설정을 불러오지 못했습니다."));
        return;
      }

      resolve(result || {});
    });
  });
}

function getOptionsFromBackground() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: READ_OPTIONS_MESSAGE }, (response) => {
      const runtimeError = chrome.runtime.lastError;

      resolve(!runtimeError && response?.ok ? normalizeOptions(response.options) : null);
    });
  });
}

async function getStoredOptions() {
  const [backgroundOptions, local] = await Promise.all([
    getOptionsFromBackground(),
    getLocalStorage([STORAGE_KEY, PRESET_STORAGE_KEY])
  ]);

  return {
    options: backgroundOptions || normalizeOptions(local?.[STORAGE_KEY] ?? DEFAULT_OPTIONS),
    customPreset: local?.[PRESET_STORAGE_KEY]
      ? createPresetSnapshot(local[PRESET_STORAGE_KEY])
      : null
  };
}

function setLocalStorage(values) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(values, () => {
      const storageError = chrome.runtime.lastError;

      if (storageError) {
        reject(new Error(storageError.message || "설정을 저장하지 못했습니다."));
        return;
      }

      resolve();
    });
  });
}

function getChangedOptionsPatch(previousOptions, nextOptions) {
  const previous = normalizeOptions(previousOptions);
  const next = normalizeOptions(nextOptions);

  return Object.fromEntries(
    Object.keys(DEFAULT_OPTIONS)
      .filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]))
      .map((key) => [key, next[key]])
  );
}

function setStoredOptions(options) {
  const normalizedOptions = normalizeOptions(options);
  const patch = getChangedOptionsPatch(lastCommittedPopupSnapshot, normalizedOptions);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: UPDATE_OPTIONS_MESSAGE,
      patch
    }, (response) => {
      const runtimeError = chrome.runtime.lastError;

      if (runtimeError) {
        reject(new Error(runtimeError.message || "설정을 저장하지 못했습니다."));
        return;
      }

      if (!response?.ok) {
        reject(new Error(response?.error || "설정을 저장하지 못했습니다."));
        return;
      }

      lastCommittedPopupSnapshot = normalizedOptions;
      resolve(normalizeOptions(response.options));
    });
  });
}

function queryActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      resolve(tab);
    });
  });
}

function sendMessageToTab(tabId, message, options = null) {
  return new Promise((resolve) => {
    const handleResponse = (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }

      resolve(response ?? null);
    };

    if (options) {
      chrome.tabs.sendMessage(tabId, message, options, handleResponse);
      return;
    }

    chrome.tabs.sendMessage(tabId, message, handleResponse);
  });
}

function getContentStatus(tabId) {
  return sendMessageToTab(tabId, {
    type: "CHZZK_CHAT_UI_TOGGLE_GET_STATUS"
  }, { frameId: 0 });
}

function refreshContent(tabId) {
  return sendMessageToTab(tabId, {
    type: "CHZZK_CHAT_UI_TOGGLE_REFRESH"
  }, { frameId: 0 });
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

  // Manifest content scripts handle Chzzk pages. Existing tabs opened before install/update may need a reload.
  return false;
}

async function applyToActiveTab() {
  const tab = await queryActiveTab();

  if (!tab?.id || !tab.url?.startsWith("https://chzzk.naver.com/")) {
    applyPopupTheme(POPUP_THEME_FALLBACK);
    setStatus("치지직 탭 아님", "warn");
    return false;
  }

  const ready = await ensureCurrentContentScript(tab.id);
  const status = await getContentStatus(tab.id);

  if (status?.detectedTheme) {
    applyPopupTheme(status.detectedTheme);
  }

  if (ready && status?.ok) {
    setStatus("적용됨", "ok");
    return true;
  }

  setStatus("새로고침 필요", "warn");
  return false;
}

async function performCommit(snapshot) {
  try {
    await setStoredOptions(snapshot);

    if (JSON.stringify(snapshot) === JSON.stringify(latestCommitSnapshot)) {
      optionsDirty = false;
    }

    if (popupIsClosing) {
      return true;
    }

    return await applyToActiveTab();
  } catch {
    if (!popupIsClosing) {
      setStatus("설정 저장 실패", "warn");
    }

    return false;
  }
}

function commitOptions() {
  return scheduleCommit({ immediate: true });
}

function persistLatestOptionsBeforeClose() {
  popupIsClosing = true;
  window.clearTimeout(commitTimer);
  commitTimer = 0;
  pendingCommitSnapshot = null;

  if (!optionsDirty) {
    return;
  }

  const snapshot = normalizeOptions(latestCommitSnapshot);
  const patch = getChangedOptionsPatch(lastCommittedPopupSnapshot, snapshot);

  chrome.runtime.sendMessage({
    type: UPDATE_OPTIONS_MESSAGE,
    patch
  }, (response) => {
    const storageError = chrome.runtime.lastError;

    if (!storageError && response?.ok) {
      optionsDirty = false;
    }
  });
}

function openColorPicker(target) {
  colorPickerTarget = target;
  const currentColor = target === "box" ? currentOptions.chatBoxColor : currentOptions.chatTextColor;
  colorPickerTitle.textContent = target === "box" ? "박스 색상" : "글자 색상";
  updateColorPickerUi(currentColor);
  navigate("color-picker", { rememberColorReturn: true });
}

function updateColorPickerUi(hexColor, { preserveHsv = false } = {}) {
  const normalized = normalizeHexColor(hexColor, colorPickerTarget === "box" ? DEFAULT_CHAT_BOX_COLOR : DEFAULT_CHAT_TEXT_COLOR);

  if (!preserveHsv) {
    const nextHsv = rgbToHsv(hexToRgb(normalized));
    // 무채색에는 색조가 없고 검정에는 채도도 없으므로 이전 선택을 유지한다.
    if (nextHsv.saturation === 0) nextHsv.hue = colorPickerHsv.hue;
    if (nextHsv.value === 0) nextHsv.saturation = colorPickerHsv.saturation;
    colorPickerHsv = nextHsv;
  }

  colorPickerSwatch.style.backgroundColor = normalized;
  colorPickerHex.value = normalized;
  colorPickerHex.classList.remove("is-invalid");
  colorPickerHue.value = String(colorPickerHsv.hue);
  colorPickerField.style.setProperty("--field-hue", hueToHex(colorPickerHsv.hue));
  colorPickerField.style.setProperty("--field-x", String(colorPickerHsv.saturation));
  colorPickerField.style.setProperty("--field-y", String(1 - colorPickerHsv.value));
}

function applyColorPickerValue(hexColor, { commit = true, immediate = false, preserveHsv = false } = {}) {
  const normalized = normalizeHexColor(
    hexColor,
    colorPickerTarget === "box" ? DEFAULT_CHAT_BOX_COLOR : DEFAULT_CHAT_TEXT_COLOR
  );

  if (colorPickerTarget === "box") {
    currentOptions.chatBoxColor = normalized;
  } else {
    currentOptions.chatTextColor = normalized;
  }

  updateColorPickerUi(normalized, { preserveHsv });
  renderColorChips();
  syncPreview();

  if (commit) {
    scheduleCommit({ immediate });
  }
}

function setColorPickerFromHsv(nextHsv, { commit = true } = {}) {
  colorPickerHsv = {
    hue: clampNumber(nextHsv.hue, 0, 360, colorPickerHsv.hue),
    saturation: clampNumber(nextHsv.saturation, 0, 1, colorPickerHsv.saturation),
    value: clampNumber(nextHsv.value, 0, 1, colorPickerHsv.value)
  };

  // HSV 조작은 8비트 RGB 왕복으로 좌표·색조 정밀도를 잃지 않도록 한다.
  applyColorPickerValue(rgbToHex(hsvToRgb(colorPickerHsv)), { commit, preserveHsv: true });
}

function updateColorPickerFromField(event) {
  const rect = colorPickerField.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

  setColorPickerFromHsv({
    hue: colorPickerHsv.hue,
    saturation: x,
    value: 1 - y
  });
}

function handleSectionToggle(event) {
  const input = event.target.closest("[data-section-toggle]");
  const keys = SECTION_OPTION_KEYS[input?.dataset.sectionToggle];
  if (!keys) return;
  for (const key of keys) currentOptions[key] = input.checked;
  syncNicknameColorDependencies();
  syncControlsFromOptions();
  syncPreview();
  scheduleCommit({ immediate: true });
}

function handleOptionInput(event) {
  const input = event.target.closest("[data-option]");

  if (!input) {
    return;
  }

  const key = input.dataset.option;

  if (input.type === "checkbox") {
    setOptionValue(key, input.checked);
  } else if (key === "randomNicknameMode" || key === "randomNicknamePrefix") {
    setOptionValue(key, input.value);
  } else if (input.type === "range") {
    const audioRanges = {
      audioCompressorThreshold: [-100, 0, -50],
      audioCompressorKnee: [0, 40, 40],
      audioCompressorRatio: [1, 20, 12],
      audioCompressorAttack: [0, 1, 0],
      audioCompressorRelease: [0, 1, 0.25],
      audioCompressorGain: [0, 2, 1]
    };
    const value = key === "chatBoxOpacity"
      ? normalizeChatBoxOpacity(input.value)
      : audioRanges[key]
        ? clampNumber(input.value, ...audioRanges[key])
        : normalizeChatFontSizePt(input.value);

    setOptionValue(key, value);

    if (key === "chatBoxOpacity") {
      chatBoxOpacityValue.textContent = `${currentOptions.chatBoxOpacity}%`;
    }

    if (key === "chatFontSizePt") {
      chatFontSizeValue.textContent = `${currentOptions.chatFontSizePt}pt`;
    }

    if (key === "nicknameFontSizePt") {
      nicknameFontSizeValue.textContent = `${currentOptions.nicknameFontSizePt}pt`;
    }
  }

  syncNicknameColorDependencies();
  syncConditionalBlocks();
  syncControlsFromOptions();
  syncPreview();
  scheduleCommit({ immediate: event.type === "change" });
}

function handleChatModeChange(event) {
  const radio = event.target;

  if (!(radio instanceof HTMLInputElement) || radio.name !== "chatMode") {
    return;
  }

  setChatMode(radio.value);
  syncConditionalBlocks();
  syncPreview();
  scheduleCommit({ immediate: true });
}

function bindEvents() {
  app.addEventListener("change", (event) => {
    if (event.target.matches("[data-section-toggle]")) {
      handleSectionToggle(event);
      return;
    }

    if (event.target.matches("[data-option]")) {
      handleOptionInput(event);
      return;
    }

    if (event.target.matches('input[name="chatMode"]')) {
      handleChatModeChange(event);
    }
  });

  app.addEventListener("input", (event) => {
    if (event.isComposing) return;
    if (event.target.matches(
      '[data-option="randomNicknamePrefix"], [data-option="chatBoxOpacity"], [data-option="chatFontSizePt"], [data-option="nicknameFontSizePt"], input[type="range"][data-option^="audioCompressor"]'
    )) {
      handleOptionInput(event);
    }
  });

  app.addEventListener("click", (event) => {
    if (event.target.closest("[data-section-toggle]")) return;
    const goto = event.target.closest("[data-goto]") || event.target.closest("[data-section]");

    if (goto) {
      navigate(goto.dataset.goto || goto.dataset.section);
      return;
    }

    const back = event.target.closest("[data-back]");

    if (back) {
      navigate("home");
      return;
    }

    const colorBack = event.target.closest("[data-color-back]");

    if (colorBack) {
      navigate(returnViewAfterColor);
      return;
    }

    const openColor = event.target.closest("[data-open-color]");

    if (openColor) {
      openColorPicker(openColor.dataset.openColor);
      return;
    }

    const audioPresetButton = event.target.closest("[data-audio-preset]");

    if (audioPresetButton) {
      applyAudioCompressorPreset(audioPresetButton.dataset.audioPreset);
      return;
    }

    const presetButton = event.target.closest("[data-preset]");

    if (presetButton) {
      if (presetButton.dataset.preset === "custom") {
        loadCustomPreset();
        return;
      }

      applyPreset(presetButton.dataset.preset);
    }
  });

  saveCustomPresetButton.addEventListener("click", (event) => {
    event.stopPropagation();
    saveCustomPreset();
  });

  menuButton.addEventListener("click", () => {
    const expanded = appMenu.hidden;
    appMenu.hidden = !expanded;
    menuButton.setAttribute("aria-expanded", String(expanded));
  });

  document.addEventListener("click", (event) => {
    if (!menuButton.contains(event.target) && !appMenu.contains(event.target)) {
      appMenu.hidden = true;
      menuButton.setAttribute("aria-expanded", "false");
    }
  });

  resetDefaultsButton.addEventListener("click", async () => {
    currentOptions = normalizeOptions(DEFAULT_OPTIONS);
    activePreset = "default";
    appMenu.hidden = true;
    syncControlsFromOptions();
    syncPreview();
    await commitOptions();
  });

  audioResetButton.addEventListener("click", resetAudioCompressorOptions);

  colorPickerField.addEventListener("pointerdown", (event) => {
    colorPickerField.setPointerCapture(event.pointerId);
    updateColorPickerFromField(event);
  });

  colorPickerField.addEventListener("pointermove", (event) => {
    if (colorPickerField.hasPointerCapture(event.pointerId)) {
      updateColorPickerFromField(event);
    }
  });

  colorPickerField.addEventListener("pointerup", () => {
    flushScheduledCommit();
  });

  colorPickerField.addEventListener("pointercancel", () => {
    flushScheduledCommit();
  });

  colorPickerHue.addEventListener("input", () => {
    setColorPickerFromHsv({
      hue: Number(colorPickerHue.value),
      saturation: colorPickerHsv.saturation,
      value: colorPickerHsv.value
    });
  });

  colorPickerHue.addEventListener("change", () => {
    flushScheduledCommit();
  });

  colorPickerHex.addEventListener("change", () => {
    const value = colorPickerHex.value.trim();

    if (!/^#?[0-9a-f]{3}$/i.test(value) && !/^#?[0-9a-f]{6}$/i.test(value)) {
      colorPickerHex.classList.add("is-invalid");
      return;
    }

    const currentColor = colorPickerTarget === "box" ? currentOptions.chatBoxColor : currentOptions.chatTextColor;
    if (normalizeHexColor(value) === currentColor) {
      // 필드 조작 직후 blur로 발생한 change가 HSV를 RGB에서 다시 계산하지 않게 한다.
      colorPickerHex.classList.remove("is-invalid");
      return;
    }

    applyColorPickerValue(value, { immediate: true });
  });

  colorPickerReset.addEventListener("click", () => {
    applyColorPickerValue(
      colorPickerTarget === "box" ? DEFAULT_CHAT_BOX_COLOR : DEFAULT_CHAT_TEXT_COLOR,
      { immediate: true }
    );
  });

  window.addEventListener("pagehide", persistLatestOptionsBeforeClose);
}

async function init() {
  bindEvents();
  applyPopupTheme(POPUP_THEME_FALLBACK);
  await syncPopupTheme();

  const stored = await getStoredOptions();
  currentOptions = stored.options;
  latestCommitSnapshot = currentOptions;
  lastCommittedPopupSnapshot = normalizeOptions(currentOptions);
  optionsDirty = false;
  customPresetSnapshot = stored.customPreset;
  activePreset = detectPreset(currentOptions);

  syncControlsFromOptions();
  syncPreview();
  navigate("home");
  await applyToActiveTab();
}

init().catch(() => {
  currentOptions = normalizeOptions(DEFAULT_OPTIONS);
  syncControlsFromOptions();
  syncPreview();
  setStatus("초기화 실패", "warn");
});
