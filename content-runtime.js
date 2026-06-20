function syncGuestChatUi() {
  if (uiSyncTimer) {
    window.clearTimeout(uiSyncTimer);
    uiSyncTimer = 0;
  }

  syncMiniFloatingChatPanel();
  syncGuestChatFrame();
  ensureGuestChatToggleButton();
}

function scheduleGuestChatUiSync() {
  if (uiSyncTimer) {
    return;
  }

  uiSyncTimer = window.setTimeout(() => {
    uiSyncTimer = 0;
    syncGuestChatUi();
  }, UI_SYNC_DELAY_MS);
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
        scheduleGuestChatUiSync();
      } else {
        scheduleScan();
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
  connectMiniChatInputOnlyScrollGuard();

  const cachedOptions = readCachedOptions();

  if (cachedOptions) {
    applyOptions(cachedOptions, { markAsReady: false, cache: false, source: "page-cache" });
    scan();
  }

  connectObserver();
  window.addEventListener("resize", scheduleGuestChatUiSync);
  document.addEventListener("fullscreenchange", handleMiniChatFullscreenChange);
  syncGuestChatTheme();
  scheduleScan();
  loadStoredOptions(1, { allowFallback: true });

  if (!scanIntervalTimer) {
    scanIntervalTimer = window.setInterval(scan, SCAN_INTERVAL_MS);
  }

  if (!themeSyncTimer) {
    themeSyncTimer = window.setInterval(syncGuestChatTheme, THEME_SYNC_INTERVAL_MS);
  }
}

if (CHZZK_CHAT_UI_TOGGLE_SHOULD_START && !window[GLOBAL_KEY]) {
  window[GLOBAL_KEY] = true;
  start();
}
