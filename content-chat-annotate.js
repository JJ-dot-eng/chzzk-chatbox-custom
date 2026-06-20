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

function removeAnnotations(element) {
  element.removeAttribute(ROLE_ATTR);
  element.removeAttribute(MESSAGE_PREFIX_ATTR);
  element.removeAttribute(MESSAGE_TEXT_ATTR);
  element.removeAttribute(NICKNAME_COLOR_MESSAGE_ATTR);
  element.removeAttribute(MINI_CHAT_HIDDEN_CONTROL_ATTR);
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

function markMiniChatHiddenControl(element) {
  if (element instanceof HTMLElement) {
    element.setAttribute(MINI_CHAT_HIDDEN_CONTROL_ATTR, "true");
  }
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

function markMiniChatCompactInputContainer(actionRow) {
  const inputContainer = findMiniChatCompactInputContainer(actionRow);

  if (inputContainer instanceof HTMLElement) {
    inputContainer.setAttribute(MINI_CHAT_COMPACT_INPUT_ATTR, "true");
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
    .filter(isMiniChatTextEntryField);
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

function markMiniChatInputOnlyLayout() {
  const inputContainer = findMiniChatInputOnlyContainer();

  if (!(inputContainer instanceof HTMLElement)) {
    return;
  }

  inputContainer.setAttribute(MINI_CHAT_COMPACT_INPUT_ATTR, "true");
  inputContainer.setAttribute(MINI_CHAT_INPUT_ONLY_KEEP_ATTR, "true");

  for (
    let current = inputContainer;
    current && current !== document.body;
    current = current.parentElement
  ) {
    if (!(current instanceof HTMLElement)) {
      break;
    }

    if (current !== inputContainer) {
      current.setAttribute(MINI_CHAT_INPUT_ONLY_PATH_ATTR, "true");
    }

    const parent = current.parentElement;

    if (!(parent instanceof HTMLElement)) {
      continue;
    }

    for (const sibling of parent.children) {
      if (sibling !== current && sibling instanceof HTMLElement) {
        sibling.setAttribute(MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR, "true");
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

  for (const element of document.querySelectorAll(`[${MINI_CHAT_HIDDEN_CONTROL_ATTR}]`)) {
    element.removeAttribute(MINI_CHAT_HIDDEN_CONTROL_ATTR);
  }

  for (const element of document.querySelectorAll(`[${MINI_CHAT_COMPACT_INPUT_ATTR}]`)) {
    element.removeAttribute(MINI_CHAT_COMPACT_INPUT_ATTR);
  }

  for (const element of document.querySelectorAll(`[${MINI_CHAT_INPUT_ONLY_PATH_ATTR}]`)) {
    element.removeAttribute(MINI_CHAT_INPUT_ONLY_PATH_ATTR);
  }

  for (const element of document.querySelectorAll(`[${MINI_CHAT_INPUT_ONLY_KEEP_ATTR}]`)) {
    element.removeAttribute(MINI_CHAT_INPUT_ONLY_KEEP_ATTR);
  }

  for (const element of document.querySelectorAll(`[${MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR}]`)) {
    element.removeAttribute(MINI_CHAT_INPUT_ONLY_HIDDEN_ATTR);
  }

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
    if (role === "timestamp" && !looksLikeTimestamp(element)) {
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

  if (!(nickname instanceof Element)) {
    return null;
  }

  try {
    const color = getComputedStyle(nickname).color;

    return isUsableCssColor(color) ? color : null;
  } catch (_error) {
    return null;
  }
}

function syncNicknameColorMessage(row) {
  clearNicknameColorMessage(row);

  if (currentOptions.useNicknameColorForMessage !== true) {
    return;
  }

  if (!(getMessageTextElement(row) instanceof HTMLElement)) {
    return;
  }

  const color = getNicknameTextColor(row);

  if (!color) {
    return;
  }

  row.setAttribute(NICKNAME_COLOR_MESSAGE_ATTR, "true");
  row.style.setProperty("--chzzk-chat-ui-toggle-nickname-color", color);
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

function annotateChatRow(row) {
  if (!isChatMessageRow(row)) {
    return;
  }

  row.setAttribute(CHAT_ROW_ATTR, "true");
  annotateSelectorTargets(row, "timestamp");
  annotateTimestampLeaves(row);
  ensureGeneratedTimestamp(row);
  annotateSelectorTargets(row, "badge");
  annotateLeadingBadges(row);
  annotateSelectorTargets(row, "nickname");
  annotateMessageText(row);
  syncNicknameColorMessage(row);
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

  for (const row of queryAllSafe(document, [`[${CHAT_ROW_ATTR}="true"]`])) {
    if (!(row instanceof HTMLElement)) {
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
    row.style.setProperty("--chzzk-chat-ui-toggle-row-dynamic-height", `${dynamicHeight.toFixed(2)}px`);
  }
}

function scheduleLargeTextLayoutSync() {
  if (largeTextLayoutFrame) {
    return;
  }

  largeTextLayoutFrame = window.requestAnimationFrame(syncLargeTextRowLayout);
}

function cleanupUnscopedAnnotations(root = document) {
  const annotatedElements = queryAllIncludingRootSafe(root, [
    `[${CHAT_ROW_ATTR}="true"]`,
    `[${ROLE_ATTR}]`,
    `[${MESSAGE_PREFIX_ATTR}]`,
    `[${MESSAGE_TEXT_ATTR}]`,
    `[${GENERATED_TIMESTAMP_ATTR}]`
  ]);

  for (const element of annotatedElements) {
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
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

function scanRows(rows) {
  const uniqueRows = [...new Set(rows)].filter((element) => element instanceof HTMLElement);

  cleanupRows(uniqueRows);

  for (const row of uniqueRows.filter(hasChatLikeText)) {
    annotateChatRow(row);
  }

  annotateNonChatPanels();
  annotateMiniChatHiddenControls();
  scheduleLargeTextLayoutSync();
}

function scan() {
  if (isScanning) {
    return;
  }

  isScanning = true;
  const roots = getChatRoots();

  try {
    cleanupUnscopedAnnotationsWhenDue();

    for (const root of roots) {
      scanRows(getChatRows(root));
    }

    annotateNonChatPanels();
    annotateMiniChatHiddenControls();
    syncGuestChatUi();
  } finally {
    isScanning = false;
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

function collectAddedChatRows(mutations) {
  const rows = [];

  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      const element = node instanceof Element ? node : node.parentElement;

      if (!element) {
        continue;
      }

      if (element instanceof HTMLElement && matchesAnySafe(element, CHAT_ROW_SELECTORS)) {
        rows.push(element);
      }

      rows.push(...queryAllSafe(element, CHAT_ROW_SELECTORS).filter((row) => row instanceof HTMLElement));

      const closestRow = closestAnySafe(element, CHAT_ROW_SELECTORS);

      if (closestRow) {
        rows.push(closestRow);
      }
    }
  }

  return rows;
}

function scheduleScan() {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(scan, SCAN_DELAY_MS);
}
