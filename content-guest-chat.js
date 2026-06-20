function createGuestChatFrameContainer() {
  const container = document.createElement("div");
  const iframe = document.createElement("iframe");

  container.id = GUEST_CHAT_FRAME_CONTAINER_ID;
  iframe.id = GUEST_CHAT_FRAME_ID;
  iframe.title = "비로그인 치지직 채팅";
  iframe.referrerPolicy = "origin";
  iframe.setAttribute("credentialless", "");
  iframe.credentialless = true;
  container.append(iframe);

  return container;
}

function isDonationRankingPanel(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const text = getCompactText(element);

  return (
    text.includes("랭킹") &&
    (element.matches("aside#aside-chatting > *") ||
      element.closest("aside#aside-chatting") ||
      element.querySelector("[class*='ranking' i]"))
  );
}

function isChatHeaderCandidate(element, { includeHidden = false } = {}) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (!includeHidden && !isElementVisible(element)) {
    return false;
  }

  if (isDonationRankingPanel(element)) {
    return false;
  }

  const className = getClassName(element);
  const text = getCompactText(element);
  const hasChatTitleText = text === "채팅" || /^채팅(?:방)?$/u.test(text) || /\bchat\b/i.test(text);
  const hasLegacyChatHeaderClass = /live_chatting_header_/i.test(className);

  return hasChatTitleText || hasLegacyChatHeaderClass;
}

function findChatHeaderInHost(host, { includeHidden = false } = {}) {
  if (!(host instanceof HTMLElement)) {
    return null;
  }

  const firstChild = host.firstElementChild;

  if (isChatHeaderCandidate(firstChild, { includeHidden })) {
    return firstChild;
  }

  for (const child of [...host.children]) {
    if (child.getAttribute("role") === "log") {
      break;
    }

    if (isChatHeaderCandidate(child, { includeHidden })) {
      return child;
    }
  }

  return null;
}

function findGuestChatHostFrom(element) {
  for (let current = element; current && current !== document.body; current = current.parentElement) {
    if (!(current instanceof HTMLElement)) {
      continue;
    }

    const className = getClassName(current);
    const hasChatShellClass = /live_chatting|chatting_area|chat_area/i.test(className);
    const isHeaderOnly = /live_chatting_header_/i.test(className);
    const isKnownChatAside = current.tagName === "ASIDE" && current.id === "aside-chatting";
    const hasModernChatShell = current.tagName === "ASIDE" && Boolean(current.querySelector("[role='log']"));
    const hasChatParts = Boolean(
      current.querySelector(
        "[class*='live_chatting_header_container' i], [class*='live_chatting_input_container' i], [class*='live_chatting_list_item' i], [role='log'], [class*='_chatting_message_' i]"
      )
    ) || isChatHeaderCandidate(current.firstElementChild, { includeHidden: true });

    if ((hasChatShellClass && !isHeaderOnly && hasChatParts) || hasModernChatShell || (isKnownChatAside && hasChatParts)) {
      return current;
    }
  }

  return null;
}

function findGuestChatHost() {
  const rowHost = findGuestChatHostFromRows();

  if (rowHost && rowHost !== document.body) {
    return rowHost;
  }

  const headerTarget = findChatHeaderTarget();
  const headerHost = headerTarget ? findGuestChatHostFrom(headerTarget) : null;

  if (headerHost) {
    return headerHost;
  }

  const actionHost = queryAllSafe(document, CHAT_ACTION_HOST_SELECTORS)
    .filter((element) => element instanceof HTMLElement)
    .filter(isElementVisible)
    .map(findGuestChatHostFrom)
    .find((element) => element instanceof HTMLElement);

  return actionHost || null;
}

function syncGuestChatFrame() {
  if (!shouldRenderGuestChatFrame() || !isGuestChatFrameEligibleContext() || !supportsCredentiallessIframe()) {
    removeGuestChatFrame();
    return;
  }

  const frameUrl = getGuestChatFrameUrl();
  const host = findGuestChatHost();

  if (!frameUrl || !host) {
    return;
  }

  const container =
    document.getElementById(GUEST_CHAT_FRAME_CONTAINER_ID) || createGuestChatFrameContainer();
  const iframe = container.querySelector(`#${GUEST_CHAT_FRAME_ID}`);

  if (iframe instanceof HTMLIFrameElement && iframe.src !== frameUrl) {
    iframe.src = frameUrl;
  }

  markGuestChatControlHost(host);
  host.setAttribute(GUEST_CHAT_HOST_ATTR, "true");
  clearGuestChatHosts(host);

  if (container.parentElement !== host) {
    host.append(container);
  }
}

function findChatHeaderFromChatAside({ includeHidden = false } = {}) {
  const hosts = queryAllSafe(document, ["aside#aside-chatting"])
    .filter((element) => element instanceof HTMLElement);

  for (const host of hosts) {
    const header = findChatHeaderInHost(host, { includeHidden });

    if (header) {
      return header;
    }
  }

  return null;
}

function findChatHeaderFromLog({ includeHidden = false } = {}) {
  const logs = queryAllSafe(document, ["[role='log']"])
    .filter((element) => element instanceof HTMLElement);

  for (const log of logs) {
    const host = log.closest("aside");
    const hostHeader = host?.firstElementChild instanceof HTMLElement ? host.firstElementChild : null;

    if (isChatHeaderCandidate(hostHeader, { includeHidden })) {
      return hostHeader;
    }

    for (
      let candidate = log.previousElementSibling;
      candidate instanceof HTMLElement;
      candidate = candidate.previousElementSibling
    ) {
      if (isDonationRankingPanel(candidate)) {
        continue;
      }

      if (isChatHeaderCandidate(candidate, { includeHidden })) {
        return candidate;
      }
    }
  }

  return null;
}

function findChatHeaderTarget({ includeHidden = false } = {}) {
  const candidates = queryAllSafe(document, CHAT_HEADER_SELECTORS)
    .filter((element) => element instanceof HTMLElement)
    .filter((element) => isChatHeaderCandidate(element, { includeHidden }));

  return candidates[0] || findChatHeaderFromChatAside({ includeHidden }) || findChatHeaderFromLog({ includeHidden });
}

function findGuestChatHostFromRows() {
  const rows = queryAllSafe(document, CHAT_ROW_SELECTORS)
    .filter((element) => element instanceof HTMLElement)
    .filter(isChatMessageRow)
    .slice(-20)
    .reverse();

  for (const row of rows) {
    let fallback = null;

    for (let element = row.parentElement; element && element !== document.body; element = element.parentElement) {
      if (!(element instanceof HTMLElement)) {
        continue;
      }

      const className = getClassName(element);
      const isChatContainer = /live_chatting|chatting_area|chat_area/i.test(className);
      const isChatRow = /live_chatting_list_item/i.test(className);
      const isModernChatLog = element.getAttribute("role") === "log";
      const isModernChatHost = element.tagName === "ASIDE" && Boolean(element.querySelector("[role='log']"));

      if (isChatContainer && !isChatRow) {
        fallback ??= element;
      }

      if (isModernChatLog || isModernChatHost) {
        fallback ??= isModernChatHost ? element : element.closest("aside") || element;
      }

      if (
        fallback &&
        (queryAllSafe(element, CHAT_HEADER_SELECTORS).some((candidate) => candidate instanceof HTMLElement) ||
          findChatHeaderFromLog({ includeHidden: true }))
      ) {
        return isModernChatHost ? element : fallback;
      }
    }

    if (fallback) {
      return fallback;
    }
  }

  return null;
}

function clearGuestChatControlHosts(activeHost = null) {
  const hosts = document.querySelectorAll(`[${GUEST_CHAT_CONTROL_HOST_ATTR}="true"]`);

  for (const host of hosts) {
    if (host !== activeHost) {
      host.removeAttribute(GUEST_CHAT_CONTROL_HOST_ATTR);
    }
  }
}

function findGuestChatControlHost(guestHost, header = null) {
  if (!(guestHost instanceof HTMLElement)) {
    return null;
  }

  const headerElement = header instanceof HTMLElement
    ? header
    : queryAllSafe(guestHost, CHAT_HEADER_SELECTORS)
      .filter((element) => element instanceof HTMLElement)
      .find((element) => isChatHeaderCandidate(element, { includeHidden: true })) ||
      findChatHeaderInHost(guestHost, { includeHidden: true }) ||
      findChatHeaderFromChatAside({ includeHidden: true }) ||
      findChatHeaderFromLog({ includeHidden: true }) ||
      null;

  if (!(headerElement instanceof HTMLElement)) {
    return null;
  }

  let controlHost = headerElement;

  while (controlHost.parentElement && controlHost.parentElement !== guestHost) {
    controlHost = controlHost.parentElement;
  }

  return controlHost.parentElement === guestHost ? controlHost : null;
}

function markGuestChatControlHost(guestHost, header = null) {
  const controlHost = findGuestChatControlHost(guestHost, header);

  if (!controlHost) {
    return false;
  }

  controlHost.setAttribute(GUEST_CHAT_CONTROL_HOST_ATTR, "true");
  clearGuestChatControlHosts(controlHost);
  return true;
}

function getChatHeaderBar() {
  const target = findChatHeaderTarget();

  if (!target) {
    return null;
  }

  for (let current = target; current && current !== document.body; current = current.parentElement) {
    if (!(current instanceof HTMLElement)) {
      continue;
    }

    if (/live_chatting_header_(container|wrapper)/i.test(getClassName(current))) {
      return current;
    }
  }

  return target;
}

function isNestedHeaderAction(element, actions) {
  return actions.some((candidate) => candidate !== element && candidate.contains(element));
}

function findGuestChatToggleTarget() {
  if (!isGuestChatFrameEligibleContext()) {
    return null;
  }

  const header = getChatHeaderBar();

  if (!header) {
    return null;
  }

  const headerRect = header.getBoundingClientRect();
  const rightSideStart = headerRect.left + headerRect.width * 0.45;
  const actions = queryAllSafe(header, CHAT_HEADER_ACTION_BUTTON_SELECTORS)
    .filter((element) => element instanceof HTMLElement)
    .filter((element) => element.id !== GUEST_CHAT_TOGGLE_BUTTON_ID)
    .filter((element) => element.id !== HEADER_SETTINGS_BUTTON_ID)
    .filter((element) => element.id !== MINI_CHAT_BUTTON_ID)
    .filter((element) => !element.closest(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`))
    .filter((element) => !element.closest(`#${HEADER_SETTINGS_BUTTON_ID}`))
    .filter((element) => !element.closest(`#${MINI_CHAT_BUTTON_ID}`))
    .filter(isElementVisible);

  const candidates = actions
    .filter((element) => !isNestedHeaderAction(element, actions))
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0 && rect.left >= rightSideStart)
    .sort((left, right) => right.rect.right - left.rect.right || right.rect.left - left.rect.left);

  const before = candidates[0]?.element || null;
  const container = before?.parentElement instanceof HTMLElement ? before.parentElement : header;

  return { before, container, header };
}

function markGuestChatToggleControlHost(header) {
  if (!currentOptions.useGuestChatFrame) {
    clearGuestChatControlHosts();
    return;
  }

  const guestHost = findGuestChatHost();

  if (!guestHost || !header) {
    return;
  }

  markGuestChatControlHost(guestHost, header);
}

function setGuestChatToggleButtonState(button, state = currentOptions.useGuestChatFrame ? "on" : "off") {
  const labels = {
    off: "비로그인 채팅 켜기",
    on: "비로그인 채팅 끄기",
    loading: "비로그인 채팅 변경 중",
    error: "비로그인 채팅 변경 실패"
  };
  const isOn = currentOptions.useGuestChatFrame === true;
  const label = labels[state] || labels.off;

  button.dataset.state = state;
  button.disabled = state === "loading";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", String(isOn));
}

function resetGuestChatToggleButtonStateLater(button) {
  window.setTimeout(() => {
    if (button.isConnected && button.dataset.state !== "loading") {
      setGuestChatToggleButtonState(button);
    }
  }, 1800);
}

function setHeaderSettingsButtonState(button, state = "idle") {
  const labels = {
    idle: "채팅 설정 열기",
    loading: "채팅 설정 여는 중",
    error: "채팅 설정 열기 실패"
  };
  const label = labels[state] || labels.idle;

  button.dataset.state = state;
  button.disabled = state === "loading";
  button.title = label;
  button.setAttribute("aria-label", label);
}

function setMiniChatToggleButtonState(button, state = "idle") {
  const labels = {
    idle: currentOptions.useMiniFloatingChat ? "미니 채팅창 닫기" : "미니 채팅창 열기",
    loading: "미니 채팅창 변경 중",
    error: "미니 채팅창 변경 실패"
  };
  const label = labels[state] || labels.idle;

  button.dataset.state = state;
  button.disabled = state === "loading";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", String(currentOptions.useMiniFloatingChat === true));
}

function resetHeaderSettingsButtonStateLater(button) {
  window.setTimeout(() => {
    if (button.isConnected && button.dataset.state !== "loading") {
      setHeaderSettingsButtonState(button);
    }
  }, 1800);
}

function resetMiniChatToggleButtonStateLater(button) {
  window.setTimeout(() => {
    if (button.isConnected && button.dataset.state !== "loading") {
      setMiniChatToggleButtonState(button);
    }
  }, 1800);
}

async function openExtensionPopupFromHeader(button) {
  setHeaderSettingsButtonState(button, "loading");

  const result = await sendOpenPopupMessage();

  if (!result.ok) {
    setHeaderSettingsButtonState(button, "error");
    resetHeaderSettingsButtonStateLater(button);
    return;
  }

  setHeaderSettingsButtonState(button);
}

async function toggleGuestChatFrame(button) {
  const previousOptions = currentOptions;
  const nextOptions = normalizeOptions({
    ...currentOptions,
    useGuestChatFrame: !currentOptions.useGuestChatFrame
  });

  setGuestChatToggleButtonState(button, "loading");

  const result = await writeOptionsToStorageLocal(nextOptions);

  if (!result.ok) {
    applyOptions(previousOptions, { source: "header-toggle-error" });
    scan();
    setGuestChatToggleButtonState(button, "error");
    resetGuestChatToggleButtonStateLater(button);
    return;
  }

  applyOptions(result.options, { source: "header-toggle" });
  scan();
}

async function toggleMiniFloatingChat(button) {
  setMiniChatToggleButtonState(button, "loading");

  const result = await updateMiniChatOptions(
    {
      useMiniFloatingChat: !currentOptions.useMiniFloatingChat,
      miniFloatingChatCollapsed: false
    },
    "mini-chat-header-toggle"
  );

  if (!result.ok) {
    setMiniChatToggleButtonState(button, "error");
    resetMiniChatToggleButtonStateLater(button);
    return;
  }

  setMiniChatToggleButtonState(button);
}

function createGuestChatToggleButton() {
  const button = document.createElement("button");
  const icon = document.createElement("span");
  const slash = document.createElement("span");

  button.id = GUEST_CHAT_TOGGLE_BUTTON_ID;
  button.type = "button";
  button.className = "chzzk-chat-ui-toggle-guest-chat-toggle";
  icon.className = GUEST_CHAT_TOGGLE_BUTTON_ICON_CLASS;
  slash.className = GUEST_CHAT_TOGGLE_BUTTON_SLASH_CLASS;
  icon.setAttribute("aria-hidden", "true");
  slash.setAttribute("aria-hidden", "true");
  icon.append(slash);
  button.append(icon);
  setGuestChatToggleButtonState(button);

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleGuestChatFrame(button);
  });

  return button;
}

function canRenderHeaderSettingsButton() {
  return document.readyState !== "loading";
}

function createMiniChatToggleButton() {
  const button = document.createElement("button");
  const icon = document.createElement("span");

  button.id = MINI_CHAT_BUTTON_ID;
  button.type = "button";
  button.className = "chzzk-chat-ui-toggle-mini-chat-button";
  icon.className = MINI_CHAT_BUTTON_ICON_CLASS;
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = `
    <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path d="M5.2 4.2h7.6c1.35 0 2.2.85 2.2 2.05v4.15c0 1.2-.85 2.05-2.2 2.05H8.1L5.2 14.3v-1.85c-1.35 0-2.2-.85-2.2-2.05V6.25c0-1.2.85-2.05 2.2-2.05Z"></path>
      <circle cx="7.2" cy="8.35" r="0.8"></circle>
      <circle cx="10.8" cy="8.35" r="0.8"></circle>
    </svg>
  `;
  button.append(icon);
  setMiniChatToggleButtonState(button);

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleMiniFloatingChat(button);
  });

  return button;
}

function createHeaderSettingsButton() {
  const button = document.createElement("button");
  const icon = document.createElement("span");

  button.id = HEADER_SETTINGS_BUTTON_ID;
  button.type = "button";
  button.className = "chzzk-chat-ui-toggle-header-settings";
  icon.className = HEADER_SETTINGS_BUTTON_ICON_CLASS;
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.52a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.52a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>`;
  button.append(icon);
  setHeaderSettingsButtonState(button);

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openExtensionPopupFromHeader(button);
  });

  return button;
}

function ensureGuestChatToggleButton() {
  const existingButton = document.getElementById(GUEST_CHAT_TOGGLE_BUTTON_ID);
  const existingSettingsButton = document.getElementById(HEADER_SETTINGS_BUTTON_ID);
  const existingMiniChatButton = document.getElementById(MINI_CHAT_BUTTON_ID);

  if (!isGuestChatFrameEligibleContext()) {
    existingButton?.remove();
    existingSettingsButton?.remove();
    existingMiniChatButton?.remove();
    clearGuestChatControlHosts();
    return;
  }

  const target = findGuestChatToggleTarget();

  if (!target) {
    if (existingButton instanceof HTMLButtonElement) {
      setGuestChatToggleButtonState(existingButton);
    }

    if (existingSettingsButton instanceof HTMLButtonElement) {
      setHeaderSettingsButtonState(existingSettingsButton);
    }

    if (existingMiniChatButton instanceof HTMLButtonElement) {
      setMiniChatToggleButtonState(existingMiniChatButton);
    }

    if (currentOptions.useGuestChatFrame) {
      const guestHost = findGuestChatHost();

      if (guestHost) {
        markGuestChatControlHost(guestHost);
      }
    } else {
      clearGuestChatControlHosts();
    }
    return;
  }

  const settingsButton = currentOptions.showHeaderSettingsButton && canRenderHeaderSettingsButton()
    ? existingSettingsButton instanceof HTMLButtonElement
      ? existingSettingsButton
      : createHeaderSettingsButton()
    : null;

  if (settingsButton instanceof HTMLButtonElement) {
    setHeaderSettingsButtonState(settingsButton);

    if (settingsButton.parentElement !== target.container || settingsButton.nextSibling !== target.before) {
      target.container.insertBefore(settingsButton, target.before);
    }
  } else {
    existingSettingsButton?.remove();
  }

  let guestButton = null;

  if (currentOptions.showGuestChatToggleButton) {
    guestButton =
      existingButton instanceof HTMLButtonElement ? existingButton : createGuestChatToggleButton();
    const nextSibling = settingsButton instanceof HTMLButtonElement ? settingsButton : target.before;

    setGuestChatToggleButtonState(guestButton);

    if (guestButton.parentElement !== target.container || guestButton.nextSibling !== nextSibling) {
      target.container.insertBefore(guestButton, nextSibling);
    }
  } else {
    existingButton?.remove();
  }

  if (currentOptions.showMiniFloatingChatButton) {
    const button =
      existingMiniChatButton instanceof HTMLButtonElement ? existingMiniChatButton : createMiniChatToggleButton();
    const nextSibling =
      guestButton instanceof HTMLButtonElement && guestButton.isConnected
        ? guestButton
        : settingsButton instanceof HTMLButtonElement
          ? settingsButton
          : target.before;

    setMiniChatToggleButtonState(button);

    if (button.parentElement !== target.container || button.nextSibling !== nextSibling) {
      target.container.insertBefore(button, nextSibling);
    }
  } else {
    existingMiniChatButton?.remove();
  }

  markGuestChatToggleControlHost(target.header);
}
