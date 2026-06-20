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
    useNicknameColorForMessage: options?.useNicknameColorForMessage === true,
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
