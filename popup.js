const STORAGE_KEY = "chzzkChatUiToggleOptions";
const PRESET_STORAGE_KEY = "chzzkChatUiToggleCustomPreset";
const CONTENT_VERSION = "0.5.1";
const POPUP_THEME_FALLBACK = "light";

const DEFAULT_CHAT_BOX_COLOR = "#808080";
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

const COLOR_CHIPS = [
  { id: "gray", hex: "#808080" },
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
  useAutoTextContrast: false,
  useChatTextColor: false,
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const PRESET_DEFINITIONS = {
  default: {
    showNonChatPanels: false
  },
  clean: {
    showNicknames: false,
    showBadges: false,
    showTimestamps: false,
    showNonChatPanels: false,
    showChatBoxes: true,
    showBoldText: true
  },
  minimal: {
    showBadges: false,
    showTimestamps: false,
    showNonChatPanels: false,
    showChatBoxes: false,
    showLargeText: false,
    useChatTextColor: false,
    useNicknameColorForMessage: false
  }
};

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
const chatFontSizeValue = document.getElementById("chatFontSizePtValue");
const nicknameFontSizeValue = document.getElementById("nicknameFontSizePtValue");
const colorPickerTitle = document.getElementById("colorPickerTitle");
const colorPickerSwatch = document.getElementById("colorPickerSwatch");
const colorPickerHex = document.getElementById("chatTextColorHex");
const colorPickerField = document.getElementById("colorPickerField");
const colorPickerHandle = document.getElementById("colorPickerHandle");
const colorPickerHue = document.getElementById("colorPickerHue");
const colorPickerReset = document.getElementById("colorPickerReset");

const views = [...document.querySelectorAll("[data-view]")];
const optionInputs = [...document.querySelectorAll("[data-option]")];
const quickBundleInputs = [...document.querySelectorAll("[data-quick-bundle]")];
const chatModeRadios = [...document.querySelectorAll('input[name="chatMode"]')];

let currentOptions = normalizeOptions(DEFAULT_OPTIONS);
let activePreset = "default";
let activeView = "home";
let colorPickerTarget = null;
let colorPickerHsv = { hue: 0, saturation: 0, value: 0.5 };
let commitTimer = 0;
let returnViewAfterColor = "style";
let customPresetSnapshot = null;

function clampNumber(value, min, max, fallback) {
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

function normalizeOptions(options) {
  const legacyBoldText = options?.showBoldText === undefined && options?.showLargeText === true;
  const miniFloatingChatInputOnly = options?.miniFloatingChatInputOnly === true;
  const useChatTextColor = options?.useChatTextColor === true;
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
    useAutoTextContrast: options?.useAutoTextContrast === true,
    useChatTextColor,
    chatTextColor: normalizeHexColor(options?.chatTextColor, DEFAULT_CHAT_TEXT_COLOR),
    useNicknameColorForMessage: useChatTextColor && options?.useNicknameColorForMessage === true,
    chatBoxColor: normalizeHexColor(options?.chatBoxColor, DEFAULT_CHAT_BOX_COLOR)
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

function getChatMode(options = currentOptions) {
  if (options.useMiniFloatingChat) {
    return "mini";
  }

  if (options.useGuestChatFrame) {
    return "guest";
  }

  return "default";
}

function setChatMode(mode) {
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

function isIdentityBundleActive() {
  return currentOptions.showNicknames === true && currentOptions.showBadges === true;
}

function isReadabilityBundleActive() {
  return (
    currentOptions.showChatBoxes === true &&
    currentOptions.showLargeText === true &&
    currentOptions.showBoldText === true &&
    currentOptions.useAutoTextContrast === true &&
    currentOptions.useChatTextColor === true &&
    currentOptions.useNicknameColorForMessage === true
  );
}

function syncQuickBundles() {
  for (const input of quickBundleInputs) {
    if (input.dataset.quickBundle === "identity") {
      input.checked = isIdentityBundleActive();
      continue;
    }

    if (input.dataset.quickBundle === "readability") {
      input.checked = isReadabilityBundleActive();
    }
  }
}

function applyQuickBundle(bundleId, enabled) {
  if (bundleId === "identity") {
    currentOptions.showNicknames = enabled;
    currentOptions.showBadges = enabled;
    return;
  }

  if (bundleId === "readability") {
    currentOptions.showChatBoxes = enabled;
    currentOptions.showLargeText = enabled;
    currentOptions.showBoldText = enabled;
    currentOptions.useAutoTextContrast = enabled;
    currentOptions.useChatTextColor = enabled;
    currentOptions.useNicknameColorForMessage = enabled;
  }
}

function syncConditionalBlocks() {
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

    if (input.type === "range") {
      input.value = String(currentOptions[key]);
    }
  }

  for (const radio of chatModeRadios) {
    radio.checked = radio.value === getChatMode();
  }

  chatFontSizeValue.textContent = `${currentOptions.chatFontSizePt}pt`;
  nicknameFontSizeValue.textContent = `${currentOptions.nicknameFontSizePt}pt`;
  syncNicknameColorDependencies();
  syncConditionalBlocks();
  renderColorChips();
  syncPresetButtons();
  syncQuickBundles();
}

function syncPreview() {
  chatPreview.dataset.showNicknames = currentOptions.showNicknames ? "on" : "off";
  chatPreview.dataset.showBadges = currentOptions.showBadges ? "on" : "off";
  chatPreview.dataset.showTimestamps = currentOptions.showTimestamps ? "on" : "off";
  chatPreview.dataset.showBoxes = currentOptions.showChatBoxes ? "on" : "off";

  const fontSize = currentOptions.showLargeText
    ? currentOptions.chatFontSizePt
    : CHAT_FONT_SIZE_PT_DEFAULT;
  chatPreview.style.setProperty("--preview-font", `${fontSize}px`);
  chatPreview.style.setProperty("--preview-weight", currentOptions.showBoldText ? "700" : "400");
  chatPreview.style.setProperty(
    "--preview-box",
    currentOptions.showChatBoxes ? `${hexToRgba(currentOptions.chatBoxColor, 0.22)}` : "transparent"
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
    guest: "비로그인 채팅",
    mini: "미니 플로팅"
  };
  previewModeLabel.textContent = modeLabels[getChatMode()] || modeLabels.default;
}

function hexToRgba(hexColor, alpha) {
  const { red, green, blue } = hexToRgb(hexColor);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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
      scheduleCommit();
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
  const normalized = normalizeOptions(options);

  if (customPresetSnapshot && JSON.stringify(normalized) === JSON.stringify(customPresetSnapshot)) {
    return "custom";
  }

  for (const [presetId, patch] of Object.entries(PRESET_DEFINITIONS)) {
    const candidate = normalizeOptions({ ...DEFAULT_OPTIONS, ...patch });

    if (JSON.stringify(normalized) === JSON.stringify(candidate)) {
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

    currentOptions = normalizeOptions(customPresetSnapshot);
  } else {
    currentOptions = normalizeOptions({ ...DEFAULT_OPTIONS, ...PRESET_DEFINITIONS[presetId] });
  }

  activePreset = presetId;
  syncControlsFromOptions();
  syncPreview();
  scheduleCommit();
}

function saveCustomPreset() {
  customPresetSnapshot = normalizeOptions(currentOptions);

  chrome.storage.local.set({ [PRESET_STORAGE_KEY]: customPresetSnapshot }, () => {
    activePreset = "custom";
    syncPresetButtons();
    setStatus("나만의 프리셋 저장됨", "ok");
  });
}

function scheduleCommit() {
  window.clearTimeout(commitTimer);
  commitTimer = window.setTimeout(() => {
    commitOptions();
  }, 120);
}

function getStoredOptions() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY, PRESET_STORAGE_KEY], (result) => {
      resolve({
        options: normalizeOptions(result?.[STORAGE_KEY] ?? DEFAULT_OPTIONS),
        customPreset: result?.[PRESET_STORAGE_KEY]
          ? normalizeOptions(result[PRESET_STORAGE_KEY])
          : null
      });
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

function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }

      resolve(response ?? null);
    });
  });
}

function getContentStatus(tabId) {
  return sendMessageToTab(tabId, {
    type: "CHZZK_CHAT_UI_TOGGLE_GET_STATUS"
  });
}

function refreshContent(tabId) {
  return sendMessageToTab(tabId, {
    type: "CHZZK_CHAT_UI_TOGGLE_REFRESH"
  });
}

function sendOptionsToTab(tabId, options) {
  return sendMessageToTab(tabId, {
    type: "CHZZK_CHAT_UI_TOGGLE_SET_OPTIONS",
    options: normalizeOptions(options)
  });
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

async function applyToActiveTab(options) {
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

  const applied = await sendOptionsToTab(tab.id, options);

  if (ready && applied?.ok) {
    setStatus("적용됨", "ok");
    return true;
  }

  setStatus("새로고침 필요", "warn");
  return false;
}

async function commitOptions() {
  currentOptions = normalizeOptions(currentOptions);
  syncNicknameColorDependencies();
  activePreset = detectPreset(currentOptions);
  syncPresetButtons();
  syncPreview();
  await setStoredOptions(currentOptions);
  await applyToActiveTab(currentOptions);
}

function openColorPicker(target) {
  colorPickerTarget = target;
  const currentColor = target === "box" ? currentOptions.chatBoxColor : currentOptions.chatTextColor;
  colorPickerTitle.textContent = target === "box" ? "박스 색상" : "글자 색상";
  updateColorPickerUi(currentColor);
  navigate("color-picker", { rememberColorReturn: true });
}

function updateColorPickerUi(hexColor) {
  const normalized = normalizeHexColor(hexColor, colorPickerTarget === "box" ? DEFAULT_CHAT_BOX_COLOR : DEFAULT_CHAT_TEXT_COLOR);
  colorPickerHsv = rgbToHsv(hexToRgb(normalized));
  colorPickerSwatch.style.backgroundColor = normalized;
  colorPickerHex.value = normalized;
  colorPickerHex.classList.remove("is-invalid");
  colorPickerHue.value = String(colorPickerHsv.hue);
  colorPickerField.style.setProperty("--field-hue", hueToHex(colorPickerHsv.hue));
  colorPickerField.style.setProperty("--field-x", String(colorPickerHsv.saturation));
  colorPickerField.style.setProperty("--field-y", String(1 - colorPickerHsv.value));
}

function applyColorPickerValue(hexColor, { commit = true } = {}) {
  const normalized = normalizeHexColor(
    hexColor,
    colorPickerTarget === "box" ? DEFAULT_CHAT_BOX_COLOR : DEFAULT_CHAT_TEXT_COLOR
  );

  if (colorPickerTarget === "box") {
    currentOptions.chatBoxColor = normalized;
  } else {
    currentOptions.chatTextColor = normalized;
  }

  updateColorPickerUi(normalized);
  renderColorChips();
  syncPreview();

  if (commit) {
    scheduleCommit();
  }
}

function setColorPickerFromHsv(nextHsv, { commit = true } = {}) {
  colorPickerHsv = {
    hue: clampNumber(nextHsv.hue, 0, 360, colorPickerHsv.hue),
    saturation: clampNumber(nextHsv.saturation, 0, 1, colorPickerHsv.saturation),
    value: clampNumber(nextHsv.value, 0, 1, colorPickerHsv.value)
  };

  applyColorPickerValue(rgbToHex(hsvToRgb(colorPickerHsv)), { commit });
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

function handleQuickBundleInput(event) {
  const input = event.target.closest("[data-quick-bundle]");

  if (!input) {
    return;
  }

  applyQuickBundle(input.dataset.quickBundle, input.checked);
  syncNicknameColorDependencies();
  syncConditionalBlocks();
  syncControlsFromOptions();
  syncPreview();
  scheduleCommit();
}

function handleOptionInput(event) {
  const input = event.target.closest("[data-option]");

  if (!input) {
    return;
  }

  const key = input.dataset.option;

  if (input.type === "checkbox") {
    setOptionValue(key, input.checked);
  } else if (input.type === "range") {
    setOptionValue(key, normalizeChatFontSizePt(input.value));

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
  scheduleCommit();
}

function handleChatModeChange(event) {
  const radio = event.target;

  if (!(radio instanceof HTMLInputElement) || radio.name !== "chatMode") {
    return;
  }

  setChatMode(radio.value);
  syncConditionalBlocks();
  syncPreview();
  scheduleCommit();
}

function bindEvents() {
  app.addEventListener("change", (event) => {
    if (event.target.matches("[data-quick-bundle]")) {
      handleQuickBundleInput(event);
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
    if (event.target.matches('[data-option="chatFontSizePt"], [data-option="nicknameFontSizePt"]')) {
      handleOptionInput(event);
    }
  });

  app.addEventListener("click", (event) => {
    const goto = event.target.closest("[data-goto]");

    if (goto) {
      navigate(goto.dataset.goto);
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
    if (!app.contains(event.target)) {
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

  colorPickerField.addEventListener("pointerdown", (event) => {
    colorPickerField.setPointerCapture(event.pointerId);
    updateColorPickerFromField(event);
  });

  colorPickerField.addEventListener("pointermove", (event) => {
    if (colorPickerField.hasPointerCapture(event.pointerId)) {
      updateColorPickerFromField(event);
    }
  });

  colorPickerHue.addEventListener("input", () => {
    setColorPickerFromHsv({
      hue: Number(colorPickerHue.value),
      saturation: colorPickerHsv.saturation,
      value: colorPickerHsv.value
    });
  });

  colorPickerHex.addEventListener("change", () => {
    const value = colorPickerHex.value.trim();

    if (!/^#?[0-9a-f]{3}$/i.test(value) && !/^#?[0-9a-f]{6}$/i.test(value)) {
      colorPickerHex.classList.add("is-invalid");
      return;
    }

    applyColorPickerValue(value);
  });

  colorPickerReset.addEventListener("click", () => {
    applyColorPickerValue(colorPickerTarget === "box" ? DEFAULT_CHAT_BOX_COLOR : DEFAULT_CHAT_TEXT_COLOR);
  });
}

async function init() {
  bindEvents();
  applyPopupTheme(POPUP_THEME_FALLBACK);
  await syncPopupTheme();

  const stored = await getStoredOptions();
  currentOptions = stored.options;
  customPresetSnapshot = stored.customPreset;
  activePreset = detectPreset(currentOptions);

  syncControlsFromOptions();
  syncPreview();
  navigate("home");
  await applyToActiveTab(currentOptions);
}

init().catch(() => {
  currentOptions = normalizeOptions(DEFAULT_OPTIONS);
  syncControlsFromOptions();
  syncPreview();
  setStatus("초기화 실패", "warn");
});
