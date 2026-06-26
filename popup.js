const STORAGE_KEY = "chzzkChatUiToggleOptions";
const CONTENT_VERSION = "0.4.4";
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

const controlIds = [
  "showNicknames",
  "showBadges",
  "showTimestamps",
  "showNonChatPanels",
  "showChatBoxes",
  "useGuestChatFrame",
  "useMiniFloatingChat",
  "miniFloatingChatFullscreenOnly",
  "showGuestChatToggleButton",
  "showHeaderSettingsButton",
  "showMiniFloatingChatButton",
  "showLargeText",
  "useNicknameFontSize",
  "showBoldText",
  "useChatTextColor",
  "useNicknameColorForMessage"
];
const controls = Object.fromEntries(controlIds.map((id) => [id, document.getElementById(id)]));
const tabButtons = [...document.querySelectorAll("[data-tab-target]")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];
const colorPreview = document.getElementById("colorPreview");
const hexInput = document.getElementById("chatBoxColorHex");
const resetColorButton = document.getElementById("resetChatBoxColor");
const chatBoxColorPanel = document.getElementById("chatBoxColorPanel");
const toggleChatBoxColorPanelButton = document.getElementById("toggleChatBoxColorPanel");
const colorField = document.getElementById("colorField");
const colorFieldHandle = document.getElementById("colorFieldHandle");
const hueSlider = document.getElementById("hueSlider");
const chatTextStylePanel = document.getElementById("chatTextStylePanel");
const toggleChatTextStylePanelButton = document.getElementById("toggleChatTextStylePanel");
const chatTextColorControl = document.getElementById("chatTextColorControl");
const chatTextColorPanel = document.getElementById("chatTextColorPanel");
const toggleChatTextColorPanelButton = document.getElementById("toggleChatTextColorPanel");
const chatTextColorPreview = document.getElementById("chatTextColorPreview");
const chatTextHexInput = document.getElementById("chatTextColorHex");
const resetChatTextColorButton = document.getElementById("resetChatTextColor");
const chatTextColorField = document.getElementById("chatTextColorField");
const chatTextColorFieldHandle = document.getElementById("chatTextColorFieldHandle");
const chatTextHueSlider = document.getElementById("chatTextHueSlider");
const chatFontSizeSlider = document.getElementById("chatFontSizePt");
const chatFontSizeValue = document.getElementById("chatFontSizeValue");
const resetChatFontSizeButton = document.getElementById("resetChatFontSize");
const chatFontSizePanel = document.getElementById("chatFontSizePanel");
const toggleChatFontSizePanelButton = document.getElementById("toggleChatFontSizePanel");
const nicknameFontSizeControl = document.getElementById("nicknameFontSizeControl");
const nicknameFontSizeSlider = document.getElementById("nicknameFontSizePt");
const nicknameFontSizeValue = document.getElementById("nicknameFontSizeValue");
const resetNicknameFontSizeButton = document.getElementById("resetNicknameFontSize");
const statusElement = document.getElementById("status");

let currentColor = DEFAULT_CHAT_BOX_COLOR;
let currentChatTextColor = DEFAULT_CHAT_TEXT_COLOR;
let currentOptions = { ...DEFAULT_OPTIONS };
let hsv = { hue: 0, saturation: 0, value: 0.5 };
let chatTextHsv = { hue: 0, saturation: 0, value: 0.07 };
let colorApplyTimer = 0;
let chatTextColorApplyTimer = 0;
let fontSizeApplyTimer = 0;
let isChatBoxColorPanelExpanded = false;
let isChatFontSizePanelExpanded = true;
let isChatTextStylePanelExpanded = true;
let isChatTextColorPanelExpanded = false;

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

function isValidHexInput(value) {
  const trimmed = value.trim();

  return /^#?[0-9a-f]{3}$/i.test(trimmed) || /^#?[0-9a-f]{6}$/i.test(trimmed);
}

function isCompleteHexInput(value) {
  return /^#?[0-9a-f]{6}$/i.test(value.trim());
}

function isPendingHexInput(value) {
  return /^#?[0-9a-f]{0,6}$/i.test(value.trim());
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

function selectTab(targetId) {
  for (const button of tabButtons) {
    const isSelected = button.dataset.tabTarget === targetId;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  }

  for (const panel of tabPanels) {
    const isSelected = panel.id === targetId;
    panel.classList.toggle("is-active", isSelected);
    panel.hidden = !isSelected;
  }
}

function setStatus(message) {
  statusElement.textContent = message;
}

function updateColorUi(hexColor, { syncInput = true } = {}) {
  currentColor = normalizeHexColor(hexColor, DEFAULT_CHAT_BOX_COLOR);
  hsv = rgbToHsv(hexToRgb(currentColor));

  document.documentElement.style.setProperty("--current-color", currentColor);
  document.documentElement.style.setProperty("--field-hue", hueToHex(hsv.hue));
  colorField.style.setProperty("--field-x", String(hsv.saturation));
  colorField.style.setProperty("--field-y", String(1 - hsv.value));
  colorPreview.style.backgroundColor = currentColor;
  hueSlider.value = String(hsv.hue);

  if (syncInput) {
    hexInput.value = currentColor;
    hexInput.classList.remove("is-invalid");
  }
}

function updateChatTextColorUi(hexColor, { syncInput = true } = {}) {
  currentChatTextColor = normalizeHexColor(hexColor, DEFAULT_CHAT_TEXT_COLOR);
  chatTextHsv = rgbToHsv(hexToRgb(currentChatTextColor));

  chatTextColorPanel.style.setProperty("--current-color", currentChatTextColor);
  chatTextColorPanel.style.setProperty("--field-hue", hueToHex(chatTextHsv.hue));
  chatTextColorField.style.setProperty("--field-x", String(chatTextHsv.saturation));
  chatTextColorField.style.setProperty("--field-y", String(1 - chatTextHsv.value));
  chatTextColorPreview.style.backgroundColor = currentChatTextColor;
  chatTextHueSlider.value = String(chatTextHsv.hue);

  if (syncInput) {
    chatTextHexInput.value = currentChatTextColor;
    chatTextHexInput.classList.remove("is-invalid");
  }
}

function updateChatFontSizeUi(fontSizePt) {
  const normalizedFontSize = normalizeChatFontSizePt(fontSizePt);
  chatFontSizeSlider.value = String(normalizedFontSize);
  chatFontSizeValue.textContent = `${normalizedFontSize}pt`;
}

function updateNicknameFontSizeUi(fontSizePt) {
  const normalizedFontSize = normalizeChatFontSizePt(fontSizePt);
  nicknameFontSizeSlider.value = String(normalizedFontSize);
  nicknameFontSizeValue.textContent = `${normalizedFontSize}pt`;
}

function setChatBoxColorPanelExpanded(expanded) {
  const shouldExpand = expanded === true;
  isChatBoxColorPanelExpanded = shouldExpand;
  document.body.classList.toggle("is-chat-box-color-panel-expanded", shouldExpand);
  chatBoxColorPanel.hidden = !shouldExpand;
  toggleChatBoxColorPanelButton.setAttribute("aria-expanded", String(shouldExpand));
  toggleChatBoxColorPanelButton.setAttribute(
    "aria-label",
    shouldExpand ? "박스 색상 항목 접기" : "박스 색상 항목 펼치기"
  );
}

function syncChatBoxColorPanel() {
  setChatBoxColorPanelExpanded(isChatBoxColorPanelExpanded);
}

function setChatFontSizePanelExpanded(expanded) {
  const shouldExpand = expanded === true;
  isChatFontSizePanelExpanded = shouldExpand;
  document.body.classList.toggle("is-chat-font-size-panel-expanded", shouldExpand);
  chatFontSizePanel.hidden = !shouldExpand;
  toggleChatFontSizePanelButton.setAttribute("aria-expanded", String(shouldExpand));
  toggleChatFontSizePanelButton.setAttribute(
    "aria-label",
    shouldExpand ? "글씨 크기 항목 접기" : "글씨 크기 항목 펼치기"
  );
}

function syncChatFontSizePanel() {
  setChatFontSizePanelExpanded(isChatFontSizePanelExpanded);
}

function setChatTextStylePanelExpanded(expanded) {
  const shouldExpand = expanded === true;
  isChatTextStylePanelExpanded = shouldExpand;
  document.body.classList.toggle("is-chat-text-style-panel-expanded", shouldExpand);
  chatTextStylePanel.hidden = !shouldExpand;
  toggleChatTextStylePanelButton.setAttribute("aria-expanded", String(shouldExpand));
  toggleChatTextStylePanelButton.setAttribute(
    "aria-label",
    shouldExpand ? "채팅 글자 스타일 항목 접기" : "채팅 글자 스타일 항목 펼치기"
  );
}

function syncChatTextStylePanel() {
  setChatTextStylePanelExpanded(isChatTextStylePanelExpanded);
}

function setChatTextColorPanelExpanded(expanded) {
  const shouldExpand = expanded === true;
  isChatTextColorPanelExpanded = shouldExpand;
  document.body.classList.toggle("is-chat-text-color-panel-expanded", shouldExpand);
  chatTextColorPanel.hidden = !shouldExpand;
  toggleChatTextColorPanelButton.setAttribute("aria-expanded", String(shouldExpand));
  toggleChatTextColorPanelButton.setAttribute(
    "aria-label",
    shouldExpand ? "글자 색상 항목 접기" : "글자 색상 항목 펼치기"
  );
}

function syncChatTextColorPanel() {
  setChatTextColorPanelExpanded(isChatTextColorPanelExpanded);
}

function setControls(options) {
  const normalized = normalizeOptions(options);
  currentOptions = normalized;

  for (const id of controlIds) {
    controls[id].checked = normalized[id];
  }

  isChatBoxColorPanelExpanded = false;
  isChatFontSizePanelExpanded = true;
  isChatTextStylePanelExpanded = true;
  isChatTextColorPanelExpanded = false;
  syncDependentControls(normalized);
  updateChatFontSizeUi(normalized.chatFontSizePt);
  updateNicknameFontSizeUi(normalized.nicknameFontSizePt);
  updateColorUi(normalized.chatBoxColor);
  updateChatTextColorUi(normalized.chatTextColor);
}

function syncDependentControls(options = currentOptions) {
  const fullscreenOnlyControl = controls.miniFloatingChatFullscreenOnly;
  const fullscreenOnlyRow = fullscreenOnlyControl?.closest(".toggle-row");
  const isMiniChatEnabled = options.useMiniFloatingChat === true;

  if (fullscreenOnlyControl) {
    fullscreenOnlyControl.disabled = !isMiniChatEnabled;
    fullscreenOnlyRow?.classList.toggle("is-disabled", !isMiniChatEnabled);
  }

  syncChatBoxColorPanel(options);
  syncChatFontSizePanel(options);
  syncChatTextStylePanel(options);
  syncChatTextColorPanel(options);
  const isNicknameFontSizeEnabled = options.showLargeText === true && options.useNicknameFontSize === true;
  nicknameFontSizeSlider.disabled = !isNicknameFontSizeEnabled;
  resetNicknameFontSizeButton.disabled = !isNicknameFontSizeEnabled;
  nicknameFontSizeControl.classList.toggle("is-disabled", !isNicknameFontSizeEnabled);

  const shouldDisableChatTextColor = options.useNicknameColorForMessage === true;
  const chatTextColorControls = [
    chatTextHexInput,
    resetChatTextColorButton,
    chatTextColorField,
    chatTextHueSlider
  ];

  for (const control of chatTextColorControls) {
    control.disabled = shouldDisableChatTextColor;
  }

  chatTextColorPanel.classList.toggle("is-disabled", shouldDisableChatTextColor);
}

function readControls() {
  return normalizeOptions({
    ...currentOptions,
    showNicknames: controls.showNicknames.checked,
    showBadges: controls.showBadges.checked,
    showTimestamps: controls.showTimestamps.checked,
    showNonChatPanels: controls.showNonChatPanels.checked,
    showChatBoxes: controls.showChatBoxes.checked,
    useGuestChatFrame: controls.useGuestChatFrame.checked,
    useMiniFloatingChat: controls.useMiniFloatingChat.checked,
    miniFloatingChatFullscreenOnly: controls.miniFloatingChatFullscreenOnly.checked,
    showGuestChatToggleButton: controls.showGuestChatToggleButton.checked,
    showHeaderSettingsButton: controls.showHeaderSettingsButton.checked,
    showMiniFloatingChatButton: controls.showMiniFloatingChatButton.checked,
    showLargeText: controls.showLargeText.checked,
    chatFontSizePt: chatFontSizeSlider.value,
    useNicknameFontSize: controls.useNicknameFontSize.checked,
    nicknameFontSizePt: nicknameFontSizeSlider.value,
    showBoldText: controls.showBoldText.checked,
    useChatTextColor: controls.useChatTextColor.checked,
    chatTextColor: currentChatTextColor,
    useNicknameColorForMessage: controls.useNicknameColorForMessage.checked,
    chatBoxColor: currentColor
  });
}

function getStoredOptions() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(normalizeOptions(result?.[STORAGE_KEY] ?? DEFAULT_OPTIONS));
    });
  });
}

function setStoredOptions(options) {
  return new Promise((resolve) => {
    const normalized = normalizeOptions(options);
    currentOptions = normalized;
    chrome.storage.local.set({ [STORAGE_KEY]: normalized }, resolve);
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
    setStatus("치지직 탭 아님");
    return;
  }

  const ready = await ensureCurrentContentScript(tab.id);
  const applied = await sendOptionsToTab(tab.id, options);
  setStatus(ready && applied?.ok ? "적용됨" : "새로고침 필요");
}

async function applyCurrentOptions() {
  const options = readControls();
  await setStoredOptions(options);
  await applyToActiveTab(options);
}

function scheduleColorApply() {
  window.clearTimeout(colorApplyTimer);
  colorApplyTimer = window.setTimeout(applyCurrentOptions, 100);
}

function scheduleChatTextColorApply() {
  window.clearTimeout(chatTextColorApplyTimer);
  chatTextColorApplyTimer = window.setTimeout(applyCurrentOptions, 100);
}

function scheduleFontSizeApply() {
  window.clearTimeout(fontSizeApplyTimer);
  fontSizeApplyTimer = window.setTimeout(applyCurrentOptions, 100);
}

async function handleControlChange() {
  const options = readControls();

  syncDependentControls(options);
  await applyCurrentOptions();
}

function handleChatFontSizeInput() {
  updateChatFontSizeUi(chatFontSizeSlider.value);
  scheduleFontSizeApply();
}

function handleNicknameFontSizeInput() {
  updateNicknameFontSizeUi(nicknameFontSizeSlider.value);
  scheduleFontSizeApply();
}

function handleChatFontSizePanelToggle() {
  setChatFontSizePanelExpanded(!isChatFontSizePanelExpanded);
}

function handleChatBoxColorPanelToggle() {
  setChatBoxColorPanelExpanded(!isChatBoxColorPanelExpanded);
}

function handleChatTextStylePanelToggle() {
  setChatTextStylePanelExpanded(!isChatTextStylePanelExpanded);
}

function handleChatTextColorPanelToggle() {
  setChatTextColorPanelExpanded(!isChatTextColorPanelExpanded);
}

function setColorFromHsv(nextHsv, { commit = true } = {}) {
  hsv = {
    hue: Math.max(0, Math.min(360, nextHsv.hue)),
    saturation: Math.max(0, Math.min(1, nextHsv.saturation)),
    value: Math.max(0, Math.min(1, nextHsv.value))
  };
  updateColorUi(rgbToHex(hsvToRgb(hsv)));

  if (commit) {
    scheduleColorApply();
  }
}

function setChatTextColorFromHsv(nextHsv, { commit = true } = {}) {
  chatTextHsv = {
    hue: Math.max(0, Math.min(360, nextHsv.hue)),
    saturation: Math.max(0, Math.min(1, nextHsv.saturation)),
    value: Math.max(0, Math.min(1, nextHsv.value))
  };
  updateChatTextColorUi(rgbToHex(hsvToRgb(chatTextHsv)));

  if (commit) {
    scheduleChatTextColorApply();
  }
}

function updateColorFromField(event) {
  const rect = colorField.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

  setColorFromHsv({
    hue: hsv.hue,
    saturation: x,
    value: 1 - y
  });
}

function updateChatTextColorFromField(event) {
  const rect = chatTextColorField.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

  setChatTextColorFromHsv({
    hue: chatTextHsv.hue,
    saturation: x,
    value: 1 - y
  });
}

function handleColorFieldPointerDown(event) {
  colorField.setPointerCapture(event.pointerId);
  updateColorFromField(event);
}

function handleColorFieldPointerMove(event) {
  if (colorField.hasPointerCapture(event.pointerId)) {
    updateColorFromField(event);
  }
}

function handleChatTextColorFieldPointerDown(event) {
  chatTextColorField.setPointerCapture(event.pointerId);
  updateChatTextColorFromField(event);
}

function handleChatTextColorFieldPointerMove(event) {
  if (chatTextColorField.hasPointerCapture(event.pointerId)) {
    updateChatTextColorFromField(event);
  }
}

function handleHueChange() {
  setColorFromHsv({
    hue: Number(hueSlider.value),
    saturation: hsv.saturation,
    value: hsv.value
  });
}

function handleChatTextHueChange() {
  setChatTextColorFromHsv({
    hue: Number(chatTextHueSlider.value),
    saturation: chatTextHsv.saturation,
    value: chatTextHsv.value
  });
}

function commitHexInput() {
  if (!isValidHexInput(hexInput.value)) {
    hexInput.classList.add("is-invalid");
    return;
  }

  updateColorUi(normalizeHexColor(hexInput.value));
  applyCurrentOptions();
}

function commitChatTextHexInput() {
  if (!isValidHexInput(chatTextHexInput.value)) {
    chatTextHexInput.classList.add("is-invalid");
    return;
  }

  updateChatTextColorUi(normalizeHexColor(chatTextHexInput.value, DEFAULT_CHAT_TEXT_COLOR));
  applyCurrentOptions();
}

function handleHexInput() {
  if (!hexInput.value.trim()) {
    hexInput.classList.remove("is-invalid");
    return;
  }

  if (isCompleteHexInput(hexInput.value)) {
    updateColorUi(normalizeHexColor(hexInput.value), { syncInput: false });
    hexInput.classList.remove("is-invalid");
    scheduleColorApply();
    return;
  }

  hexInput.classList.toggle("is-invalid", !isPendingHexInput(hexInput.value));
}

function handleChatTextHexInput() {
  if (!chatTextHexInput.value.trim()) {
    chatTextHexInput.classList.remove("is-invalid");
    return;
  }

  if (isCompleteHexInput(chatTextHexInput.value)) {
    updateChatTextColorUi(
      normalizeHexColor(chatTextHexInput.value, DEFAULT_CHAT_TEXT_COLOR),
      { syncInput: false }
    );
    chatTextHexInput.classList.remove("is-invalid");
    scheduleChatTextColorApply();
    return;
  }

  chatTextHexInput.classList.toggle("is-invalid", !isPendingHexInput(chatTextHexInput.value));
}

function handleHexKeyDown(event) {
  if (event.key === "Enter") {
    commitHexInput();
    hexInput.blur();
  }
}

function handleChatTextHexKeyDown(event) {
  if (event.key === "Enter") {
    commitChatTextHexInput();
    chatTextHexInput.blur();
  }
}

function handleHexBlur() {
  if (isValidHexInput(hexInput.value)) {
    commitHexInput();
    return;
  }

  updateColorUi(currentColor);
}

function handleChatTextHexBlur() {
  if (isValidHexInput(chatTextHexInput.value)) {
    commitChatTextHexInput();
    return;
  }

  updateChatTextColorUi(currentChatTextColor);
}

async function handleResetColor() {
  updateColorUi(DEFAULT_CHAT_BOX_COLOR);
  await applyCurrentOptions();
}

async function handleResetChatTextColor() {
  updateChatTextColorUi(DEFAULT_CHAT_TEXT_COLOR);
  await applyCurrentOptions();
}

async function handleResetChatFontSize() {
  updateChatFontSizeUi(CHAT_FONT_SIZE_PT_DEFAULT);
  await applyCurrentOptions();
}

async function handleResetNicknameFontSize() {
  updateNicknameFontSizeUi(CHAT_FONT_SIZE_PT_DEFAULT);
  await applyCurrentOptions();
}

async function init() {
  const options = await getStoredOptions();
  setControls(options);
  await applyToActiveTab(options);

  for (const id of controlIds) {
    controls[id].addEventListener("change", handleControlChange);
  }

  for (const button of tabButtons) {
    button.addEventListener("click", () => {
      selectTab(button.dataset.tabTarget);
    });
  }

  colorField.addEventListener("pointerdown", handleColorFieldPointerDown);
  colorField.addEventListener("pointermove", handleColorFieldPointerMove);
  hueSlider.addEventListener("input", handleHueChange);
  chatTextColorField.addEventListener("pointerdown", handleChatTextColorFieldPointerDown);
  chatTextColorField.addEventListener("pointermove", handleChatTextColorFieldPointerMove);
  chatTextHueSlider.addEventListener("input", handleChatTextHueChange);
  toggleChatBoxColorPanelButton.addEventListener("click", handleChatBoxColorPanelToggle);
  toggleChatFontSizePanelButton.addEventListener("click", handleChatFontSizePanelToggle);
  toggleChatTextStylePanelButton.addEventListener("click", handleChatTextStylePanelToggle);
  toggleChatTextColorPanelButton.addEventListener("click", handleChatTextColorPanelToggle);
  chatFontSizeSlider.addEventListener("input", handleChatFontSizeInput);
  resetChatFontSizeButton.addEventListener("click", handleResetChatFontSize);
  nicknameFontSizeSlider.addEventListener("input", handleNicknameFontSizeInput);
  resetNicknameFontSizeButton.addEventListener("click", handleResetNicknameFontSize);
  hexInput.addEventListener("input", handleHexInput);
  hexInput.addEventListener("keydown", handleHexKeyDown);
  hexInput.addEventListener("blur", handleHexBlur);
  chatTextHexInput.addEventListener("input", handleChatTextHexInput);
  chatTextHexInput.addEventListener("keydown", handleChatTextHexKeyDown);
  chatTextHexInput.addEventListener("blur", handleChatTextHexBlur);
  resetColorButton.addEventListener("click", handleResetColor);
  resetChatTextColorButton.addEventListener("click", handleResetChatTextColor);
}

init().catch(() => {
  setControls(DEFAULT_OPTIONS);
  setStatus("초기화 실패");
});
