const { mkdirSync } = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright-core");

const CDP_URL = process.env.EDGE_CDP_URL || "http://127.0.0.1:9333";
const LIVE_URL =
  process.env.CHZZK_LIVE_URL ||
  "https://chzzk.naver.com/live/1b0561f3051c10a24b9d8ec9a6cb3374";
const STORAGE_KEY = "chzzkChatUiToggleOptions";
const ROLE_ATTR = "data-chzzk-chat-ui-toggle-role";
const CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-chat-row";
const OUTPUT_DIR = path.join(process.cwd(), "output", "playwright");
const DEFAULT_CHAT_BOX_COLOR = "#808080";

const onOptions = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true,
  showLargeText: false,
  showBoldText: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const offOptions = {
  showNicknames: false,
  showBadges: false,
  showTimestamps: false,
  showChatBoxes: true,
  showLargeText: false,
  showBoldText: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const badgeOffOptions = {
  showNicknames: true,
  showBadges: false,
  showTimestamps: true,
  showChatBoxes: true,
  showLargeText: false,
  showBoldText: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const nicknameOffOptions = {
  showNicknames: false,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true,
  showLargeText: false,
  showBoldText: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const chatBoxOffOptions = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: false,
  showLargeText: false,
  showBoldText: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const largeTextColorOptions = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true,
  showLargeText: true,
  showBoldText: false,
  chatBoxColor: "#4b8bff"
};

const boldTextOptions = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true,
  showLargeText: false,
  showBoldText: true,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

function normalizeHexColor(value) {
  const trimmed = String(value || "").trim();
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }

  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return hex.toLowerCase();
  }

  return DEFAULT_CHAT_BOX_COLOR;
}

function hexToExpectedRgba(hexColor) {
  const hex = normalizeHexColor(hexColor).slice(1);
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, 0.18)`;
}

function summarizeFrameState(frameStates) {
  const summary = frameStates.reduce(
    (summary, state) => {
      for (const key of ["nickname", "badge", "timestamp"]) {
        summary.counts[key] += state.counts[key] || 0;
        summary.hidden[key] += state.hidden[key] || 0;
        summary.visible[key] += state.visible[key] || 0;
      }

      for (const gap of state.layout?.timestampNicknameGaps || []) {
        summary.layout.timestampNicknameGaps.push(gap);
      }

      const chatBoxes = state.layout?.chatBoxes;

      if (chatBoxes) {
        summary.layout.chatBoxes.sampleCount += chatBoxes.sampleCount || 0;
        summary.layout.chatBoxes.roundedCount += chatBoxes.roundedCount || 0;
        summary.layout.chatBoxes.backgroundedCount += chatBoxes.backgroundedCount || 0;
        summary.layout.chatBoxes.paddedCount += chatBoxes.paddedCount || 0;
        summary.layout.chatBoxes.shrunkenCount += chatBoxes.shrunkenCount || 0;
        summary.layout.chatBoxes.minWidth =
          summary.layout.chatBoxes.minWidth === null
            ? chatBoxes.minWidth
            : Math.min(summary.layout.chatBoxes.minWidth, chatBoxes.minWidth || summary.layout.chatBoxes.minWidth);
        summary.layout.chatBoxes.maxWidth =
          summary.layout.chatBoxes.maxWidth === null
            ? chatBoxes.maxWidth
            : Math.max(summary.layout.chatBoxes.maxWidth, chatBoxes.maxWidth || summary.layout.chatBoxes.maxWidth);
        summary.layout.chatBoxes.widthSpread =
          summary.layout.chatBoxes.minWidth !== null && summary.layout.chatBoxes.maxWidth !== null
            ? summary.layout.chatBoxes.maxWidth - summary.layout.chatBoxes.minWidth
            : null;

        for (const delta of chatBoxes.textInsetDeltas || []) {
          summary.layout.chatBoxes.textInsetDeltas.push(delta);
        }

        for (const fontSize of chatBoxes.fontSizes || []) {
          summary.layout.chatBoxes.fontSizes.push(fontSize);
        }

        for (const fontWeight of chatBoxes.fontWeights || []) {
          summary.layout.chatBoxes.fontWeights.push(fontWeight);
        }

        for (const fontWeight of chatBoxes.messageFontWeights || []) {
          summary.layout.chatBoxes.messageFontWeights.push(fontWeight);
        }

        for (const backgroundColor of chatBoxes.backgroundColors || []) {
          summary.layout.chatBoxes.backgroundColors.push(backgroundColor);
        }

        for (const sample of chatBoxes.samples || []) {
          if (summary.layout.chatBoxes.samples.length < 8) {
            summary.layout.chatBoxes.samples.push(sample);
          }
        }
      }

      if (state.hasStyle) {
        summary.framesWithStyle += 1;
      }

      if (state.hasRootDataset) {
        summary.framesWithRootDataset += 1;
      }

      return summary;
    },
    {
      framesWithStyle: 0,
      framesWithRootDataset: 0,
      counts: { nickname: 0, badge: 0, timestamp: 0 },
      hidden: { nickname: 0, badge: 0, timestamp: 0 },
      visible: { nickname: 0, badge: 0, timestamp: 0 },
      layout: {
        timestampNicknameGaps: [],
        chatBoxes: {
          sampleCount: 0,
          roundedCount: 0,
          backgroundedCount: 0,
          paddedCount: 0,
          shrunkenCount: 0,
          minWidth: null,
          maxWidth: null,
          widthSpread: null,
          textInsetDeltas: [],
          maxTextInsetDelta: null,
          fontSizes: [],
          maxFontSize: null,
          fontWeights: [],
          maxFontWeight: null,
          messageFontWeights: [],
          maxMessageFontWeight: null,
          backgroundColors: [],
          samples: []
        }
      }
    }
  );

  const gaps = summary.layout.timestampNicknameGaps;
  summary.layout.timestampNicknameGapCount = gaps.length;
  summary.layout.timestampNicknameGapMax = gaps.length ? Math.max(...gaps) : null;
  summary.layout.timestampNicknameGapMedian = gaps.length
    ? [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)]
    : null;

  const insetDeltas = summary.layout.chatBoxes.textInsetDeltas;
  summary.layout.chatBoxes.maxTextInsetDelta = insetDeltas.length ? Math.max(...insetDeltas) : null;
  const fontSizes = summary.layout.chatBoxes.fontSizes;
  summary.layout.chatBoxes.maxFontSize = fontSizes.length ? Math.max(...fontSizes) : null;
  const fontWeights = summary.layout.chatBoxes.fontWeights;
  summary.layout.chatBoxes.maxFontWeight = fontWeights.length ? Math.max(...fontWeights) : null;
  const messageFontWeights = summary.layout.chatBoxes.messageFontWeights;
  summary.layout.chatBoxes.maxMessageFontWeight = messageFontWeights.length
    ? Math.max(...messageFontWeights)
    : null;

  return summary;
}

async function collectFrameStates(page) {
  const states = [];

  for (const frame of page.frames()) {
    try {
      const state = await frame.evaluate(({ roleAttr, chatRowAttr }) => {
        const roles = ["nickname", "badge", "timestamp"];
        const counts = {};
        const hidden = {};
        const visible = {};
        const samples = {};

        for (const role of roles) {
          const elements = [...document.querySelectorAll(`[${chatRowAttr}="true"] [${roleAttr}~="${role}"]`)];
          counts[role] = elements.length;
          hidden[role] = elements.filter((element) => getComputedStyle(element).display === "none").length;
          visible[role] = elements.filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();

            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
          }).length;
          samples[role] = elements.slice(0, 4).map((element) => ({
            tag: element.tagName.toLowerCase(),
            className: String(element.getAttribute("class") || "").slice(0, 120),
            text: String(element.textContent || element.getAttribute("alt") || "").trim().slice(0, 80)
          }));
        }

        const timestampNicknameGaps = [...document.querySelectorAll("[class*='live_chatting_list_item' i]")]
          .slice(-80)
          .map((row) => {
            const timestamp = row.querySelector(`[${roleAttr}~="timestamp"]`);
            const nickname = row.querySelector(`[${roleAttr}~="nickname"]`);

            if (!timestamp || !nickname) {
              return null;
            }

            const timestampStyle = getComputedStyle(timestamp);
            const nicknameStyle = getComputedStyle(nickname);

            if (timestampStyle.display === "none" || nicknameStyle.display === "none") {
              return null;
            }

            const timestampRect = timestamp.getBoundingClientRect();
            const nicknameRect = nickname.getBoundingClientRect();

            if (!timestampRect.width || !nicknameRect.width) {
              return null;
            }

            return Math.round(nicknameRect.left - timestampRect.right);
          })
          .filter((gap) => Number.isFinite(gap) && gap >= 0);

        const chatBoxSamples = [...document.querySelectorAll("[class*='live_chatting_list_item' i]")]
          .filter((row) => row.querySelector("[class*='live_chatting_message_container' i]"))
          .slice(-40)
          .map((row) => {
            const style = getComputedStyle(row);
            const rect = row.getBoundingClientRect();
            const parentRect = row.parentElement?.getBoundingClientRect();
            const backgroundIsVisible =
              style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent";
            const borderRadius = Number.parseFloat(style.borderTopLeftRadius) || 0;
            const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
            const parentWidth = parentRect?.width || 0;
            const width = Math.round(rect.width);
            const fontSize = Number.parseFloat(style.fontSize) || 0;
            const fontWeight = Number.parseInt(style.fontWeight, 10) || 0;
            const messageText = row.querySelector("[class*='live_chatting_message_text' i], [class*='message_text' i]");
            const messageTextStyle = messageText ? getComputedStyle(messageText) : null;
            const messageFontWeight = messageTextStyle
              ? Number.parseInt(messageTextStyle.fontWeight, 10) || 0
              : 0;
            let textLeftInset = null;
            let textRightInset = null;

            if (messageText) {
              const range = document.createRange();
              range.selectNodeContents(messageText);
              const textRect = range.getBoundingClientRect();
              range.detach();

              if (textRect.width > 0 && textRect.height > 0) {
                textLeftInset = Math.round(textRect.left - rect.left);
                textRightInset = Math.round(rect.right - textRect.right);
              }
            }

            return {
              width,
              height: Math.round(rect.height),
              parentWidth: Math.round(parentWidth),
              backgroundColor: style.backgroundColor,
              borderRadius,
              paddingLeft,
              marginLeft: Number.parseFloat(style.marginLeft) || 0,
              fontSize,
              fontWeight,
              messageFontWeight,
              backgroundIsVisible,
              isRounded: borderRadius >= 6,
              isPadded: paddingLeft >= 6,
              isShrunken: parentWidth > 0 && width <= Math.round(parentWidth) - 40,
              textLeftInset,
              textRightInset,
              textInsetDelta:
                textLeftInset !== null && textRightInset !== null
                  ? Math.abs(textLeftInset - textRightInset)
                  : null,
              text: String(row.textContent || "").trim().slice(0, 80)
            };
          });
        const chatBoxWidths = chatBoxSamples.map((sample) => sample.width);
        const textInsetDeltas = chatBoxSamples
          .map((sample) => sample.textInsetDelta)
          .filter((delta) => Number.isFinite(delta));
        const fontSizes = chatBoxSamples
          .map((sample) => sample.fontSize)
          .filter((fontSize) => Number.isFinite(fontSize) && fontSize > 0);
        const fontWeights = chatBoxSamples
          .map((sample) => sample.fontWeight)
          .filter((fontWeight) => Number.isFinite(fontWeight) && fontWeight > 0);
        const messageFontWeights = chatBoxSamples
          .map((sample) => sample.messageFontWeight)
          .filter((fontWeight) => Number.isFinite(fontWeight) && fontWeight > 0);
        const backgroundColors = chatBoxSamples.map((sample) => sample.backgroundColor);

        return {
          url: location.href,
          title: document.title,
          readyState: document.readyState,
          hasStyle: Boolean(document.getElementById("chzzk-chat-ui-toggle-style")),
          hasRootDataset: document.documentElement.hasAttribute("data-chzzk-chat-ui-toggle-nicknames"),
          rootDataset: {
            nicknames: document.documentElement.dataset.chzzkChatUiToggleNicknames || null,
            badges: document.documentElement.dataset.chzzkChatUiToggleBadges || null,
            timestamps: document.documentElement.dataset.chzzkChatUiToggleTimestamps || null,
            chatBoxes: document.documentElement.dataset.chzzkChatUiToggleChatBoxes || null,
            largeText: document.documentElement.dataset.chzzkChatUiToggleLargeText || null,
            boldText: document.documentElement.dataset.chzzkChatUiToggleBoldText || null,
            chatBoxColor: document.documentElement.dataset.chzzkChatUiToggleChatBoxColor || null
          },
          counts,
          hidden,
          visible,
          samples,
          layout: {
            timestampNicknameGaps,
            chatBoxes: {
              sampleCount: chatBoxSamples.length,
              roundedCount: chatBoxSamples.filter((sample) => sample.isRounded).length,
              backgroundedCount: chatBoxSamples.filter((sample) => sample.backgroundIsVisible).length,
              paddedCount: chatBoxSamples.filter((sample) => sample.isPadded).length,
              shrunkenCount: chatBoxSamples.filter((sample) => sample.isShrunken).length,
              minWidth: chatBoxWidths.length ? Math.min(...chatBoxWidths) : null,
              maxWidth: chatBoxWidths.length ? Math.max(...chatBoxWidths) : null,
              widthSpread: chatBoxWidths.length ? Math.max(...chatBoxWidths) - Math.min(...chatBoxWidths) : null,
              textInsetDeltas,
              fontSizes,
              fontWeights,
              messageFontWeights,
              backgroundColors,
              samples: chatBoxSamples.slice(0, 4)
            }
          }
        };
      }, { roleAttr: ROLE_ATTR, chatRowAttr: CHAT_ROW_ATTR });

      states.push(state);
    } catch (error) {
      states.push({
        url: frame.url(),
        inaccessible: true,
        error: String(error.message || error).slice(0, 160),
        counts: { nickname: 0, badge: 0, timestamp: 0 },
        hidden: { nickname: 0, badge: 0, timestamp: 0 },
        visible: { nickname: 0, badge: 0, timestamp: 0 }
      });
    }
  }

  return states;
}

async function waitForRoleCoverage(page, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let latestStates = [];
  let latestSummary = null;

  while (Date.now() < deadline) {
    latestStates = await collectFrameStates(page);
    latestSummary = summarizeFrameState(latestStates);

    if (
      latestSummary.framesWithStyle > 0 &&
      latestSummary.counts.nickname > 0 &&
      latestSummary.counts.badge > 0 &&
      latestSummary.counts.timestamp > 0
    ) {
      return { states: latestStates, summary: latestSummary };
    }

    await page.waitForTimeout(1000);
  }

  return { states: latestStates, summary: latestSummary };
}

async function findExtensionWorker(context) {
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    const worker = context
      .serviceWorkers()
      .find((candidate) => candidate.url().startsWith("chrome-extension://"));

    if (worker) {
      return worker;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return null;
}

async function setExtensionOptions(worker, options) {
  await worker.evaluate(
    ({ key, value }) =>
      new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
          const error = chrome.runtime.lastError;

          if (error) {
            reject(new Error(error.message));
            return;
          }

          resolve();
        });
      }),
    { key: STORAGE_KEY, value: options }
  );
}

async function collectSyntheticFirstMutationState(page) {
  return page.evaluate(
    ({ roleAttr, chatRowAttr }) =>
      new Promise((resolve) => {
        const rootId = `chzzk-chat-ui-toggle-probe-${Date.now()}`;
        const rowId = `${rootId}-row`;

        function readElementState(row, selector) {
          const element = row.querySelector(selector);

          if (!element) {
            return { exists: false };
          }

          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();

          return {
            exists: true,
            display: style.display,
            visibility: style.visibility,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            role: element.getAttribute(roleAttr) || ""
          };
        }

        function isVisible(state) {
          return (
            state.exists &&
            state.display !== "none" &&
            state.visibility !== "hidden" &&
            state.width > 0 &&
            state.height > 0
          );
        }

        const probeObserver = new MutationObserver(() => {
          const row = document.getElementById(rowId);

          if (!row) {
            return;
          }

          probeObserver.disconnect();

          const state = {
            row: readElementState(document, `#${rowId}`),
            nickname: readElementState(row, "[data-probe='nickname']"),
            badge: readElementState(row, "[data-probe='badge']"),
            timestamp: readElementState(row, ".chzzk-chat-ui-toggle-timestamp"),
            message: readElementState(row, "[data-probe='message']"),
            rootDataset: {
              nicknames: document.documentElement.dataset.chzzkChatUiToggleNicknames || null,
              badges: document.documentElement.dataset.chzzkChatUiToggleBadges || null,
              timestamps: document.documentElement.dataset.chzzkChatUiToggleTimestamps || null
            }
          };
          state.row.chatRow = row.getAttribute(chatRowAttr) || "";

          state.visible = {
            row: isVisible(state.row),
            nickname: isVisible(state.nickname),
            badge: isVisible(state.badge),
            timestamp: isVisible(state.timestamp),
            message: isVisible(state.message)
          };

          document.getElementById(rootId)?.remove();
          resolve(state);
        });

        const root = document.createElement("ul");
        root.id = rootId;
        root.className = "live_chatting_list__probe";

        const row = document.createElement("li");
        row.id = rowId;
        row.className = "live_chatting_list_item__probe";

        const nicknameButton = document.createElement("button");
        nicknameButton.type = "button";
        nicknameButton.className = "live_chatting_message_nickname__probe";

        const badgeWrapper = document.createElement("span");
        badgeWrapper.className = "live_chatting_username_wrapper__probe badge_container__probe";

        const badge = document.createElement("img");
        badge.dataset.probe = "badge";
        badge.alt = "배지";
        badge.src = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
        badge.width = 18;
        badge.height = 18;
        badgeWrapper.appendChild(badge);

        const nickname = document.createElement("span");
        nickname.dataset.probe = "nickname";
        nickname.className = "name_text__probe live_chatting_username_nickname__probe";
        nickname.textContent = "probeUser";

        const messageContainer = document.createElement("span");
        messageContainer.className = "live_chatting_message_container__probe";

        const message = document.createElement("span");
        message.dataset.probe = "message";
        message.className = "live_chatting_message_text__probe";
        message.textContent = "probe message";

        nicknameButton.append(badgeWrapper, nickname);
        messageContainer.appendChild(message);
        row.append(nicknameButton, messageContainer);
        root.appendChild(row);

        probeObserver.observe(document.body, {
          childList: true,
          subtree: true
        });

        document.body.appendChild(root);
      }),
    { roleAttr: ROLE_ATTR, chatRowAttr: CHAT_ROW_ATTR }
  );
}

function assertSyntheticNoRawPrefixFlash(label, state) {
  if (state.row.chatRow !== "true") {
    throw new Error(`${label}: synthetic row was not confirmed as a scoped chat row`);
  }

  const hiddenTargets = ["nickname", "badge", "timestamp"];

  for (const target of hiddenTargets) {
    if (!state[target].exists) {
      throw new Error(`${label}: synthetic ${target} was not annotated before first mutation observer check`);
    }

    if (!state[target].role.includes(target)) {
      throw new Error(`${label}: synthetic ${target} role missing before first mutation observer check`);
    }

    if (state.visible[target]) {
      throw new Error(`${label}: synthetic ${target} was visible before processing completed`);
    }
  }

  if (!state.visible.message) {
    throw new Error(`${label}: synthetic message text was not visible after processing`);
  }
}

function assertSummary(label, summary) {
  const missing = [];

  for (const role of ["nickname", "badge", "timestamp"]) {
    if (summary.counts[role] <= 0) {
      missing.push(role);
    }
  }

  if (summary.framesWithStyle <= 0) {
    missing.push("content-style");
  }

  if (missing.length > 0) {
    throw new Error(`${label}: missing coverage for ${missing.join(", ")}`);
  }
}

function assertOffState(summary) {
  for (const role of ["nickname", "badge", "timestamp"]) {
    if (summary.hidden[role] !== summary.counts[role]) {
      throw new Error(
        `off state failed for ${role}: hidden ${summary.hidden[role]} of ${summary.counts[role]}`
      );
    }
  }
}

function assertOnState(summary) {
  for (const role of ["nickname", "badge", "timestamp"]) {
    if (summary.visible[role] <= 0) {
      throw new Error(`on state failed for ${role}: no visible annotated elements`);
    }
  }
}

function assertChatBoxesOn(label, summary) {
  const chatBoxes = summary.layout.chatBoxes;

  if (chatBoxes.sampleCount <= 0) {
    throw new Error(`${label}: no chat row box samples`);
  }

  if (chatBoxes.backgroundedCount <= 0) {
    throw new Error(`${label}: no visible chat row backgrounds`);
  }

  if (chatBoxes.roundedCount <= 0) {
    throw new Error(`${label}: no rounded chat row boxes`);
  }

  if (chatBoxes.paddedCount <= 0) {
    throw new Error(`${label}: no padded chat row boxes`);
  }

  if (chatBoxes.shrunkenCount <= 0) {
    throw new Error(`${label}: no content-width chat row boxes`);
  }

  if (chatBoxes.widthSpread === null || chatBoxes.widthSpread < 32) {
    throw new Error(`${label}: chat row boxes are not varying by content length`);
  }
}

function assertChatBoxColor(label, summary, hexColor) {
  const expectedColor = hexToExpectedRgba(hexColor);

  if (!summary.layout.chatBoxes.backgroundColors.includes(expectedColor)) {
    throw new Error(`${label}: expected ${expectedColor} chat box background`);
  }
}

function assertLargeTextOn(label, summary) {
  const chatBoxes = summary.layout.chatBoxes;

  if (chatBoxes.maxFontSize === null || chatBoxes.maxFontSize < 16.8) {
    throw new Error(`${label}: large text font size was not applied`);
  }
}

function assertLargeTextOff(label, summary) {
  const chatBoxes = summary.layout.chatBoxes;

  if (chatBoxes.maxFontSize === null || chatBoxes.maxFontSize >= 16.8) {
    throw new Error(`${label}: large text font size should be off`);
  }
}

function assertBoldTextOn(label, summary) {
  const chatBoxes = summary.layout.chatBoxes;

  if (chatBoxes.maxMessageFontWeight === null || chatBoxes.maxMessageFontWeight < 650) {
    throw new Error(`${label}: bold text font weight was not applied`);
  }
}

function assertBoldTextOff(label, summary) {
  const chatBoxes = summary.layout.chatBoxes;

  if (chatBoxes.maxMessageFontWeight === null || chatBoxes.maxMessageFontWeight >= 650) {
    throw new Error(`${label}: bold text font weight should be off`);
  }
}

function assertChatBoxesOff(label, summary) {
  const chatBoxes = summary.layout.chatBoxes;

  if (chatBoxes.sampleCount <= 0) {
    throw new Error(`${label}: no chat row box samples`);
  }

  if (chatBoxes.backgroundedCount > 0 || chatBoxes.roundedCount > 0) {
    throw new Error(
      `${label}: chat boxes still styled; backgrounded ${chatBoxes.backgroundedCount}, rounded ${chatBoxes.roundedCount}`
    );
  }
}

function assertAllOffChatBoxPadding(label, summary) {
  const chatBoxes = summary.layout.chatBoxes;

  if (chatBoxes.textInsetDeltas.length <= 0) {
    throw new Error(`${label}: no text inset samples`);
  }

  if (chatBoxes.maxTextInsetDelta > 14) {
    throw new Error(
      `${label}: chat box text padding is unbalanced; max inset delta ${chatBoxes.maxTextInsetDelta}px`
    );
  }
}

function assertRoleHidden(label, summary, role) {
  if (summary.hidden[role] !== summary.counts[role]) {
    throw new Error(`${label}: ${role} hidden ${summary.hidden[role]} of ${summary.counts[role]}`);
  }
}

function assertRoleVisible(label, summary, role) {
  if (summary.visible[role] <= 0) {
    throw new Error(`${label}: no visible ${role} elements`);
  }
}

function assertBadgeGapCollapsed(label, summary) {
  if (summary.layout.timestampNicknameGapCount <= 0) {
    throw new Error(`${label}: no timestamp-to-nickname layout samples`);
  }

  if (summary.layout.timestampNicknameGapMax > 24) {
    throw new Error(
      `${label}: badge slot gap is still too wide; max gap ${summary.layout.timestampNicknameGapMax}px`
    );
  }
}

async function collectState(page, label) {
  await page.bringToFront();
  await page.waitForTimeout(1500);

  const state = {
    states: await collectFrameStates(page)
  };
  state.summary = summarizeFrameState(state.states);
  assertSummary(label, state.summary);

  return state;
}

async function selectPopupTab(popup, targetId) {
  await popup.locator(`[data-tab-target="${targetId}"]`).click();
  await popup.locator(`#${targetId}`).waitFor({ state: "visible", timeout: 5000 });
}

async function setPopupOptions(popup, options) {
  await popup.bringToFront();
  await selectPopupTab(popup, "textPanel");
  await popup.locator("#showNicknames").setChecked(options.showNicknames);
  await popup.locator("#showBadges").setChecked(options.showBadges);
  await popup.locator("#showTimestamps").setChecked(options.showTimestamps);

  await selectPopupTab(popup, "stylePanel");
  await popup.locator("#showChatBoxes").setChecked(options.showChatBoxes);
  await popup.locator("#showLargeText").setChecked(options.showLargeText);
  await popup.locator("#showBoldText").setChecked(options.showBoldText);

  if (options.chatBoxColor) {
    const hexInput = popup.locator("#chatBoxColorHex");
    await hexInput.fill(options.chatBoxColor);
    await hexInput.press("Enter");
  }
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.connectOverCDP(CDP_URL);
  const context = browser.contexts()[0];

  if (!context) {
    throw new Error("No browser context found.");
  }

  let page = context.pages().find((candidate) => candidate.url().includes("chzzk.naver.com/live/"));

  if (!page) {
    page = await context.newPage();
    await page.goto(LIVE_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  }

  await page.bringToFront();
  await page.waitForLoadState("domcontentloaded", { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(8000);

  const worker = await findExtensionWorker(context);

  if (!worker) {
    throw new Error("Extension service worker was not found.");
  }

  const extensionId = worker.url().match(/^chrome-extension:\/\/([^/]+)/)?.[1];

  if (!extensionId) {
    throw new Error(`Could not parse extension id from ${worker.url()}`);
  }

  await setExtensionOptions(worker, onOptions);
  await page.waitForTimeout(1500);

  const before = await waitForRoleCoverage(page);
  assertSummary("initial on state", before.summary);
  assertOnState(before.summary);
  assertChatBoxesOn("initial on state", before.summary);
  assertChatBoxColor("initial on state", before.summary, DEFAULT_CHAT_BOX_COLOR);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-on-before.png"), fullPage: false });

  await setExtensionOptions(worker, boldTextOptions);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });

  const boldReloadNoPopup = await collectState(page, "saved bold reload before popup state");
  assertOnState(boldReloadNoPopup.summary);
  assertChatBoxesOn("saved bold reload before popup state", boldReloadNoPopup.summary);
  assertLargeTextOff("saved bold reload before popup state", boldReloadNoPopup.summary);
  assertBoldTextOn("saved bold reload before popup state", boldReloadNoPopup.summary);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "chzzk-live-bold-reload-no-popup.png"),
    fullPage: false
  });

  await setExtensionOptions(worker, onOptions);
  await page.waitForTimeout(500);

  await setExtensionOptions(worker, offOptions);
  await page.waitForTimeout(500);
  const noFlashProbe = await collectSyntheticFirstMutationState(page);
  assertSyntheticNoRawPrefixFlash("synthetic first-frame off state", noFlashProbe);
  await setExtensionOptions(worker, onOptions);
  await page.waitForTimeout(500);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
    waitUntil: "domcontentloaded",
    timeout: 15000
  });

  await setPopupOptions(popup, badgeOffOptions);

  const badgeOff = await collectState(page, "badge-only off state");
  assertRoleVisible("badge-only off state", badgeOff.summary, "nickname");
  assertRoleHidden("badge-only off state", badgeOff.summary, "badge");
  assertRoleVisible("badge-only off state", badgeOff.summary, "timestamp");
  assertChatBoxesOn("badge-only off state", badgeOff.summary);
  assertBadgeGapCollapsed("badge-only off state", badgeOff.summary);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-badge-off.png"), fullPage: false });

  await setPopupOptions(popup, nicknameOffOptions);

  const nicknameOff = await collectState(page, "nickname-only off state");
  assertRoleHidden("nickname-only off state", nicknameOff.summary, "nickname");
  assertRoleVisible("nickname-only off state", nicknameOff.summary, "badge");
  assertRoleVisible("nickname-only off state", nicknameOff.summary, "timestamp");
  assertChatBoxesOn("nickname-only off state", nicknameOff.summary);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-nickname-off.png"), fullPage: false });

  await setPopupOptions(popup, largeTextColorOptions);

  const largeTextColor = await collectState(page, "large-text color state");
  assertOnState(largeTextColor.summary);
  assertChatBoxesOn("large-text color state", largeTextColor.summary);
  assertLargeTextOn("large-text color state", largeTextColor.summary);
  assertBoldTextOff("large-text color state", largeTextColor.summary);
  assertChatBoxColor("large-text color state", largeTextColor.summary, largeTextColorOptions.chatBoxColor);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-large-text-blue.png"), fullPage: false });

  await setPopupOptions(popup, boldTextOptions);

  const boldText = await collectState(page, "bold-text state");
  assertOnState(boldText.summary);
  assertChatBoxesOn("bold-text state", boldText.summary);
  assertLargeTextOff("bold-text state", boldText.summary);
  assertBoldTextOn("bold-text state", boldText.summary);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-bold-text.png"), fullPage: false });

  await setPopupOptions(popup, chatBoxOffOptions);

  const chatBoxOff = await collectState(page, "chat-box off state");
  assertOnState(chatBoxOff.summary);
  assertChatBoxesOff("chat-box off state", chatBoxOff.summary);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-chat-box-off.png"), fullPage: false });

  await setPopupOptions(popup, offOptions);

  const off = await collectState(page, "popup off state");
  assertOffState(off.summary);
  assertChatBoxesOn("popup off state", off.summary);
  assertAllOffChatBoxPadding("popup off state", off.summary);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-off.png"), fullPage: false });

  await setPopupOptions(popup, onOptions);

  const onAfter = await collectState(page, "popup on state");
  assertOnState(onAfter.summary);
  assertChatBoxesOn("popup on state", onAfter.summary);
  assertChatBoxColor("popup on state", onAfter.summary, DEFAULT_CHAT_BOX_COLOR);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-on-after.png"), fullPage: false });

  await popup.close();
  await browser.close();

  console.log(
    JSON.stringify(
      {
        ok: true,
        liveUrl: page.url(),
        extensionId,
        screenshots: [
          "output/playwright/chzzk-live-on-before.png",
          "output/playwright/chzzk-live-bold-reload-no-popup.png",
          "output/playwright/chzzk-live-badge-off.png",
          "output/playwright/chzzk-live-nickname-off.png",
          "output/playwright/chzzk-live-large-text-blue.png",
          "output/playwright/chzzk-live-bold-text.png",
          "output/playwright/chzzk-live-chat-box-off.png",
          "output/playwright/chzzk-live-off.png",
          "output/playwright/chzzk-live-on-after.png"
        ],
        summaries: {
          before: before.summary,
          boldReloadNoPopup: boldReloadNoPopup.summary,
          badgeOff: badgeOff.summary,
          nicknameOff: nicknameOff.summary,
          largeTextColor: largeTextColor.summary,
          boldText: boldText.summary,
          chatBoxOff: chatBoxOff.summary,
          off: off.summary,
          onAfter: onAfter.summary
        },
        noFlashProbe,
        sampleFrames: before.states
          .filter((state) => state.counts.nickname || state.counts.badge || state.counts.timestamp)
          .slice(0, 3)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error.message || error) }, null, 2));
  process.exit(1);
});
