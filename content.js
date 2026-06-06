(() => {
  const GLOBAL_KEY = "__chzzkChatUiToggleLoaded";

  if (window[GLOBAL_KEY]) {
    return;
  }

  window[GLOBAL_KEY] = true;

  const STORAGE_KEY = "chzzkChatUiToggleOptions";
  const ROLE_ATTR = "data-chzzk-chat-ui-toggle-role";
  const STYLE_ID = "chzzk-chat-ui-toggle-style";
  const CACHE_KEY = "chzzkChatUiToggleOptionsCache";
  const SCAN_DELAY_MS = 0;
  const SCAN_INTERVAL_MS = 2000;
  const GENERATED_TIMESTAMP_ATTR = "data-chzzk-chat-ui-toggle-generated-timestamp";
  const MESSAGE_PREFIX_ATTR = "data-chzzk-chat-ui-toggle-prefix";

  const DEFAULT_OPTIONS = {
    showNicknames: true,
    showBadges: true,
    showTimestamps: true,
    showChatBoxes: true
  };

  const DATASET_KEYS = {
    showNicknames: "chzzkChatUiToggleNicknames",
    showBadges: "chzzkChatUiToggleBadges",
    showTimestamps: "chzzkChatUiToggleTimestamps",
    showChatBoxes: "chzzkChatUiToggleChatBoxes"
  };

  const CHAT_ROOT_SELECTORS = [
    "[class*='live_chatting' i]",
    "[class*='chatting_area' i]",
    "[class*='chatting_list' i]",
    "[class*='chat_list' i]",
    "[class*='chat_area' i]",
    "[role='log']",
    "[aria-live]"
  ];

  const CHAT_ROW_SELECTORS = [
    "[class*='chatting_list_item' i]",
    "[class*='chatting_item' i]",
    "[class*='chat_item' i]",
    "[class*='live_chatting_list_item' i]",
    "[class*='message_item' i]",
    "[class*='message_container' i]",
    "[class*='chatting_message' i]",
    "[class*='live_chatting_message' i]",
    "[role='listitem']",
    "li"
  ];

  const TARGET_SELECTORS = {
    nickname: [
      "[data-testid*='nickname' i]",
      "[data-testid*='user-name' i]",
      "[data-testid*='username' i]",
      "[aria-label*='닉네임' i]",
      "[class*='nickname' i]",
      "[class*='user_name' i]",
      "[class*='username' i]",
      "[class*='name_text' i]",
      "[class*='chatting_name' i]",
      "[class*='author' i]"
    ],
    badge: [
      "[data-testid*='badge' i]",
      "[aria-label*='배지' i]",
      "[alt*='배지' i]",
      "[class*='badge' i]",
      "[class*='grade' i]",
      "img[src*='badge' i]",
      "img[src*='profile_image' i]",
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

  let currentOptions = { ...DEFAULT_OPTIONS };
  let scanTimer = 0;
  let observer = null;

  function getRuntime() {
    if (typeof chrome === "undefined") {
      return null;
    }

    return chrome;
  }

  function normalizeOptions(options) {
    return {
      showNicknames: options?.showNicknames !== false,
      showBadges: options?.showBadges !== false,
      showTimestamps: options?.showTimestamps !== false,
      showChatBoxes: options?.showChatBoxes !== false
    };
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

  function readOptions() {
    const runtime = getRuntime();

    if (!runtime?.storage?.local) {
      return Promise.resolve({ ...DEFAULT_OPTIONS });
    }

    return new Promise((resolve) => {
      runtime.storage.local.get(STORAGE_KEY, (result) => {
        resolve(normalizeOptions(result?.[STORAGE_KEY]));
      });
    });
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html:not([data-chzzk-chat-ui-toggle-ready="true"])
        [class*="live_chatting_list_item" i] {
        visibility: hidden !important;
      }

      .chzzk-chat-ui-toggle-timestamp {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        margin-right: 4px;
        color: color-mix(in srgb, currentColor 62%, transparent);
        font-size: 0.9em;
        line-height: inherit;
        white-space: nowrap;
        user-select: none;
      }

      html[data-chzzk-chat-ui-toggle-chat-boxes="on"]
        [class*="live_chatting_list_item" i]:has([class*="live_chatting_message_container" i]) {
        width: calc(100% - 16px) !important;
        margin: 3px 8px !important;
        padding: 4px 8px !important;
        border-radius: 8px !important;
        background: rgba(128, 128, 128, 0.18) !important;
        box-sizing: border-box !important;
      }

      html[data-chzzk-chat-ui-toggle-chat-boxes="on"]
        [class*="live_chatting_list_item" i]:has([class*="live_chatting_message_container" i]):hover {
        background: rgba(128, 128, 128, 0.24) !important;
      }

      html[data-chzzk-chat-ui-toggle-timestamps="on"]
        [class*="live_chatting_list_item" i]:has([class*="live_chatting_message_nickname" i]):not(:has(.chzzk-chat-ui-toggle-timestamp)) {
        visibility: hidden !important;
      }

      html[data-chzzk-chat-ui-toggle-nicknames="off"]
        [class*="live_chatting_list_item" i]
        [class*="live_chatting_username_nickname" i],
      html[data-chzzk-chat-ui-toggle-nicknames="off"]
        [class*="live_chatting_list_item" i]
        [class*="name_text" i] {
        display: none !important;
      }

      html[data-chzzk-chat-ui-toggle-badges="off"]
        [class*="live_chatting_list_item" i]
        button[class*="live_chatting_message_nickname" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        [class*="live_chatting_list_item" i]
        [class*="live_chatting_username_container" i] {
        column-gap: 0 !important;
        gap: 0 !important;
      }

      html[data-chzzk-chat-ui-toggle-badges="off"]
        [class*="live_chatting_list_item" i]
        button[class*="live_chatting_message_nickname" i]
        [class*="live_chatting_username_wrapper" i]:has(img, svg),
      html[data-chzzk-chat-ui-toggle-badges="off"]
        [class*="live_chatting_list_item" i]
        button[class*="live_chatting_message_nickname" i]
        [class*="live_chatting_username_icon" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        [class*="live_chatting_list_item" i]
        button[class*="live_chatting_message_nickname" i]
        [class*="badge_container" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        [class*="live_chatting_list_item" i]
        button[class*="live_chatting_message_nickname" i]
        img[src*="badge" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        [class*="live_chatting_list_item" i]
        button[class*="live_chatting_message_nickname" i]
        img[src*="profile_image" i],
      html[data-chzzk-chat-ui-toggle-badges="off"]
        [class*="live_chatting_list_item" i]
        button[class*="live_chatting_message_nickname" i]
        svg {
        display: none !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      html[data-chzzk-chat-ui-toggle-nicknames="off"] [${ROLE_ATTR}~="nickname"],
      html[data-chzzk-chat-ui-toggle-badges="off"] [${ROLE_ATTR}~="badge"],
      html[data-chzzk-chat-ui-toggle-timestamps="off"] [${ROLE_ATTR}~="timestamp"] {
        display: none !important;
      }

      html[data-chzzk-chat-ui-toggle-badges="off"] [${MESSAGE_PREFIX_ATTR}] {
        column-gap: 0 !important;
        gap: 0 !important;
      }

      html[data-chzzk-chat-ui-toggle-badges="off"] [${ROLE_ATTR}~="badge"] {
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function applyOptions(options) {
    currentOptions = normalizeOptions(options);
    writeCachedOptions(currentOptions);
    document.documentElement.dataset.chzzkChatUiToggleReady = "true";

    for (const [optionKey, datasetKey] of Object.entries(DATASET_KEYS)) {
      document.documentElement.dataset[datasetKey] = currentOptions[optionKey] ? "on" : "off";
    }
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

  function hasChatLikeText(element) {
    const text = element.textContent?.trim() ?? "";

    return text.length > 0 && text.length < 1000;
  }

  function getChatRoots() {
    const roots = queryAllSafe(document, CHAT_ROOT_SELECTORS)
      .filter(hasChatLikeText)
      .slice(0, 20);

    return roots.length > 0 ? roots : [document.body ?? document.documentElement];
  }

  function getChatRows(root) {
    const rows = queryAllSafe(root, CHAT_ROW_SELECTORS)
      .filter((element) => element instanceof HTMLElement)
      .filter(hasChatLikeText)
      .slice(-250);

    return rows.length > 0 ? rows : [root];
  }

  function addRole(element, role) {
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
      return;
    }

    if (element === document.documentElement || element === document.body) {
      return;
    }

    const roles = new Set((element.getAttribute(ROLE_ATTR) ?? "").split(/\s+/).filter(Boolean));
    roles.add(role);
    element.setAttribute(ROLE_ATTR, [...roles].join(" "));
  }

  function looksLikeTimestamp(element) {
    const text = element.textContent?.trim() ?? "";

    return /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(text);
  }

  function formatTimestamp(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  function getClassName(element) {
    return String(element.getAttribute("class") ?? "");
  }

  function getMessageTextElement(row) {
    return row.querySelector("[class*='message_text' i], [class*='chatting_message_text' i]");
  }

  function isBeforeMessageText(row, element) {
    const messageText = getMessageTextElement(row);

    if (!messageText) {
      return true;
    }

    if (messageText.contains(element)) {
      return false;
    }

    return Boolean(element.compareDocumentPosition(messageText) & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  function isLikelyBadge(element) {
    const tagName = element.tagName.toLowerCase();
    const className = getClassName(element);
    const source = String(element.getAttribute("src") ?? "");
    const alt = String(element.getAttribute("alt") ?? "");
    const label = String(element.getAttribute("aria-label") ?? "");

    if (/badge|grade/i.test(className) || /배지/.test(alt) || /배지/.test(label)) {
      return true;
    }

    if (tagName === "img" && /badge|profile_image|emblem|grade/i.test(source)) {
      return true;
    }

    return tagName === "svg" && /badge|grade/i.test(className);
  }

  function isLikelyNickname(element) {
    const tagName = element.tagName.toLowerCase();
    const className = getClassName(element);
    const testId = String(element.getAttribute("data-testid") ?? "");
    const label = String(element.getAttribute("aria-label") ?? "");
    const text = element.textContent?.trim() ?? "";

    if (!text || text.length > 80 || looksLikeTimestamp(element)) {
      return false;
    }

    if (element.querySelector("img, svg, [class*='badge' i], [class*='icon' i]")) {
      return false;
    }

    if (/container|wrapper|icon|badge|grade|profile/i.test(className)) {
      return false;
    }

    if (tagName === "button" && element.childElementCount > 0) {
      return false;
    }

    if (/닉네임/.test(label)) {
      return true;
    }

    return /username_nickname|(?:^|[_-])nickname(?:__|[_-]|$)|name_text|chatting_name|author/i.test(
      `${className} ${testId}`
    );
  }

  function annotateSelectorTargets(row, role) {
    const candidates = queryAllSafe(row, TARGET_SELECTORS[role]);
    const nicknameCandidates =
      role === "nickname" ? candidates.filter((element) => isLikelyNickname(element)) : [];

    for (const element of candidates) {
      if (role === "timestamp" && !looksLikeTimestamp(element)) {
        continue;
      }

      if (role === "badge" && (!isBeforeMessageText(row, element) || !isLikelyBadge(element))) {
        continue;
      }

      if (role === "nickname" && !isLikelyNickname(element)) {
        continue;
      }

      if (role === "nickname" && nicknameCandidates.some((candidate) => candidate !== element && element.contains(candidate))) {
        continue;
      }

      addRole(element, role);

      if (role === "badge") {
        annotateBadgeAncestors(row, element);
      }
    }
  }

  function annotateTimestampLeaves(row) {
    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.textContent?.trim() ?? "";

        if (!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(text)) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;

        if (!parent || parent.childElementCount > 0 || parent.textContent?.trim() !== text) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const parents = [];
    let node = walker.nextNode();

    while (node) {
      if (node.parentElement) {
        parents.push(node.parentElement);
      }

      node = walker.nextNode();
    }

    parents.forEach((element) => addRole(element, "timestamp"));
  }

  function hasTimestamp(row) {
    return Boolean(row.querySelector(`[${ROLE_ATTR}~="timestamp"], [${GENERATED_TIMESTAMP_ATTR}]`));
  }

  function isChatMessageRow(row) {
    if (!(row instanceof HTMLElement)) {
      return false;
    }

    const className = getClassName(row);

    if (/fixed|header|input|textarea|notice|banner/i.test(className)) {
      return false;
    }

    const nickname = queryAllSafe(row, TARGET_SELECTORS.nickname).find(isLikelyNickname);
    const messageText = getMessageTextElement(row);

    return Boolean(nickname && messageText);
  }

  function getNicknameTextElement(row) {
    const candidates = queryAllSafe(row, TARGET_SELECTORS.nickname).filter(isLikelyNickname);

    return candidates.find((element) => !candidates.some((candidate) => candidate !== element && element.contains(candidate)));
  }

  function getMessagePrefixAnchor(row, nickname) {
    let anchor = nickname;
    let current = nickname;

    while (current.parentElement && current.parentElement !== row) {
      const parent = current.parentElement;
      const parentClass = getClassName(parent);

      if (getMessageTextElement(row)?.contains(parent)) {
        break;
      }

      if (/message_nickname|username_container|chatting_name|author|nickname/i.test(parentClass)) {
        anchor = parent;
      }

      current = parent;
    }

    if (anchor instanceof HTMLElement) {
      anchor.setAttribute(MESSAGE_PREFIX_ATTR, "true");
    }

    return anchor;
  }

  function ensureGeneratedTimestamp(row) {
    if (!isChatMessageRow(row) || hasTimestamp(row)) {
      return;
    }

    const nickname = getNicknameTextElement(row);

    if (!nickname?.parentElement) {
      return;
    }

    const anchor = getMessagePrefixAnchor(row, nickname);

    const timestamp = document.createElement("span");
    timestamp.className = "chzzk-chat-ui-toggle-timestamp";
    timestamp.textContent = formatTimestamp(new Date());
    timestamp.setAttribute(GENERATED_TIMESTAMP_ATTR, "true");
    addRole(timestamp, "timestamp");

    anchor.insertAdjacentElement("beforebegin", timestamp);
  }

  function annotateBadgeAncestors(row, element) {
    let current = element.parentElement;
    let depth = 0;

    while (current && current !== row && depth < 4) {
      if (!isBeforeMessageText(row, current)) {
        break;
      }

      const className = getClassName(current);
      const text = current.textContent?.trim() ?? "";
      const hasMedia = Boolean(current.querySelector("img, svg"));

      if (/badge|grade|profile|icon/i.test(className) || (hasMedia && text.length === 0)) {
        addRole(current, "badge");
        current = current.parentElement;
        depth += 1;
        continue;
      }

      break;
    }
  }

  function annotateLeadingBadges(row) {
    const mediaCandidates = [...row.querySelectorAll("img, svg")]
      .filter((element) => element instanceof HTMLElement || element instanceof SVGElement)
      .filter((element) => isBeforeMessageText(row, element))
      .slice(0, 8);

    for (const element of mediaCandidates) {
      if (isLikelyBadge(element)) {
        addRole(element, "badge");
        annotateBadgeAncestors(row, element);
      }
    }
  }

  function scan() {
    const roots = getChatRoots();

    for (const root of roots) {
      for (const row of getChatRows(root)) {
        annotateSelectorTargets(row, "timestamp");
        annotateTimestampLeaves(row);
        ensureGeneratedTimestamp(row);
        annotateSelectorTargets(row, "badge");
        annotateLeadingBadges(row);
        annotateSelectorTargets(row, "nickname");
      }
    }
  }

  function scheduleScan() {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(scan, SCAN_DELAY_MS);
  }

  function connectObserver() {
    const target = document.body ?? document.documentElement;

    if (observer || !target) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
        scheduleScan();
      }
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });
  }

  function connectMessages() {
    const runtime = getRuntime();

    if (!runtime?.runtime?.onMessage) {
      return;
    }

    runtime.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "CHZZK_CHAT_UI_TOGGLE_GET_OPTIONS") {
        sendResponse({ ok: true, options: currentOptions });
        return false;
      }

      if (message?.type === "CHZZK_CHAT_UI_TOGGLE_SET_OPTIONS") {
        applyOptions(message.options);
        scheduleScan();
        sendResponse({ ok: true, options: currentOptions });
        return false;
      }

      return false;
    });
  }

  function connectStorageListener() {
    const runtime = getRuntime();

    if (!runtime?.storage?.onChanged) {
      return;
    }

    runtime.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes[STORAGE_KEY]) {
        return;
      }

      applyOptions(changes[STORAGE_KEY].newValue);
      scheduleScan();
    });
  }

  function start() {
    injectStyle();

    const cachedOptions = readCachedOptions();

    if (cachedOptions) {
      applyOptions(cachedOptions);
    }

    connectObserver();
    scheduleScan();

    readOptions().then((options) => {
      applyOptions(options);
      scan();
      connectMessages();
      connectStorageListener();
      window.setInterval(scan, SCAN_INTERVAL_MS);
    });
  }

  start();
})();
