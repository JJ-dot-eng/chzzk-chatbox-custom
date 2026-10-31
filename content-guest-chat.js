function createGuestChatFrameContainer() {
  const container = document.createElement("div");
  const iframe = document.createElement("iframe");

  container.id = GUEST_CHAT_FRAME_CONTAINER_ID;
  iframe.id = GUEST_CHAT_FRAME_ID;
  iframe.title = "나만 보는 치지직 채팅창";
  iframe.referrerPolicy = "origin";
  iframe.setAttribute("credentialless", "");
  iframe.credentialless = true;
  container.append(iframe);

  return container;
}

function hasLocalOnlyChatCredentiallessFrameMarker() {
  if (window.self === window.top || !isGuestChatFrameEmbedUrl(window.location.href)) {
    return false;
  }

  try {
    const frame = window.frameElement;

    return Boolean(
      frame &&
      String(frame.tagName || "").toUpperCase() === "IFRAME" &&
      frame.hasAttribute("credentialless") &&
      frame.credentialless === true
    );
  } catch (_error) {
    return false;
  }
}

function isLocalOnlyChatContext() {
  return localOnlyChatCredentiallessVerified && hasLocalOnlyChatCredentiallessFrameMarker();
}

async function verifyLocalOnlyChatCredentiallessContext() {
  if (
    localOnlyChatCredentiallessVerificationStarted ||
    !hasLocalOnlyChatCredentiallessFrameMarker()
  ) {
    return false;
  }

  localOnlyChatCredentiallessVerificationStarted = true;

  if (typeof document.hasStorageAccess !== "function") {
    return false;
  }

  try {
    const hasStorageAccess = await document.hasStorageAccess();

    if (hasStorageAccess !== false || !hasLocalOnlyChatCredentiallessFrameMarker()) {
      return false;
    }

    localOnlyChatCredentiallessVerified = true;
    applyGuestChatCleanBotDefault();
    connectLocalOnlyChatInterception();
    scheduleGuestChatUiSync();
    return true;
  } catch (_error) {
    return false;
  }
}

function getLocalOnlyChatEventPath(event) {
  return typeof event.composedPath === "function" ? event.composedPath() : [event.target];
}

function getLocalOnlyChatEventElement(event, attributeName) {
  return getLocalOnlyChatEventPath(event).find(
    (element) =>
      element instanceof HTMLElement && element.getAttribute(attributeName) === "true"
  ) || null;
}

function stopLocalOnlyChatEvent(event, { preventDefault = false } = {}) {
  if (preventDefault && event.cancelable) {
    event.preventDefault();
  }

  event.stopPropagation();
  event.stopImmediatePropagation();
}

function getLocalOnlyChatFieldValue(field) {
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    return field.value;
  }

  return field instanceof HTMLElement ? field.textContent || "" : "";
}

function setLocalOnlyChatFieldValue(field, value) {
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    field.value = value;
    return;
  }

  if (field instanceof HTMLElement) {
    field.textContent = value;
  }
}

function getLocalOnlyChatField() {
  const field = document.querySelector(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`);

  return field instanceof HTMLElement ? field : null;
}

function getLocalOnlyChatSendButton() {
  const button = document.querySelector(`[${LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR}="true"]`);

  return button instanceof HTMLButtonElement ? button : null;
}

function syncLocalOnlyChatSendButtonState(field = getLocalOnlyChatField()) {
  const button = getLocalOnlyChatSendButton();

  if (!(button instanceof HTMLButtonElement) || !(field instanceof HTMLElement)) {
    return;
  }

  button.disabled = getLocalOnlyChatFieldValue(field).trim().length === 0;
}

function resetLocalOnlyChatInputEventState() {
  localOnlyChatAllowLineBreakUntil = 0;
  localOnlyChatIsComposing = false;
  localOnlyChatImeSubmitPending = false;
  localOnlyChatEnterHandledUntilKeyup = false;
}

function handleLocalOnlyChatCapturedEvent(event) {
  if (!isLocalOnlyChatContext()) {
    return;
  }

  if (event.type === "submit") {
    const field = getLocalOnlyChatField();
    const form = event.target;

    if (
      field instanceof HTMLElement &&
      form instanceof HTMLFormElement &&
      form.contains(field)
    ) {
      stopLocalOnlyChatEvent(event, { preventDefault: true });
      submitLocalOnlyChatMessage(field);
    }

    return;
  }

  const field = getLocalOnlyChatEventElement(event, LOCAL_ONLY_CHAT_FIELD_ATTR);
  const sendButton = getLocalOnlyChatEventElement(event, LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR);

  if (!(field instanceof HTMLElement) && !(sendButton instanceof HTMLButtonElement)) {
    return;
  }

  if (event.type === "click" && sendButton instanceof HTMLButtonElement) {
    stopLocalOnlyChatEvent(event, { preventDefault: true });
    submitLocalOnlyChatMessage(getLocalOnlyChatField());
    return;
  }

  if (!(field instanceof HTMLElement)) {
    return;
  }

  if (event.type === "focusout") {
    resetLocalOnlyChatInputEventState();
    stopLocalOnlyChatEvent(event);
    return;
  }

  if (event.type === "compositionstart") {
    localOnlyChatIsComposing = true;
    localOnlyChatImeSubmitPending = false;
    localOnlyChatEnterHandledUntilKeyup = false;
    stopLocalOnlyChatEvent(event);
    return;
  }

  if (event.type === "compositionend") {
    localOnlyChatIsComposing = false;
    const shouldSubmit = localOnlyChatImeSubmitPending;

    localOnlyChatImeSubmitPending = false;

    if (shouldSubmit) {
      localOnlyChatEnterHandledUntilKeyup = true;
      submitLocalOnlyChatMessage(field);
    }

    stopLocalOnlyChatEvent(event);
    return;
  }

  if (event.type === "keydown") {
    const keyboardEvent = event;

    if (keyboardEvent.key === "Enter") {
      if (
        localOnlyChatIsComposing ||
        keyboardEvent.isComposing ||
        keyboardEvent.keyCode === 229
      ) {
        localOnlyChatImeSubmitPending = !keyboardEvent.shiftKey;

        if (keyboardEvent.shiftKey) {
          localOnlyChatAllowLineBreakUntil = Date.now() + 750;
          localOnlyChatEnterHandledUntilKeyup = false;
        } else {
          localOnlyChatEnterHandledUntilKeyup = true;
        }

        stopLocalOnlyChatEvent(event);
        return;
      }

      if (localOnlyChatEnterHandledUntilKeyup) {
        if (keyboardEvent.repeat || !getLocalOnlyChatFieldValue(field).trim()) {
          stopLocalOnlyChatEvent(event, { preventDefault: !keyboardEvent.shiftKey });
          return;
        }

        localOnlyChatEnterHandledUntilKeyup = false;
      }

      if (keyboardEvent.shiftKey) {
        localOnlyChatAllowLineBreakUntil = Date.now() + 750;
        stopLocalOnlyChatEvent(event);
        return;
      }

      localOnlyChatEnterHandledUntilKeyup = true;
      stopLocalOnlyChatEvent(event, { preventDefault: true });
      submitLocalOnlyChatMessage(field);
      return;
    }

    stopLocalOnlyChatEvent(event);
    return;
  }

  if (event.type === "keypress") {
    const isImeKeypress =
      localOnlyChatIsComposing || event.isComposing || event.keyCode === 229;

    stopLocalOnlyChatEvent(event, {
      preventDefault: event.key === "Enter" && !event.shiftKey && !isImeKeypress
    });
    return;
  }

  if (event.type === "keyup") {
    if (event.key === "Enter") {
      localOnlyChatEnterHandledUntilKeyup = false;
      localOnlyChatAllowLineBreakUntil = 0;
    }

    stopLocalOnlyChatEvent(event, {
      preventDefault: event.key === "Enter" && !event.shiftKey
    });
    return;
  }

  if (event.type === "beforeinput") {
    const inputType = String(event.inputType || "");
    const isLineBreak = inputType === "insertParagraph" || inputType === "insertLineBreak";

    if (
      isLineBreak &&
      (localOnlyChatIsComposing || event.isComposing)
    ) {
      stopLocalOnlyChatEvent(event);
      return;
    }

    if (isLineBreak && localOnlyChatEnterHandledUntilKeyup) {
      stopLocalOnlyChatEvent(event, { preventDefault: true });
      return;
    }

    if (isLineBreak && Date.now() <= localOnlyChatAllowLineBreakUntil) {
      localOnlyChatAllowLineBreakUntil = 0;
      stopLocalOnlyChatEvent(event);
      return;
    }

    if (isLineBreak) {
      stopLocalOnlyChatEvent(event, { preventDefault: true });
      submitLocalOnlyChatMessage(field);
      return;
    }

    stopLocalOnlyChatEvent(event);
    return;
  }

  if (event.type === "input") {
    syncLocalOnlyChatSendButtonState(field);
  }

  stopLocalOnlyChatEvent(event);
}

function connectLocalOnlyChatInterception() {
  if (localOnlyChatInterceptionConnected || !isLocalOnlyChatContext()) {
    return;
  }

  localOnlyChatInterceptionConnected = true;

  for (const eventType of [
    "beforeinput",
    "change",
    "click",
    "compositionend",
    "compositionstart",
    "drop",
    "focusin",
    "focusout",
    "input",
    "keydown",
    "keypress",
    "keyup",
    "mousedown",
    "paste",
    "pointerdown",
    "submit"
  ]) {
    window.addEventListener(eventType, handleLocalOnlyChatCapturedEvent, true);
  }

  window.addEventListener("blur", resetLocalOnlyChatInputEventState, true);
}

function findLocalOnlyChatOriginalField() {
  return queryAllSafe(document, LOCAL_ONLY_CHAT_INPUT_FIELD_SELECTORS)
    .filter((element) => element instanceof HTMLElement)
    .filter((element) => element.getAttribute(LOCAL_ONLY_CHAT_FIELD_ATTR) !== "true")
    .find((element) => {
      const aside = closestSafe(element, "aside#aside-chatting, aside:has([role='log'])");

      return aside instanceof HTMLElement && Boolean(aside.querySelector("[role='log']"));
    }) || null;
}

function findLocalOnlyChatOriginalSendButton(field) {
  for (
    let current = field?.parentElement, depth = 0;
    current instanceof HTMLElement && depth < 4;
    current = current.parentElement, depth += 1
  ) {
    if (current.matches("aside#aside-chatting, aside:has([role='log'])")) {
      break;
    }

    const buttons = queryAllSafe(current, [
      "button[class*='send_button' i]",
      "button[type='submit']",
      "button[aria-label*='전송' i]",
      "button[title*='전송' i]"
    ])
      .filter((element) => element instanceof HTMLButtonElement)
      .filter((element) => element.getAttribute(LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR) !== "true");
    const sendButton = buttons.find((button) => {
      const className = getClassName(button);
      const label = `${button.getAttribute("aria-label") || ""} ${button.title || ""}`;
      const isFormSubmit = button.type === "submit" && button.form?.contains(field);

      return /send_button/i.test(className) || isFormSubmit || /전송/u.test(label);
    });

    if (sendButton instanceof HTMLButtonElement) {
      return sendButton;
    }

  }

  return null;
}

function preserveLocalOnlyChatOriginalFieldState(field) {
  if (localOnlyChatOriginalFieldStates.has(field)) {
    return;
  }

  localOnlyChatOriginalFieldStates.set(field, {
    ariaHidden: field.getAttribute("aria-hidden"),
    disabled: "disabled" in field ? Boolean(field.disabled) : null,
    readOnly: "readOnly" in field ? Boolean(field.readOnly) : null,
    tabIndex: field.getAttribute("tabindex")
  });
}

function preserveLocalOnlyChatOriginalSendButtonState(button) {
  if (localOnlyChatOriginalSendButtonStates.has(button)) {
    return;
  }

  localOnlyChatOriginalSendButtonStates.set(button, {
    ariaHidden: button.getAttribute("aria-hidden"),
    disabled: button.disabled,
    tabIndex: button.getAttribute("tabindex")
  });
}

function hideLocalOnlyChatOriginalField(field) {
  preserveLocalOnlyChatOriginalFieldState(field);
  field.setAttribute(LOCAL_ONLY_CHAT_ORIGINAL_FIELD_ATTR, "true");
  field.setAttribute("aria-hidden", "true");
  field.setAttribute("tabindex", "-1");

  if ("disabled" in field) {
    field.disabled = true;
  }

  if ("readOnly" in field) {
    field.readOnly = true;
  }
}

function hideLocalOnlyChatOriginalSendButton(button) {
  preserveLocalOnlyChatOriginalSendButtonState(button);
  button.setAttribute(LOCAL_ONLY_CHAT_ORIGINAL_SEND_BUTTON_ATTR, "true");
  button.setAttribute("aria-hidden", "true");
  button.setAttribute("tabindex", "-1");
  button.disabled = true;
}

function stripLocalOnlyChatExecutableAttributes(root) {
  for (const element of [root, ...root.querySelectorAll("*")]) {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.toLowerCase().startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}

function createLocalOnlyChatField(originalField) {
  const field = originalField.cloneNode(false);

  stripLocalOnlyChatExecutableAttributes(field);

  for (const attributeName of [
    "aria-disabled",
    "disabled",
    "form",
    "formaction",
    "id",
    "name",
    "readonly"
  ]) {
    field.removeAttribute(attributeName);
  }

  field.setAttribute(LOCAL_ONLY_CHAT_FIELD_ATTR, "true");
  field.setAttribute("aria-label", "나만 보는 채팅 입력 · 실제 전송되지 않음");
  field.setAttribute("autocomplete", "off");
  field.setAttribute("maxlength", String(LOCAL_ONLY_CHAT_MAX_MESSAGE_LENGTH));
  field.setAttribute("placeholder", LOCAL_ONLY_CHAT_PLACEHOLDER);
  field.setAttribute("spellcheck", "true");
  field.setAttribute("tabindex", "0");

  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    field.disabled = false;
    field.readOnly = false;
    field.value = "";
  } else {
    field.setAttribute("contenteditable", "true");
    field.textContent = "";
  }

  return field;
}

function createLocalOnlyChatSendButton(originalButton) {
  const button = originalButton.cloneNode(true);

  stripLocalOnlyChatExecutableAttributes(button);

  for (const attributeName of [
    "aria-disabled",
    "disabled",
    "form",
    "formaction",
    "id",
    "name"
  ]) {
    button.removeAttribute(attributeName);
  }

  button.setAttribute(LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR, "true");
  button.setAttribute("aria-label", "내 화면의 채팅 목록에만 추가");
  button.setAttribute("title", "내 화면에만 표시 · 실제 전송되지 않음");
  button.type = "button";
  button.disabled = true;

  return button;
}

function restoreLocalOnlyChatOriginalField(field) {
  const state = localOnlyChatOriginalFieldStates.get(field);

  field.removeAttribute(LOCAL_ONLY_CHAT_ORIGINAL_FIELD_ATTR);

  if (!state) {
    return;
  }

  if (state.ariaHidden === null) field.removeAttribute("aria-hidden");
  else field.setAttribute("aria-hidden", state.ariaHidden);

  if (state.tabIndex === null) field.removeAttribute("tabindex");
  else field.setAttribute("tabindex", state.tabIndex);

  if (state.disabled !== null && "disabled" in field) field.disabled = state.disabled;
  if (state.readOnly !== null && "readOnly" in field) field.readOnly = state.readOnly;

  localOnlyChatOriginalFieldStates.delete(field);
}

function restoreLocalOnlyChatOriginalSendButton(button) {
  const state = localOnlyChatOriginalSendButtonStates.get(button);

  button.removeAttribute(LOCAL_ONLY_CHAT_ORIGINAL_SEND_BUTTON_ATTR);

  if (!state) {
    return;
  }

  if (state.ariaHidden === null) button.removeAttribute("aria-hidden");
  else button.setAttribute("aria-hidden", state.ariaHidden);

  if (state.tabIndex === null) button.removeAttribute("tabindex");
  else button.setAttribute("tabindex", state.tabIndex);

  button.disabled = state.disabled;
  localOnlyChatOriginalSendButtonStates.delete(button);
}

function findLocalOnlyChatLog(field = getLocalOnlyChatField()) {
  const aside = field instanceof HTMLElement
    ? closestSafe(field, "aside#aside-chatting, aside:has([role='log'])")
    : null;
  const scopedLog = aside?.querySelector("[role='log']");

  return scopedLog instanceof HTMLElement
    ? scopedLog
    : document.querySelector("aside#aside-chatting [role='log'], aside:has([role='log']) [role='log']");
}

function getLocalOnlyChatNativeRows(log) {
  if (!(log instanceof HTMLElement)) {
    return [];
  }

  return queryAllSafe(log, CHAT_ROW_SELECTORS)
    .filter((row) => row instanceof HTMLElement)
    .filter((row) => row.getAttribute(LOCAL_ONLY_CHAT_ROW_ATTR) !== "true")
    .filter(isChatMessageRow);
}

function createLocalOnlyChatFallbackRow() {
  const row = document.createElement("div");
  const nicknameButton = document.createElement("button");
  const nickname = document.createElement("span");
  const messageContainer = document.createElement("div");
  const messageText = document.createElement("span");

  row.className = "live_chatting_list_item chzzk-chat-ui-toggle-local-only-row";
  nicknameButton.type = "button";
  nicknameButton.className = "live_chatting_message_nickname";
  nickname.className = "live_chatting_username_nickname";
  messageContainer.className = "live_chatting_message_container";
  messageText.className = "live_chatting_message_text";
  nicknameButton.append(nickname);
  messageContainer.append(messageText);
  row.append(nicknameButton, messageContainer);

  return row;
}

function removeLocalOnlyChatClonedBadgeMedia(row, nickname) {
  const nicknameButton = getNicknameButtonElement(row);

  if (!(nicknameButton instanceof HTMLElement)) {
    return;
  }

  for (const media of [...nicknameButton.querySelectorAll("img, picture, source, svg, video")]) {
    let removable = media;

    while (
      removable.parentElement instanceof HTMLElement &&
      removable.parentElement !== nicknameButton &&
      !removable.parentElement.contains(nickname)
    ) {
      removable = removable.parentElement;
    }

    removable.remove();
  }
}

function sanitizeLocalOnlyChatRow(row, message) {
  for (const timestamp of queryAllSafe(row, [`[${GENERATED_TIMESTAMP_ATTR}]`])) {
    timestamp.remove();
  }

  const nickname = getNicknameTextElement(row);

  if (nickname instanceof HTMLElement) {
    removeLocalOnlyChatClonedBadgeMedia(row, nickname);
  }

  for (const element of [row, ...row.querySelectorAll("*")]) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();

      if (
        name === "id" ||
        name === "href" ||
        name === "src" ||
        name === "srcset" ||
        name === "poster" ||
        name === "action" ||
        name === "formaction" ||
        name === "form" ||
        name === "name" ||
        name === "target" ||
        name.startsWith("on") ||
        name.startsWith("data-chzzk-chat-ui-toggle-")
      ) {
        element.removeAttribute(attribute.name);
      }
    }

    if (element instanceof HTMLButtonElement) {
      element.type = "button";
      element.setAttribute("aria-disabled", "true");
      element.setAttribute("tabindex", "-1");
    }
  }

  const nextNickname = getNicknameTextElement(row);
  const messageText = getMessageTextElement(row);

  if (nextNickname instanceof HTMLElement) {
    nextNickname.textContent = "나";
  }

  if (messageText instanceof HTMLElement) {
    messageText.textContent = message.text;
  }

  row.setAttribute(LOCAL_ONLY_CHAT_ROW_ATTR, "true");
  row.setAttribute(LOCAL_ONLY_CHAT_MESSAGE_ID_ATTR, message.id);
  row.setAttribute("aria-label", `내 화면에만 표시된 채팅: ${message.text}`);

  return row;
}

function createLocalOnlyChatRow(message, templateRow = null) {
  const row = templateRow instanceof HTMLElement
    ? templateRow.cloneNode(true)
    : localOnlyChatRowTemplate instanceof HTMLElement
      ? localOnlyChatRowTemplate.cloneNode(true)
      : createLocalOnlyChatFallbackRow();

  return sanitizeLocalOnlyChatRow(row, message);
}

function getLocalOnlyChatScrollHost(log, rowContainer) {
  for (
    let current = rowContainer;
    current instanceof HTMLElement;
    current = current.parentElement
  ) {
    const style = window.getComputedStyle(current);

    if (
      current.scrollHeight > current.clientHeight + 4 &&
      /(auto|scroll)/i.test(style.overflowY)
    ) {
      return current;
    }

    if (current === log || current.matches("aside#aside-chatting")) {
      break;
    }
  }

  return log;
}

function isLocalOnlyChatReverseFlow(rowContainer) {
  if (!(rowContainer instanceof HTMLElement)) {
    return false;
  }

  return window.getComputedStyle(rowContainer).flexDirection.endsWith("reverse");
}

function getLocalOnlyChatTimelineSignature(row) {
  if (!(row instanceof HTMLElement)) {
    return "";
  }

  const nickname = getNicknameTextElement(row);
  const messageText = getMessageTextElement(row);

  if (!(messageText instanceof HTMLElement)) {
    return "";
  }

  const normalize = (element) => String(element?.textContent || "").replace(/\s+/g, " ").trim();
  const mediaLabels = [...messageText.querySelectorAll("img")]
    .map((image) => image.getAttribute("alt") || image.getAttribute("title") || "")
    .filter(Boolean)
    .join("|");

  const nicknameText = normalize(nickname);
  const chatText = normalize(messageText);

  return nicknameText || chatText || mediaLabels
    ? [nicknameText, chatText, mediaLabels].join("\u001f")
    : "";
}

function matchLocalOnlyChatTimelineEntries(previousEntries, currentEntries) {
  let bestOffset = 0;
  let bestOverlap = 0;

  for (let offset = 0; offset < currentEntries.length; offset += 1) {
    const overlapLimit = Math.min(previousEntries.length, currentEntries.length - offset);
    let overlap = 0;

    while (
      overlap < overlapLimit &&
      currentEntries[offset + overlap] === previousEntries[overlap]
    ) {
      overlap += 1;
    }

    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestOffset = offset;
    }
  }

  return {
    offset: bestOverlap > 0 ? bestOffset : 0,
    overlap: bestOverlap
  };
}

function getLocalOnlyChatTimelineDelta(
  previousSignatures,
  previousRows,
  currentSignatures,
  currentRows,
  mutatedNativeRows = null
) {
  const signatureMatch = matchLocalOnlyChatTimelineEntries(
    previousSignatures,
    currentSignatures
  );
  const rowMatch = matchLocalOnlyChatTimelineEntries(previousRows, currentRows);
  const newestRowContentChanged = Boolean(
    currentRows[0] &&
    currentRows[0] === previousRows[0] &&
    currentSignatures[0] !== previousSignatures[0] &&
    mutatedNativeRows?.has(currentRows[0])
  );
  const hasStableSignatureOverlap = signatureMatch.overlap >= 2;
  const hasRowIdentityOverlap = rowMatch.overlap > 0;

  return {
    hasConfidence:
      hasStableSignatureOverlap ||
      hasRowIdentityOverlap ||
      newestRowContentChanged,
    newEntryCount: Math.max(
      hasStableSignatureOverlap ? signatureMatch.offset : 0,
      hasRowIdentityOverlap ? rowMatch.offset : 0,
      newestRowContentChanged ? 1 : 0
    )
  };
}

function resetLocalOnlyChatSuspendedTimeline() {
  localOnlyChatSuspendedTimelinePlacementAvailable = false;
  localOnlyChatSuspendedTimelineSnapshot = [];
  localOnlyChatSuspendedTimelineRowsSnapshot = [];
}

function beginLocalOnlyChatSuspendedTimeline(currentSignatures, currentRows) {
  localOnlyChatNativeTimelinePlacementSuspended = true;
  localOnlyChatSuspendedTimelinePlacementAvailable = true;
  localOnlyChatSuspendedTimelineSnapshot = currentSignatures;
  localOnlyChatSuspendedTimelineRowsSnapshot = currentRows;
}

function advanceLocalOnlyChatNativeTimeline(nativeRows, mutatedNativeRows = null) {
  const currentRows = getLocalOnlyChatNativeRowsNewestFirst(nativeRows);
  const currentSignatures = currentRows.map(getLocalOnlyChatTimelineSignature);

  if (currentSignatures.some((signature) => !signature)) {
    return 0;
  }

  if (!localOnlyChatNativeTimelineInitialized) {
    localOnlyChatNativeTimelineInitialized = true;
    localOnlyChatNativeTimelineBaselineWasEmpty = currentRows.length === 0;
    localOnlyChatNativeTimelinePlacementSuspended = false;
    localOnlyChatNativeTimelineSnapshot = currentSignatures;
    localOnlyChatNativeTimelineRowsSnapshot = currentRows;
    resetLocalOnlyChatSuspendedTimeline();
    return 0;
  }

  if (currentRows.length === 0) {
    const shouldSuspendPlacement =
      !localOnlyChatNativeTimelineBaselineWasEmpty ||
      localOnlyChatNativeTimelineSnapshot.length > 0;

    if (shouldSuspendPlacement && !localOnlyChatNativeTimelinePlacementSuspended) {
      beginLocalOnlyChatSuspendedTimeline([], []);
    } else if (
      shouldSuspendPlacement &&
      localOnlyChatSuspendedTimelineSnapshot.length > 0
    ) {
      localOnlyChatSuspendedTimelinePlacementAvailable = false;
    }

    return 0;
  }

  if (
    localOnlyChatNativeTimelineBaselineWasEmpty &&
    localOnlyChatNativeTimelineSnapshot.length === 0
  ) {
    const newEntryCount = currentRows.length;

    localOnlyChatNativeTimelineBaselineWasEmpty = false;
    localOnlyChatNativeTimelinePlacementSuspended = false;
    localOnlyChatNativeTimelineSnapshot = currentSignatures;
    localOnlyChatNativeTimelineRowsSnapshot = currentRows;
    resetLocalOnlyChatSuspendedTimeline();

    for (const message of localOnlyChatMessages) {
      message.newerRemoteCount += newEntryCount;
    }

    return newEntryCount;
  }

  const primaryDelta = getLocalOnlyChatTimelineDelta(
    localOnlyChatNativeTimelineSnapshot,
    localOnlyChatNativeTimelineRowsSnapshot,
    currentSignatures,
    currentRows,
    mutatedNativeRows
  );

  if (!primaryDelta.hasConfidence) {
    if (!localOnlyChatNativeTimelinePlacementSuspended) {
      beginLocalOnlyChatSuspendedTimeline(currentSignatures, currentRows);
      return 0;
    }

    const suspendedDelta = localOnlyChatSuspendedTimelineSnapshot.length === 0
      ? { hasConfidence: true, newEntryCount: currentRows.length }
      : getLocalOnlyChatTimelineDelta(
          localOnlyChatSuspendedTimelineSnapshot,
          localOnlyChatSuspendedTimelineRowsSnapshot,
          currentSignatures,
          currentRows,
          mutatedNativeRows
        );

    if (!suspendedDelta.hasConfidence) {
      localOnlyChatSuspendedTimelinePlacementAvailable = false;
      return 0;
    }

    localOnlyChatSuspendedTimelinePlacementAvailable = true;
    localOnlyChatSuspendedTimelineSnapshot = currentSignatures;
    localOnlyChatSuspendedTimelineRowsSnapshot = currentRows;

    if (suspendedDelta.newEntryCount > 0) {
      for (const message of localOnlyChatMessages) {
        if (message.visibleWhileTimelineSuspended) {
          message.newerRemoteCount += suspendedDelta.newEntryCount;
        }
      }
    }

    return 0;
  }

  const newEntryCount = primaryDelta.newEntryCount;
  const wasPlacementSuspended = localOnlyChatNativeTimelinePlacementSuspended;

  localOnlyChatNativeTimelineBaselineWasEmpty = false;
  localOnlyChatNativeTimelinePlacementSuspended = false;
  localOnlyChatNativeTimelineSnapshot = currentSignatures;
  localOnlyChatNativeTimelineRowsSnapshot = currentRows;

  for (const message of localOnlyChatMessages) {
    if (wasPlacementSuspended && message.visibleWhileTimelineSuspended) {
      message.newerRemoteCount = Math.min(message.newerRemoteCount, newEntryCount);
    } else if (newEntryCount > 0) {
      message.newerRemoteCount += newEntryCount;
    }
  }

  resetLocalOnlyChatSuspendedTimeline();

  return newEntryCount;
}

function getLocalOnlyChatNativeRowsNewestFirst(nativeRows) {
  return [...nativeRows].sort((first, second) => {
    const firstRect = first.getBoundingClientRect();
    const secondRect = second.getBoundingClientRect();
    const verticalDifference =
      secondRect.top + secondRect.height / 2 - (firstRect.top + firstRect.height / 2);

    if (Math.abs(verticalDifference) > 1) {
      return verticalDifference;
    }

    if (first.parentElement === second.parentElement) {
      const siblings = [...first.parentElement.children];
      const firstIndex = siblings.indexOf(first);
      const secondIndex = siblings.indexOf(second);

      return isLocalOnlyChatReverseFlow(first.parentElement)
        ? firstIndex - secondIndex
        : secondIndex - firstIndex;
    }

    return 0;
  });
}

function removeLocalOnlyChatMessage(message) {
  const messageIndex = localOnlyChatMessages.indexOf(message);

  if (messageIndex < 0) {
    return;
  }

  if (message.row instanceof HTMLElement) {
    message.row.remove();
  }

  localOnlyChatMessages.splice(messageIndex, 1);
}

function getLocalOnlyChatEffectiveRemoteSlot(message, nativeRowCount) {
  const newerRemoteCount = Math.max(0, Number(message?.newerRemoteCount) || 0);

  return Math.min(newerRemoteCount, Math.max(0, Number(nativeRowCount) || 0));
}

function findLocalOnlyChatPreviousMessage(
  message,
  { nativeRowCount = Number.POSITIVE_INFINITY, visibleDuringSuspensionOnly = false } = {}
) {
  const messageIndex = localOnlyChatMessages.indexOf(message);
  const effectiveRemoteSlot = getLocalOnlyChatEffectiveRemoteSlot(message, nativeRowCount);

  for (let index = messageIndex - 1; index >= 0; index -= 1) {
    const candidate = localOnlyChatMessages[index];

    if (visibleDuringSuspensionOnly && !candidate.visibleWhileTimelineSuspended) {
      continue;
    }

    return getLocalOnlyChatEffectiveRemoteSlot(candidate, nativeRowCount) === effectiveRemoteSlot
      ? candidate
      : null;
  }

  return null;
}

function placeLocalOnlyChatMessage(message, log, nativeRows) {
  const row = message.row;

  if (!(row instanceof HTMLElement)) {
    return "expired";
  }

  let anchor = null;
  let placeAtOlderEdge = false;
  const nativeRowsNewestFirst = getLocalOnlyChatNativeRowsNewestFirst(nativeRows);

  const previousLocalMessage = findLocalOnlyChatPreviousMessage(message, {
    nativeRowCount: nativeRowsNewestFirst.length
  });

  if (previousLocalMessage) {
    const anchorMessage = previousLocalMessage;

    if (!(anchorMessage?.row instanceof HTMLElement) || !anchorMessage.row.isConnected) {
      return "pending";
    }

    anchor = anchorMessage.row;
  } else if (nativeRowsNewestFirst.length > 0) {
    const newerRemoteCount = Math.max(0, Number(message.newerRemoteCount) || 0);

    if (newerRemoteCount >= nativeRowsNewestFirst.length) {
      placeAtOlderEdge = true;
    } else {
      anchor = nativeRowsNewestFirst[newerRemoteCount] || null;
    }
  }

  if (anchor instanceof HTMLElement && anchor.parentElement instanceof HTMLElement) {
    const rowContainer = anchor.parentElement;
    const reverseFlow = isLocalOnlyChatReverseFlow(rowContainer);

    message.rowContainer = rowContainer;
    message.reverseFlow = reverseFlow;

    if (reverseFlow) {
      if (row.parentElement !== rowContainer || row.nextElementSibling !== anchor) {
        anchor.before(row);
      }
    } else if (row.parentElement !== rowContainer || row.previousElementSibling !== anchor) {
      anchor.after(row);
    }

    return "placed";
  }

  if (!placeAtOlderEdge && !message.insertedWithoutNativeRows) {
    return "pending";
  }

  const rowContainer = nativeRows[0]?.parentElement ||
    (message.rowContainer?.isConnected ? message.rowContainer : null) ||
    (log instanceof HTMLElement ? log : null);

  if (!(rowContainer instanceof HTMLElement)) {
    return "pending";
  }

  const reverseFlow = isLocalOnlyChatReverseFlow(rowContainer);

  message.rowContainer = rowContainer;
  message.reverseFlow = reverseFlow;

  if (reverseFlow) {
    if (row.parentElement !== rowContainer || row !== rowContainer.lastElementChild) {
      rowContainer.append(row);
    }
  } else if (row.parentElement !== rowContainer || row !== rowContainer.firstElementChild) {
    rowContainer.prepend(row);
  }

  return "placed";
}

function placeLocalOnlyChatMessageDuringSuspension(message, log, nativeRows) {
  const row = message.row;

  if (!(row instanceof HTMLElement)) {
    return;
  }

  const nativeRowsNewestFirst = getLocalOnlyChatNativeRowsNewestFirst(nativeRows);
  const previousVisibleMessage = findLocalOnlyChatPreviousMessage(message, {
    nativeRowCount: nativeRowsNewestFirst.length,
    visibleDuringSuspensionOnly: true
  });
  const newerRemoteCount = Math.max(0, Number(message.newerRemoteCount) || 0);
  let anchor = null;
  let placeAtOlderEdge = false;

  if (previousVisibleMessage) {
    if (!(previousVisibleMessage.row instanceof HTMLElement) || !previousVisibleMessage.row.isConnected) {
      return;
    }

    anchor = previousVisibleMessage.row;
  } else if (nativeRowsNewestFirst.length > 0) {
    if (newerRemoteCount >= nativeRowsNewestFirst.length) {
      placeAtOlderEdge = true;
    } else {
      anchor = nativeRowsNewestFirst[newerRemoteCount] || null;
    }
  }

  if (anchor instanceof HTMLElement && anchor.parentElement instanceof HTMLElement) {
    const rowContainer = anchor.parentElement;
    const reverseFlow = isLocalOnlyChatReverseFlow(rowContainer);

    message.rowContainer = rowContainer;
    message.reverseFlow = reverseFlow;

    if (reverseFlow) {
      if (row.parentElement !== rowContainer || row.nextElementSibling !== anchor) {
        anchor.before(row);
      }
    } else if (row.parentElement !== rowContainer || row.previousElementSibling !== anchor) {
      anchor.after(row);
    }

    return;
  }

  const rowContainer = nativeRows[0]?.parentElement ||
    (message.rowContainer?.isConnected ? message.rowContainer : null) ||
    (log instanceof HTMLElement ? log : null);

  if (!(rowContainer instanceof HTMLElement)) {
    return;
  }

  const reverseFlow = isLocalOnlyChatReverseFlow(rowContainer);

  message.rowContainer = rowContainer;
  message.reverseFlow = reverseFlow;

  if (placeAtOlderEdge) {
    if (reverseFlow) {
      if (row.parentElement !== rowContainer || row !== rowContainer.lastElementChild) {
        rowContainer.append(row);
      }
    } else if (row.parentElement !== rowContainer || row !== rowContainer.firstElementChild) {
      rowContainer.prepend(row);
    }
  } else if (reverseFlow) {
    if (row.parentElement !== rowContainer || row !== rowContainer.firstElementChild) {
      rowContainer.prepend(row);
    }
  } else if (row.parentElement !== rowContainer || row !== rowContainer.lastElementChild) {
    rowContainer.append(row);
  }
}

function insertLocalOnlyChatRow(message, { scroll = false } = {}) {
  const log = findLocalOnlyChatLog();

  if (!(log instanceof HTMLElement)) {
    return null;
  }

  const nativeRows = getLocalOnlyChatNativeRows(log);
  const nativeRowContainer = nativeRows[0]?.parentElement || null;
  const reverseFlow = isLocalOnlyChatReverseFlow(nativeRowContainer);
  const templateRow = (reverseFlow ? nativeRows[0] : nativeRows.at(-1)) || null;

  if (templateRow instanceof HTMLElement) {
    localOnlyChatRowTemplate = templateRow.cloneNode(true);
  }

  const localRows = queryAllSafe(log, [`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`]);
  const fallbackLocalRow = (reverseFlow ? localRows[0] : localRows.at(-1)) || null;
  const rememberedRowContainer = [...localOnlyChatMessages]
    .reverse()
    .find((candidate) => candidate.rowContainer?.isConnected)
    ?.rowContainer || null;
  const rowContainer = templateRow?.parentElement ||
    fallbackLocalRow?.parentElement ||
    rememberedRowContainer ||
    log;

  if (!(rowContainer instanceof HTMLElement)) {
    return null;
  }

  const scrollHost = getLocalOnlyChatScrollHost(log, rowContainer);
  const row = createLocalOnlyChatRow(message, templateRow);

  const reverseFlowAtInsert = isLocalOnlyChatReverseFlow(rowContainer);

  if (reverseFlowAtInsert) {
    rowContainer.prepend(row);
  } else {
    rowContainer.append(row);
  }
  message.row = row;
  message.rowContainer = rowContainer;
  message.reverseFlow = reverseFlowAtInsert;
  message.wasInserted = true;
  message.insertedWithoutNativeRows = nativeRows.length === 0;
  annotateChatRow(row);
  scheduleLargeTextLayoutSync([row]);

  for (const timestamp of queryAllSafe(row, [
    `[${ROLE_ATTR}~="timestamp"]`,
    `[${GENERATED_TIMESTAMP_ATTR}]`
  ])) {
    timestamp.textContent = message.time;
  }

  if (scroll) {
    window.requestAnimationFrame(() => {
      scrollHost.scrollTop = isLocalOnlyChatReverseFlow(rowContainer)
        ? 0
        : scrollHost.scrollHeight;
    });
  }

  return row;
}

function removeExpiredLocalOnlyChatRows() {
  const validIds = new Set(localOnlyChatMessages.map((message) => message.id));

  for (const row of queryAllSafe(document, [`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`])) {
    if (!validIds.has(row.getAttribute(LOCAL_ONLY_CHAT_MESSAGE_ID_ATTR) || "")) {
      row.remove();
    }
  }
}

function syncLocalOnlyChatRows({ scrollMessageId = null, mutatedNativeRows = null } = {}) {
  if (!isLocalOnlyChatContext() || localOnlyChatMessages.length === 0) {
    return;
  }

  const log = findLocalOnlyChatLog();

  if (!(log instanceof HTMLElement)) {
    return;
  }

  const nativeRows = getLocalOnlyChatNativeRows(log);
  const expiredMessages = [];

  advanceLocalOnlyChatNativeTimeline(nativeRows, mutatedNativeRows);

  for (const message of [...localOnlyChatMessages]) {
    if (!message.wasInserted) {
      insertLocalOnlyChatRow(message, { scroll: message.id === scrollMessageId });
    }
  }

  if (localOnlyChatNativeTimelinePlacementSuspended) {
    for (const message of localOnlyChatMessages) {
      if (
        message.visibleWhileTimelineSuspended &&
        localOnlyChatSuspendedTimelinePlacementAvailable
      ) {
        placeLocalOnlyChatMessageDuringSuspension(message, log, nativeRows);
      } else if (message.row instanceof HTMLElement && message.row.isConnected) {
        message.row.remove();
      }
    }

    return;
  }

  for (const message of [...localOnlyChatMessages]) {
    message.visibleWhileTimelineSuspended = false;

    if (placeLocalOnlyChatMessage(message, log, nativeRows) === "expired") {
      expiredMessages.push(message);
    }
  }

  for (const message of expiredMessages) {
    removeLocalOnlyChatMessage(message);
  }

  removeExpiredLocalOnlyChatRows();
}

function submitLocalOnlyChatMessage(field = getLocalOnlyChatField()) {
  if (!(field instanceof HTMLElement) || !isLocalOnlyChatContext()) {
    return false;
  }

  const text = getLocalOnlyChatFieldValue(field)
    .slice(0, LOCAL_ONLY_CHAT_MAX_MESSAGE_LENGTH)
    .trim();

  if (!text) {
    syncLocalOnlyChatSendButtonState(field);
    return false;
  }

  const message = {
    id: `${Date.now()}-${++localOnlyChatMessageSequence}`,
    insertedWithoutNativeRows: false,
    newerRemoteCount: 0,
    reverseFlow: false,
    row: null,
    rowContainer: null,
    text,
    time: formatTimestamp(new Date()),
    visibleWhileTimelineSuspended: localOnlyChatNativeTimelinePlacementSuspended,
    wasInserted: false
  };

  if (localOnlyChatMessages.length === 0) {
    localOnlyChatNativeTimelineInitialized = false;
    localOnlyChatNativeTimelineBaselineWasEmpty = false;
    localOnlyChatNativeTimelinePlacementSuspended = false;
    localOnlyChatNativeTimelineSnapshot = [];
    localOnlyChatNativeTimelineRowsSnapshot = [];
    resetLocalOnlyChatSuspendedTimeline();
  }

  localOnlyChatMessages.push(message);

  if (localOnlyChatMessages.length > LOCAL_ONLY_CHAT_MAX_MESSAGES) {
    const overflowCount = localOnlyChatMessages.length - LOCAL_ONLY_CHAT_MAX_MESSAGES;

    for (const expiredMessage of localOnlyChatMessages.slice(0, overflowCount)) {
      removeLocalOnlyChatMessage(expiredMessage);
    }
  }

  setLocalOnlyChatFieldValue(field, "");
  syncLocalOnlyChatSendButtonState(field);
  removeExpiredLocalOnlyChatRows();
  syncLocalOnlyChatRows({ scrollMessageId: message.id });

  return true;
}

function clearLocalOnlyChatComposer() {
  for (const field of queryAllSafe(document, [`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`])) {
    field.remove();
  }

  for (const button of queryAllSafe(document, [`[${LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR}="true"]`])) {
    button.remove();
  }

  for (const field of queryAllSafe(document, [`[${LOCAL_ONLY_CHAT_ORIGINAL_FIELD_ATTR}="true"]`])) {
    restoreLocalOnlyChatOriginalField(field);
  }

  for (const button of queryAllSafe(document, [`[${LOCAL_ONLY_CHAT_ORIGINAL_SEND_BUTTON_ATTR}="true"]`])) {
    restoreLocalOnlyChatOriginalSendButton(button);
  }

  for (const row of queryAllSafe(document, [`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`])) {
    row.remove();
  }

  localOnlyChatMessages = [];
  localOnlyChatRowTemplate = null;
  localOnlyChatNativeTimelineInitialized = false;
  localOnlyChatNativeTimelineBaselineWasEmpty = false;
  localOnlyChatNativeTimelinePlacementSuspended = false;
  localOnlyChatNativeTimelineSnapshot = [];
  localOnlyChatNativeTimelineRowsSnapshot = [];
  resetLocalOnlyChatInputEventState();
  resetLocalOnlyChatSuspendedTimeline();
  document.documentElement.removeAttribute(LOCAL_ONLY_CHAT_ACTIVE_ATTR);
}

function syncLocalOnlyNativeComposer() {
  if (!isLocalOnlyChatContext()) {
    clearLocalOnlyChatComposer();
    return;
  }

  connectLocalOnlyChatInterception();
  document.documentElement.setAttribute(LOCAL_ONLY_CHAT_ACTIVE_ATTR, "true");

  const originalField = findLocalOnlyChatOriginalField();

  if (!(originalField instanceof HTMLElement) || !originalField.parentElement) {
    return;
  }

  let field = originalField.previousElementSibling;

  if (!(field instanceof HTMLElement) || field.getAttribute(LOCAL_ONLY_CHAT_FIELD_ATTR) !== "true") {
    for (const staleField of queryAllSafe(document, [`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`])) {
      staleField.remove();
    }

    resetLocalOnlyChatInputEventState();
    field = createLocalOnlyChatField(originalField);
    originalField.parentElement.insertBefore(field, originalField);
  }

  hideLocalOnlyChatOriginalField(originalField);

  const originalSendButton = findLocalOnlyChatOriginalSendButton(originalField);

  if (originalSendButton instanceof HTMLButtonElement && originalSendButton.parentElement) {
    let sendButton = originalSendButton.previousElementSibling;

    if (
      !(sendButton instanceof HTMLButtonElement) ||
      sendButton.getAttribute(LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR) !== "true"
    ) {
      for (const staleButton of queryAllSafe(document, [`[${LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR}="true"]`])) {
        staleButton.remove();
      }

      sendButton = createLocalOnlyChatSendButton(originalSendButton);
      originalSendButton.parentElement.insertBefore(sendButton, originalSendButton);
    }

    hideLocalOnlyChatOriginalSendButton(originalSendButton);
  }

  syncLocalOnlyChatSendButtonState(field);
  syncLocalOnlyChatRows();
}

function localOnlyChatMutationNeedsSync(mutations) {
  if (!isLocalOnlyChatContext()) {
    return false;
  }

  const ownedSelector = [
    `[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`,
    `[${LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR}="true"]`,
    `[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`
  ].join(", ");

  return mutations.some((mutation) => [...mutation.removedNodes].some((node) => {
    const element = node instanceof Element ? node : node.parentElement;
    const ownedElements = element
      ? [
          ...(element.matches(ownedSelector) ? [element] : []),
          ...element.querySelectorAll(ownedSelector)
        ]
      : [];

    return ownedElements.some((ownedElement) => !ownedElement.isConnected);
  }));
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

function findGuestChatComposerToggleTarget() {
  if (!isGuestChatFrameEligibleContext() && !isLocalOnlyChatContext()) {
    return null;
  }

  const originalField = findLocalOnlyChatOriginalField();
  const originalSendButton = findLocalOnlyChatOriginalSendButton(originalField);
  const localOnlySendButton = isLocalOnlyChatContext() ? getLocalOnlyChatSendButton() : null;
  const sendButton =
    localOnlySendButton instanceof HTMLButtonElement && localOnlySendButton.isConnected
      ? localOnlySendButton
      : originalSendButton;

  if (!(sendButton instanceof HTMLButtonElement) || !(sendButton.parentElement instanceof HTMLElement)) {
    return null;
  }

  return {
    before: sendButton,
    container: sendButton.parentElement,
    sendButton
  };
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
    off: "나만 보는 채팅 켜기",
    on: "나만 보는 채팅 끄기",
    loading: "나만 보는 채팅 변경 중",
    error: "나만 보는 채팅 변경 실패"
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
    error: "브라우저 도구 모음의 확장 아이콘에서 설정을 열어 주세요"
  };
  const label = labels[state] || labels.idle;

  button.dataset.state = state;
  button.disabled = state === "loading";
  button.title = label;
  button.setAttribute("aria-label", label);
}

function setMiniChatToggleButtonState(button, state = "idle") {
  const isActive = currentOptions.useMiniFloatingChat && !currentOptions.useGuestChatFrame;
  const labels = {
    idle: isActive ? "미니 채팅창 닫기" : "미니 채팅창 열기",
    loading: "미니 채팅창 변경 중",
    error: "미니 채팅창 변경 실패"
  };
  const label = labels[state] || labels.idle;

  button.dataset.state = state;
  button.disabled = state === "loading";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", String(isActive));
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
  if (!supportsCredentiallessIframe()) {
    return;
  }

  const previousOptions = currentOptions;
  const stateRevisionAtStart = optionsStateRevision;
  const patch = {
    useGuestChatFrame: !currentOptions.useGuestChatFrame
  };

  setGuestChatToggleButtonState(button, "loading");

  const result = await writeOptionsPatchToStorageLocal(patch);
  const storageStateChanged = optionsStateRevision !== stateRevisionAtStart;

  if (!result.ok) {
    if (!storageStateChanged && result.authoritative && result.options) {
      applyOptions(result.options, { source: "composer-toggle-reconciled-error" });
    } else if (!storageStateChanged) {
      applyOptions(previousOptions, { source: "composer-toggle-error" });
    }

    scan();
    setGuestChatToggleButtonState(button, "error");
    resetGuestChatToggleButtonStateLater(button);
    return;
  }

  if (!storageStateChanged) {
    applyOptions(result.options, { source: "composer-toggle" });
  }

  scan();
}

async function toggleMiniFloatingChat(button) {
  setMiniChatToggleButtonState(button, "loading");

  const result = await updateMiniChatOptions(
    {
      useGuestChatFrame: false,
      useMiniFloatingChat: currentOptions.useGuestChatFrame || !currentOptions.useMiniFloatingChat,
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
  const canRenderHeaderButtons = isGuestChatFrameEligibleContext();
  const canRenderGuestChatToggle = supportsCredentiallessIframe() &&
    (canRenderHeaderButtons || isLocalOnlyChatContext());

  if (!canRenderHeaderButtons) {
    existingSettingsButton?.remove();
    existingMiniChatButton?.remove();
    clearGuestChatControlHosts();
  }

  const headerTarget = canRenderHeaderButtons ? findGuestChatToggleTarget() : null;

  if (canRenderHeaderButtons && !headerTarget) {
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
  }

  const settingsButton = headerTarget && currentOptions.showHeaderSettingsButton && canRenderHeaderSettingsButton()
    ? existingSettingsButton instanceof HTMLButtonElement
      ? existingSettingsButton
      : createHeaderSettingsButton()
    : null;

  if (settingsButton instanceof HTMLButtonElement) {
    setHeaderSettingsButtonState(settingsButton);

    if (
      settingsButton.parentElement !== headerTarget.container ||
      settingsButton.nextSibling !== headerTarget.before
    ) {
      headerTarget.container.insertBefore(settingsButton, headerTarget.before);
    }
  } else if (!headerTarget || !currentOptions.showHeaderSettingsButton) {
    existingSettingsButton?.remove();
  }

  if (headerTarget && currentOptions.showMiniFloatingChatButton) {
    const button =
      existingMiniChatButton instanceof HTMLButtonElement ? existingMiniChatButton : createMiniChatToggleButton();
    const nextSibling =
      settingsButton instanceof HTMLButtonElement && settingsButton.isConnected
        ? settingsButton
        : headerTarget.before;

    setMiniChatToggleButtonState(button);

    if (button.parentElement !== headerTarget.container || button.nextSibling !== nextSibling) {
      headerTarget.container.insertBefore(button, nextSibling);
    }
  } else if (!headerTarget || !currentOptions.showMiniFloatingChatButton) {
    existingMiniChatButton?.remove();
  }

  if (headerTarget) {
    markGuestChatToggleControlHost(headerTarget.header);
  }

  const composerTarget = canRenderGuestChatToggle ? findGuestChatComposerToggleTarget() : null;

  if (currentOptions.showGuestChatToggleButton && composerTarget) {
    const guestButton =
      existingButton instanceof HTMLButtonElement ? existingButton : createGuestChatToggleButton();

    setGuestChatToggleButtonState(guestButton);

    if (
      guestButton.parentElement !== composerTarget.container ||
      guestButton.nextSibling !== composerTarget.before
    ) {
      composerTarget.container.insertBefore(guestButton, composerTarget.before);
    }
  } else {
    existingButton?.remove();
  }
}
