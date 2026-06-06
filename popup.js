const STORAGE_KEY = "chzzkChatUiToggleOptions";
const CONTENT_VERSION = "0.1.7";
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

const controlIds = ["showNicknames", "showBadges", "showTimestamps", "showChatBoxes", "showLargeText", "showBoldText"];
const controls = Object.fromEntries(controlIds.map((id) => [id, document.getElementById(id)]));
const tabButtons = [...document.querySelectorAll("[data-tab-target]")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];
const colorPreview = document.getElementById("colorPreview");
const hexInput = document.getElementById("chatBoxColorHex");
const resetColorButton = document.getElementById("resetChatBoxColor");
const colorField = document.getElementById("colorField");
const colorFieldHandle = document.getElementById("colorFieldHandle");
const hueSlider = document.getElementById("hueSlider");
const statusElement = document.getElementById("status");

let currentColor = DEFAULT_CHAT_BOX_COLOR;
let hsv = { hue: 0, saturation: 0, value: 0.5 };
let colorApplyTimer = 0;

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
  currentColor = normalizeHexColor(hexColor);
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

function setControls(options) {
  const normalized = normalizeOptions(options);

  for (const id of controlIds) {
    controls[id].checked = normalized[id];
  }

  updateColorUi(normalized.chatBoxColor);
}

function readControls() {
  return normalizeOptions({
    showNicknames: controls.showNicknames.checked,
    showBadges: controls.showBadges.checked,
    showTimestamps: controls.showTimestamps.checked,
    showChatBoxes: controls.showChatBoxes.checked,
    showLargeText: controls.showLargeText.checked,
    showBoldText: controls.showBoldText.checked,
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

function executeContentScript(tabId) {
  return new Promise((resolve) => {
    if (!chrome.scripting?.executeScript) {
      resolve(false);
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId, allFrames: true },
        files: ["content.js"]
      },
      () => {
        resolve(!chrome.runtime.lastError);
      }
    );
  });
}

function getContentDomStatus(tabId) {
  return new Promise((resolve) => {
    if (!chrome.scripting?.executeScript) {
      resolve(null);
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId, allFrames: true },
        func: () => ({
          version: document.documentElement.dataset.chzzkChatUiToggleVersion || null,
          styleVersion: document.getElementById("chzzk-chat-ui-toggle-style")?.dataset.chzzkChatUiToggleVersion || null
        })
      },
      (results) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }

        resolve(results?.map((result) => result.result) ?? null);
      }
    );
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

async function hasCurrentContentDom(tabId) {
  const statuses = await getContentDomStatus(tabId);

  return Array.isArray(statuses) && statuses.some(isCurrentContentStatus);
}

async function ensureCurrentContentScript(tabId) {
  let status = await getContentStatus(tabId);

  if (isCurrentContentStatus(status) || await hasCurrentContentDom(tabId)) {
    return true;
  }

  if (status?.version === CONTENT_VERSION) {
    status = await refreshContent(tabId);
    return isCurrentContentStatus(status) || await hasCurrentContentDom(tabId);
  }

  const injected = await executeContentScript(tabId);

  if (!injected) {
    return false;
  }

  status = await getContentStatus(tabId);
  return isCurrentContentStatus(status) || await hasCurrentContentDom(tabId);
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

async function handleControlChange() {
  await applyCurrentOptions();
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

function handleColorFieldPointerDown(event) {
  colorField.setPointerCapture(event.pointerId);
  updateColorFromField(event);
}

function handleColorFieldPointerMove(event) {
  if (colorField.hasPointerCapture(event.pointerId)) {
    updateColorFromField(event);
  }
}

function handleHueChange() {
  setColorFromHsv({
    hue: Number(hueSlider.value),
    saturation: hsv.saturation,
    value: hsv.value
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

function handleHexKeyDown(event) {
  if (event.key === "Enter") {
    commitHexInput();
    hexInput.blur();
  }
}

function handleHexBlur() {
  if (isValidHexInput(hexInput.value)) {
    commitHexInput();
    return;
  }

  updateColorUi(currentColor);
}

async function handleResetColor() {
  updateColorUi(DEFAULT_CHAT_BOX_COLOR);
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
  hexInput.addEventListener("input", handleHexInput);
  hexInput.addEventListener("keydown", handleHexKeyDown);
  hexInput.addEventListener("blur", handleHexBlur);
  resetColorButton.addEventListener("click", handleResetColor);
}

init().catch(() => {
  setControls(DEFAULT_OPTIONS);
  setStatus("초기화 실패");
});
