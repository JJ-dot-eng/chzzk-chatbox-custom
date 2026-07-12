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
const NATIVE_CHAT_ROW_SELECTOR = `:is([class*="live_chatting_list_item" i], [role="log"] [class*="_item_" i]):has(:is([class*="live_chatting_message_container" i], [class*="_chatting_message_" i]))`;
const OUTPUT_DIR = path.join(process.cwd(), "output", "playwright");
const DEFAULT_CHAT_BOX_COLOR = "#808080";
const DEFAULT_CHAT_TEXT_COLOR = "#101418";
const CHAT_FONT_SIZE_PT_DEFAULT = 13;
const CHAT_BOX_ALPHA = 0.18;
const CHAT_BOX_ALPHA_MAX = 0.88;
const CHAT_BOX_ALPHA_CONTRAST_START = 3;
const CHAT_BOX_ALPHA_CONTRAST_END = 12;
const EXTENSION_NAME = "치지직 채팅 커스텀";
const EXTENSION_BACKGROUND_FILE = "background.js";
const GUEST_CHAT_FRAME_ID = "chzzk-chat-ui-toggle-guest-chat-frame";
const GUEST_CHAT_FRAME_CONTAINER_ID = "chzzk-chat-ui-toggle-guest-chat-frame-container";
const GUEST_CHAT_TOGGLE_BUTTON_ID = "chzzk-chat-ui-toggle-guest-chat-toggle";
const GUEST_CHAT_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-host";
const GUEST_CHAT_CONTROL_HOST_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-control-host";
const GUEST_CHAT_EMBED_ATTR = "data-chzzk-chat-ui-toggle-guest-chat-embed";
const GUEST_CHAT_CLEANBOT_DEFAULT_ATTR = "data-chzzk-chat-ui-toggle-guest-cleanbot-default";
const GUEST_CHAT_FRAME_MARKER_PARAM = "chzzkChatUiToggleGuest";
const LOCAL_ONLY_CHAT_FIELD_ATTR = "data-chzzk-chat-ui-toggle-local-only-field";
const LOCAL_ONLY_CHAT_ORIGINAL_FIELD_ATTR = "data-chzzk-chat-ui-toggle-local-only-original-field";
const LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR = "data-chzzk-chat-ui-toggle-local-only-send-button";
const LOCAL_ONLY_CHAT_ORIGINAL_SEND_BUTTON_ATTR = "data-chzzk-chat-ui-toggle-local-only-original-send-button";
const LOCAL_ONLY_CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-local-only-row";
const LOCAL_ONLY_CHAT_PLACEHOLDER = "나만 보는 채팅, 실제로 전송되지 않음";
const MINI_CHAT_PANEL_ID = "chzzk-chat-ui-toggle-mini-chat-panel";
const LIVE_CHANNEL_ID_PATTERN = /^[0-9a-f]{32}$/i;
const HEADER_BUTTON_IDS = [
  "chzzk-chat-ui-toggle-header-settings",
  "chzzk-chat-ui-toggle-mini-chat-button"
];

const onOptions = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true,
  useGuestChatFrame: false,
  showGuestChatToggleButton: true,
  showLargeText: false,
  showBoldText: false,
  useChatTextColor: false,
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const offOptions = {
  showNicknames: false,
  showBadges: false,
  showTimestamps: false,
  showChatBoxes: true,
  useGuestChatFrame: false,
  showGuestChatToggleButton: true,
  showLargeText: false,
  showBoldText: false,
  useChatTextColor: false,
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const badgeOffOptions = {
  showNicknames: true,
  showBadges: false,
  showTimestamps: true,
  showChatBoxes: true,
  useGuestChatFrame: false,
  showGuestChatToggleButton: true,
  showLargeText: false,
  showBoldText: false,
  useChatTextColor: false,
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const nicknameOffOptions = {
  showNicknames: false,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true,
  useGuestChatFrame: false,
  showGuestChatToggleButton: true,
  showLargeText: false,
  showBoldText: false,
  useChatTextColor: false,
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const chatBoxOffOptions = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: false,
  useGuestChatFrame: false,
  showGuestChatToggleButton: true,
  showLargeText: false,
  showBoldText: false,
  useChatTextColor: false,
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
  chatBoxColor: DEFAULT_CHAT_BOX_COLOR
};

const largeTextColorOptions = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true,
  useGuestChatFrame: false,
  showGuestChatToggleButton: true,
  showLargeText: true,
  chatFontSizePt: 36,
  useNicknameFontSize: true,
  nicknameFontSizePt: 24,
  showBoldText: false,
  useChatTextColor: false,
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
  chatBoxColor: "#4b8bff"
};

const boldTextOptions = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true,
  showChatBoxes: true,
  useGuestChatFrame: false,
  showGuestChatToggleButton: true,
  showLargeText: false,
  showBoldText: true,
  useChatTextColor: false,
  chatTextColor: DEFAULT_CHAT_TEXT_COLOR,
  useNicknameColorForMessage: false,
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

function hexToRgb(hexColor) {
  const hex = normalizeHexColor(hexColor).slice(1);

  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16)
  };
}

function getRelativeLuminance(color) {
  const channels = [color.red, color.green, color.blue].map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function getContrastRatio(firstColor, secondColor) {
  const first = getRelativeLuminance(firstColor);
  const second = getRelativeLuminance(secondColor);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function hexToExpectedRgba(hexColor, theme) {
  const color = hexToRgb(hexColor);
  const backdrop = theme === "dark"
    ? { red: 16, green: 20, blue: 24 }
    : { red: 255, green: 255, blue: 255 };
  const contrast = getContrastRatio(color, backdrop);
  const progress = Math.max(
    0,
    Math.min(
      1,
      (contrast - CHAT_BOX_ALPHA_CONTRAST_START) /
        (CHAT_BOX_ALPHA_CONTRAST_END - CHAT_BOX_ALPHA_CONTRAST_START)
    )
  );
  const alpha = Number(
    (CHAT_BOX_ALPHA + progress * (CHAT_BOX_ALPHA_MAX - CHAT_BOX_ALPHA)).toFixed(2)
  );

  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
}

function extractLiveChannelId(url) {
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

function isVisibleRect(rect) {
  return Boolean(rect && rect.width > 0 && rect.height > 0);
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
          summary.layout.chatBoxes.nativeRowCount += chatBoxes.nativeRowCount || 0;
          summary.layout.chatBoxes.unannotatedRowCount += chatBoxes.unannotatedRowCount || 0;
          summary.layout.chatBoxes.nicknameMissingRoleCount += chatBoxes.nicknameMissingRoleCount || 0;
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
        summary.layout.chatBoxes.minHeight =
          summary.layout.chatBoxes.minHeight === null
            ? chatBoxes.minHeight
            : Math.min(summary.layout.chatBoxes.minHeight, chatBoxes.minHeight || summary.layout.chatBoxes.minHeight);
        summary.layout.chatBoxes.maxHeight =
          summary.layout.chatBoxes.maxHeight === null
            ? chatBoxes.maxHeight
            : Math.max(summary.layout.chatBoxes.maxHeight, chatBoxes.maxHeight || summary.layout.chatBoxes.maxHeight);
        summary.layout.chatBoxes.widthSpread =
          summary.layout.chatBoxes.minWidth !== null && summary.layout.chatBoxes.maxWidth !== null
            ? summary.layout.chatBoxes.maxWidth - summary.layout.chatBoxes.minWidth
            : null;

        for (const delta of chatBoxes.textInsetDeltas || []) {
          summary.layout.chatBoxes.textInsetDeltas.push(delta);
        }

        for (const delta of chatBoxes.singleLineTextInsetDeltas || []) {
          summary.layout.chatBoxes.singleLineTextInsetDeltas.push(delta);
        }

        for (const fontSize of chatBoxes.fontSizes || []) {
          summary.layout.chatBoxes.fontSizes.push(fontSize);
        }

        for (const fontSize of chatBoxes.nicknameFontSizes || []) {
          summary.layout.chatBoxes.nicknameFontSizes.push(fontSize);
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

      const detectedTheme = state.rootDataset?.detectedTheme;

      if (
        (detectedTheme === "dark" || detectedTheme === "light") &&
        !summary.detectedThemes.includes(detectedTheme)
      ) {
        summary.detectedThemes.push(detectedTheme);
      }

      return summary;
    },
    {
      framesWithStyle: 0,
      framesWithRootDataset: 0,
      detectedThemes: [],
      counts: { nickname: 0, badge: 0, timestamp: 0 },
      hidden: { nickname: 0, badge: 0, timestamp: 0 },
      visible: { nickname: 0, badge: 0, timestamp: 0 },
      layout: {
        timestampNicknameGaps: [],
        chatBoxes: {
          nativeRowCount: 0,
          unannotatedRowCount: 0,
          nicknameMissingRoleCount: 0,
          sampleCount: 0,
          roundedCount: 0,
          backgroundedCount: 0,
          paddedCount: 0,
          shrunkenCount: 0,
          minWidth: null,
          maxWidth: null,
          minHeight: null,
          maxHeight: null,
          widthSpread: null,
          textInsetDeltas: [],
          maxTextInsetDelta: null,
          singleLineTextInsetDeltas: [],
          maxSingleLineTextInsetDelta: null,
          fontSizes: [],
          maxFontSize: null,
          nicknameFontSizes: [],
          minNicknameFontSize: null,
          maxNicknameFontSize: null,
          nicknameFontSizeSpread: null,
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
  const singleLineInsetDeltas = summary.layout.chatBoxes.singleLineTextInsetDeltas;
  summary.layout.chatBoxes.maxSingleLineTextInsetDelta = singleLineInsetDeltas.length
    ? Math.max(...singleLineInsetDeltas)
    : null;
  const fontSizes = summary.layout.chatBoxes.fontSizes;
  summary.layout.chatBoxes.maxFontSize = fontSizes.length ? Math.max(...fontSizes) : null;
  const nicknameFontSizes = summary.layout.chatBoxes.nicknameFontSizes;
  summary.layout.chatBoxes.minNicknameFontSize = nicknameFontSizes.length ? Math.min(...nicknameFontSizes) : null;
  summary.layout.chatBoxes.maxNicknameFontSize = nicknameFontSizes.length ? Math.max(...nicknameFontSizes) : null;
  summary.layout.chatBoxes.nicknameFontSizeSpread = nicknameFontSizes.length
    ? Math.max(...nicknameFontSizes) - Math.min(...nicknameFontSizes)
    : null;
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
      const state = await frame.evaluate(({ roleAttr, chatRowAttr, nativeChatRowSelector }) => {
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

        const nativeChatRows = [...document.querySelectorAll(nativeChatRowSelector)]
          .filter((row) =>
            row.querySelector(
              "button[class*='live_chatting_message_nickname' i], button[class*='nickname' i]"
            ) &&
            row.querySelector(
              "[class*='live_chatting_message_text' i], [class*='message_text' i], [class*='_chatting_message_' i] [class*='_text_' i]"
            )
          );
        const unannotatedRowCount = nativeChatRows.filter(
          (row) => row.getAttribute(chatRowAttr) !== "true"
        ).length;
        const chatRows = [...document.querySelectorAll(`[${chatRowAttr}="true"]`)];
        const timestampNicknameGaps = chatRows
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

        const chatBoxSamples = chatRows
          .filter((row) => row.querySelector("[class*='live_chatting_message_container' i], [class*='_chatting_message_' i]"))
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
            const messageText = [
              ...row.querySelectorAll(
                "[class*='live_chatting_message_text' i], [class*='message_text' i], [class*='_chatting_message_' i] [class*='_text_' i]"
              )
            ].find(
              (element) =>
                !element.closest(
                  "button[class*='live_chatting_message_nickname' i], button[class*='nickname' i]"
                )
            );
            const messageTextStyle = messageText ? getComputedStyle(messageText) : null;
            const messageFontWeight = messageTextStyle
              ? Number.parseInt(messageTextStyle.fontWeight, 10) || 0
              : 0;
            const nicknameText = row.querySelector(`[${roleAttr}~="nickname"]`);
            const nicknameTextStyle = nicknameText ? getComputedStyle(nicknameText) : null;
            const nicknameFontSize = nicknameTextStyle ? Number.parseFloat(nicknameTextStyle.fontSize) || 0 : 0;
            let textLeftInset = null;
            let textRightInset = null;
            let textLineCount = null;

            if (messageText) {
              const range = document.createRange();
              range.selectNodeContents(messageText);
              const textRect = range.getBoundingClientRect();
              const lineTops = new Set(
                [...range.getClientRects()]
                  .filter((clientRect) => clientRect.width > 0 && clientRect.height > 0)
                  .map((clientRect) => Math.round(clientRect.top))
              );
              range.detach();

              if (textRect.width > 0 && textRect.height > 0) {
                textLeftInset = Math.round(textRect.left - rect.left);
                textRightInset = Math.round(rect.right - textRect.right);
                textLineCount = lineTops.size;
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
              nicknameFontSize,
              fontWeight,
              messageFontWeight,
              backgroundIsVisible,
              isRounded: borderRadius >= 6,
              isPadded: paddingLeft >= 6,
              isShrunken: parentWidth > 0 && width <= Math.round(parentWidth) - 40,
              textLeftInset,
              textRightInset,
              textLineCount,
              textInsetDelta:
                textLeftInset !== null && textRightInset !== null
                  ? Math.abs(textLeftInset - textRightInset)
                  : null,
              text: String(row.textContent || "").trim().slice(0, 80)
            };
          });
        const chatBoxWidths = chatBoxSamples.map((sample) => sample.width);
        const chatBoxHeights = chatBoxSamples
          .map((sample) => sample.height)
          .filter((height) => Number.isFinite(height) && height > 0);
        const textInsetDeltas = chatBoxSamples
          .map((sample) => sample.textInsetDelta)
          .filter((delta) => Number.isFinite(delta));
        const singleLineTextInsetDeltas = chatBoxSamples
          .filter((sample) => sample.textLineCount === 1)
          .map((sample) => sample.textInsetDelta)
          .filter((delta) => Number.isFinite(delta));
        const fontSizes = chatBoxSamples
          .map((sample) => sample.fontSize)
          .filter((fontSize) => Number.isFinite(fontSize) && fontSize > 0);
        const nicknameFontSizes = chatBoxSamples
          .map((sample) => sample.nicknameFontSize)
          .filter((fontSize) => Number.isFinite(fontSize));
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
          hasStyle: Boolean(document.documentElement.dataset.chzzkChatUiToggleStyleVersion),
          hasRootDataset: document.documentElement.hasAttribute("data-chzzk-chat-ui-toggle-nicknames"),
          rootDataset: {
            nicknames: document.documentElement.dataset.chzzkChatUiToggleNicknames || null,
            badges: document.documentElement.dataset.chzzkChatUiToggleBadges || null,
            timestamps: document.documentElement.dataset.chzzkChatUiToggleTimestamps || null,
            chatBoxes: document.documentElement.dataset.chzzkChatUiToggleChatBoxes || null,
            largeText: document.documentElement.dataset.chzzkChatUiToggleLargeText || null,
            chatFontSizePt: document.documentElement.dataset.chzzkChatUiToggleChatFontSizePt || null,
            nicknameFontSizePt: document.documentElement.dataset.chzzkChatUiToggleNicknameFontSizePt || null,
            boldText: document.documentElement.dataset.chzzkChatUiToggleBoldText || null,
            chatBoxColor: document.documentElement.dataset.chzzkChatUiToggleChatBoxColor || null,
            detectedTheme: document.documentElement.dataset.chzzkChatUiToggleDetectedTheme || null
          },
          counts,
          hidden,
          visible,
          samples,
          layout: {
            timestampNicknameGaps,
            chatBoxes: {
              nativeRowCount: nativeChatRows.length,
              unannotatedRowCount,
              nicknameMissingRoleCount: chatBoxSamples.filter(
                (sample) => sample.nicknameFontSize <= 0
              ).length,
              sampleCount: chatBoxSamples.length,
              roundedCount: chatBoxSamples.filter((sample) => sample.isRounded).length,
              backgroundedCount: chatBoxSamples.filter((sample) => sample.backgroundIsVisible).length,
              paddedCount: chatBoxSamples.filter((sample) => sample.isPadded).length,
              shrunkenCount: chatBoxSamples.filter((sample) => sample.isShrunken).length,
              minWidth: chatBoxWidths.length ? Math.min(...chatBoxWidths) : null,
              maxWidth: chatBoxWidths.length ? Math.max(...chatBoxWidths) : null,
              minHeight: chatBoxHeights.length ? Math.min(...chatBoxHeights) : null,
              maxHeight: chatBoxHeights.length ? Math.max(...chatBoxHeights) : null,
              widthSpread: chatBoxWidths.length ? Math.max(...chatBoxWidths) - Math.min(...chatBoxWidths) : null,
              textInsetDeltas,
              singleLineTextInsetDeltas,
              fontSizes,
              nicknameFontSizes,
              fontWeights,
              messageFontWeights,
              backgroundColors,
              samples: chatBoxSamples.slice(0, 4)
            }
          }
        };
      }, {
        roleAttr: ROLE_ATTR,
        chatRowAttr: CHAT_ROW_ATTR,
        nativeChatRowSelector: NATIVE_CHAT_ROW_SELECTOR
      });

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

async function collectGuestChatState(page) {
  const pageState = await page.evaluate(
    ({
      frameId,
      frameContainerId,
      toggleButtonId,
      guestHostAttr,
      guestControlHostAttr
    }) => {
      const getRectState = (element) => {
        if (!(element instanceof HTMLElement)) {
          return null;
        }

        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);

        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity
        };
      };
      const isVisible = (element) => {
        if (!(element instanceof HTMLElement)) {
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
      };
      const frame = document.getElementById(frameId);
      const frameContainer = document.getElementById(frameContainerId);
      const toggleButton = document.getElementById(toggleButtonId);
      const guestHost = document.querySelector(`[${guestHostAttr}="true"]`);
      const guestControlHost = document.querySelector(`[${guestControlHostAttr}="true"]`);
      const nativeRows = [...document.querySelectorAll('[role="log"] [class*="_item_" i]')];

      return {
        url: location.href,
        rootGuestFrame: document.documentElement.getAttribute("data-chzzk-chat-ui-toggle-guest-chat-frame"),
        toggleButton: toggleButton
          ? {
              ariaPressed: toggleButton.getAttribute("aria-pressed"),
              title: toggleButton.getAttribute("title"),
              state: toggleButton.dataset.state || null,
              rect: getRectState(toggleButton)
            }
          : null,
        guestHost: guestHost
          ? {
              tagName: guestHost.tagName.toLowerCase(),
              id: guestHost.id || null,
              className: String(guestHost.getAttribute("class") || "").slice(0, 120),
              rect: getRectState(guestHost)
            }
          : null,
        guestControlHost: guestControlHost
          ? {
              tagName: guestControlHost.tagName.toLowerCase(),
              id: guestControlHost.id || null,
              className: String(guestControlHost.getAttribute("class") || "").slice(0, 120),
              rect: getRectState(guestControlHost)
            }
          : null,
        frameContainer: frameContainer
          ? {
              parentId: frameContainer.parentElement?.id || null,
              parentTagName: frameContainer.parentElement?.tagName.toLowerCase() || null,
              rect: getRectState(frameContainer)
            }
          : null,
        frame: frame
          ? {
              src: frame instanceof HTMLIFrameElement ? frame.src : "",
              credentiallessAttr: frame.getAttribute("credentialless"),
              credentiallessProp: frame instanceof HTMLIFrameElement ? frame.credentialless === true : false,
              rect: getRectState(frame)
            }
          : null,
        nativeVisibleRows: nativeRows.filter(isVisible).length
      };
    },
    {
      frameId: GUEST_CHAT_FRAME_ID,
      frameContainerId: GUEST_CHAT_FRAME_CONTAINER_ID,
      toggleButtonId: GUEST_CHAT_TOGGLE_BUTTON_ID,
      guestHostAttr: GUEST_CHAT_HOST_ATTR,
      guestControlHostAttr: GUEST_CHAT_CONTROL_HOST_ATTR
    }
  );

  let frameState = null;

  for (const frame of page.frames()) {
    let parsedUrl = null;

    try {
      parsedUrl = new URL(frame.url());
    } catch (_error) {
      continue;
    }

    if (parsedUrl.searchParams.get(GUEST_CHAT_FRAME_MARKER_PARAM) !== "1") {
      continue;
    }

    try {
      frameState = await frame.evaluate(
        async ({
          guestEmbedAttr,
          guestCleanbotDefaultAttr,
          guestMarkerParam,
          localOnlyChatFieldAttr,
          localOnlyChatOriginalFieldAttr,
          localOnlyChatSendButtonAttr,
          localOnlyChatOriginalSendButtonAttr,
          localOnlyChatRowAttr,
          toggleButtonId
        }) => {
          const inputCandidates = [
            ...document.querySelectorAll(
              "aside#aside-chatting textarea, aside#aside-chatting [contenteditable='true'], aside#aside-chatting [role='textbox'], aside:has([role='log']) textarea, aside:has([role='log']) [contenteditable='true'], aside:has([role='log']) [role='textbox']"
            )
          ];
          const localOnlyChatField = document.querySelector(`[${localOnlyChatFieldAttr}="true"]`);
          const originalField = document.querySelector(`[${localOnlyChatOriginalFieldAttr}="true"]`);
          const localOnlyChatSendButton = document.querySelector(`[${localOnlyChatSendButtonAttr}="true"]`);
          const originalSendButton = document.querySelector(`[${localOnlyChatOriginalSendButtonAttr}="true"]`);
          const toggleButton = document.getElementById(toggleButtonId);
          const localOnlyChatRows = [...document.querySelectorAll(`[${localOnlyChatRowAttr}="true"]`)];
          const allModernRows = [...document.querySelectorAll('[role="log"] [class*="_item_" i]')];
          const originalRemoteRows = allModernRows.filter(
            (row) => row.getAttribute(localOnlyChatRowAttr) !== "true"
          );
          const getRectState = (element) => {
            if (!(element instanceof HTMLElement)) {
              return null;
            }

            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);

            return {
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity
            };
          };
          const isVisible = (element) => {
            const rect = getRectState(element);

            return Boolean(
              rect &&
                rect.width > 0 &&
                rect.height > 0 &&
                rect.display !== "none" &&
                rect.visibility !== "hidden" &&
                rect.opacity !== "0"
            );
          };

          return {
            url: location.href,
            readyState: document.readyState,
            title: document.title,
            hasStorageAccess: typeof document.hasStorageAccess === "function"
              ? await document.hasStorageAccess()
              : null,
            marker: new URL(location.href).searchParams.get(guestMarkerParam),
            embed: document.documentElement.getAttribute(guestEmbedAttr),
            cleanbotDefault: document.documentElement.getAttribute(guestCleanbotDefaultAttr),
            localStorageCleanbot: window.localStorage?.getItem("cleanbot") || null,
            hasStyle: Boolean(document.documentElement.dataset.chzzkChatUiToggleStyleVersion),
            visibleHeaderCount: [
              ...new Set([
                ...document.querySelectorAll(
                  "aside#aside-chatting > :first-child, [class*='live_chatting_header' i], [class*='chatting_header' i]"
                )
              ])
            ].filter(isVisible).length,
            logCount: document.querySelectorAll('[role="log"]').length,
            rowCount: allModernRows.length,
            originalRemoteRowCount: originalRemoteRows.length,
            localOnlyChatRows: localOnlyChatRows.length,
            bodyText: String(document.body?.innerText || "").slice(0, 500),
            nestedExtensionFrameCount: document.querySelectorAll('iframe[src^="chrome-extension://"]').length,
            localOnlyChatField: localOnlyChatField instanceof HTMLElement
              ? {
                  clientHeight: localOnlyChatField.clientHeight,
                  className: localOnlyChatField.className,
                  overflowY: getComputedStyle(localOnlyChatField).overflowY,
                  placeholder: localOnlyChatField.getAttribute("placeholder"),
                  scrollHeight: localOnlyChatField.scrollHeight,
                  disabled: "disabled" in localOnlyChatField ? localOnlyChatField.disabled : null,
                  readOnly: "readOnly" in localOnlyChatField ? localOnlyChatField.readOnly : null,
                  sameParentAsOriginal: Boolean(
                    originalField && localOnlyChatField.parentElement === originalField.parentElement
                  ),
                  rect: getRectState(localOnlyChatField)
                }
              : null,
            originalField: originalField instanceof HTMLElement
              ? {
                  className: originalField.className,
                  disabled: "disabled" in originalField ? originalField.disabled : null,
                  readOnly: "readOnly" in originalField ? originalField.readOnly : null,
                  rect: getRectState(originalField)
                }
              : null,
            localOnlyChatSendButton: localOnlyChatSendButton instanceof HTMLButtonElement
              ? {
                  className: localOnlyChatSendButton.className,
                  disabled: localOnlyChatSendButton.disabled,
                  sameParentAsOriginal: Boolean(
                    originalSendButton &&
                    localOnlyChatSendButton.parentElement === originalSendButton.parentElement
                  ),
                  text: String(localOnlyChatSendButton.textContent || "").replace(/\s+/g, " ").trim(),
                  type: localOnlyChatSendButton.type,
                  rect: getRectState(localOnlyChatSendButton)
                }
              : null,
            toggleButton: toggleButton instanceof HTMLButtonElement
              ? {
                  ariaPressed: toggleButton.getAttribute("aria-pressed"),
                  immediatelyBeforeLocalSend: toggleButton.nextElementSibling === localOnlyChatSendButton,
                  insideHeader: Boolean(toggleButton.closest("header")),
                  sameParentAsLocalSend: Boolean(
                    localOnlyChatSendButton && toggleButton.parentElement === localOnlyChatSendButton.parentElement
                  ),
                  type: toggleButton.type,
                  rect: getRectState(toggleButton)
                }
              : null,
            originalSendButton: originalSendButton instanceof HTMLButtonElement
              ? {
                  className: originalSendButton.className,
                  disabled: originalSendButton.disabled,
                  text: String(originalSendButton.textContent || "").replace(/\s+/g, " ").trim(),
                  rect: getRectState(originalSendButton)
                }
              : null,
            inputCandidateCount: inputCandidates.length,
            visibleInputCandidateCount: inputCandidates.filter(isVisible).length
          };
        },
        {
          guestEmbedAttr: GUEST_CHAT_EMBED_ATTR,
          guestCleanbotDefaultAttr: GUEST_CHAT_CLEANBOT_DEFAULT_ATTR,
          guestMarkerParam: GUEST_CHAT_FRAME_MARKER_PARAM,
          localOnlyChatFieldAttr: LOCAL_ONLY_CHAT_FIELD_ATTR,
          localOnlyChatOriginalFieldAttr: LOCAL_ONLY_CHAT_ORIGINAL_FIELD_ATTR,
          localOnlyChatSendButtonAttr: LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR,
          localOnlyChatOriginalSendButtonAttr: LOCAL_ONLY_CHAT_ORIGINAL_SEND_BUTTON_ATTR,
          localOnlyChatRowAttr: LOCAL_ONLY_CHAT_ROW_ATTR,
          toggleButtonId: GUEST_CHAT_TOGGLE_BUTTON_ID
        }
      );
    } catch (error) {
      frameState = {
        url: frame.url(),
        inaccessible: true,
        error: String(error.message || error).slice(0, 160)
      };
    }

    break;
  }

  return { page: pageState, frame: frameState };
}

async function collectHeaderButtonPlacement(page) {
  return await page.evaluate(({ buttonIds }) => {
    const getRectState = (element) => {
      if (!(element instanceof HTMLElement)) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity
      };
    };
    const compactText = (element) => String(element?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 160);
    const chatHeader = document.querySelector("aside#aside-chatting")?.firstElementChild || null;

    return {
      header: chatHeader
        ? {
            tagName: chatHeader.tagName.toLowerCase(),
            className: String(chatHeader.getAttribute("class") || "").slice(0, 120),
            text: compactText(chatHeader),
            rect: getRectState(chatHeader)
          }
        : null,
      buttons: buttonIds.map((id) => {
        const button = document.getElementById(id);
        const rankingAncestor = button?.closest("aside#aside-chatting > :has([class*='ranking' i])") || null;

        return {
          id,
          exists: Boolean(button),
          title: button?.getAttribute("title") || null,
          rect: getRectState(button),
          parentClassName: String(button?.parentElement?.getAttribute("class") || "").slice(0, 120),
          parentText: compactText(button?.parentElement),
          insideChatHeader: Boolean(button && chatHeader?.contains(button)),
          rankingAncestor: rankingAncestor
            ? {
                className: String(rankingAncestor.getAttribute("class") || "").slice(0, 120),
                text: compactText(rankingAncestor),
                rect: getRectState(rankingAncestor)
              }
            : null
        };
      })
    };
  }, { buttonIds: HEADER_BUTTON_IDS });
}

async function collectGuestChatComposerTogglePlacement(target) {
  return await target.evaluate(({ localSendButtonAttr, toggleButtonId }) => {
    const getRectState = (element) => {
      if (!(element instanceof HTMLElement)) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity
      };
    };
    const isVisible = (element) => {
      const rect = getRectState(element);

      return Boolean(
        rect &&
          rect.width > 0 &&
          rect.height > 0 &&
          rect.display !== "none" &&
          rect.visibility !== "hidden" &&
          rect.opacity !== "0"
      );
    };
    const toggleButton = document.getElementById(toggleButtonId);
    const localSendButton = document.querySelector(`[${localSendButtonAttr}="true"]`);
    const nativeSendButton = [
      ...document.querySelectorAll(
        "aside#aside-chatting button[class*='send_button' i], aside#aside-chatting button[type='submit'], aside#aside-chatting button[aria-label*='전송' i]"
      )
    ].find((button) => button !== toggleButton && isVisible(button)) || null;
    const sendButton = isVisible(localSendButton) ? localSendButton : nativeSendButton;
    const toggleRect = getRectState(toggleButton);
    const sendRect = getRectState(sendButton);
    const chatHeader = document.querySelector("aside#aside-chatting")?.firstElementChild || null;

    return {
      toggle: toggleButton
        ? {
            ariaPressed: toggleButton.getAttribute("aria-pressed"),
            insideChatHeader: Boolean(chatHeader?.contains(toggleButton)),
            rect: toggleRect,
            type: toggleButton.getAttribute("type")
          }
        : null,
      sendButton: sendButton
        ? {
            isLocalOnly: sendButton === localSendButton,
            rect: sendRect,
            text: String(sendButton.textContent || "").replace(/\s+/g, " ").trim()
          }
        : null,
      centerDifference: toggleRect && sendRect
        ? Math.abs(toggleRect.y + toggleRect.height / 2 - (sendRect.y + sendRect.height / 2))
        : null,
      gap: toggleRect && sendRect ? sendRect.x - (toggleRect.x + toggleRect.width) : null,
      immediatelyBeforeSend: toggleButton?.nextElementSibling === sendButton,
      sameParent: Boolean(toggleButton && sendButton && toggleButton.parentElement === sendButton.parentElement)
    };
  }, {
    localSendButtonAttr: LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR,
    toggleButtonId: GUEST_CHAT_TOGGLE_BUTTON_ID
  });
}

function isGuestChatOnState(state, liveUrl) {
  if (!state?.page?.frame || !state.frame) {
    return false;
  }

  let frameUrl = null;

  try {
    frameUrl = new URL(state.page.frame.src);
  } catch (_error) {
    return false;
  }

  const liveChannelId = extractLiveChannelId(liveUrl);
  const framePathParts = frameUrl.pathname.split("/").filter(Boolean);
  const frameChannelId = framePathParts[1]?.toLowerCase() || null;

  return Boolean(
    state.page.rootGuestFrame === "on" &&
      state.page.toggleButton?.ariaPressed === "true" &&
      isVisibleRect(state.page.toggleButton?.rect) &&
      isVisibleRect(state.page.guestHost?.rect) &&
      isVisibleRect(state.page.frameContainer?.rect) &&
      isVisibleRect(state.page.frame?.rect) &&
      framePathParts[0] === "live" &&
      framePathParts[2] === "chat" &&
      (!liveChannelId || frameChannelId === liveChannelId) &&
      frameUrl.searchParams.get(GUEST_CHAT_FRAME_MARKER_PARAM) === "1" &&
      (!frameUrl.searchParams.has("theme") || ["dark", "light"].includes(frameUrl.searchParams.get("theme"))) &&
      state.page.frame.credentiallessAttr !== null &&
      state.page.frame.credentiallessProp === true &&
      state.page.nativeVisibleRows === 0 &&
      state.frame.hasStorageAccess === false &&
      state.frame.marker === "1" &&
      state.frame.embed === "true" &&
      state.frame.cleanbotDefault === "off" &&
      state.frame.localStorageCleanbot === "false" &&
      state.frame.hasStyle === true &&
      state.frame.visibleHeaderCount === 0 &&
      state.frame.nestedExtensionFrameCount === 0 &&
      isVisibleRect(state.frame.localOnlyChatField?.rect) &&
      state.frame.localOnlyChatField?.disabled === false &&
      state.frame.localOnlyChatField?.readOnly === false &&
      state.frame.localOnlyChatField?.placeholder === LOCAL_ONLY_CHAT_PLACEHOLDER &&
      state.frame.localOnlyChatField?.overflowY === "hidden" &&
      state.frame.localOnlyChatField?.scrollHeight <= state.frame.localOnlyChatField?.clientHeight + 1 &&
      state.frame.localOnlyChatField?.className === state.frame.originalField?.className &&
      state.frame.localOnlyChatField?.sameParentAsOriginal === true &&
      !isVisibleRect(state.frame.originalField?.rect) &&
      state.frame.originalField?.disabled === true &&
      state.frame.originalField?.readOnly === true &&
      isVisibleRect(state.frame.localOnlyChatSendButton?.rect) &&
      state.frame.localOnlyChatSendButton?.type === "button" &&
      state.frame.localOnlyChatSendButton?.sameParentAsOriginal === true &&
      state.frame.localOnlyChatSendButton?.className === state.frame.originalSendButton?.className &&
      state.frame.localOnlyChatSendButton?.text === state.frame.originalSendButton?.text &&
      state.frame.toggleButton?.ariaPressed === "true" &&
      state.frame.toggleButton?.type === "button" &&
      state.frame.toggleButton?.sameParentAsLocalSend === true &&
      state.frame.toggleButton?.immediatelyBeforeLocalSend === true &&
      state.frame.toggleButton?.insideHeader === false &&
      isVisibleRect(state.frame.toggleButton?.rect) &&
      !isVisibleRect(state.frame.originalSendButton?.rect) &&
      state.frame.originalSendButton?.disabled === true &&
      state.frame.inputCandidateCount >= 2 &&
      state.frame.visibleInputCandidateCount === 1 &&
      (state.frame.logCount > 0 || state.frame.bodyText.length > 0)
  );
}

async function waitForGuestChatFrame(page, timeout = 30000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const guestFrame = page.frames().find((frame) => {
      try {
        return new URL(frame.url()).searchParams.get(GUEST_CHAT_FRAME_MARKER_PARAM) === "1";
      } catch (_error) {
        return false;
      }
    });

    if (guestFrame) {
      return guestFrame;
    }

    await page.waitForTimeout(250);
  }

  throw new Error("credentialless guest chat frame did not become available");
}

function isGuestChatOffState(state) {
  return Boolean(
    state?.page &&
      state.page.rootGuestFrame === "off" &&
      state.page.toggleButton?.ariaPressed === "false" &&
      isVisibleRect(state.page.toggleButton?.rect) &&
      !state.page.guestHost &&
      !state.page.guestControlHost &&
      !state.page.frameContainer &&
      !state.page.frame &&
      !state.frame &&
      state.page.nativeVisibleRows > 0
  );
}

async function waitForGuestChatState(page, { enabled, timeoutMs = 20000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let latestState = null;

  while (Date.now() < deadline) {
    latestState = await collectGuestChatState(page);

    if (enabled ? isGuestChatOnState(latestState, page.url()) : isGuestChatOffState(latestState)) {
      return latestState;
    }

    await page.waitForTimeout(1000);
  }

  return latestState;
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

function hasRoleCoverage(summary) {
  return Boolean(
    summary &&
      summary.framesWithStyle > 0 &&
      summary.counts.nickname > 0 &&
      summary.counts.badge > 0 &&
      summary.counts.timestamp > 0
  );
}

async function findExtensionWorker(context) {
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    for (const worker of context.serviceWorkers()) {
      if (!worker.url().startsWith("chrome-extension://")) {
        continue;
      }

      try {
        const metadata = await worker.evaluate(({ expectedName, expectedBackgroundFile }) => {
          const manifest = chrome.runtime.getManifest();

          return {
            name: manifest.name,
            backgroundFile: manifest.background?.service_worker || "",
            hasStorageLocal: Boolean(chrome.storage?.local),
            matches:
              manifest.name === expectedName &&
              manifest.background?.service_worker === expectedBackgroundFile &&
              Boolean(chrome.storage?.local)
          };
        }, { expectedName: EXTENSION_NAME, expectedBackgroundFile: EXTENSION_BACKGROUND_FILE });

        if (metadata.matches) {
          return worker;
        }
      } catch (_error) {
        // Edge exposes built-in extension workers too. Ignore workers that do not expose our MV3 APIs.
      }
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

async function readExtensionOptions(worker) {
  return worker.evaluate(
    (key) =>
      new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
          const error = chrome.runtime.lastError;

          if (error) {
            reject(new Error(error.message));
            return;
          }

          resolve(result?.[key] || null);
        });
      }),
    STORAGE_KEY
  );
}

async function waitForExtensionOption(worker, optionKey, expectedValue, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  let latestOptions = null;

  while (Date.now() < deadline) {
    latestOptions = await readExtensionOptions(worker);

    if (latestOptions?.[optionKey] === expectedValue) {
      return latestOptions;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(
    `Stored popup option ${optionKey} did not become ${expectedValue}; ` +
    `latest value ${latestOptions?.[optionKey]}`
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

async function collectSyntheticRowRegressionState(
  page,
  { includeNativeTimestamp = false, useLowContrastMessage = false } = {}
) {
  return page.evaluate(
    ({
      roleAttr,
      chatRowAttr,
      includeNativeTimestamp,
      useLowContrastMessage
    }) =>
      new Promise((resolve) => {
        const rootId = `chzzk-chat-ui-toggle-regression-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const rowId = `${rootId}-row`;
        const deadline = Date.now() + 3000;
        const detectedTheme = document.documentElement.dataset.chzzkChatUiToggleDetectedTheme;
        const baseMessageColor = detectedTheme === "dark" ? "#101418" : "#ffffff";
        const colorProbe = document.createElement("span");
        colorProbe.style.color = baseMessageColor;
        document.body.appendChild(colorProbe);
        const baseComputedMessageColor = getComputedStyle(colorProbe).color;
        colorProbe.remove();

        function readElementState(element) {
          if (!(element instanceof Element)) {
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
            role: element.getAttribute(roleAttr) || "",
            color: style.color
          };
        }

        function isVisible(state) {
          return Boolean(
            state.exists &&
            state.display !== "none" &&
            state.visibility !== "hidden" &&
            state.width > 0 &&
            state.height > 0
          );
        }

        function finishWhenAnnotated() {
          const root = document.getElementById(rootId);
          const row = document.getElementById(rowId);

          if (!(root instanceof HTMLElement) || !(row instanceof HTMLElement)) {
            resolve({ missing: true });
            return;
          }

          const nativeTimestamp = row.querySelector("[data-probe='native-timestamp']");
          const message = row.querySelector("[data-probe='message']");
          const nativeTimestampReady =
            !includeNativeTimestamp || nativeTimestamp?.getAttribute(roleAttr)?.includes("timestamp");
          const autoContrastReady =
            !useLowContrastMessage || row.getAttribute("data-chzzk-chat-ui-toggle-auto-contrast")?.includes("message");
          const messageReady = message?.getAttribute("data-chzzk-chat-ui-toggle-message-text") === "true";

          if (
            Date.now() < deadline &&
            (row.getAttribute(chatRowAttr) !== "true" || !nativeTimestampReady || !autoContrastReady || !messageReady)
          ) {
            window.setTimeout(finishWhenAnnotated, 50);
            return;
          }

          const state = {
            row: readElementState(row),
            nativeTimestamp: readElementState(nativeTimestamp),
            message: readElementState(message),
            chatRow: row.getAttribute(chatRowAttr) || "",
            generatedTimestampCount: row.querySelectorAll(
              "[data-chzzk-chat-ui-toggle-generated-timestamp]"
            ).length,
            autoContrastRoles: row.getAttribute("data-chzzk-chat-ui-toggle-auto-contrast") || "",
            autoMessageColor: row.style.getPropertyValue(
              "--chzzk-chat-ui-toggle-auto-message-color"
            ).trim(),
            baseComputedMessageColor,
            rootDataset: {
              timestamps: document.documentElement.dataset.chzzkChatUiToggleTimestamps || null,
              chatTextColor: document.documentElement.dataset.chzzkChatUiToggleChatTextColor || null,
              autoTextContrast:
                document.documentElement.dataset.chzzkChatUiToggleAutoTextContrast || null
            }
          };
          state.visible = {
            row: isVisible(state.row),
            nativeTimestamp: isVisible(state.nativeTimestamp),
            message: isVisible(state.message)
          };

          root.remove();
          resolve(state);
        }

        const root = document.createElement("ul");
        root.id = rootId;
        root.className = "live_chatting_list__probe";
        root.style.position = "fixed";
        root.style.left = "16px";
        root.style.top = "16px";
        root.style.width = "320px";
        root.style.zIndex = "2147483647";
        root.style.pointerEvents = "none";

        const row = document.createElement("li");
        row.id = rowId;
        row.className = "live_chatting_list_item__probe";

        if (includeNativeTimestamp) {
          const timestamp = document.createElement("span");
          timestamp.dataset.probe = "native-timestamp";
          timestamp.className = "live_chatting_message_time__probe";
          timestamp.textContent = "12:34";
          row.appendChild(timestamp);
        }

        const nicknameButton = document.createElement("button");
        nicknameButton.type = "button";
        nicknameButton.className = "live_chatting_message_nickname__probe";

        const nickname = document.createElement("span");
        nickname.className = "name_text__probe live_chatting_username_nickname__probe";
        nickname.textContent = "probeUser";
        nicknameButton.appendChild(nickname);

        const messageContainer = document.createElement("span");
        messageContainer.className = "live_chatting_message_container__probe";

        const message = document.createElement("span");
        message.dataset.probe = "message";
        message.className = "live_chatting_message_text__probe";
        message.textContent = "probe message";

        if (useLowContrastMessage) {
          message.style.color = baseMessageColor;
        }

        messageContainer.appendChild(message);
        row.append(nicknameButton, messageContainer);
        root.appendChild(row);
        document.body.appendChild(root);
        window.setTimeout(finishWhenAnnotated, 50);
      }),
    {
      roleAttr: ROLE_ATTR,
      chatRowAttr: CHAT_ROW_ATTR,
      includeNativeTimestamp,
      useLowContrastMessage
    }
  );
}

function assertSyntheticNativeTimestamp(label, state) {
  if (state.chatRow !== "true") {
    throw new Error(`${label}: synthetic native timestamp row was not annotated`);
  }

  if (!state.nativeTimestamp.exists || !state.nativeTimestamp.role.includes("timestamp")) {
    throw new Error(`${label}: native HH:mm timestamp was not recognized`);
  }

  if (state.generatedTimestampCount !== 0) {
    throw new Error(`${label}: generated timestamp was added beside a native timestamp`);
  }

  if (!state.visible.row || !state.visible.nativeTimestamp || !state.visible.message) {
    throw new Error(`${label}: native timestamp row or its content is hidden; state ${JSON.stringify(state)}`);
  }
}

function assertSyntheticStandaloneAutoContrast(label, state) {
  if (state.rootDataset.chatTextColor !== "off") {
    throw new Error(`${label}: custom chat text color must remain off during standalone auto contrast`);
  }

  if (!state.autoContrastRoles.includes("message") || !state.autoMessageColor) {
    throw new Error(`${label}: message auto-contrast value was not calculated`);
  }

  if (!state.visible.message || state.message.color === state.baseComputedMessageColor) {
    throw new Error(`${label}: calculated auto-contrast color was not applied; state ${JSON.stringify(state)}`);
  }
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
  const chatBoxes = summary.layout.chatBoxes;

  for (const role of ["nickname", "badge", "timestamp"]) {
    if (summary.counts[role] <= 0) {
      missing.push(role);
    }
  }

  if (summary.framesWithStyle <= 0) {
    missing.push("content-style");
  }

  if (chatBoxes.unannotatedRowCount > 0) {
    missing.push(`chat-row-annotations:${chatBoxes.unannotatedRowCount}`);
  }

  if (chatBoxes.nicknameMissingRoleCount > 0) {
    missing.push(`nickname-role:${chatBoxes.nicknameMissingRoleCount}`);
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

function assertChatBoxesOn(label, summary, { requireWidthVariation = true } = {}) {
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

  if (
    requireWidthVariation &&
    (chatBoxes.widthSpread === null || chatBoxes.widthSpread < 32)
  ) {
    throw new Error(`${label}: chat row boxes are not varying by content length`);
  }
}

function assertChatBoxColor(label, summary, hexColor) {
  const themes = summary.detectedThemes.length > 0
    ? summary.detectedThemes
    : ["dark", "light"];
  const expectedColors = themes.map((theme) => hexToExpectedRgba(hexColor, theme));

  if (!summary.layout.chatBoxes.backgroundColors.some((color) => expectedColors.includes(color))) {
    throw new Error(
      `${label}: expected adaptive chat box background ${expectedColors.join(" or ")}; ` +
      `received ${[...new Set(summary.layout.chatBoxes.backgroundColors)].join(", ")}`
    );
  }
}

function assertLargeTextOn(
  label,
  summary,
  expectedFontSizePt = CHAT_FONT_SIZE_PT_DEFAULT,
  expectedNicknameFontSizePt = null
) {
  const chatBoxes = summary.layout.chatBoxes;
  const expectedFontSizePx = expectedFontSizePt * 96 / 72;
  const expectedLineHeightPx = expectedFontSizePx * 1.45;

  if (chatBoxes.maxFontSize === null || chatBoxes.maxFontSize < expectedFontSizePx - 0.5) {
    throw new Error(`${label}: large text font size was not applied`);
  }

  if (Number.isFinite(expectedNicknameFontSizePt)) {
    const expectedNicknameFontSizePx = expectedNicknameFontSizePt * 96 / 72;

    if (
      chatBoxes.minNicknameFontSize === null ||
      chatBoxes.maxNicknameFontSize === null ||
      Math.abs(chatBoxes.minNicknameFontSize - expectedNicknameFontSizePx) > 0.5 ||
      Math.abs(chatBoxes.maxNicknameFontSize - expectedNicknameFontSizePx) > 0.5 ||
      chatBoxes.nicknameFontSizeSpread > 0.5
    ) {
      throw new Error(
        `${label}: independent nickname font size was inconsistent; ` +
        `expected ${expectedNicknameFontSizePx.toFixed(2)}px, ` +
        `received ${chatBoxes.minNicknameFontSize ?? "none"}-${chatBoxes.maxNicknameFontSize ?? "none"}px`
      );
    }
  }

  if (chatBoxes.maxHeight === null || chatBoxes.maxHeight < expectedLineHeightPx - 1) {
    throw new Error(`${label}: large text row height was not expanded`);
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

  if (chatBoxes.singleLineTextInsetDeltas.length <= 0) {
    throw new Error(`${label}: no single-line text inset samples`);
  }

  if (chatBoxes.maxSingleLineTextInsetDelta > 14) {
    throw new Error(
      `${label}: chat box text padding is unbalanced; max single-line inset delta ${chatBoxes.maxSingleLineTextInsetDelta}px`
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

function assertGuestChatOn(label, state, liveUrl) {
  if (isGuestChatOnState(state, liveUrl)) {
    return;
  }

  throw new Error(
    `${label}: guest chat iframe did not become active; state ${JSON.stringify(state).slice(0, 1200)}`
  );
}

function assertGuestChatOff(label, state) {
  if (isGuestChatOffState(state)) {
    return;
  }

  throw new Error(
    `${label}: guest chat iframe did not cleanly turn off; state ${JSON.stringify(state).slice(0, 1200)}`
  );
}

function assertHeaderButtonsInChatHeader(label, state) {
  if (!state?.header || !String(state.header.text || "").includes("채팅")) {
    throw new Error(`${label}: chat header was not found; state ${JSON.stringify(state).slice(0, 800)}`);
  }

  for (const button of state.buttons || []) {
    if (!button.exists || !isVisibleRect(button.rect)) {
      throw new Error(`${label}: ${button.id} is not visible in the chat header`);
    }

    if (!button.insideChatHeader || button.rankingAncestor) {
      throw new Error(
        `${label}: ${button.id} was inserted outside the chat header; state ${JSON.stringify(button).slice(0, 800)}`
      );
    }
  }
}

function assertGuestChatToggleBesideSendButton(label, state, { expectLocalOnly = false } = {}) {
  if (!state?.toggle || !isVisibleRect(state.toggle.rect)) {
    throw new Error(`${label}: 나만 보기 전환 버튼이 보이지 않습니다; state ${JSON.stringify(state).slice(0, 800)}`);
  }

  if (!state.sendButton || !isVisibleRect(state.sendButton.rect)) {
    throw new Error(`${label}: 채팅 전송 버튼이 보이지 않습니다; state ${JSON.stringify(state).slice(0, 800)}`);
  }

  if (
    state.toggle.type !== "button" ||
    state.toggle.insideChatHeader ||
    !state.sameParent ||
    !state.immediatelyBeforeSend ||
    state.sendButton.isLocalOnly !== expectLocalOnly
  ) {
    throw new Error(
      `${label}: 나만 보기 버튼이 전송 버튼 바로 왼쪽에 있지 않습니다; state ${JSON.stringify(state).slice(0, 1000)}`
    );
  }

  if (
    !Number.isFinite(state.gap) ||
    state.gap < 0 ||
    state.gap > 20 ||
    !Number.isFinite(state.centerDifference) ||
    state.centerDifference > 8
  ) {
    throw new Error(
      `${label}: 하단 버튼 정렬이 어긋났습니다; state ${JSON.stringify(state).slice(0, 1000)}`
    );
  }
}

async function createLocalOnlyChatNetworkAudit(context, page) {
  const session = await context.newCDPSession(page);
  const requests = [];
  let observedRequestCount = 0;
  const webSocketFrameSent = [];
  const webSocketFrameReceived = [];
  const webSocketUrls = new Map();
  const stringifyPayload = (payload) => {
    if (Buffer.isBuffer(payload)) return payload.toString("utf8");
    if (typeof payload === "string") return payload;
    return JSON.stringify(payload ?? "");
  };
  const createWebSocketFrameRecord = ({ opcode = null, payload = "", requestId = null, url = "" }) => {
    const rawPayload = stringifyPayload(payload);
    let decodedPayload = rawPayload;

    if (opcode === 2) {
      try {
        decodedPayload = Buffer.from(rawPayload, "base64").toString("utf8");
      } catch (_error) {
        decodedPayload = rawPayload;
      }
    }

    return {
      decodedPayload,
      opcode,
      rawPayload,
      requestId,
      url: url || webSocketUrls.get(requestId) || ""
    };
  };
  const recordRequest = (request) => {
    observedRequestCount += 1;
    requests.push({
      method: request.method(),
      postData: request.postData() || "",
      url: request.url()
    });
  };
  const recordWebSocket = (socket) => {
    socket.on("framesent", (event) => webSocketFrameSent.push(createWebSocketFrameRecord({
      payload: event.payload,
      url: socket.url()
    })));
    socket.on("framereceived", (event) => webSocketFrameReceived.push(createWebSocketFrameRecord({
      payload: event.payload,
      url: socket.url()
    })));
  };

  page.on("request", recordRequest);
  page.on("websocket", recordWebSocket);
  session.on("Network.requestWillBeSent", (event) => {
    observedRequestCount += 1;
    requests.push({
      method: event.request.method,
      postData: event.request.postData || "",
      url: event.request.url
    });
  });
  session.on("Network.webSocketCreated", (event) => {
    webSocketUrls.set(event.requestId, event.url);
  });
  session.on("Network.webSocketFrameSent", (event) => {
    webSocketFrameSent.push(createWebSocketFrameRecord({
      opcode: event.response?.opcode ?? null,
      payload: event.response?.payloadData || "",
      requestId: event.requestId
    }));
  });
  session.on("Network.webSocketFrameReceived", (event) => {
    webSocketFrameReceived.push(createWebSocketFrameRecord({
      opcode: event.response?.opcode ?? null,
      payload: event.response?.payloadData || "",
      requestId: event.requestId
    }));
  });
  await session.send("Network.enable");

  return {
    requests,
    webSocketFrameReceived,
    webSocketFrameSent,
    clear() {
      requests.length = 0;
      webSocketFrameReceived.length = 0;
      webSocketFrameSent.length = 0;
    },
    findSentinel(sentinel) {
      const requestMatches = requests.filter((request) =>
        `${request.method}\n${request.url}\n${request.postData}`.includes(sentinel)
      );
      const webSocketMatches = webSocketFrameSent.filter((frame) =>
        frame.rawPayload.includes(sentinel) || frame.decodedPayload.includes(sentinel)
      );

      return { requestMatches, webSocketMatches };
    },
    getObservedWebSocketUrls() {
      return [...new Set([
        ...webSocketUrls.values(),
        ...webSocketFrameSent.map((frame) => frame.url),
        ...webSocketFrameReceived.map((frame) => frame.url)
      ].filter(Boolean))];
    },
    getObservedRequestCount() {
      return observedRequestCount;
    },
    async dispose() {
      page.off("request", recordRequest);
      page.off("websocket", recordWebSocket);
      await session.detach().catch(() => {});
    }
  };
}

async function assertLocalOnlyChatFlow(page, networkAudit) {
  const guestFrame = await waitForGuestChatFrame(page);
  const localOnlyChatField = guestFrame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`);
  const enterMessage = `LOCAL_ONLY_ENTER_${Date.now().toString(36)}`;

  await localOnlyChatField.waitFor({ state: "visible", timeout: 30000 });
  await guestFrame.waitForFunction(
    ({ localRowAttr, nativeChatRowSelector }) =>
      [...document.querySelectorAll(nativeChatRowSelector)]
        .some((row) => row.getAttribute(localRowAttr) !== "true"),
    {
      localRowAttr: LOCAL_ONLY_CHAT_ROW_ATTR,
      nativeChatRowSelector: NATIVE_CHAT_ROW_SELECTOR
    },
    { timeout: 30000 }
  );
  const remoteBefore = await guestFrame.evaluate(({ localRowAttr, nativeChatRowSelector }) => {
    const normalize = (element) => String(element?.textContent || "").replace(/\s+/g, " ").trim();
    const timelineSignature = (row) => {
      const nickname = row.querySelector('[data-chzzk-chat-ui-toggle-role~="nickname"]');
      const message = row.querySelector('[data-chzzk-chat-ui-toggle-message-text="true"]');

      return `${normalize(nickname)}\u001f${normalize(message)}`;
    };
    const rows = [...document.querySelectorAll(nativeChatRowSelector)]
      .filter((row) => row.getAttribute(localRowAttr) !== "true");

    window.__chzzkLocalOnlyVerifierRemoteSnapshot = rows.map((row) => ({
      row,
      signature: timelineSignature(row),
      text: normalize(row)
    }));

    return {
      count: rows.length
    };
  }, {
    localRowAttr: LOCAL_ONLY_CHAT_ROW_ATTR,
    nativeChatRowSelector: NATIVE_CHAT_ROW_SELECTOR
  });
  const originalRemoteRowCount = remoteBefore.count;

  if (originalRemoteRowCount <= 0) {
    throw new Error("local-only live verification requires at least one original remote chat row");
  }

  networkAudit.clear();
  await localOnlyChatField.fill(enterMessage);
  await localOnlyChatField.press("Enter");

  const localOnlyRow = guestFrame
    .locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`)
    .filter({ hasText: enterMessage });
  await localOnlyRow.waitFor({ state: "visible", timeout: 10000 });
  await guestFrame.waitForTimeout(150);
  const localState = await localOnlyRow.evaluate(
    (row, { localRowAttr, message, nativeChatRowSelector }) => {
      const remoteRows = [...document.querySelectorAll(nativeChatRowSelector)]
        .filter((candidate) => candidate.getAttribute(localRowAttr) !== "true");
      const remoteRowContainer = remoteRows[0]?.parentElement;
      const reverseFlow = remoteRowContainer instanceof HTMLElement &&
        getComputedStyle(remoteRowContainer).flexDirection.endsWith("reverse");
      const remoteTemplate = reverseFlow ? remoteRows[0] : remoteRows.at(-1);
      const messageText = row.querySelector('[data-chzzk-chat-ui-toggle-message-text="true"]');
      const nickname = row.querySelector('[data-chzzk-chat-ui-toggle-role~="nickname"]');
      const rect = row.getBoundingClientRect();
      const composer = document.querySelector('[data-chzzk-chat-ui-toggle-local-only-field="true"]');
      const composerRect = composer?.getBoundingClientRect();
      const aside = row.closest("aside#aside-chatting, aside:has([role='log'])");
      const composerAside = composer?.closest("aside#aside-chatting, aside:has([role='log'])");
      const snapshot = Array.isArray(window.__chzzkLocalOnlyVerifierRemoteSnapshot)
        ? window.__chzzkLocalOnlyVerifierRemoteSnapshot
        : [];
      const normalize = (element) => String(element?.textContent || "").replace(/\s+/g, " ").trim();
      const preservedSnapshotRows = snapshot.filter(
        (entry) => entry.row.isConnected && normalize(entry.row) === entry.text
      ).length;
      const mutatedSnapshotRows = snapshot.filter(
        (entry) => entry.row.isConnected && normalize(entry.row) !== entry.text
      ).length;
      const removedSnapshotRows = snapshot.filter((entry) => !entry.row.isConnected).length;
      const clipRect = {
        bottom: window.innerHeight,
        left: 0,
        right: window.innerWidth,
        top: 0
      };

      for (
        let current = row.parentElement;
        current instanceof HTMLElement;
        current = current.parentElement
      ) {
        const style = getComputedStyle(current);
        const currentRect = current.getBoundingClientRect();

        if (/(auto|scroll|hidden|clip)/i.test(style.overflowY)) {
          clipRect.top = Math.max(clipRect.top, currentRect.top);
          clipRect.bottom = Math.min(clipRect.bottom, currentRect.bottom);
        }

        if (/(auto|scroll|hidden|clip)/i.test(style.overflowX)) {
          clipRect.left = Math.max(clipRect.left, currentRect.left);
          clipRect.right = Math.min(clipRect.right, currentRect.right);
        }

        if (current === aside || current === document.body) break;
      }

      const visibleWidth = Math.max(0, Math.min(rect.right, clipRect.right) - Math.max(rect.left, clipRect.left));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, clipRect.bottom) - Math.max(rect.top, clipRect.top));
      const previousPointerEvents = row.style.getPropertyValue("pointer-events");
      const previousPointerEventsPriority = row.style.getPropertyPriority("pointer-events");

      row.style.setProperty("pointer-events", "auto", "important");
      const rowCenterElements = document.elementsFromPoint(
        Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2)),
        Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2))
      );

      if (previousPointerEvents) {
        row.style.setProperty("pointer-events", previousPointerEvents, previousPointerEventsPriority);
      } else {
        row.style.removeProperty("pointer-events");
      }

      const composerCenterElements = composerRect
        ? document.elementsFromPoint(
            Math.min(window.innerWidth - 1, Math.max(0, composerRect.left + composerRect.width / 2)),
            Math.min(window.innerHeight - 1, Math.max(0, composerRect.top + composerRect.height / 2))
          )
        : [];
      const rowComposerOverlap = Boolean(
        composerRect &&
        rect.left < composerRect.right &&
        rect.right > composerRect.left &&
        rect.top < composerRect.bottom &&
        rect.bottom > composerRect.top
      );

      window.__chzzkLocalOnlyVerifierInsertedRow = row;
      const rowCenterY = rect.top + rect.height / 2;
      const newerRemoteCount = remoteRows.filter((remoteRow) => {
        const remoteRect = remoteRow.getBoundingClientRect();

        return remoteRect.top + remoteRect.height / 2 > rowCenterY + 1;
      }).length;

      return {
        classMatchesRemote: Boolean(remoteTemplate && row.className === remoteTemplate.className),
        insideLog: Boolean(row.closest('[role="log"]')),
        messageText: messageText?.textContent || "",
        nicknameText: nickname?.textContent?.trim() || "",
        parentMatchesRemote: Boolean(remoteTemplate && row.parentElement === remoteTemplate.parentElement),
        remoteRowCount: remoteRows.length,
        containsExecutableMarkup: Boolean(row.querySelector("script, img, iframe, form")),
        inputValue: composer?.value || "",
        expectedMessage: message,
        composerVisibleInViewport: Boolean(
          composerRect &&
          composerRect.width > 0 &&
          composerRect.height > 0 &&
          composerRect.left >= 0 &&
          composerRect.right <= window.innerWidth &&
          composerRect.top >= 0 &&
          composerRect.bottom <= window.innerHeight &&
          composerCenterElements.some((element) => element === composer || composer.contains(element))
        ),
        documentScrollTop: document.scrollingElement?.scrollTop || 0,
        localRowFullyVisible:
          rect.width > 0 &&
          rect.height > 0 &&
          visibleWidth >= rect.width - 1 &&
          visibleHeight >= rect.height - 1 &&
          rowCenterElements.some((element) => element === row || row.contains(element)),
        clipRect,
        localText: normalize(row),
        mutatedSnapshotRows,
        newerRemoteCount,
        preservedSnapshotRows,
        removedSnapshotRows,
        rowAboveComposer: Boolean(composerRect && rect.bottom <= composerRect.top + 1),
        rowComposerOverlap,
        rowRect: {
          bottom: rect.bottom,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          width: rect.width
        },
        sameChatAside: Boolean(aside && aside === composerAside),
        snapshotRowCount: snapshot.length
      };
    },
    {
      localRowAttr: LOCAL_ONLY_CHAT_ROW_ATTR,
      message: enterMessage,
      nativeChatRowSelector: NATIVE_CHAT_ROW_SELECTOR
    }
  );

  if (
    !localState.insideLog ||
    !localState.parentMatchesRemote ||
    !localState.classMatchesRemote ||
    localState.messageText !== enterMessage ||
    localState.nicknameText !== "나" ||
    localState.containsExecutableMarkup ||
    localState.inputValue !== "" ||
    !localState.composerVisibleInViewport ||
    localState.documentScrollTop !== 0 ||
    !localState.localRowFullyVisible ||
    !localState.rowAboveComposer ||
    localState.rowComposerOverlap ||
    !localState.sameChatAside ||
    localState.mutatedSnapshotRows !== 0 ||
    localState.removedSnapshotRows > 1 ||
    localState.preservedSnapshotRows < Math.max(1, localState.snapshotRowCount - 1) ||
    localState.remoteRowCount < Math.max(1, originalRemoteRowCount - 1)
  ) {
    throw new Error(`local-only chat did not preserve the native chat flow: ${JSON.stringify(localState)}`);
  }

  try {
    await guestFrame.waitForFunction(
      ({ localRowAttr, nativeChatRowSelector }) => {
        const normalize = (element) => String(element?.textContent || "").replace(/\s+/g, " ").trim();
        const timelineSignature = (row) => {
          const nickname = row.querySelector('[data-chzzk-chat-ui-toggle-role~="nickname"]');
          const message = row.querySelector('[data-chzzk-chat-ui-toggle-message-text="true"]');

          return `${normalize(nickname)}\u001f${normalize(message)}`;
        };
        const rows = [...document.querySelectorAll(nativeChatRowSelector)]
          .filter((row) => row.getAttribute(localRowAttr) !== "true");
        const snapshot = Array.isArray(window.__chzzkLocalOnlyVerifierRemoteSnapshot)
          ? window.__chzzkLocalOnlyVerifierRemoteSnapshot
          : [];

        return rows.some((row) => {
          const previous = snapshot.find((entry) => entry.row === row);

          return !previous || timelineSignature(row) !== previous.signature;
        });
      },
      {
        localRowAttr: LOCAL_ONLY_CHAT_ROW_ATTR,
        nativeChatRowSelector: NATIVE_CHAT_ROW_SELECTOR
      },
      { timeout: 30000 }
    );
  } catch (_error) {
    throw new Error("remote chat DOM did not update during the 30-second local-only timeline verification window");
  }

  const remoteStreamUpdated = true;
  await page.waitForTimeout(1000);
  const enterNetworkMatches = networkAudit.findSentinel(enterMessage);
  const enterNetworkCoverage = {
    observedWebSocketUrls: networkAudit.getObservedWebSocketUrls(),
    receivedFramesWithUrl: networkAudit.webSocketFrameReceived.filter((frame) => frame.url).length,
    requestCount: networkAudit.getObservedRequestCount(),
    sentFrameCount: networkAudit.webSocketFrameSent.length
  };

  if (
    enterNetworkMatches.requestMatches.length > 0 ||
    enterNetworkMatches.webSocketMatches.length > 0
  ) {
    throw new Error(`local-only Enter sentinel escaped to a network send: ${JSON.stringify(enterNetworkMatches)}`);
  }

  if (
    enterNetworkCoverage.observedWebSocketUrls.length === 0 ||
    enterNetworkCoverage.receivedFramesWithUrl === 0 ||
    enterNetworkCoverage.requestCount === 0
  ) {
    throw new Error(`local-only network audit did not observe the guest chat transport: ${JSON.stringify(enterNetworkCoverage)}`);
  }

  const postStreamState = await guestFrame.evaluate(
    ({ localRowAttr, message, nativeChatRowSelector }) => {
      const normalize = (element) => String(element?.textContent || "").replace(/\s+/g, " ").trim();
      const timelineSignature = (row) => {
        const nickname = row.querySelector('[data-chzzk-chat-ui-toggle-role~="nickname"]');
        const messageText = row.querySelector('[data-chzzk-chat-ui-toggle-message-text="true"]');

        return `${normalize(nickname)}\u001f${normalize(messageText)}`;
      };
      const rows = [...document.querySelectorAll(`[${localRowAttr}="true"]`)]
        .filter((row) => String(row.textContent || "").includes(message));
      const remoteRows = [...document.querySelectorAll(nativeChatRowSelector)]
        .filter((row) => row.getAttribute(localRowAttr) !== "true");
      const localRow = rows[0] || null;
      const localRect = localRow?.getBoundingClientRect() || null;
      const localCenterY = localRect ? localRect.top + localRect.height / 2 : null;
      const snapshot = Array.isArray(window.__chzzkLocalOnlyVerifierRemoteSnapshot)
        ? window.__chzzkLocalOnlyVerifierRemoteSnapshot
        : [];
      const updatedRemoteRows = remoteRows.filter((row) => {
        const previous = snapshot.find((entry) => entry.row === row);

        return !previous || timelineSignature(row) !== previous.signature;
      });
      const updatedRemoteBelowLocalCount = localCenterY === null
        ? 0
        : updatedRemoteRows.filter((row) => {
            const rect = row.getBoundingClientRect();

            return rect.top + rect.height / 2 > localCenterY + 1;
          }).length;
      const newerRemoteCount = localCenterY === null
        ? 0
        : remoteRows.filter((row) => {
            const rect = row.getBoundingClientRect();

            return rect.top + rect.height / 2 > localCenterY + 1;
          }).length;
      const logRect = localRow?.closest('[role="log"]')?.getBoundingClientRect() || null;
      const visibleRows = [
        ...remoteRows.map((row) => ({ kind: "remote", row })),
        ...rows.map((row) => ({ kind: "local", row }))
      ].filter(({ row }) => {
        const rect = row.getBoundingClientRect();
        const clipTop = Math.max(0, logRect?.top ?? 0);
        const clipBottom = Math.min(window.innerHeight, logRect?.bottom ?? window.innerHeight);

        return rect.width > 0 && rect.height > 0 && rect.bottom > clipTop && rect.top < clipBottom;
      });
      const bottommostVisibleRow = visibleRows.sort(
        (first, second) => second.row.getBoundingClientRect().bottom - first.row.getBoundingClientRect().bottom
      )[0] || null;

      return {
        bottommostVisibleRowKind: bottommostVisibleRow?.kind || null,
        localTop: localRect?.top ?? null,
        localRowCount: rows.length,
        newerRemoteCount,
        remoteRowCount: remoteRows.length,
        sameLocalRowNode: rows.length === 1 && rows[0] === window.__chzzkLocalOnlyVerifierInsertedRow,
        updatedRemoteBelowLocalCount,
        updatedRemoteCount: updatedRemoteRows.length
      };
    },
    {
      localRowAttr: LOCAL_ONLY_CHAT_ROW_ATTR,
      message: enterMessage,
      nativeChatRowSelector: NATIVE_CHAT_ROW_SELECTOR
    }
  );

  if (
    postStreamState.localRowCount !== 1 ||
    !postStreamState.sameLocalRowNode ||
    postStreamState.remoteRowCount <= 0 ||
    postStreamState.updatedRemoteCount <= 0 ||
    postStreamState.updatedRemoteBelowLocalCount <= 0 ||
    postStreamState.newerRemoteCount <= localState.newerRemoteCount ||
    !(postStreamState.localTop < localState.rowRect.top - 1) ||
    postStreamState.bottommostVisibleRowKind !== "remote"
  ) {
    throw new Error(`local-only row did not move up with the remote chat timeline: ${JSON.stringify({ localState, postStreamState })}`);
  }

  networkAudit.clear();
  const buttonMessage = `LOCAL_ONLY_BUTTON_${Date.now().toString(36)}`;
  await localOnlyChatField.fill(buttonMessage);
  const sendButton = guestFrame.locator(`[${LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR}="true"]`);
  await sendButton.waitFor({ state: "visible", timeout: 10000 });
  await sendButton.click();
  const buttonRow = guestFrame
    .locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`)
    .filter({ hasText: buttonMessage });
  await buttonRow.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(1000);
  const buttonNetworkMatches = networkAudit.findSentinel(buttonMessage);

  if (
    buttonNetworkMatches.requestMatches.length > 0 ||
    buttonNetworkMatches.webSocketMatches.length > 0
  ) {
    throw new Error(`local-only button sentinel escaped to a network send: ${JSON.stringify(buttonNetworkMatches)}`);
  }

  const buttonState = await guestFrame.evaluate(
    ({ localRowAttr, buttonMessage, enterMessage }) => {
      const rows = [...document.querySelectorAll(`[${localRowAttr}="true"]`)];

      return {
        buttonMessageCount: rows.filter((row) => String(row.textContent || "").includes(buttonMessage)).length,
        composerVisible: Boolean(document.querySelector('[data-chzzk-chat-ui-toggle-local-only-field="true"]')?.getClientRects().length),
        enterMessageCount: rows.filter((row) => String(row.textContent || "").includes(enterMessage)).length
      };
    },
    { buttonMessage, enterMessage, localRowAttr: LOCAL_ONLY_CHAT_ROW_ATTR }
  );

  if (
    buttonState.buttonMessageCount !== 1 ||
    buttonState.enterMessageCount !== 1 ||
    !buttonState.composerVisible
  ) {
    throw new Error(`local-only button flow did not remain local and visible: ${JSON.stringify(buttonState)}`);
  }

  const sentinelNetworkMatches = {
    button: buttonNetworkMatches,
    enter: enterNetworkMatches
  };

  return {
    buttonMessage,
    buttonState,
    enterMessage,
    enterNetworkCoverage,
    localState,
    originalRemoteRowCount,
    postStreamState,
    remoteStreamUpdated,
    requestCount: networkAudit.requests.length,
    sentFrameCount: networkAudit.webSocketFrameSent.length,
    receivedFrameCount: networkAudit.webSocketFrameReceived.length,
    observedWebSocketUrls: networkAudit.getObservedWebSocketUrls(),
    sentinelNetworkMatches
  };
}

async function assertGuestChatComposerToggleFlow(page, networkAudit) {
  assertGuestChatToggleBesideSendButton(
    "guest chat off composer toggle placement",
    await collectGuestChatComposerTogglePlacement(page)
  );
  const toggleButton = page.locator(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`);

  await toggleButton.waitFor({ state: "visible", timeout: 30000 });

  if ((await toggleButton.getAttribute("aria-pressed")) === "true") {
    await toggleButton.click();
    assertGuestChatOff("guest chat precondition off state", await waitForGuestChatState(page, { enabled: false }));
  }

  await toggleButton.click();
  const guestOn = await waitForGuestChatState(page, { enabled: true });
  assertGuestChatOn("guest chat composer-toggle on state", guestOn, page.url());
  const guestFrame = await waitForGuestChatFrame(page);
  const frameToggleButton = guestFrame.locator(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`);

  await frameToggleButton.waitFor({ state: "visible", timeout: 30000 });
  assertGuestChatToggleBesideSendButton(
    "guest chat on composer toggle placement",
    await collectGuestChatComposerTogglePlacement(guestFrame),
    { expectLocalOnly: true }
  );
  const localOnlyChat = await assertLocalOnlyChatFlow(page, networkAudit);

  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-guest-chat-on.png"), fullPage: false });

  await frameToggleButton.click();
  const guestOff = await waitForGuestChatState(page, { enabled: false });
  assertGuestChatOff("guest chat composer-toggle off state", guestOff);

  return { on: guestOn, off: guestOff, localOnlyChat };
}

async function collectState(page, label) {
  await page.bringToFront();
  await page.waitForTimeout(1500);

  let state = {
    states: await collectFrameStates(page)
  };
  state.summary = summarizeFrameState(state.states);

  if (!hasRoleCoverage(state.summary)) {
    state = await waitForRoleCoverage(page, 15000);
  }

  assertSummary(label, state.summary);

  return state;
}

async function waitForPopupReady(popup) {
  await popup.locator('[data-view="home"]').waitFor({ state: "attached", timeout: 10000 });
  await popup.waitForFunction(
    () => document.getElementById("statusLabel")?.textContent?.trim() !== "준비 중",
    null,
    { timeout: 10000 }
  );
}

async function selectPopupView(popup, targetView) {
  await popup.bringToFront();
  const target = popup.locator(`[data-view="${targetView}"]`);

  if (await target.isVisible()) {
    return target;
  }

  const home = popup.locator('[data-view="home"]');

  for (let attempt = 0; attempt < 3 && !(await home.isVisible()); attempt += 1) {
    const activeView = popup.locator("[data-view]:not([hidden])").first();
    const backButton = activeView.locator("[data-back], [data-color-back]").first();

    if ((await backButton.count()) === 0) {
      throw new Error(`Popup cannot navigate from the active view to ${targetView}`);
    }

    await backButton.click();
    await popup.waitForTimeout(50);
  }

  await home.waitFor({ state: "visible", timeout: 5000 });

  if (targetView === "home") {
    return home;
  }

  await home.locator(`[data-goto="${targetView}"]`).click();
  await target.waitFor({ state: "visible", timeout: 5000 });
  return target;
}

async function setPopupCheckbox(view, optionKey, value) {
  if (typeof value !== "boolean") {
    return;
  }

  const input = view.locator(`[data-option="${optionKey}"]`);

  if ((await input.count()) !== 1) {
    throw new Error(`Popup option ${optionKey} was not found exactly once in the selected view`);
  }

  await input.setChecked(value);
}

async function setPopupColor(popup, target, hexColor) {
  const normalized = normalizeHexColor(hexColor);
  const styleView = await selectPopupView(popup, "style");
  const chip = styleView.locator(
    `[data-color-target="${target}"] .color-chip[aria-label="${normalized}"]`
  );

  if ((await chip.count()) === 1) {
    await chip.click();
    return;
  }

  await styleView.locator(`[data-open-color="${target}"]`).click();
  const colorView = popup.locator('[data-view="color-picker"]');
  await colorView.waitFor({ state: "visible", timeout: 5000 });
  await colorView.locator("#chatTextColorHex").evaluate((input, value) => {
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, normalized);
  await selectPopupView(popup, "style");
}

async function setPopupOptions(popup, options) {
  await waitForPopupReady(popup);

  const visibilityView = await selectPopupView(popup, "visibility");
  await setPopupCheckbox(visibilityView, "showNicknames", options.showNicknames);
  await setPopupCheckbox(visibilityView, "showBadges", options.showBadges);
  await setPopupCheckbox(visibilityView, "showTimestamps", options.showTimestamps);
  await setPopupCheckbox(visibilityView, "showNonChatPanels", options.showNonChatPanels);

  const styleView = await selectPopupView(popup, "style");
  await setPopupCheckbox(styleView, "showChatBoxes", options.showChatBoxes);
  await setPopupCheckbox(styleView, "showLargeText", options.showLargeText);
  if (typeof options.chatFontSizePt === "number") {
    await styleView.locator('[data-option="chatFontSizePt"]').evaluate((slider, fontSizePt) => {
      slider.value = String(fontSizePt);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    }, options.chatFontSizePt);
    await popup.waitForTimeout(150);
  }
  await setPopupCheckbox(styleView, "useNicknameFontSize", options.useNicknameFontSize);
  if (typeof options.nicknameFontSizePt === "number") {
    await styleView.locator('[data-option="nicknameFontSizePt"]').evaluate((slider, fontSizePt) => {
      slider.value = String(fontSizePt);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    }, options.nicknameFontSizePt);
    await popup.waitForTimeout(150);
  }
  await setPopupCheckbox(styleView, "showBoldText", options.showBoldText);
  await setPopupCheckbox(styleView, "useAutoTextContrast", options.useAutoTextContrast);
  await setPopupCheckbox(styleView, "useChatTextColor", options.useChatTextColor === true);
  await setPopupCheckbox(
    styleView,
    "useNicknameColorForMessage",
    options.useNicknameColorForMessage === true
  );

  if (options.useChatTextColor === true && options.chatTextColor) {
    await setPopupColor(popup, "text", options.chatTextColor);
  }

  if (options.chatBoxColor) {
    await setPopupColor(popup, "box", options.chatBoxColor);
  }

  if (
    typeof options.useGuestChatFrame === "boolean" ||
    typeof options.useMiniFloatingChat === "boolean"
  ) {
    const chatModeView = await selectPopupView(popup, "chat-mode");
    const chatMode = options.useGuestChatFrame
      ? "guest"
      : options.useMiniFloatingChat
        ? "mini"
        : "default";
    await chatModeView.locator(`input[name="chatMode"][value="${chatMode}"]`).setChecked(true);
  }

  const buttonsView = await selectPopupView(popup, "buttons");
  await setPopupCheckbox(
    buttonsView,
    "showGuestChatToggleButton",
    options.showGuestChatToggleButton
  );
  await setPopupCheckbox(
    buttonsView,
    "showMiniFloatingChatButton",
    options.showMiniFloatingChatButton
  );
  await setPopupCheckbox(
    buttonsView,
    "showHeaderSettingsButton",
    options.showHeaderSettingsButton
  );
  await popup.waitForTimeout(180);
}

async function assertPopupImmediateClosePersistence(context, worker, extensionId) {
  await setExtensionOptions(worker, onOptions);
  const popup = await context.newPage();

  try {
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: "domcontentloaded",
      timeout: 15000
    });
    await waitForPopupReady(popup);
    const visibilityView = await selectPopupView(popup, "visibility");
    await visibilityView.locator('[data-option="showBadges"]').setChecked(false);
    await popup.close({ runBeforeUnload: true });
    const storedOptions = await waitForExtensionOption(worker, "showBadges", false);

    return {
      option: "showBadges",
      storedValue: storedOptions.showBadges
    };
  } finally {
    if (!popup.isClosed()) {
      await popup.close().catch(() => {});
    }

    await setExtensionOptions(worker, onOptions);
  }
}

async function collectMiniChatDefaultPosition(page) {
  const panel = page.locator(`#${MINI_CHAT_PANEL_ID}`);
  await panel.waitFor({ state: "visible", timeout: 10000 });

  return panel.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return {
      rect: {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      rightGap: Math.round(window.innerWidth - rect.right),
      bottomGap: Math.round(window.innerHeight - rect.bottom)
    };
  });
}

async function waitForMiniChatFrameState(page, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let latestState = null;

  while (Date.now() < deadline) {
    const frame = page.frames().find((candidate) =>
      candidate.url().includes("chzzkChatUiToggleMini=1")
    );

    if (frame) {
      latestState = await frame.evaluate(() => ({
        url: location.href,
        readyState: document.readyState,
        embed: document.documentElement.dataset.chzzkChatUiToggleMiniChatEmbed || null,
        logCount: document.querySelectorAll("[role='log']").length,
        rowCount: document.querySelectorAll('[data-chzzk-chat-ui-toggle-chat-row="true"]').length
      }));

      if (
        latestState.readyState === "complete" &&
        latestState.embed === "true" &&
        latestState.logCount > 0
      ) {
        return latestState;
      }
    }

    await page.waitForTimeout(100);
  }

  throw new Error(`mini chat frame did not become ready; state ${JSON.stringify(latestState)}`);
}

function assertMiniChatDefaultPosition(label, state) {
  if (
    state.rightGap < 0 ||
    state.bottomGap < 0 ||
    state.rightGap > 48 ||
    state.bottomGap > 48
  ) {
    throw new Error(`${label}: mini chat did not start near the bottom-right; state ${JSON.stringify(state)}`);
  }
}

async function assertDirectGuestMarkerProtection(context, page) {
  const channelId = extractLiveChannelId(page.url());

  if (!channelId) {
    throw new Error(`Cannot build direct guest marker URL from ${page.url()}`);
  }

  const sentinel = `chzzk-chat-ui-toggle-verifier-${Date.now()}`;
  const originalCleanbot = await page.evaluate(() => window.localStorage.getItem("cleanbot"));
  const directPage = await context.newPage();

  try {
    await page.evaluate((value) => window.localStorage.setItem("cleanbot", value), sentinel);
    const directUrl = new URL(`/live/${channelId}/chat`, page.url());
    directUrl.searchParams.set(GUEST_CHAT_FRAME_MARKER_PARAM, "1");
    await directPage.goto(directUrl.href, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    await directPage.waitForTimeout(1000);

    const state = await directPage.evaluate(
      ({ guestEmbedAttr, guestCleanbotDefaultAttr, toggleButtonId }) => ({
        url: location.href,
        isTopLevel: window.self === window.top,
        cleanbot: window.localStorage.getItem("cleanbot"),
        guestEmbed: document.documentElement.getAttribute(guestEmbedAttr),
        guestCleanbotDefault: document.documentElement.getAttribute(guestCleanbotDefaultAttr),
        toggleButtonCount: document.querySelectorAll(`#${toggleButtonId}`).length
      }),
      {
        guestEmbedAttr: GUEST_CHAT_EMBED_ATTR,
        guestCleanbotDefaultAttr: GUEST_CHAT_CLEANBOT_DEFAULT_ATTR,
        toggleButtonId: GUEST_CHAT_TOGGLE_BUTTON_ID
      }
    );

    if (
      !state.isTopLevel ||
      state.cleanbot !== sentinel ||
      state.guestEmbed !== null ||
      state.guestCleanbotDefault !== null ||
      state.toggleButtonCount !== 0
    ) {
      throw new Error(`direct guest marker changed top-level storage; state ${JSON.stringify(state)}`);
    }

    return state;
  } finally {
    await directPage.close().catch(() => {});
    await page.bringToFront();
    await page.evaluate((originalValue) => {
      if (originalValue === null) {
        window.localStorage.removeItem("cleanbot");
      } else {
        window.localStorage.setItem("cleanbot", originalValue);
      }
    }, originalCleanbot);
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

  const popupImmediateClose = await assertPopupImmediateClosePersistence(
    context,
    worker,
    extensionId
  );
  await page.bringToFront();
  await setExtensionOptions(worker, onOptions);
  await page.waitForTimeout(1500);

  if (process.env.CHZZK_VERIFY_LOCAL_ONLY === "1") {
    const localOnlyNetworkAudit = await createLocalOnlyChatNetworkAudit(context, page);
    const guestChatToggle = await assertGuestChatComposerToggleFlow(page, localOnlyNetworkAudit);
    const verifiedLiveUrl = page.url();

    await localOnlyNetworkAudit.dispose();
    await browser.close();
    console.log(JSON.stringify({
      ok: true,
      liveUrl: verifiedLiveUrl,
      localOnlyChat: guestChatToggle.localOnlyChat,
      screenshot: "output/playwright/chzzk-live-guest-chat-on.png"
    }, null, 2));
    return;
  }

  const before = await waitForRoleCoverage(page);
  assertSummary("initial on state", before.summary);
  assertOnState(before.summary);
  assertChatBoxesOn("initial on state", before.summary);
  assertChatBoxColor("initial on state", before.summary, DEFAULT_CHAT_BOX_COLOR);
  const headerButtonsBefore = await collectHeaderButtonPlacement(page);
  assertHeaderButtonsInChatHeader("initial header button placement", headerButtonsBefore);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-on-before.png"), fullPage: false });

  const localOnlyNetworkAudit = await createLocalOnlyChatNetworkAudit(context, page);
  const guestChatToggle = await assertGuestChatComposerToggleFlow(page, localOnlyNetworkAudit);
  const directGuestMarker = await assertDirectGuestMarkerProtection(context, page);

  await setExtensionOptions(worker, {
    ...onOptions,
    useMiniFloatingChat: true,
    miniFloatingChatBounds: {
      left: null,
      top: null,
      width: 360,
      height: 520
    },
    miniFloatingChatScale: 100
  });
  const miniChatDefaultPosition = await collectMiniChatDefaultPosition(page);
  assertMiniChatDefaultPosition("mini chat default position", miniChatDefaultPosition);
  const miniChatFrame = await waitForMiniChatFrameState(page);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "chzzk-live-mini-chat-default-position.png"),
    fullPage: false
  });
  await setExtensionOptions(worker, onOptions);
  await page.waitForTimeout(500);

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

  const nativeTimestampProbe = await collectSyntheticRowRegressionState(page, {
    includeNativeTimestamp: true
  });
  assertSyntheticNativeTimestamp("synthetic native timestamp state", nativeTimestampProbe);

  await setExtensionOptions(worker, {
    ...onOptions,
    useAutoTextContrast: true,
    useChatTextColor: false,
    useNicknameColorForMessage: false
  });
  await page.waitForTimeout(500);
  const standaloneAutoContrastProbe = await collectSyntheticRowRegressionState(page, {
    useLowContrastMessage: true
  });
  assertSyntheticStandaloneAutoContrast(
    "synthetic standalone auto-contrast state",
    standaloneAutoContrastProbe
  );
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
  assertChatBoxesOn("large-text color state", largeTextColor.summary, {
    requireWidthVariation: false
  });
  assertLargeTextOn(
    "large-text color state",
    largeTextColor.summary,
    largeTextColorOptions.chatFontSizePt,
    largeTextColorOptions.nicknameFontSizePt
  );
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
  await localOnlyNetworkAudit.dispose();
  await browser.close();

  console.log(
    JSON.stringify(
      {
        ok: true,
        liveUrl: page.url(),
        extensionId,
        screenshots: [
          "output/playwright/chzzk-live-on-before.png",
          "output/playwright/chzzk-live-guest-chat-on.png",
          "output/playwright/chzzk-live-mini-chat-default-position.png",
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
          headerButtonsBefore,
          guestChatToggle,
          directGuestMarker,
          miniChatDefaultPosition,
          miniChatFrame,
          popupImmediateClose,
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
        nativeTimestampProbe,
        standaloneAutoContrastProbe,
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
