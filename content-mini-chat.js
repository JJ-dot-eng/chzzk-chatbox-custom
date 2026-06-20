function getViewportBounds() {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  };
}

function clampMiniChatBoundsToViewport(
  bounds,
  { scale = currentOptions.miniFloatingChatScale, inputOnly = currentOptions.miniFloatingChatInputOnly } = {}
) {
  const normalizedBounds = normalizeMiniChatBounds(bounds, { inputOnly });
  const viewport = getViewportBounds();
  const scaleRatio = getMiniChatScaleRatio(scale);
  const minHeight = getMiniChatMinHeight(inputOnly);
  const fallbackHeight = inputOnly ? MINI_CHAT_INPUT_ONLY_HEIGHT : MINI_CHAT_DEFAULT_HEIGHT;
  const maxWidth = Math.max(
    MINI_CHAT_MIN_WIDTH,
    Math.min(MINI_CHAT_MAX_WIDTH, (viewport.width - MINI_CHAT_VIEWPORT_MARGIN * 2) / scaleRatio)
  );
  const maxHeight = Math.max(
    minHeight,
    Math.min(MINI_CHAT_MAX_HEIGHT, (viewport.height - MINI_CHAT_VIEWPORT_MARGIN * 2) / scaleRatio)
  );
  const width = clampNumber(normalizedBounds.width, MINI_CHAT_MIN_WIDTH, maxWidth, MINI_CHAT_DEFAULT_WIDTH);
  const height = clampNumber(normalizedBounds.height, minHeight, maxHeight, fallbackHeight);
  const visibleWidth = width * scaleRatio;
  const visibleHeight = height * scaleRatio;
  const fallbackLeft = viewport.width - visibleWidth - 20;
  const fallbackTop = viewport.height - height - 20;
  const maxLeft = Math.max(MINI_CHAT_VIEWPORT_MARGIN, viewport.width - visibleWidth - MINI_CHAT_VIEWPORT_MARGIN);
  const minTop = MINI_CHAT_VIEWPORT_MARGIN - height + visibleHeight;
  const maxTop = Math.max(minTop, viewport.height - height - MINI_CHAT_VIEWPORT_MARGIN);
  const left = clampNumber(
    normalizedBounds.left,
    MINI_CHAT_VIEWPORT_MARGIN,
    maxLeft,
    Math.max(MINI_CHAT_VIEWPORT_MARGIN, fallbackLeft)
  );
  const top = clampNumber(
    normalizedBounds.top,
    minTop,
    maxTop,
    Math.max(minTop, Math.min(maxTop, fallbackTop))
  );

  return { left, top, width, height };
}

function applyMiniChatPanelBounds(panel, bounds, clampOptions) {
  const nextBounds = clampMiniChatBoundsToViewport(bounds, clampOptions);

  panel.style.left = `${nextBounds.left}px`;
  panel.style.top = `${nextBounds.top}px`;
  panel.style.width = `${nextBounds.width}px`;
  panel.style.height = `${nextBounds.height}px`;
}

function readMiniChatPanelBounds(panel) {
  const rect = panel.getBoundingClientRect();
  const scaleRatio = getMiniChatScaleRatio();
  const styledLeft = Number.parseFloat(panel.style.left);
  const styledTop = Number.parseFloat(panel.style.top);
  const height = rect.height / scaleRatio;

  return normalizeMiniChatBounds({
    left: Number.isFinite(styledLeft) ? styledLeft : rect.left,
    top: Number.isFinite(styledTop) ? styledTop : rect.bottom - height,
    width: rect.width / scaleRatio,
    height
  }, { inputOnly: currentOptions.miniFloatingChatInputOnly });
}

function clampMiniChatBubbleBounds(bounds) {
  const viewport = getViewportBounds();
  const maxLeft = Math.max(MINI_CHAT_VIEWPORT_MARGIN, viewport.width - MINI_CHAT_BUBBLE_SIZE - MINI_CHAT_VIEWPORT_MARGIN);
  const maxTop = Math.max(MINI_CHAT_VIEWPORT_MARGIN, viewport.height - MINI_CHAT_BUBBLE_SIZE - MINI_CHAT_VIEWPORT_MARGIN);

  return {
    left: clampNumber(bounds?.left, MINI_CHAT_VIEWPORT_MARGIN, maxLeft, maxLeft),
    top: clampNumber(bounds?.top, MINI_CHAT_VIEWPORT_MARGIN, maxTop, maxTop)
  };
}

function applyMiniChatBubbleBounds(button, bounds) {
  const nextBounds = clampMiniChatBubbleBounds(bounds);

  miniChatBubbleBounds = nextBounds;
  button.style.left = `${nextBounds.left}px`;
  button.style.top = `${nextBounds.top}px`;
}

function getMiniChatBubbleBoundsFromPanel(panel) {
  const rect = panel.getBoundingClientRect();

  return clampMiniChatBubbleBounds({
    left: rect.right - MINI_CHAT_BUBBLE_SIZE,
    top: rect.bottom - MINI_CHAT_BUBBLE_SIZE
  });
}

function getMiniChatRestoreBoundsFromBubble(bounds, restoreBounds = miniChatRestoreBounds) {
  const baseBounds = normalizeMiniChatBounds(restoreBounds || currentOptions.miniFloatingChatBounds, {
    inputOnly: currentOptions.miniFloatingChatInputOnly
  });
  const bubbleBounds = clampMiniChatBubbleBounds(bounds);
  const scaleRatio = getMiniChatScaleRatio();
  const left = bubbleBounds.left + MINI_CHAT_BUBBLE_SIZE - baseBounds.width * scaleRatio;
  const top = bubbleBounds.top + MINI_CHAT_BUBBLE_SIZE - baseBounds.height;

  return clampMiniChatBoundsToViewport({
    ...baseBounds,
    left,
    top
  });
}

function resetMiniChatMinimizeState() {
  miniChatMinimized = false;
  miniChatBubbleBounds = null;
  miniChatRestoreBounds = null;
  miniChatBubbleIgnoreNextClick = false;
  miniChatBubbleDragState = null;
}

function removeMiniChatBubbleButton({ reset = false } = {}) {
  miniChatBubbleDragState = null;
  document.getElementById(MINI_CHAT_BUBBLE_ID)?.remove();

  if (reset) {
    resetMiniChatMinimizeState();
  }
}

function setMiniChatBubbleButtonState(button) {
  button.title = "미니 채팅창 펼치기";
  button.setAttribute("aria-label", button.title);
}

function handleMiniChatBubbleDragStart(event) {
  if (event.button !== 0) {
    return;
  }

  const button = event.currentTarget;

  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const bounds = clampMiniChatBubbleBounds(miniChatBubbleBounds || {
    left: button.getBoundingClientRect().left,
    top: button.getBoundingClientRect().top
  });

  miniChatBubbleDragState = {
    pointerId: event.pointerId,
    button,
    startX: event.clientX,
    startY: event.clientY,
    left: bounds.left,
    top: bounds.top,
    moved: false
  };
  button.dataset.dragging = "true";
  button.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function handleMiniChatBubbleDragMove(event) {
  if (!miniChatBubbleDragState || miniChatBubbleDragState.pointerId !== event.pointerId) {
    return;
  }

  const deltaX = event.clientX - miniChatBubbleDragState.startX;
  const deltaY = event.clientY - miniChatBubbleDragState.startY;

  if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
    miniChatBubbleDragState.moved = true;
  }

  applyMiniChatBubbleBounds(miniChatBubbleDragState.button, {
    left: miniChatBubbleDragState.left + deltaX,
    top: miniChatBubbleDragState.top + deltaY
  });
  event.preventDefault();
  event.stopPropagation();
}

function handleMiniChatBubbleDragEnd(event) {
  if (!miniChatBubbleDragState || miniChatBubbleDragState.pointerId !== event.pointerId) {
    return;
  }

  const { button, moved } = miniChatBubbleDragState;
  miniChatBubbleDragState = null;
  delete button.dataset.dragging;
  button.releasePointerCapture?.(event.pointerId);

  if (moved) {
    miniChatBubbleIgnoreNextClick = true;
    window.setTimeout(() => {
      miniChatBubbleIgnoreNextClick = false;
    }, 0);
  }

  event.preventDefault();
  event.stopPropagation();
}

function createMiniChatBubbleButton() {
  const button = document.createElement("button");
  const icon = document.createElement("span");

  button.id = MINI_CHAT_BUBBLE_ID;
  button.type = "button";
  icon.className = MINI_CHAT_BUBBLE_ICON_CLASS;
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = `
    <svg viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <path d="M6.2 5.2h9.6c1.55 0 2.7 1.08 2.7 2.52v5.18c0 1.44-1.15 2.52-2.7 2.52H9.5L5.6 17.7v-2.28c-1.3-.17-2.1-1.18-2.1-2.52V7.72c0-1.44 1.15-2.52 2.7-2.52Z"></path>
      <circle cx="8.5" cy="10.35" r="0.95"></circle>
      <circle cx="13.5" cy="10.35" r="0.95"></circle>
    </svg>
  `;
  button.append(icon);
  setMiniChatBubbleButtonState(button);
  button.addEventListener("pointerdown", handleMiniChatBubbleDragStart);
  button.addEventListener("pointermove", handleMiniChatBubbleDragMove);
  button.addEventListener("pointerup", handleMiniChatBubbleDragEnd);
  button.addEventListener("pointercancel", handleMiniChatBubbleDragEnd);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (miniChatBubbleIgnoreNextClick) {
      miniChatBubbleIgnoreNextClick = false;
      return;
    }

    restoreMiniFloatingChatFromBubble();
  });

  return button;
}

function syncMiniChatBubbleButton(host) {
  if (!(host instanceof HTMLElement)) {
    return null;
  }

  const button = document.getElementById(MINI_CHAT_BUBBLE_ID) instanceof HTMLButtonElement
    ? document.getElementById(MINI_CHAT_BUBBLE_ID)
    : createMiniChatBubbleButton();

  if (button.parentElement !== host) {
    host.append(button);
  }

  if (host === document.body) {
    button.removeAttribute(MINI_CHAT_FULLSCREEN_HOST_ATTR);
  } else {
    button.setAttribute(MINI_CHAT_FULLSCREEN_HOST_ATTR, "true");
  }

  setMiniChatBubbleButtonState(button);
  applyMiniChatBubbleBounds(button, miniChatBubbleBounds || {
    left: getViewportBounds().width - MINI_CHAT_BUBBLE_SIZE - 20,
    top: getViewportBounds().height - MINI_CHAT_BUBBLE_SIZE - 20
  });

  return button;
}

function minimizeMiniFloatingChatToBubble(panel) {
  if (!(panel instanceof HTMLElement)) {
    return;
  }

  miniChatRestoreBounds = readMiniChatPanelBounds(panel);
  miniChatBubbleBounds = getMiniChatBubbleBoundsFromPanel(panel);
  miniChatMinimized = true;
  panel.remove();
  syncMiniFloatingChatPanel();
}

async function restoreMiniFloatingChatFromBubble() {
  const button = document.getElementById(MINI_CHAT_BUBBLE_ID);
  const bounds = button instanceof HTMLElement
    ? clampMiniChatBubbleBounds({
      left: button.getBoundingClientRect().left,
      top: button.getBoundingClientRect().top
    })
    : clampMiniChatBubbleBounds(miniChatBubbleBounds);
  const nextBounds = getMiniChatRestoreBoundsFromBubble(bounds);
  const patch = {
    miniFloatingChatBounds: nextBounds
  };

  if (currentOptions.miniFloatingChatInputOnly) {
    patch.miniFloatingChatExpandedBounds = getMiniChatExpandedBoundsFromInputOnly(nextBounds);
  }

  miniChatMinimized = false;
  miniChatBubbleBounds = null;
  miniChatRestoreBounds = null;
  removeMiniChatBubbleButton();

  const result = await updateMiniChatOptions(patch, "mini-chat-bubble-restore");

  if (!result.ok) {
    miniChatMinimized = true;
    miniChatBubbleBounds = bounds;
    miniChatRestoreBounds = nextBounds;
    syncMiniFloatingChatPanel();
  }
}

async function updateMiniChatOptions(patch, source) {
  const previousOptions = currentOptions;
  const nextOptions = normalizeOptions({
    ...currentOptions,
    ...patch
  });
  const result = await writeOptionsToStorageLocal(nextOptions);

  if (!result.ok) {
    applyOptions(previousOptions, { source: `${source}-error` });
    return result;
  }

  applyOptions(result.options, { source });
  return result;
}

function getMiniChatLayoutTopForVisualTop(visualTop, height, scale = currentOptions.miniFloatingChatScale) {
  const scaleRatio = getMiniChatScaleRatio(scale);

  return visualTop - height * (1 - scaleRatio);
}

function getMiniChatInputOnlyBounds(expandedBounds, { visualTop = null } = {}) {
  const baseBounds = clampMiniChatBoundsToViewport(expandedBounds, {
    inputOnly: false
  });
  const inputOnlyBounds = {
    ...baseBounds,
    top: Number.isFinite(visualTop)
      ? getMiniChatLayoutTopForVisualTop(visualTop, MINI_CHAT_INPUT_ONLY_HEIGHT)
      : baseBounds.top,
    height: MINI_CHAT_INPUT_ONLY_HEIGHT
  };

  return clampMiniChatBoundsToViewport(inputOnlyBounds, {
    inputOnly: true
  });
}

function getMiniChatExpandedBoundsFromInputOnly(inputOnlyBounds, { visualTop = null } = {}) {
  const compactBounds = clampMiniChatBoundsToViewport(inputOnlyBounds, {
    inputOnly: true
  });
  const storedExpandedBounds = currentOptions.miniFloatingChatExpandedBounds;
  const expandedBase = storedExpandedBounds || {
    ...compactBounds,
    height: MINI_CHAT_DEFAULT_HEIGHT
  };
  const expandedHeight = normalizeMiniChatBounds(expandedBase).height;
  const expandedBounds = {
    ...expandedBase,
    left: compactBounds.left,
    top: Number.isFinite(visualTop)
      ? getMiniChatLayoutTopForVisualTop(visualTop, expandedHeight)
      : compactBounds.top,
    width: compactBounds.width,
    height: expandedHeight
  };

  return clampMiniChatBoundsToViewport(expandedBounds, {
    inputOnly: false
  });
}

function toggleMiniChatInputOnly() {
  const panel = document.getElementById(MINI_CHAT_PANEL_ID);
  const visualTop = panel instanceof HTMLElement ? panel.getBoundingClientRect().top : null;
  const activeBounds = panel instanceof HTMLElement
    ? readMiniChatPanelBounds(panel)
    : currentOptions.miniFloatingChatBounds;

  if (currentOptions.miniFloatingChatInputOnly) {
    const expandedBounds = getMiniChatExpandedBoundsFromInputOnly(activeBounds, { visualTop });

    if (panel instanceof HTMLElement) {
      panel.dataset.inputOnly = "false";
      applyMiniChatPanelBounds(panel, expandedBounds, { inputOnly: false });
    }

    updateMiniChatOptions(
      {
        miniFloatingChatInputOnly: false,
        miniFloatingChatBounds: expandedBounds,
        miniFloatingChatExpandedBounds: expandedBounds
      },
      "mini-chat-input-only"
    );
    return;
  }

  const expandedBounds = clampMiniChatBoundsToViewport(activeBounds, {
    inputOnly: false
  });
  const inputOnlyBounds = getMiniChatInputOnlyBounds(expandedBounds, { visualTop });

  if (panel instanceof HTMLElement) {
    panel.dataset.inputOnly = "true";
    applyMiniChatPanelBounds(panel, inputOnlyBounds, { inputOnly: true });
  }

  updateMiniChatOptions(
    {
      miniFloatingChatInputOnly: true,
      miniFloatingChatBounds: inputOnlyBounds,
      miniFloatingChatExpandedBounds: expandedBounds
    },
    "mini-chat-input-only"
  );
}

function updateMiniChatScale(delta) {
  const nextScale = normalizeMiniChatScale(currentOptions.miniFloatingChatScale + delta);

  if (nextScale === currentOptions.miniFloatingChatScale) {
    return;
  }

  const panel = document.getElementById(MINI_CHAT_PANEL_ID);
  const currentBounds = panel instanceof HTMLElement
    ? readMiniChatPanelBounds(panel)
    : currentOptions.miniFloatingChatBounds;
  const nextBounds = clampMiniChatBoundsToViewport(currentBounds, {
    scale: nextScale,
    inputOnly: currentOptions.miniFloatingChatInputOnly
  });

  if (panel instanceof HTMLElement) {
    applyMiniChatPanelBounds(panel, nextBounds, {
      scale: nextScale,
      inputOnly: currentOptions.miniFloatingChatInputOnly
    });
  }

  const patch = {
    miniFloatingChatScale: nextScale,
    miniFloatingChatBounds: nextBounds
  };

  if (currentOptions.miniFloatingChatInputOnly) {
    patch.miniFloatingChatExpandedBounds = getMiniChatExpandedBoundsFromInputOnly(nextBounds);
  }

  updateMiniChatOptions(patch, "mini-chat-scale");
}

function saveMiniChatPanelBounds(panel, { immediate = false } = {}) {
  window.clearTimeout(miniChatBoundsSaveTimer);

  const save = () => {
    if (!panel.isConnected) {
      return;
    }

    const nextBounds = readMiniChatPanelBounds(panel);
    const patch = {
      miniFloatingChatBounds: nextBounds
    };

    if (currentOptions.miniFloatingChatInputOnly) {
      patch.miniFloatingChatExpandedBounds = getMiniChatExpandedBoundsFromInputOnly(nextBounds);
    }

    updateMiniChatOptions(patch, "mini-chat-bounds");
  };

  if (immediate) {
    save();
    return;
  }

  miniChatBoundsSaveTimer = window.setTimeout(save, 240);
}

function supportsCredentiallessIframe() {
  return typeof HTMLIFrameElement !== "undefined" && "credentialless" in HTMLIFrameElement.prototype;
}

function isGuestChatFrameEligibleContext() {
  if (window.self !== window.top) {
    return false;
  }

  return Boolean(getGuestChatFrameUrl()) && !isLiveChatFrameUrl(window.location.href);
}

function isElementVisible(element) {
  return element instanceof HTMLElement && element.getClientRects().length > 0;
}

function clearGuestChatHosts(activeHost = null) {
  const hosts = document.querySelectorAll(`[${GUEST_CHAT_HOST_ATTR}="true"]`);

  for (const host of hosts) {
    if (host !== activeHost) {
      host.removeAttribute(GUEST_CHAT_HOST_ATTR);
    }
  }
}

function removeGuestChatFrame() {
  document.getElementById(GUEST_CHAT_FRAME_CONTAINER_ID)?.remove();
  clearGuestChatHosts();
  clearGuestChatControlHosts();
}

function removeMiniFloatingChatPanel({ resetMinimized = false } = {}) {
  window.clearTimeout(miniChatBoundsSaveTimer);
  miniChatDragState = null;
  miniChatResizeState = null;
  document.getElementById(MINI_CHAT_PANEL_ID)?.remove();

  if (resetMinimized) {
    removeMiniChatBubbleButton({ reset: true });
  }
}

// Mini chat mode names (user-facing Korean terms):
// - Chat view mode / "채팅 보기 모드": shows the chat list with the input box.
// - Input-only mode / "입력 전용 모드": shows only the chat input/send box.
function setMiniFloatingChatPanelState(panel) {
  const isInputOnly = currentOptions.miniFloatingChatInputOnly === true;
  const scale = currentOptions.miniFloatingChatScale;
  const minimizeButton = panel.querySelector(`.${MINI_CHAT_PANEL_MINIMIZE_CLASS}`);
  const closeButton = panel.querySelector(`.${MINI_CHAT_PANEL_CLOSE_CLASS}`);
  const inputOnlyButton = panel.querySelector(`.${MINI_CHAT_PANEL_INPUT_ONLY_CLASS}`);
  const scaleValue = panel.querySelector(`.${MINI_CHAT_PANEL_SCALE_VALUE_CLASS}`);
  const scaleDownButton = panel.querySelector(`[data-mini-chat-scale-delta="-${MINI_CHAT_SCALE_STEP}"]`);
  const scaleUpButton = panel.querySelector(`[data-mini-chat-scale-delta="${MINI_CHAT_SCALE_STEP}"]`);

  panel.dataset.inputOnly = String(isInputOnly);
  panel.dataset.scale = String(scale);

  if (scaleValue instanceof HTMLElement) {
    scaleValue.textContent = `${scale}%`;
    scaleValue.title = `채팅 배율 ${scale}%`;
  }

  if (scaleDownButton instanceof HTMLButtonElement) {
    scaleDownButton.disabled = scale <= MINI_CHAT_SCALE_MIN;
    scaleDownButton.title = `채팅 배율 줄이기 (${Math.max(MINI_CHAT_SCALE_MIN, scale - MINI_CHAT_SCALE_STEP)}%)`;
    scaleDownButton.setAttribute("aria-label", scaleDownButton.title);
  }

  if (scaleUpButton instanceof HTMLButtonElement) {
    scaleUpButton.disabled = scale >= MINI_CHAT_SCALE_MAX;
    scaleUpButton.title = `채팅 배율 키우기 (${Math.min(MINI_CHAT_SCALE_MAX, scale + MINI_CHAT_SCALE_STEP)}%)`;
    scaleUpButton.setAttribute("aria-label", scaleUpButton.title);
  }

  if (inputOnlyButton instanceof HTMLButtonElement) {
    inputOnlyButton.textContent = "ㅁ";
    inputOnlyButton.title = isInputOnly ? "채팅 목록 보기" : "입력창만 보기";
    inputOnlyButton.setAttribute("aria-label", inputOnlyButton.title);
    inputOnlyButton.setAttribute("aria-pressed", String(isInputOnly));
  }

  if (minimizeButton instanceof HTMLButtonElement) {
    minimizeButton.textContent = "−";
    minimizeButton.title = "말풍선으로 최소화";
    minimizeButton.setAttribute("aria-label", minimizeButton.title);
  }

  if (closeButton instanceof HTMLButtonElement) {
    closeButton.title = "미니 채팅창 닫기";
    closeButton.setAttribute("aria-label", closeButton.title);
  }
}

function handleMiniChatDragStart(event) {
  if (event.button !== 0 || event.target?.closest?.("button")) {
    return;
  }

  const dragHandle = event.currentTarget;
  const panel = dragHandle.closest(`#${MINI_CHAT_PANEL_ID}`);

  if (!(panel instanceof HTMLElement)) {
    return;
  }

  const bounds = readMiniChatPanelBounds(panel);
  miniChatDragState = {
    pointerId: event.pointerId,
    panel,
    startX: event.clientX,
    startY: event.clientY,
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height
  };
  panel.dataset.dragging = "true";
  dragHandle.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function handleMiniChatDragMove(event) {
  if (!miniChatDragState || miniChatDragState.pointerId !== event.pointerId) {
    return;
  }

  const nextBounds = clampMiniChatBoundsToViewport({
    left: miniChatDragState.left + event.clientX - miniChatDragState.startX,
    top: miniChatDragState.top + event.clientY - miniChatDragState.startY,
    width: miniChatDragState.width,
    height: miniChatDragState.height
  }, {
    inputOnly: currentOptions.miniFloatingChatInputOnly
  });

  miniChatDragState.panel.style.left = `${nextBounds.left}px`;
  miniChatDragState.panel.style.top = `${nextBounds.top}px`;
  event.preventDefault();
}

function handleMiniChatDragEnd(event) {
  if (!miniChatDragState || miniChatDragState.pointerId !== event.pointerId) {
    return;
  }

  const { panel } = miniChatDragState;
  miniChatDragState = null;
  delete panel.dataset.dragging;
  saveMiniChatPanelBounds(panel, { immediate: true });
  event.preventDefault();
}

function handleMiniChatResizeStart(event) {
  if (event.button !== 0) {
    return;
  }

  const handle = event.currentTarget;
  const panel = handle.closest(`#${MINI_CHAT_PANEL_ID}`);

  if (!(panel instanceof HTMLElement)) {
    return;
  }

  const rect = panel.getBoundingClientRect();
  const scaleRatio = getMiniChatScaleRatio();
  miniChatResizeState = {
    pointerId: event.pointerId,
    panel,
    scaleRatio,
    startX: event.clientX,
    startY: event.clientY,
    left: rect.left,
    visualTop: rect.top,
    width: rect.width / scaleRatio,
    height: rect.height / scaleRatio
  };
  panel.dataset.resizing = "true";
  handle.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function handleMiniChatResizeMove(event) {
  if (!miniChatResizeState || miniChatResizeState.pointerId !== event.pointerId) {
    return;
  }

  const viewport = getViewportBounds();
  const maxWidth = Math.max(
    MINI_CHAT_MIN_WIDTH,
    Math.min(
      MINI_CHAT_MAX_WIDTH,
      (viewport.width - miniChatResizeState.left - MINI_CHAT_VIEWPORT_MARGIN) /
        miniChatResizeState.scaleRatio
    )
  );
  const maxHeight = Math.max(
    MINI_CHAT_MIN_HEIGHT,
    Math.min(
      MINI_CHAT_MAX_HEIGHT,
      (viewport.height - miniChatResizeState.visualTop - MINI_CHAT_VIEWPORT_MARGIN) /
        miniChatResizeState.scaleRatio
    )
  );
  const width = clampNumber(
    miniChatResizeState.width + (event.clientX - miniChatResizeState.startX) / miniChatResizeState.scaleRatio,
    MINI_CHAT_MIN_WIDTH,
    maxWidth,
    miniChatResizeState.width
  );
  const height = currentOptions.miniFloatingChatInputOnly
    ? MINI_CHAT_INPUT_ONLY_HEIGHT
    : clampNumber(
      miniChatResizeState.height + (event.clientY - miniChatResizeState.startY) / miniChatResizeState.scaleRatio,
      MINI_CHAT_MIN_HEIGHT,
      maxHeight,
      miniChatResizeState.height
    );
  const top = miniChatResizeState.visualTop - height * (1 - miniChatResizeState.scaleRatio);

  miniChatResizeState.panel.style.left = `${miniChatResizeState.left}px`;
  miniChatResizeState.panel.style.top = `${top}px`;
  miniChatResizeState.panel.style.width = `${width}px`;
  miniChatResizeState.panel.style.height = `${height}px`;
  event.preventDefault();
  event.stopPropagation();
}

function handleMiniChatResizeEnd(event) {
  if (!miniChatResizeState || miniChatResizeState.pointerId !== event.pointerId) {
    return;
  }

  const { panel } = miniChatResizeState;
  miniChatResizeState = null;
  delete panel.dataset.resizing;
  saveMiniChatPanelBounds(panel, { immediate: true });
  event.preventDefault();
  event.stopPropagation();
}

function createMiniFloatingChatPanel() {
  const panel = document.createElement("section");
  const controlsBar = document.createElement("div");
  const scaleControls = document.createElement("div");
  const scaleDownButton = document.createElement("button");
  const scaleValue = document.createElement("span");
  const scaleUpButton = document.createElement("button");
  const modeControls = document.createElement("div");
  const inputOnlyButton = document.createElement("button");
  const actions = document.createElement("div");
  const minimizeButton = document.createElement("button");
  const closeButton = document.createElement("button");
  const body = document.createElement("div");
  const iframe = document.createElement("iframe");
  const resizeHandle = document.createElement("div");

  panel.id = MINI_CHAT_PANEL_ID;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "미니 채팅");

  controlsBar.className = MINI_CHAT_PANEL_CONTROLS_CLASS;
  controlsBar.addEventListener("pointerdown", handleMiniChatDragStart);
  controlsBar.addEventListener("pointermove", handleMiniChatDragMove);
  controlsBar.addEventListener("pointerup", handleMiniChatDragEnd);
  controlsBar.addEventListener("pointercancel", handleMiniChatDragEnd);

  actions.dataset.miniChatActions = "true";
  modeControls.className = MINI_CHAT_PANEL_MODE_CLASS;
  modeControls.dataset.miniChatMode = "true";
  scaleControls.className = MINI_CHAT_PANEL_SCALE_CLASS;
  scaleControls.dataset.miniChatScaleControls = "true";

  scaleDownButton.type = "button";
  scaleDownButton.className = MINI_CHAT_PANEL_SCALE_BUTTON_CLASS;
  scaleDownButton.dataset.miniChatScaleDelta = String(-MINI_CHAT_SCALE_STEP);
  scaleDownButton.textContent = "-";
  scaleDownButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    updateMiniChatScale(-MINI_CHAT_SCALE_STEP);
  });

  scaleValue.className = MINI_CHAT_PANEL_SCALE_VALUE_CLASS;
  scaleValue.setAttribute("aria-live", "polite");

  scaleUpButton.type = "button";
  scaleUpButton.className = MINI_CHAT_PANEL_SCALE_BUTTON_CLASS;
  scaleUpButton.dataset.miniChatScaleDelta = String(MINI_CHAT_SCALE_STEP);
  scaleUpButton.textContent = "+";
  scaleUpButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    updateMiniChatScale(MINI_CHAT_SCALE_STEP);
  });

  inputOnlyButton.type = "button";
  inputOnlyButton.className = MINI_CHAT_PANEL_INPUT_ONLY_CLASS;
  inputOnlyButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleMiniChatInputOnly();
  });

  minimizeButton.type = "button";
  minimizeButton.className = MINI_CHAT_PANEL_MINIMIZE_CLASS;
  minimizeButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    minimizeMiniFloatingChatToBubble(panel);
  });

  closeButton.type = "button";
  closeButton.className = MINI_CHAT_PANEL_CLOSE_CLASS;
  closeButton.textContent = "×";
  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    updateMiniChatOptions(
      {
        useMiniFloatingChat: false
      },
      "mini-chat-close"
    );
  });

  body.dataset.miniChatBody = "true";
  iframe.id = MINI_CHAT_FRAME_ID;
  iframe.title = "미니 치지직 채팅";
  iframe.referrerPolicy = "origin";
  body.append(iframe);

  resizeHandle.className = MINI_CHAT_PANEL_RESIZE_CLASS;
  resizeHandle.setAttribute("role", "presentation");
  resizeHandle.addEventListener("pointerdown", handleMiniChatResizeStart);
  resizeHandle.addEventListener("pointermove", handleMiniChatResizeMove);
  resizeHandle.addEventListener("pointerup", handleMiniChatResizeEnd);
  resizeHandle.addEventListener("pointercancel", handleMiniChatResizeEnd);

  scaleControls.append(scaleDownButton, scaleValue, scaleUpButton);
  modeControls.append(inputOnlyButton);
  actions.append(minimizeButton, closeButton);
  controlsBar.append(scaleControls, modeControls, actions);
  panel.append(body, controlsBar, resizeHandle);
  setMiniFloatingChatPanelState(panel);

  return panel;
}

function canHostMiniChatFullscreenPanel(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return !FULLSCREEN_UNSUPPORTED_MINI_CHAT_HOST_TAG_NAMES.has(element.tagName);
}

function getMiniChatPanelHost() {
  if (canHostMiniChatFullscreenPanel(document.fullscreenElement)) {
    return document.fullscreenElement;
  }

  return document.body || null;
}

function moveMiniChatPanelToHost(panel, host) {
  if (!(panel instanceof HTMLElement) || !(host instanceof HTMLElement)) {
    return;
  }

  if (panel.parentElement !== host) {
    host.append(panel);
  }

  if (host === document.body) {
    panel.removeAttribute(MINI_CHAT_FULLSCREEN_HOST_ATTR);
    return;
  }

  panel.setAttribute(MINI_CHAT_FULLSCREEN_HOST_ATTR, "true");
}

function handleMiniChatFullscreenChange() {
  scheduleGuestChatUiSync();
}

function isPageFullscreenActive() {
  return Boolean(document.fullscreenElement);
}

function shouldRenderGuestChatFrame() {
  return currentOptions.useGuestChatFrame && !isPageFullscreenActive();
}

function isMiniFloatingChatTemporarilyDisabledByGuestChat() {
  return currentOptions.useGuestChatFrame;
}

function shouldRenderMiniFloatingChatPanel() {
  if (!currentOptions.useMiniFloatingChat || !isMiniFloatingChatEligibleContext()) {
    return false;
  }

  if (isMiniFloatingChatTemporarilyDisabledByGuestChat()) {
    return false;
  }

  if (!currentOptions.miniFloatingChatFullscreenOnly) {
    return true;
  }

  return canHostMiniChatFullscreenPanel(document.fullscreenElement);
}

function syncMiniFloatingChatPanel() {
  const existingPanel = document.getElementById(MINI_CHAT_PANEL_ID);

  if (!currentOptions.useMiniFloatingChat || !isMiniFloatingChatEligibleContext()) {
    removeMiniFloatingChatPanel({ resetMinimized: true });
    return;
  }

  const panelHost = getMiniChatPanelHost();

  if (!panelHost) {
    removeMiniFloatingChatPanel();
    removeMiniChatBubbleButton();
    return;
  }

  const frameUrl = getMiniChatFrameUrl();

  if (!frameUrl) {
    removeMiniFloatingChatPanel({ resetMinimized: true });
    return;
  }

  if (!shouldRenderMiniFloatingChatPanel()) {
    removeMiniFloatingChatPanel();
    removeMiniChatBubbleButton();
    return;
  }

  if (miniChatMinimized) {
    removeMiniFloatingChatPanel();
    syncMiniChatBubbleButton(panelHost);
    return;
  }

  removeMiniChatBubbleButton();

  const isExistingPanel = existingPanel instanceof HTMLElement;
  const panel = isExistingPanel ? existingPanel : createMiniFloatingChatPanel();
  const iframe = panel.querySelector(`#${MINI_CHAT_FRAME_ID}`);
  const nextBounds = isExistingPanel ? readMiniChatPanelBounds(panel) : currentOptions.miniFloatingChatBounds;

  if (iframe instanceof HTMLIFrameElement && iframe.src !== frameUrl) {
    iframe.src = frameUrl;
  }

  setMiniFloatingChatPanelState(panel);
  moveMiniChatPanelToHost(panel, panelHost);
  applyMiniChatPanelBounds(panel, nextBounds);
}
