var chatRowAnnotationSnapshots = new WeakMap();
var randomNicknameChannel = null;
var randomNicknameCache = new Map();
var randomNicknamePending = new Map();
var randomNicknameTimer = 0;
var randomNicknameInFlight = false;
var randomNicknameRetryAt = 0;
var RANDOM_NICKNAME_ATTR = "data-chzzk-chat-ui-toggle-random-name";
var RANDOM_NICKNAME_PENDING_ATTR = "data-chzzk-chat-ui-toggle-random-name-pending";
var RANDOM_NICKNAME_SELECTOR = `[${RANDOM_NICKNAME_ATTR}], [${RANDOM_NICKNAME_PENDING_ATTR}]`;

function isStreamerChatRow(row) {
  const message = getMessageTextElement(row);
  const markers = [row, ...row.querySelectorAll("img, svg, [data-user-role], [data-role], [aria-label], [title]")];
  return markers.some((element) => {
    if (message && (element === message || message.contains(element))) return false;
    const role = element.getAttribute("data-user-role") || element.getAttribute("data-role") || "";
    if (/^(streamer|broadcaster|channel_owner)$/i.test(role)) return true;
    const label = element.getAttribute("alt") || element.getAttribute("aria-label") || element.getAttribute("title") || "";
    if (/^(스트리머|방송자|채널 소유자|streamer|broadcaster)(?:\s*배지)?$/i.test(label.trim())) return true;
    return element.tagName === "IMG" && /(?:^|[\/_.-])(?:streamer|broadcaster)(?:[\/_.-]|$)/i.test(element.getAttribute("src") || "");
  });
}

function setRandomNickname(element, entry) {
  if (!element.hasAttribute(RANDOM_NICKNAME_ATTR)) {
    element.style.setProperty("--chzzk-random-name-font", getComputedStyle(element).fontSize);
  }
  const label = currentOptions.randomNicknameMode === "custom"
    ? `${currentOptions.randomNicknamePrefix} ${entry.number}` : entry.label.replace(/\s*·\s*(?=\d+$)/, " ");
  if (element.getAttribute(RANDOM_NICKNAME_ATTR) !== label) element.setAttribute(RANDOM_NICKNAME_ATTR, label);
  element.removeAttribute(RANDOM_NICKNAME_PENDING_ATTR);
}

function clearRandomNickname(element) {
  element.removeAttribute(RANDOM_NICKNAME_ATTR);
  element.removeAttribute(RANDOM_NICKNAME_PENDING_ATTR);
  element.style.removeProperty("--chzzk-random-name-font");
}

function flushRandomNicknames() {
  randomNicknameTimer = 0;
  if (randomNicknameInFlight || !randomNicknamePending.size) return;
  const channelId = randomNicknameChannel;
  const batch = [...randomNicknamePending].slice(0, 250);
  for (const [name] of batch) randomNicknamePending.delete(name);
  randomNicknameInFlight = true;
  const complete = (response) => {
    randomNicknameInFlight = false;
    if (channelId !== getCurrentChannelId()) {
      if (randomNicknamePending.size) randomNicknameTimer = window.setTimeout(flushRandomNicknames, 50);
      return;
    }
    if (!response?.ok) {
      randomNicknameRetryAt = Date.now() + 5000;
      randomNicknamePending.clear();
      return;
    }
    const entries = new Map(response.entries);
    for (const [name, elements] of batch) {
      const entry = entries.get(name);
      if (!entry || typeof entry.label !== "string" || !Number.isSafeInteger(entry.number)) continue;
      randomNicknameCache.set(name, entry);
      for (const element of elements) {
        const row = element.closest(`[${CHAT_ROW_ATTR}="true"]`);
        if (element.isConnected && currentOptions.useRandomNicknames && currentOptions.showNicknames &&
            element.textContent.trim() === name && row && !isStreamerChatRow(row)) {
          setRandomNickname(element, entry);
          scheduleLargeTextLayoutSync([row]);
        }
      }
    }
    // Only visible/recent names need a frame-local cache; the shared session owns identity.
    while (randomNicknameCache.size > 2000) randomNicknameCache.delete(randomNicknameCache.keys().next().value);
    if (randomNicknamePending.size) randomNicknameTimer = window.setTimeout(flushRandomNicknames, 50);
  };
  try {
    getRuntime().runtime.sendMessage({ type: "CHZZK_CHAT_UI_TOGGLE_RANDOM_NAMES", channelId, names: batch.map(([name]) => name) }, (response) => {
      complete(getRuntime()?.runtime?.lastError ? null : response);
    });
  } catch (_error) { complete(null); }
}

function syncRandomNickname(row) {
  if (!currentOptions.useRandomNicknames) {
    for (const element of row.querySelectorAll(RANDOM_NICKNAME_SELECTOR)) clearRandomNickname(element);
    return;
  }
  const channelId = getCurrentChannelId();
  if (channelId !== randomNicknameChannel) {
    randomNicknameChannel = channelId;
    randomNicknameCache.clear();
    randomNicknamePending.clear();
    randomNicknameRetryAt = 0;
  }
  const nickname = getNicknameTextElement(row);
  const enabled = currentOptions.useRandomNicknames && currentOptions.showNicknames && channelId && !isStreamerChatRow(row);
  for (const element of row.querySelectorAll(RANDOM_NICKNAME_SELECTOR)) {
    if (!enabled || element !== nickname) clearRandomNickname(element);
  }
  if (!enabled || !nickname) return;
  const name = nickname.textContent.trim();
  if (!name || name.length > 128) return;
  const entry = randomNicknameCache.get(name);
  if (entry) { setRandomNickname(nickname, entry); return; }
  clearRandomNickname(nickname);
  // Hide only the native name while the batched allocation is pending, including
  // retries and recycled rows. The rest of the chat stays visible and untouched.
  nickname.setAttribute(RANDOM_NICKNAME_PENDING_ATTR, "true");
  if (Date.now() < randomNicknameRetryAt) return;
  if (randomNicknamePending.size >= 1000 && !randomNicknamePending.has(name)) return;
  if (!randomNicknamePending.has(name)) randomNicknamePending.set(name, new Set());
  for (const element of randomNicknamePending.get(name)) {
    if (!element.isConnected) randomNicknamePending.get(name).delete(element);
  }
  randomNicknamePending.get(name).add(nickname);
  if (!randomNicknameTimer && !randomNicknameInFlight) randomNicknameTimer = window.setTimeout(flushRandomNicknames, 50);
}
var miniChatAnnotationPass = null;
var MINI_CHAT_ANNOTATION_ATTRIBUTES = [
  MINI_CHAT_HIDDEN_CONTROL_ATTR,
  MINI_CHAT_TRANSPARENT_SURFACE_ATTR,
  MINI_CHAT_COMPACT_INPUT_ATTR,
  MINI_CHAT_INPUT_ONLY_PATH_ATTR,
  MINI_CHAT_INPUT_ONLY_KEEP_ATTR,
  MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR,
  MINI_CHAT_INPUT_ONLY_LAYOUT_HIDDEN_ATTR
];

function hasChatLikeText(element) {
  const text = element.textContent?.trim() ?? "";

  return text.length > 0 && text.length < 1000;
}

function getChatRoots() {
  const candidates = queryAllSafe(document, CHAT_ROOT_SELECTORS)
    .filter(hasChatLikeText)
    .map((root) => {
      let depth = 0;

      for (let current = root.parentElement; current; current = current.parentElement) {
        depth += 1;
      }

      return { root, depth };
    })
    .sort((first, second) => first.depth - second.depth);
  const roots = [];

  for (const { root } of candidates) {
    if (roots.some((candidate) => candidate.contains(root))) {
      continue;
    }

    roots.push(root);

    if (roots.length >= 20) {
      break;
    }
  }

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

function removeAnnotations(element) {
  if (element instanceof HTMLElement) clearRandomNickname(element);
  element.removeAttribute(ROLE_ATTR);
  element.removeAttribute(MESSAGE_PREFIX_ATTR);
  element.removeAttribute(MESSAGE_TEXT_ATTR);
  element.removeAttribute(NICKNAME_COLOR_MESSAGE_ATTR);
  element.removeAttribute(AUTO_CONTRAST_ATTR);
  element.removeAttribute(MINI_CHAT_HIDDEN_CONTROL_ATTR);
  element.removeAttribute(MINI_CHAT_TRANSPARENT_SURFACE_ATTR);
  element.removeAttribute(NON_CHAT_PANEL_ATTR);
  element.removeAttribute(MINI_CHAT_COMPACT_INPUT_ATTR);
  element.removeAttribute(MINI_CHAT_INPUT_ONLY_PATH_ATTR);
  element.removeAttribute(MINI_CHAT_INPUT_ONLY_KEEP_ATTR);
  element.removeAttribute(MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR);

  if (element.getAttribute(CHAT_ROW_ATTR) === "true") {
    element.removeAttribute(CHAT_ROW_ATTR);
  }

  if (element instanceof HTMLElement) {
    element.style.removeProperty("--chzzk-chat-ui-toggle-nickname-color");
    clearAutoContrast(element);
    clearLargeTextRowLayout(element);
  }

  if (element.hasAttribute(GENERATED_TIMESTAMP_ATTR)) {
    element.remove();
  }
}

function getCompactText(element) {
  return (element.textContent || "").replace(/\s+/g, " ").trim();
}

function getMiniChatActionControls(root = document) {
  return queryAllSafe(root, [
    "button",
    "[role='button']",
    "a[href]"
  ]).filter((element) => element instanceof HTMLElement);
}

function beginMiniChatAnnotationPass() {
  miniChatAnnotationPass = new Map(
    MINI_CHAT_ANNOTATION_ATTRIBUTES.map((attribute) => [attribute, new Set()])
  );
}

function markMiniChatAnnotation(element, attribute) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  miniChatAnnotationPass?.get(attribute)?.add(element);

  if (element.getAttribute(attribute) !== "true") {
    element.setAttribute(attribute, "true");
  }
}

function finishMiniChatAnnotationPass() {
  const pass = miniChatAnnotationPass;

  miniChatAnnotationPass = null;

  if (!pass) {
    return;
  }

  const selector = MINI_CHAT_ANNOTATION_ATTRIBUTES
    .map((attribute) => `[${attribute}]`)
    .join(",");

  for (const element of document.querySelectorAll(selector)) {
    for (const attribute of MINI_CHAT_ANNOTATION_ATTRIBUTES) {
      if (element.hasAttribute(attribute) && !pass.get(attribute)?.has(element)) {
        element.removeAttribute(attribute);
      }
    }
  }
}

function markMiniChatHiddenControl(element) {
  markMiniChatAnnotation(element, MINI_CHAT_HIDDEN_CONTROL_ATTR);
}

function markMiniChatTransparentSurfaces() {
  const chatLog = queryAllSafe(document, [
    "aside#aside-chatting [role='log']",
    "aside:has([role='log']) [role='log']",
    "[role='log']"
  ]).find((element) => element instanceof HTMLElement);

  for (
    let current = chatLog, depth = 0;
    current instanceof HTMLElement && current !== document.body && depth < 12;
    current = current.parentElement, depth += 1
  ) {
    markMiniChatAnnotation(current, MINI_CHAT_TRANSPARENT_SURFACE_ATTR);
  }
}

function findMiniChatNativeHeader() {
  const knownHeader =
    typeof findChatHeaderTarget === "function"
      ? findChatHeaderTarget({ includeHidden: true })
      : null;

  if (knownHeader instanceof HTMLElement) {
    return knownHeader;
  }

  const chatLog = queryAllSafe(document, [
    "aside#aside-chatting [role='log']",
    "aside:has([role='log']) [role='log']",
    "[role='log']"
  ]).find((element) => element instanceof HTMLElement);
  const chatAside = chatLog?.closest("aside#aside-chatting, aside");

  if (!(chatLog instanceof HTMLElement) || !(chatAside instanceof HTMLElement)) {
    return null;
  }

  let logBranch = chatLog;

  while (logBranch.parentElement && logBranch.parentElement !== chatAside) {
    logBranch = logBranch.parentElement;
  }

  for (
    let candidate = logBranch.previousElementSibling;
    candidate instanceof HTMLElement;
    candidate = candidate.previousElementSibling
  ) {
    const text = getCompactText(candidate);
    const controlCount = getMiniChatActionControls(candidate).length;
    const hasExactChatTitle = [candidate, ...candidate.querySelectorAll(
      "h1, h2, h3, strong, [class*='title' i], [class*='text' i]"
    )].some((element) => getCompactText(element) === "채팅");
    const hasNestedChatUi = Boolean(
      candidate.querySelector("[role='log'], textarea, input, [contenteditable='true'], [role='textbox']")
    );

    if (
      !hasNestedChatUi &&
      text.startsWith("채팅") &&
      hasExactChatTitle &&
      (candidate.tagName === "HEADER" || controlCount >= 2 || /header/i.test(getClassName(candidate)))
    ) {
      return candidate;
    }
  }

  return null;
}

function markNonChatPanel(element) {
  if (element instanceof HTMLElement) {
    element.setAttribute(NON_CHAT_PANEL_ATTR, "true");
  }
}

function hasChatMessageContent(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  try {
    return Boolean(
      element.getAttribute("role") === "log" ||
      element.matches(NATIVE_CHAT_ROW_SELECTOR) ||
      element.querySelector(
        `[${CHAT_ROW_ATTR}="true"], [class*="live_chatting_message_container" i], [class*="_chatting_message_" i]`
      )
    );
  } catch (_error) {
    return false;
  }
}

function hasNonChatPanelSignal(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (isDonationRankingPanel(element)) {
    return true;
  }

  const text = getCompactText(element);
  const hasPredictionPanelText = /승부예측|참여\s*마감|파워가\s*걸린/u.test(text);
  const hasSportsPanelText = /스포츠\s*중계\s*정보|중계\s*정보\s*펼치기|(?:전반|후반)\s*\d+'?/u.test(text);

  if (hasPredictionPanelText) {
    return true;
  }

  if (!hasSportsPanelText) {
    return false;
  }

  try {
    return Boolean(
      element.querySelector("[aria-controls*='broadcast-information-sports' i], img[src*='sports-phinf' i]") ||
      element.matches("[aria-controls*='broadcast-information-sports' i], section")
    );
  } catch (_error) {
    return false;
  }
}

function isNonChatPanelCandidate(element) {
  return (
    element instanceof HTMLElement &&
    !hasMiniChatInputField(element) &&
    !hasChatMessageContent(element) &&
    hasNonChatPanelSignal(element)
  );
}

function findNonChatPanelRoot(element) {
  let candidate = element instanceof HTMLElement ? element : null;

  for (
    let current = candidate, depth = 0;
    current && current !== document.body && depth < 5;
    current = current.parentElement, depth += 1
  ) {
    if (!(current instanceof HTMLElement)) {
      break;
    }

    if (hasMiniChatInputField(current) || hasChatMessageContent(current)) {
      break;
    }

    if (hasNonChatPanelSignal(current)) {
      candidate = current;
    }

    const parent = current.parentElement;

    if (
      !(parent instanceof HTMLElement) ||
      parent === document.body ||
      parent.getAttribute("role") === "log" ||
      Boolean(parent.querySelector("[role='log']"))
    ) {
      break;
    }
  }

  return candidate;
}

function clearNonChatPanelAnnotations() {
  for (const element of document.querySelectorAll(`[${NON_CHAT_PANEL_ATTR}]`)) {
    element.removeAttribute(NON_CHAT_PANEL_ATTR);
  }
}

function annotateNonChatPanels() {
  clearNonChatPanelAnnotations();

  if (currentOptions.showNonChatPanels !== false) {
    return;
  }

  for (const element of queryAllSafe(document, NON_CHAT_PANEL_SELECTORS)) {
    const panel = findNonChatPanelRoot(element);

    if (isNonChatPanelCandidate(panel)) {
      markNonChatPanel(panel);
    }
  }
}

function hasMiniChatInputField(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  try {
    return Boolean(
      element.matches("textarea, input, [contenteditable='true'], [role='textbox']") ||
      element.querySelector("textarea, input, [contenteditable='true'], [role='textbox']")
    );
  } catch (_error) {
    return false;
  }
}

function isMiniChatTextEntryField(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  try {
    if (element instanceof HTMLInputElement) {
      const type = String(element.type || "text").toLowerCase();

      if (/^(?:button|checkbox|color|file|hidden|image|radio|range|reset|submit)$/.test(type)) {
        return false;
      }
    } else if (
      !(element instanceof HTMLTextAreaElement) &&
      element.getAttribute("contenteditable") !== "true" &&
      element.getAttribute("role") !== "textbox"
    ) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  } catch (_error) {
    return false;
  }
}

function isReasonableMiniChatInputContainer(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  try {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return (
      element !== document.documentElement &&
      element !== document.body &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.height <= 160 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  } catch (_error) {
    return false;
  }
}

function findMiniChatCompactInputContainer(actionRow) {
  let fallbackContainer = null;

  for (
    let current = actionRow.parentElement, depth = 0;
    current && current !== document.body && depth < 6;
    current = current.parentElement, depth += 1
  ) {
    if (!(current instanceof HTMLElement) || !hasMiniChatInputField(current)) {
      continue;
    }

    if (matchesAnySafe(current, MINI_CHAT_INPUT_CONTAINER_SELECTORS)) {
      return current;
    }

    fallbackContainer ??= current;
  }

  return fallbackContainer;
}

function isMiniChatInputFieldInChatContext(field) {
  if (closestAnySafe(field, MINI_CHAT_INPUT_CONTAINER_SELECTORS)) {
    return true;
  }

  for (
    let current = field.parentElement, depth = 0;
    current && current !== document.body && depth < 12;
    current = current.parentElement, depth += 1
  ) {
    if (
      matchesAnySafe(current, CHAT_ACTION_HOST_SELECTORS) &&
      (hasChatMessageContent(current) || current.querySelector("[role='log']"))
    ) {
      return true;
    }
  }

  return false;
}

function markMiniChatCompactInputContainer(actionRow) {
  const inputContainer = findMiniChatCompactInputContainer(actionRow);

  if (inputContainer instanceof HTMLElement) {
    markMiniChatAnnotation(inputContainer, MINI_CHAT_COMPACT_INPUT_ATTR);
  }
}

function findMiniChatInputOnlyContainer(root = document) {
  const inputFields = queryAllSafe(root, [
    "textarea",
    "input",
    "[contenteditable='true']",
    "[role='textbox']"
  ])
    .filter((element) => element instanceof HTMLElement)
    .filter(isMiniChatTextEntryField)
    .filter(isMiniChatInputFieldInChatContext);
  let fallbackContainer = null;
  let actionFallbackContainer = null;

  for (const field of inputFields) {
    for (
      let current = field.parentElement, depth = 0;
      current && current !== document.body && depth < 8;
      current = current.parentElement, depth += 1
    ) {
      if (!isReasonableMiniChatInputContainer(current)) {
        continue;
      }

      if (matchesAnySafe(current, MINI_CHAT_INPUT_CONTAINER_SELECTORS)) {
        return current;
      }

      if (!actionFallbackContainer && getMiniChatActionControls(current).length > 0) {
        actionFallbackContainer = current;
      }

      fallbackContainer ??= current;
    }
  }

  const inputContainers = queryAllSafe(root, MINI_CHAT_INPUT_CONTAINER_SELECTORS)
    .filter((element) => element instanceof HTMLElement)
    .filter(hasMiniChatInputField)
    .filter(isReasonableMiniChatInputContainer);

  if (inputContainers.length > 0) {
    return inputContainers[0];
  }

  return actionFallbackContainer || fallbackContainer;
}

function shouldLockMiniChatInputOnlyScroll() {
  return isMiniChatFrameEmbedUrl(window.location.href) && currentOptions.miniFloatingChatInputOnly === true;
}

function resetMiniChatInputOnlyScroll() {
  miniChatInputOnlyScrollFrame = 0;

  if (!shouldLockMiniChatInputOnlyScroll()) {
    return;
  }

  for (const scroller of [document.scrollingElement, document.documentElement, document.body]) {
    if (!(scroller instanceof Element)) {
      continue;
    }

    scroller.scrollTop = 0;
    scroller.scrollLeft = 0;
  }

  if (window.scrollX !== 0 || window.scrollY !== 0) {
    window.scrollTo(0, 0);
  }
}

function scheduleMiniChatInputOnlyScrollReset() {
  if (!shouldLockMiniChatInputOnlyScroll() || miniChatInputOnlyScrollFrame) {
    return;
  }

  miniChatInputOnlyScrollFrame = window.requestAnimationFrame(resetMiniChatInputOnlyScroll);
}

function connectMiniChatInputOnlyScrollGuard() {
  if (!isMiniChatFrameEmbedUrl(window.location.href)) {
    return;
  }

  document.addEventListener("focusin", scheduleMiniChatInputOnlyScrollReset, true);
  document.addEventListener("input", scheduleMiniChatInputOnlyScrollReset, true);
}

function shouldPreserveMiniChatInputOnlyLayout(element) {
  if (!(element instanceof HTMLElement) || hasMiniChatInputField(element)) {
    return false;
  }

  try {
    if (
      element.matches("[role='log']") ||
      element.querySelector("[role='log']") ||
      matchesAnySafe(element, CHAT_ROW_SELECTORS) ||
      queryAllSafe(element, CHAT_ROW_SELECTORS).length > 0
    ) {
      return true;
    }

    return Boolean(element.closest("aside")) &&
      Number.parseFloat(getComputedStyle(element).flexGrow) > 0;
  } catch (_error) {
    return false;
  }
}

function markMiniChatInputOnlyLayout() {
  const inputContainer = findMiniChatInputOnlyContainer();

  if (!(inputContainer instanceof HTMLElement)) {
    return;
  }

  markMiniChatAnnotation(inputContainer, MINI_CHAT_COMPACT_INPUT_ATTR);
  markMiniChatAnnotation(inputContainer, MINI_CHAT_INPUT_ONLY_KEEP_ATTR);

  for (
    let current = inputContainer;
    current && current !== document.body;
    current = current.parentElement
  ) {
    if (!(current instanceof HTMLElement)) {
      break;
    }

    if (current !== inputContainer) {
      markMiniChatAnnotation(current, MINI_CHAT_INPUT_ONLY_PATH_ATTR);
    }

    const parent = current.parentElement;

    if (!(parent instanceof HTMLElement)) {
      continue;
    }

    for (const sibling of parent.children) {
      if (sibling !== current && sibling instanceof HTMLElement) {
        markMiniChatAnnotation(
          sibling,
          shouldPreserveMiniChatInputOnlyLayout(sibling)
            ? MINI_CHAT_INPUT_ONLY_LAYOUT_HIDDEN_ATTR
            : MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR
        );
      }
    }
  }

  scheduleMiniChatInputOnlyScrollReset();
}

function findMiniChatActionControlRow(control) {
  for (
    let current = control.parentElement, depth = 0;
    current && current !== document.body && depth < 6;
    current = current.parentElement, depth += 1
  ) {
    const controls = getMiniChatActionControls(current);
    const text = getCompactText(current);

    if (
      controls.length >= 3 &&
      text.includes("후원하기") &&
      !text.includes("채팅을 입력") &&
      !hasMiniChatInputField(current)
    ) {
      return current;
    }
  }

  return null;
}

function annotateMiniChatHiddenControls() {
  if (!isMiniChatFrameEmbedUrl(window.location.href)) {
    return;
  }

  beginMiniChatAnnotationPass();

  try {
    markMiniChatHiddenControl(findMiniChatNativeHeader());
    markMiniChatTransparentSurfaces();

    const controls = getMiniChatActionControls();
    const donationControls = controls.filter((control) => getCompactText(control).includes("후원하기"));

    for (const control of donationControls) {
      const actionRow = findMiniChatActionControlRow(control);

      if (actionRow) {
        markMiniChatHiddenControl(actionRow);
        markMiniChatCompactInputContainer(actionRow);

        for (const rowControl of getMiniChatActionControls(actionRow)) {
          markMiniChatHiddenControl(rowControl);
        }
      } else {
        markMiniChatHiddenControl(control);
      }
    }

    for (const control of controls) {
      if (getCompactText(control) === "채팅") {
        markMiniChatHiddenControl(control);
      }
    }

    markMiniChatInputOnlyLayout();
  } finally {
    finishMiniChatAnnotationPass();
  }
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

function getMessageContainerElement(row) {
  return row.querySelector(
    "[class*='live_chatting_message_container' i], [class*='_chatting_message_' i]"
  );
}

function getNicknameButtonElement(row) {
  return row.querySelector(
    "button[class*='live_chatting_message_nickname' i], button[class*='nickname' i]"
  );
}

function getMessageTextElement(row) {
  const messageContainer = getMessageContainerElement(row);

  if (messageContainer instanceof HTMLElement) {
    const messageText = queryAllSafe(messageContainer, [
      "[class*='live_chatting_message_text' i]",
      "[class*='message_text' i]",
      "[class*='_text_' i]"
    ]).find((element) => !isInsideLiveChatNicknameShell(element));

    if (messageText instanceof HTMLElement) {
      return messageText;
    }
  }

  return row.querySelector("[class*='live_chatting_message_text' i], [class*='message_text' i]");
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

  if (tagName === "img" && /badge|emblem|grade|\/glive\/icon\//i.test(source)) {
    return true;
  }

  if ((tagName === "img" || tagName === "svg") && isInsideLiveChatNicknameShell(element)) {
    return true;
  }

  return tagName === "svg" && /badge|grade/i.test(className);
}

function isInsideLiveChatNicknameShell(element) {
  return Boolean(
    element.closest(
      "button[class*='live_chatting_message_nickname' i], [class*='live_chatting_username_container' i], button[class*='nickname' i]"
    )
  );
}

function isTimestampCandidate(row, element) {
  if (!looksLikeTimestamp(element)) {
    return false;
  }

  const messageText = getMessageTextElement(row);

  if (
    messageText &&
    (messageText === element || messageText.contains(element) || element.contains(messageText))
  ) {
    return false;
  }

  const nicknameButton = getNicknameButtonElement(row);

  return !(
    isInsideLiveChatNicknameShell(element) ||
    (nicknameButton &&
      (nicknameButton === element || nicknameButton.contains(element) || element.contains(nicknameButton)))
  );
}

function isLikelyNickname(element) {
  const tagName = element.tagName.toLowerCase();
  const className = getClassName(element);
  const testId = String(element.getAttribute("data-testid") ?? "");
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

  return (
    /live_chatting_username_nickname|live_chatting_nickname|(?:^|[_-])nickname(?:__|[_-]|$)/i.test(
      `${className} ${testId}`
    ) ||
    isInsideLiveChatNicknameShell(element)
  );
}

function annotateSelectorTargets(row, role) {
  const candidates = queryAllSafe(row, TARGET_SELECTORS[role]);
  const nicknameCandidates =
    role === "nickname" ? candidates.filter((element) => isLikelyNickname(element)) : [];

  for (const element of candidates) {
    if (role === "timestamp" && !isTimestampCandidate(row, element)) {
      continue;
    }

    if (role === "badge" && (!isBeforeMessageText(row, element) || !isLikelyBadge(element))) {
      continue;
    }

    if (role === "nickname" && !isLikelyNickname(element)) {
      continue;
    }

    if (role === "nickname" && !isBeforeMessageText(row, element)) {
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

      if (!isTimestampCandidate(row, parent)) {
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

  if (row === document.body || row === document.documentElement) {
    return false;
  }

  const className = getClassName(row);

  if (/fixed|header|input|textarea|notice|banner/i.test(className)) {
    return false;
  }

  const nicknameButton = getNicknameButtonElement(row);
  const messageContainer = getMessageContainerElement(row);
  const messageText = getMessageTextElement(row);
  const hasLegacyChatMessageShell = Boolean(
    /live_chatting_list_item/i.test(className) &&
      nicknameButton &&
      messageContainer &&
      messageText
  );
  const hasModernChatMessageShell = Boolean(
    row.closest("[role='log']") &&
      /(?:^|\s)_item_/i.test(className) &&
      nicknameButton &&
      messageContainer &&
      messageText
  );
  const hasChatMessageShell = hasLegacyChatMessageShell || hasModernChatMessageShell;

  if (!hasChatMessageShell) {
    return false;
  }

  const nickname = queryAllSafe(row, TARGET_SELECTORS.nickname).find(isLikelyNickname);

  return Boolean(nickname && messageText);
}

function getNicknameTextElement(row) {
  const candidates = queryAllSafe(row, TARGET_SELECTORS.nickname).filter(isLikelyNickname);

  return candidates.find((element) => !candidates.some((candidate) => candidate !== element && element.contains(candidate)));
}

function annotateMessageText(row) {
  const messageText = getMessageTextElement(row);

  if (messageText instanceof HTMLElement) {
    messageText.setAttribute(MESSAGE_TEXT_ATTR, "true");
  }
}

function clearNicknameColorMessage(row) {
  if (!(row instanceof HTMLElement)) {
    return;
  }

  row.removeAttribute(NICKNAME_COLOR_MESSAGE_ATTR);
  row.style.removeProperty("--chzzk-chat-ui-toggle-nickname-color");
}

var autoContrastCache = new Map();

function clearAutoContrast(row) {
  if (!(row instanceof HTMLElement)) {
    return;
  }

  row.removeAttribute(AUTO_CONTRAST_ATTR);
  row.style.removeProperty("--chzzk-chat-ui-toggle-auto-nickname-color");
  row.style.removeProperty("--chzzk-chat-ui-toggle-auto-message-color");
}

function parseCssRgbColorForContrast(color) {
  const normalizedColor = String(color || "").trim();

  if (/^#?[0-9a-f]{3}$/i.test(normalizedColor) || /^#?[0-9a-f]{6}$/i.test(normalizedColor)) {
    return {
      ...hexToRgb(normalizedColor),
      alpha: 1
    };
  }

  const match = normalizedColor.match(/rgba?\(([^)]+)\)/i);

  if (!match) {
    return null;
  }

  const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));

  if (parts.length < 3 || parts.slice(0, 3).some((part) => !Number.isFinite(part))) {
    return null;
  }

  const alpha = parts.length >= 4 && Number.isFinite(parts[3]) ? parts[3] : 1;

  if (alpha <= 0.05) {
    return null;
  }

  return {
    red: Math.max(0, Math.min(255, parts[0])),
    green: Math.max(0, Math.min(255, parts[1])),
    blue: Math.max(0, Math.min(255, parts[2])),
    alpha: Math.max(0, Math.min(1, alpha))
  };
}

function blendRgb(foreground, background, alpha = 1) {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  return {
    red: foreground.red * clampedAlpha + background.red * (1 - clampedAlpha),
    green: foreground.green * clampedAlpha + background.green * (1 - clampedAlpha),
    blue: foreground.blue * clampedAlpha + background.blue * (1 - clampedAlpha)
  };
}

function getContrastRatio(foreground, background) {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getRgbDistance(first, second) {
  return Math.hypot(
    first.red - second.red,
    first.green - second.green,
    first.blue - second.blue
  );
}

function isNearNeutralRgb(color) {
  return Math.max(color.red, color.green, color.blue) - Math.min(color.red, color.green, color.blue) <=
    AUTO_CONTRAST_NEUTRAL_CHANNEL_DELTA;
}

function clampRgbChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToCssColor(color) {
  return `rgb(${clampRgbChannel(color.red)}, ${clampRgbChannel(color.green)}, ${clampRgbChannel(color.blue)})`;
}

function rgbToHsl(color) {
  const red = color.red / 255;
  const green = color.green / 255;
  const blue = color.blue / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);
  let hue;

  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return {
    hue: hue * 60,
    saturation,
    lightness
  };
}

function hueToRgb(p, q, t) {
  let normalizedT = t;

  if (normalizedT < 0) {
    normalizedT += 1;
  }

  if (normalizedT > 1) {
    normalizedT -= 1;
  }

  if (normalizedT < 1 / 6) {
    return p + (q - p) * 6 * normalizedT;
  }

  if (normalizedT < 1 / 2) {
    return q;
  }

  if (normalizedT < 2 / 3) {
    return p + (q - p) * (2 / 3 - normalizedT) * 6;
  }

  return p;
}

function hslToRgb(color) {
  const hue = (((color.hue % 360) + 360) % 360) / 360;
  const saturation = Math.max(0, Math.min(1, color.saturation));
  const lightness = Math.max(0, Math.min(1, color.lightness));

  if (saturation === 0) {
    const channel = lightness * 255;

    return { red: channel, green: channel, blue: channel };
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    red: hueToRgb(p, q, hue + 1 / 3) * 255,
    green: hueToRgb(p, q, hue) * 255,
    blue: hueToRgb(p, q, hue - 1 / 3) * 255
  };
}

function getHuePreservingContrastColor(textRgb, backgroundRgb) {
  if (!textRgb || isNearNeutralRgb(textRgb)) {
    return null;
  }

  const hsl = rgbToHsl(textRgb);

  if (hsl.saturation < 0.08) {
    return null;
  }

  const saturationCandidates = [
    hsl.saturation,
    Math.max(hsl.saturation, 0.52)
  ];
  let bestColor = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestContrast = 0;

  for (let lightnessStep = 8; lightnessStep <= 92; lightnessStep += 2) {
    for (const saturation of saturationCandidates) {
      const candidate = hslToRgb({
        hue: hsl.hue,
        saturation,
        lightness: lightnessStep / 100
      });
      const contrast = getContrastRatio(candidate, backgroundRgb);

      if (contrast < AUTO_CONTRAST_MIN_RATIO) {
        continue;
      }

      const distance = getRgbDistance(candidate, textRgb);

      if (distance < bestDistance || (distance === bestDistance && contrast > bestContrast)) {
        bestColor = candidate;
        bestDistance = distance;
        bestContrast = contrast;
      }
    }
  }

  return bestColor ? rgbToCssColor(bestColor) : null;
}

function getChatBoxContrastBackgroundRgb() {
  const theme = typeof getCurrentChatBoxTheme === "function"
    ? getCurrentChatBoxTheme()
    : "light";

  return getChatBoxEffectiveBackgroundRgb(
    currentOptions.chatBoxColor,
    theme,
    currentOptions.chatBoxOpacity
  );
}

function getThemeBackdropRgb() {
  const detectedTheme = document.documentElement.dataset.chzzkChatUiToggleDetectedTheme;

  return detectedTheme === "dark"
    ? { red: 16, green: 20, blue: 24 }
    : { red: 255, green: 255, blue: 255 };
}

function getAmbientContrastBackgroundRgb(row) {
  let element = getMessageTextElement(row) || row;
  const fallback = getThemeBackdropRgb();

  for (let depth = 0; element instanceof HTMLElement && depth < 10; depth += 1) {
    const color = parseCssRgbColorForContrast(getComputedStyle(element).backgroundColor);

    if (color) {
      return color.alpha < 1 ? blendRgb(color, fallback, color.alpha) : color;
    }

    element = element.parentElement;
  }

  return fallback;
}

function getContrastBackgroundRgb(row) {
  return currentOptions.showChatBoxes === true
    ? getChatBoxContrastBackgroundRgb()
    : getAmbientContrastBackgroundRgb(row);
}

function getAutoContrastCacheKey(textRgb, backgroundRgb, { preferAccent = false } = {}) {
  return [
    Math.round(textRgb.red),
    Math.round(textRgb.green),
    Math.round(textRgb.blue),
    Math.round(backgroundRgb.red),
    Math.round(backgroundRgb.green),
    Math.round(backgroundRgb.blue),
    preferAccent ? "accent" : "plain"
  ].join(",");
}

function rememberAutoContrastResult(key, value) {
  autoContrastCache.set(key, value);

  if (autoContrastCache.size <= AUTO_CONTRAST_CACHE_LIMIT) {
    return;
  }

  const oldestKey = autoContrastCache.keys().next().value;

  if (oldestKey) {
    autoContrastCache.delete(oldestKey);
  }
}

function getReadableContrastColor(backgroundRgb, { preferAccent = false, originalRgb = null } = {}) {
  const black = { red: 0, green: 0, blue: 0 };
  const white = { red: 255, green: 255, blue: 255 };

  if (preferAccent) {
    const huePreservingColor = getHuePreservingContrastColor(originalRgb, backgroundRgb);

    if (huePreservingColor) {
      return huePreservingColor;
    }
  }

  if (preferAccent) {
    const accent = getReadableAccentContrastColor(backgroundRgb);

    if (accent) {
      return accent;
    }
  }

  return getContrastRatio(black, backgroundRgb) >= getContrastRatio(white, backgroundRgb)
    ? "#000000"
    : "#ffffff";
}

function getReadableAccentContrastColor(backgroundRgb) {
  let bestColor = null;
  let bestContrast = 0;

  for (const color of AUTO_CONTRAST_ACCENT_COLORS) {
    const parsedColor = parseCssRgbColorForContrast(color);

    if (!parsedColor) {
      continue;
    }

    const contrast = getContrastRatio(parsedColor, backgroundRgb);

    if (contrast > bestContrast) {
      bestColor = color;
      bestContrast = contrast;
    }
  }

  return bestContrast >= AUTO_CONTRAST_MIN_RATIO ? bestColor : null;
}

function getAutoContrastColor(color, backgroundRgb, { preferAccent = false } = {}) {
  const parsedColor = parseCssRgbColorForContrast(color);

  if (!parsedColor) {
    return null;
  }

  const textRgb = parsedColor.alpha < 1
    ? blendRgb(parsedColor, backgroundRgb, parsedColor.alpha)
    : parsedColor;
  const cacheKey = getAutoContrastCacheKey(textRgb, backgroundRgb, { preferAccent });

  if (autoContrastCache.has(cacheKey)) {
    return autoContrastCache.get(cacheKey);
  }

  const currentContrast = getContrastRatio(textRgb, backgroundRgb);

  if (currentContrast >= AUTO_CONTRAST_MIN_RATIO) {
    rememberAutoContrastResult(cacheKey, null);
    return null;
  }

  const isNeutralColor = isNearNeutralRgb(textRgb);
  const shouldConsiderColor =
    isNeutralColor ||
    (
      preferAccent &&
      getHuePreservingContrastColor(textRgb, backgroundRgb)
    ) ||
    getRgbDistance(textRgb, backgroundRgb) <= AUTO_CONTRAST_NEAR_COLOR_DISTANCE;
  const result = shouldConsiderColor ? getReadableContrastColor(backgroundRgb, { preferAccent, originalRgb: textRgb }) : null;

  rememberAutoContrastResult(cacheKey, result);
  return result;
}

function getElementTextColor(element) {
  if (!(element instanceof Element)) {
    return null;
  }

  try {
    const color = getComputedStyle(element).color;

    return isUsableCssColor(color) ? color : null;
  } catch (_error) {
    return null;
  }
}

function isUsableCssColor(color) {
  const normalized = String(color || "").replace(/\s+/g, "").toLowerCase();

  if (!normalized || normalized === "transparent" || normalized === "rgba(0,0,0,0)") {
    return false;
  }

  try {
    return typeof CSS !== "undefined" && CSS.supports("color", color);
  } catch (_error) {
    return false;
  }
}

function getNicknameTextColor(row) {
  const nickname = getNicknameTextElement(row);

  return getElementTextColor(nickname);
}

function getMessageBaseTextColor(row) {
  if (
    currentOptions.useChatTextColor === true &&
    currentOptions.useNicknameColorForMessage === true
  ) {
    return getNicknameTextColor(row);
  }

  if (currentOptions.useChatTextColor === true) {
    return currentOptions.chatTextColor;
  }

  return getElementTextColor(getMessageTextElement(row));
}

function syncNicknameColorMessage(row, measuredColor) {
  if (measuredColor === undefined) clearNicknameColorMessage(row);

  if (
    currentOptions.useChatTextColor !== true ||
    currentOptions.useNicknameColorForMessage !== true
  ) {
    return;
  }

  if (!(getMessageTextElement(row) instanceof HTMLElement)) {
    return;
  }

  const color = measuredColor === undefined ? getNicknameTextColor(row) : measuredColor;

  if (!color) {
    return;
  }

  row.setAttribute(NICKNAME_COLOR_MESSAGE_ATTR, "true");
  row.style.setProperty("--chzzk-chat-ui-toggle-nickname-color", color);
}

function syncAutoContrast(row, measured = null) {
  if (!measured) clearAutoContrast(row);

  const shouldAutoContrast = currentOptions.useAutoTextContrast === true;

  if (!shouldAutoContrast) {
    return;
  }

  const shouldPreferAccentForNicknameColorMessage =
    currentOptions.useChatTextColor === true &&
    currentOptions.useNicknameColorForMessage === true;
  const backgroundRgb = measured ? measured.background : getContrastBackgroundRgb(row);
  // Read both source colors before applying either correction.
  const nicknameColor = measured ? measured.nickname : getNicknameTextColor(row);
  const messageColor = measured ? measured.message : getMessageBaseTextColor(row);
  const contrastRoles = [];

  if (shouldAutoContrast) {
    const autoNicknameColor = getAutoContrastColor(nicknameColor, backgroundRgb);

    if (autoNicknameColor) {
      contrastRoles.push("nickname");
      row.style.setProperty("--chzzk-chat-ui-toggle-auto-nickname-color", autoNicknameColor);
    }
  }

  const autoMessageColor = getAutoContrastColor(messageColor, backgroundRgb, {
    preferAccent: shouldPreferAccentForNicknameColorMessage
  });

  if (autoMessageColor) {
    contrastRoles.push("message");
    row.style.setProperty("--chzzk-chat-ui-toggle-auto-message-color", autoMessageColor);
  }

  if (contrastRoles.length > 0) {
    row.setAttribute(AUTO_CONTRAST_ATTR, contrastRoles.join(" "));
  }
}

function syncChatRowColors(rows) {
  // Reset all rows before any computed-style read, then apply all results together.
  // Keep this synchronous so new rows are corrected before the browser paints.
  for (const row of rows) {
    clearAutoContrast(row);
    clearNicknameColorMessage(row);
  }
  const useNickname = currentOptions.useChatTextColor && currentOptions.useNicknameColorForMessage;
  if (!currentOptions.useAutoTextContrast && !useNickname) return;
  const measurements = rows.map((row) => {
    const nickname = getNicknameTextColor(row);
    return {
      row,
      nickname,
      message: currentOptions.useAutoTextContrast
        ? (useNickname ? nickname : getMessageBaseTextColor(row))
        : null,
      background: currentOptions.useAutoTextContrast ? getContrastBackgroundRgb(row) : null
    };
  });
  for (const measured of measurements) {
    syncNicknameColorMessage(measured.row, measured.nickname);
    syncAutoContrast(measured.row, measured);
  }
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
  if (!isChatMessageRow(row)) {
    return;
  }

  const nickname = getNicknameTextElement(row);

  if (!nickname?.parentElement) {
    return;
  }

  const anchor = getMessagePrefixAnchor(row, nickname);

  if (hasTimestamp(row)) {
    return;
  }

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

function getChatRowAnnotationSnapshot(row) {
  const nickname = getNicknameTextElement(row);
  const messageText = getMessageTextElement(row);

  return {
    nickname,
    nicknameText: nickname ? getCompactText(nickname) : "",
    messageContainer: getMessageContainerElement(row),
    messageText,
    messageValue: messageText ? getCompactText(messageText) : ""
  };
}

function hasChatRowSnapshotChanged(previous, next) {
  return Boolean(
    previous &&
      (previous.nickname !== next.nickname ||
        previous.nicknameText !== next.nicknameText ||
        previous.messageContainer !== next.messageContainer ||
        previous.messageText !== next.messageText ||
        previous.messageValue !== next.messageValue)
  );
}

function revalidateChatRowAnnotations(row, snapshotChanged) {
  const generatedTimestamps = queryAllSafe(row, [`[${GENERATED_TIMESTAMP_ATTR}]`]);

  if (snapshotChanged) {
    for (const timestamp of generatedTimestamps) {
      timestamp.remove();
    }
  } else {
    for (const timestamp of generatedTimestamps.slice(1)) {
      timestamp.remove();
    }
  }

  for (const element of queryAllIncludingRootSafe(row, [
    `[${ROLE_ATTR}]`,
    `[${MESSAGE_PREFIX_ATTR}]`,
    `[${MESSAGE_TEXT_ATTR}]`
  ])) {
    element.removeAttribute(ROLE_ATTR);
    element.removeAttribute(MESSAGE_PREFIX_ATTR);
    element.removeAttribute(MESSAGE_TEXT_ATTR);
  }
}

function removeGeneratedTimestampWhenNativeExists(row) {
  const timestampElements = queryAllSafe(row, [`[${ROLE_ATTR}~="timestamp"]`]);
  const hasNativeTimestamp = timestampElements.some(
    (element) => !element.hasAttribute(GENERATED_TIMESTAMP_ATTR)
  );

  if (!hasNativeTimestamp) {
    return;
  }

  for (const timestamp of queryAllSafe(row, [`[${GENERATED_TIMESTAMP_ATTR}]`])) {
    timestamp.remove();
  }
}

function annotateChatRow(row, { contentMutated = false, deferColors = false } = {}) {
  if (!isChatMessageRow(row)) {
    return;
  }

  const snapshot = getChatRowAnnotationSnapshot(row);
  const previousSnapshot = chatRowAnnotationSnapshots.get(row);

  revalidateChatRowAnnotations(
    row,
    contentMutated || hasChatRowSnapshotChanged(previousSnapshot, snapshot)
  );
  row.setAttribute(CHAT_ROW_ATTR, "true");
  annotateSelectorTargets(row, "timestamp");
  annotateTimestampLeaves(row);
  removeGeneratedTimestampWhenNativeExists(row);
  ensureGeneratedTimestamp(row);
  annotateSelectorTargets(row, "badge");
  annotateLeadingBadges(row);
  annotateSelectorTargets(row, "nickname");
  annotateMessageText(row);
  if (!deferColors) syncChatRowColors([row]);
  syncRandomNickname(row);
  chatRowAnnotationSnapshots.set(row, snapshot);
}

function clearLargeTextRowLayout(row) {
  row.style.removeProperty("--chzzk-chat-ui-toggle-row-dynamic-height");
}

function getLargeTextLayoutElements(row) {
  return queryAllSafe(row, [
    `[${ROLE_ATTR}]`,
    `[${MESSAGE_PREFIX_ATTR}]`,
    ".chzzk-chat-ui-toggle-timestamp",
    "[class*='live_chatting_message_container' i]",
    "[class*='live_chatting_message_text' i]",
    "[class*='live_chatting_message_text' i] img",
    "[class*='_chatting_message_' i]",
    "[class*='_chatting_message_' i] img",
    "[class*='message_text' i]",
    "[class*='message_text' i] img",
    "[class*='message' i] [class*='text' i]",
    "[class*='message' i] [class*='text' i] img",
    "[class*='live_chatting_username' i]",
    "[class*='name_text' i]",
    "button[class*='nickname' i]"
  ]).filter((element) => element instanceof Element);
}

function syncLargeTextRowLayout() {
  largeTextLayoutFrame = 0;
  const rows = largeTextLayoutSyncAll
    ? queryAllSafe(document, [`[${CHAT_ROW_ATTR}="true"]`])
    : [...largeTextLayoutRows];

  largeTextLayoutRows.clear();
  largeTextLayoutSyncAll = false;
  const updates = [];

  for (const row of rows) {
    if (!(row instanceof HTMLElement) || !row.isConnected) {
      continue;
    }

    if (!currentOptions.showLargeText) {
      clearLargeTextRowLayout(row);
      continue;
    }

    const rowRect = row.getBoundingClientRect();

    if (rowRect.width <= 0 && rowRect.height <= 0) {
      continue;
    }

    const effectiveNicknameFontSizePt = currentOptions.useNicknameFontSize
      ? currentOptions.nicknameFontSizePt
      : currentOptions.chatFontSizePt;
    const maxChatLineFontSizePt = Math.max(currentOptions.chatFontSizePt, effectiveNicknameFontSizePt);
    const chatEmoteSizePx = Math.max(20, currentOptions.chatFontSizePt * 96 / 72);
    const minimumHeight = Math.max(maxChatLineFontSizePt * 96 / 72 * 1.45, chatEmoteSizePx) + 8;
    let contentBottom = rowRect.top + minimumHeight - 8;

    for (const element of getLargeTextLayoutElements(row)) {
      for (const rect of element.getClientRects()) {
        if (rect.width > 0 || rect.height > 0) {
          contentBottom = Math.max(contentBottom, rect.bottom);
        }
      }
    }

    const measuredHeight = Math.ceil(contentBottom - rowRect.top + 8);
    const dynamicHeight = Math.max(minimumHeight, measuredHeight);
    updates.push([row, `${dynamicHeight.toFixed(2)}px`]);
  }
  for (const [row, height] of updates) {
    if (row.style.getPropertyValue("--chzzk-chat-ui-toggle-row-dynamic-height") !== height) {
      row.style.setProperty("--chzzk-chat-ui-toggle-row-dynamic-height", height);
    }
  }
}

function scheduleLargeTextLayoutSync(rows = null) {
  if (rows === null) {
    largeTextLayoutSyncAll = true;
    largeTextLayoutRows.clear();
  } else if (!largeTextLayoutSyncAll) {
    for (const row of rows) {
      if (row instanceof HTMLElement) {
        largeTextLayoutRows.add(row);
      }
    }
  }

  if (largeTextLayoutFrame) {
    return;
  }

  largeTextLayoutFrame = window.requestAnimationFrame(syncLargeTextRowLayout);
}

function cleanupUnscopedAnnotations(root = document) {
  const annotatedElements = queryAllIncludingRootSafe(root, [
    RANDOM_NICKNAME_SELECTOR,
    `[${CHAT_ROW_ATTR}="true"]`,
    `[${ROLE_ATTR}]`,
    `[${MESSAGE_PREFIX_ATTR}]`,
    `[${MESSAGE_TEXT_ATTR}]`,
    `[${AUTO_CONTRAST_ATTR}]`,
    `[${GENERATED_TIMESTAMP_ATTR}]`
  ]);

  for (const element of annotatedElements) {
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
      continue;
    }

    if (isHiddenGuestChatNativeContent(element)) {
      continue;
    }

    const scopedRow = element instanceof HTMLElement && element.getAttribute(CHAT_ROW_ATTR) === "true"
      ? element
      : element.closest(`[${CHAT_ROW_ATTR}="true"]`);

    if (!(scopedRow instanceof HTMLElement) || !isChatMessageRow(scopedRow)) {
      removeAnnotations(element);
    }
  }
}

function cleanupRows(rows) {
  for (const row of [...new Set(rows)].filter((element) => element instanceof HTMLElement)) {
    cleanupUnscopedAnnotations(row);
  }
}

function cleanupUnscopedAnnotationsWhenDue() {
  const now = Date.now();

  if (now - lastFullCleanupAt < FULL_CLEANUP_INTERVAL_MS) {
    return;
  }

  lastFullCleanupAt = now;
  cleanupUnscopedAnnotations();
}

function isHiddenGuestChatNativeContent(element) {
  if (
    currentOptions.useGuestChatFrame !== true ||
    window.self !== window.top ||
    !(element instanceof Element)
  ) {
    return false;
  }

  const host = element.closest(`[${GUEST_CHAT_HOST_ATTR}="true"]`);

  if (!(host instanceof HTMLElement) || element === host) {
    return false;
  }

  if (element.closest(`#${GUEST_CHAT_FRAME_CONTAINER_ID}`)) {
    return false;
  }

  return !element.closest(`[${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]`);
}

function isHiddenGuestChatNativeMutation(mutation) {
  const element = mutation.target instanceof Element
    ? mutation.target
    : mutation.target.parentElement;

  return isHiddenGuestChatNativeContent(element);
}

function scanRows(rows, { contentMutated = false, contentMutatedRows = null } = {}) {
  const uniqueRows = [...new Set(rows)]
    .filter((element) => element instanceof HTMLElement)
    .filter((element) => !isHiddenGuestChatNativeContent(element));

  cleanupRows(uniqueRows);

  const chatRows = uniqueRows.filter(hasChatLikeText).filter(isChatMessageRow);
  for (const row of chatRows) {
    annotateChatRow(row, {
      contentMutated: contentMutated || Boolean(contentMutatedRows?.has(row)),
      deferColors: true
    });
  }
  syncChatRowColors(chatRows);

  scheduleLargeTextLayoutSync(uniqueRows);
}

function scan() {
  if (isScanning) {
    return;
  }

  if (scanTimer) {
    window.clearTimeout(scanTimer);
    scanTimer = 0;
  }

  isScanning = true;
  const roots = getChatRoots();

  try {
    cleanupUnscopedAnnotationsWhenDue();
    const rows = new Set();

    for (const root of roots) {
      if (isHiddenGuestChatNativeContent(root)) {
        continue;
      }

      for (const row of getChatRows(root)) {
        rows.add(row);
      }
    }

    scanRows(rows);
    annotateNonChatPanels();
    annotateMiniChatHiddenControls();
    syncGuestChatUi();
  } finally {
    isScanning = false;
    lastScanAt = Date.now();
  }
}

function matchesAnySafe(element, selectors) {
  for (const selector of selectors) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch (_error) {
      // A selector mismatch should not break processing for new chat rows.
    }
  }

  return false;
}

function closestAnySafe(element, selectors) {
  for (const selector of selectors) {
    try {
      const closest = element.closest(selector);

      if (closest instanceof HTMLElement) {
        return closest;
      }
    } catch (_error) {
      // A selector mismatch should not break processing for new chat rows.
    }
  }

  return null;
}

function isGeneratedTimestampMutationNode(node, mutationTarget = null) {
  const element = node instanceof Element ? node : node.parentElement;

  if (element?.closest(`[${GENERATED_TIMESTAMP_ATTR}]`)) {
    return true;
  }

  return Boolean(
    mutationTarget instanceof Element && mutationTarget.closest(`[${GENERATED_TIMESTAMP_ATTR}]`)
  );
}

function isGeneratedTimestampMutation(mutation) {
  const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];

  if (mutation.type === "characterData") {
    return isGeneratedTimestampMutationNode(mutation.target, mutation.target.parentElement);
  }

  return (
    changedNodes.length > 0 &&
    changedNodes.every((node) => isGeneratedTimestampMutationNode(node, mutation.target))
  );
}

function hasNonGeneratedAddedNodes(mutations) {
  return mutations.some((mutation) => [...mutation.addedNodes].some((node) => {
    return !isGeneratedTimestampMutationNode(node, mutation.target);
  }));
}

function hasNonGeneratedAddedNodesOutsideChatRows(mutations) {
  return mutations.some((mutation) => [...mutation.addedNodes].some((node) => {
    if (isGeneratedTimestampMutationNode(node, mutation.target)) {
      return false;
    }

    const element = node instanceof Element ? node : node.parentElement;
    const closestRow = element ? closestAnySafe(element, CHAT_ROW_SELECTORS) : null;

    return Boolean(element && (!closestRow || !isChatMessageRow(closestRow)));
  }));
}

function collectMutationChatRows(mutation) {
  const rows = new Set();

  if (mutation.type === "attributes") {
    const row = closestAnySafe(mutation.target, CHAT_ROW_SELECTORS);
    if (row) rows.add(row);
    return rows;
  }

  if (mutation.type === "characterData") {
    const element = mutation.target.parentElement;

    if (!element) {
      return rows;
    }

    const closestRow = closestAnySafe(element, CHAT_ROW_SELECTORS);

    if (closestRow) {
      rows.add(closestRow);
    }

    return rows;
  }

  if (mutation.removedNodes.length > 0 && mutation.target instanceof Element) {
    const closestRow = closestAnySafe(mutation.target, CHAT_ROW_SELECTORS);

    if (closestRow) {
      rows.add(closestRow);
    }
  }

  for (const node of mutation.addedNodes) {
    const element = node instanceof Element ? node : node.parentElement;

    if (!element || isGeneratedTimestampMutationNode(node, mutation.target)) {
      continue;
    }

    if (element instanceof HTMLElement && matchesAnySafe(element, CHAT_ROW_SELECTORS)) {
      rows.add(element);
    }

    for (const row of queryAllSafe(element, CHAT_ROW_SELECTORS)) {
      if (row instanceof HTMLElement) {
        rows.add(row);
      }
    }

    const closestRow = closestAnySafe(element, CHAT_ROW_SELECTORS);

    if (closestRow) {
      rows.add(closestRow);
    }
  }

  return rows;
}

function getChatContentMutationElements(row) {
  const previous = chatRowAnnotationSnapshots.get(row);

  return [...new Set([
    previous?.nickname,
    previous?.messageText,
    getNicknameTextElement(row),
    getMessageTextElement(row)
  ].filter((element) => element instanceof HTMLElement))];
}

function mutationReplacesChatContentElement(node, contentElements) {
  return contentElements.some(
    (element) => node === element || (node instanceof Element && node.contains(element))
  );
}

function isLogicalChatContentMutation(row, mutation) {
  const contentElements = getChatContentMutationElements(row);

  if (contentElements.length === 0) {
    return false;
  }

  if (mutation.type === "characterData") {
    const parent = mutation.target.parentElement;

    return Boolean(
      parent && contentElements.some((element) => element === parent || element.contains(parent))
    );
  }

  const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];

  if (changedNodes.some((node) => mutationReplacesChatContentElement(node, contentElements))) {
    return true;
  }

  if (!(mutation.target instanceof Element)) {
    return false;
  }

  const targetIsInsideContent = contentElements.some(
    (element) => element === mutation.target || element.contains(mutation.target)
  );

  if (!targetIsInsideContent) {
    return false;
  }

  return changedNodes.some((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return Boolean(node.textContent?.trim());
    }

    return node instanceof Element && Boolean(getCompactText(node));
  });
}

function collectChangedChatRowDetails(mutations) {
  const rows = new Set();
  const contentMutatedRows = new Set();

  for (const mutation of mutations) {
    if (isGeneratedTimestampMutation(mutation)) {
      continue;
    }

    for (const row of collectMutationChatRows(mutation)) {
      rows.add(row);

      if (isLogicalChatContentMutation(row, mutation)) {
        contentMutatedRows.add(row);
      }
    }
  }

  return { rows: [...rows], contentMutatedRows };
}

function collectChangedChatRows(mutations) {
  return collectChangedChatRowDetails(mutations).rows;
}

function scheduleScan() {
  if (scanTimer) {
    return;
  }

  const elapsedSinceLastScan = Date.now() - lastScanAt;
  const delay = Math.max(SCAN_DELAY_MS, SCAN_MIN_INTERVAL_MS - elapsedSinceLastScan);

  scanTimer = window.setTimeout(() => {
    scanTimer = 0;
    scan();
  }, delay);
}
