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
