function injectStyle() {
  // Styles are loaded through manifest content.css. This marker is used by the popup/status check.
  document.documentElement.dataset.chzzkChatUiToggleStyleVersion = SCRIPT_VERSION;
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
  document.documentElement.dataset.chzzkChatUiToggleChatTextColor = currentOptions.chatTextColor;
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
    "--chzzk-chat-ui-toggle-chat-text-color",
    currentOptions.chatTextColor
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
  annotateNonChatPanels();
  annotateMiniChatHiddenControls();
  scheduleLargeTextLayoutSync();

  if (markAsReady) {
    markReady();
  }
}

function getStatus() {
  return {
    ok: true,
    version: SCRIPT_VERSION,
    styleVersion: document.documentElement.dataset.chzzkChatUiToggleStyleVersion || null,
    options: currentOptions,
    optionsSource: lastOptionsSource,
    optionsLoadError: lastOptionsLoadError,
    guestChatTheme: currentGuestChatTheme,
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
    // Credentialless guest chat frames use isolated temporary storage.
    // Keep only the extension-created read-only guest frame on CHZZK's local display setting.
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
