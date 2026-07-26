const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { after, before, test } = require("node:test");
const vm = require("node:vm");
const { chromium } = require("playwright-core");

const REPO_ROOT = path.resolve(__dirname, "..");
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "manifest.json"), "utf8")
);
const CONTENT_SCRIPT_PATHS = MANIFEST.content_scripts[0].js.map((file) =>
  path.join(REPO_ROOT, file)
);
const CONTENT_STYLE_PATH = path.join(REPO_ROOT, MANIFEST.content_scripts[0].css[0]);
const BACKGROUND_SCRIPT_PATH = path.join(REPO_ROOT, MANIFEST.background.service_worker);
const POPUP_HTML_PATH = path.join(REPO_ROOT, MANIFEST.action.default_popup);
const POPUP_STYLE_PATH = path.join(REPO_ROOT, "popup.css");
const POPUP_SCRIPT_PATH = path.join(REPO_ROOT, "popup.js");
const STORAGE_KEY = "chzzkChatUiToggleOptions";
const PRESET_STORAGE_KEY = "chzzkChatUiToggleCustomPreset";
const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
const UPDATE_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_UPDATE_OPTIONS";
const LIVE_URL = `https://chzzk.naver.com/live/${"a".repeat(32)}`;
const GUEST_CHAT_URL = `${LIVE_URL}/chat?chzzkChatUiToggleGuest=1`;
const MINI_CHAT_URL = `${LIVE_URL}/chat?chzzkChatUiToggleMini=1`;
const LOCAL_ONLY_CHAT_FIELD_ATTR = "data-chzzk-chat-ui-toggle-local-only-field";
const LOCAL_ONLY_CHAT_ORIGINAL_FIELD_ATTR = "data-chzzk-chat-ui-toggle-local-only-original-field";
const LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR = "data-chzzk-chat-ui-toggle-local-only-send-button";
const LOCAL_ONLY_CHAT_ROW_ATTR = "data-chzzk-chat-ui-toggle-local-only-row";
const GUEST_CHAT_TOGGLE_BUTTON_ID = "chzzk-chat-ui-toggle-guest-chat-toggle";

let browser;

function resolveEdgeExecutable() {
  const candidates = [
    process.env.EDGE_PATH,
    process.env["PROGRAMFILES(X86)"] &&
      path.join(process.env["PROGRAMFILES(X86)"], "Microsoft", "Edge", "Application", "msedge.exe"),
    process.env.PROGRAMFILES &&
      path.join(process.env.PROGRAMFILES, "Microsoft", "Edge", "Application", "msedge.exe"),
    process.env.LOCALAPPDATA &&
      path.join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "Application", "msedge.exe")
  ].filter(Boolean);

  const executablePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!executablePath) {
    throw new Error(
      `설치된 Microsoft Edge를 찾지 못했습니다. 확인한 경로: ${candidates.join(", ")}`
    );
  }

  return executablePath;
}

function createChatDocument(message = "안녕하세요", { nativeTimestamp = null } = {}) {
  return `<!doctype html>
<html lang="ko">
  <head><meta charset="utf-8"><title>CHZZK content-script regression fixture</title></head>
  <body>
    <aside id="aside-chatting">
      <div class="live_chatting_list" role="log">
        <div id="chat-row" class="live_chatting_list_item">
          ${nativeTimestamp ? `<span id="native-timestamp" class="live_chatting_message_time">${nativeTimestamp}</span>` : ""}
          <button type="button" class="live_chatting_message_nickname">
            <span id="nickname" class="live_chatting_username_nickname">테스터</span>
          </button>
          <div class="live_chatting_message_container">
            <span id="message" class="live_chatting_message_text">${message}</span>
          </div>
        </div>
      </div>
    </aside>
  </body>
</html>`;
}

function createLocalOnlyChatDocument() {
  const createRow = (id, nickname, message) => `
    <div id="${id}" class="_item_fixture_7">
      <div class="_container_fixture_1">
        <div class="_chatting_message_fixture_21">
          <button type="button" class="_nickname_fixture_37">
            <span class="_nickname_shell_fixture_57"><span class="_text_fixture_2">${nickname}</span></span>
          </button>
          <span class="_text_fixture_1">${message}</span>
        </div>
      </div>
    </div>`;

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>CHZZK local-only chat fixture</title>
    <style>
      ._wrapper_log_fixture {
        display: flex;
        flex-direction: column-reverse;
        height: 180px;
        max-height: 180px;
        overflow-y: auto;
      }
      ._wrapper_log_fixture > * {
        flex: 0 0 auto;
        min-height: 30px;
      }
      ._input_fixture_59 {
        box-sizing: border-box;
        width: 360px;
      }
      ._tools_fixture_125 {
        display: flex;
        align-items: center;
        width: 420px;
        height: 48px;
      }
      ._send_button_fixture_176 {
        width: 64px;
        height: 40px;
      }
    </style>
  </head>
  <body>
    <aside id="aside-chatting">
      <header class="_header_fixture">채팅</header>
      <div class="_container_log_fixture" role="log">
        <div class="_wrapper_log_fixture">
          ${createRow("remote-row-1", "시청자1", "원본 채팅 1")}
          ${createRow("remote-row-2", "시청자2", "원본 채팅 2")}
        </div>
      </div>
      <form id="native-chat-form" class="_area_fixture_49">
        <div class="_container_input_fixture_2">
          <textarea
            id="native-chat-input"
            class="_input_fixture_59 _default_fixture_77 _not_login_fixture_81"
            onkeydown="window.__inlineSiteSendAttempts = (window.__inlineSiteSendAttempts || 0) + 1"
            placeholder="채팅에 참여하려면 로그인 해주세요"
            style="height: 40px !important;"
          ></textarea>
          <button type="button" class="_input_button_fixture_90">이모티콘</button>
        </div>
        <div class="_tools_fixture_125">
          <button type="button" class="_donation_fixture_137">후원하기</button>
          <button id="native-send-button" type="submit" class="_send_button_fixture_176" onclick="window.__inlineSiteSendAttempts = (window.__inlineSiteSendAttempts || 0) + 1" disabled>채팅</button>
        </div>
      </form>
    </aside>
  </body>
</html>`;
}

function createMiniChatDocument() {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>CHZZK mini chat transparency fixture</title>
    <style>
      html,
      body,
      #mini-app-root,
      #mini-chat-shell,
      #mini-log-shell,
      #mini-chat-log {
        background: rgb(249, 250, 251);
      }
      html,
      body,
      #mini-app-root,
      #aside-chatting,
      #mini-chat-shell {
        width: 100%;
        height: 100%;
        margin: 0;
      }
      #mini-chat-shell {
        display: flex;
        flex-direction: column;
      }
      #mini-native-header {
        display: flex;
        flex: 0 0 58px;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        background: rgb(255, 255, 255);
      }
      #mini-native-header strong {
        margin-right: auto;
      }
      #mini-log-shell {
        display: flex;
        flex: 1 1 auto;
        min-height: 0;
      }
      #mini-chat-log {
        flex: 1 1 auto;
        min-height: 0;
      }
      #mini-chat-row {
        background: rgb(217, 222, 228);
      }
      #mini-system-notice {
        background: rgb(238, 240, 243);
      }
      #mini-input-surface {
        flex: 0 0 auto;
        padding: 12px 0;
        background: rgb(255, 255, 255);
      }
      #mini-native-input {
        flex: 0 0 72px;
        padding: 10px;
        background: rgb(229, 232, 236);
      }
      #mini-native-input button {
        flex: 0 0 32px;
        width: 32px;
        height: 32px;
        padding: 0;
        position: relative;
        top: 8px;
      }
      #mini-native-input button img {
        width: 20px;
        height: 20px;
      }
      #mini-chat-input {
        flex: 1 1 auto;
        min-width: 0;
        width: auto;
        height: 40px;
      }
    </style>
  </head>
  <body>
    <div id="mini-app-root">
      <aside id="aside-chatting">
        <section id="mini-header-decoy" class="_header_notice_fixture_12">
          <strong>채팅 랭킹</strong>
          <button type="button">주간</button>
          <button type="button">닫기</button>
        </section>
        <header id="mini-native-header" class="_header_fixture_42">
          <strong>채팅</strong>
          <button type="button">−</button>
          <span>100%</span>
          <button type="button">+</button>
          <button type="button" aria-label="채팅 설정">⋮</button>
        </header>
        <div id="mini-chat-shell">
          <div id="mini-log-shell">
            <div id="mini-chat-log" role="log">
              <div id="mini-chat-row" class="_item_fixture_7">
                <div class="_chatting_message_fixture_21">
                  <span id="mini-native-timestamp" class="_time_fixture_3">22:05</span>
                  <button type="button" class="_nickname_fixture_37">
                    <img id="mini-badge" class="_badge_fixture_8" alt="배지" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
                    <span id="mini-nickname" class="_text_fixture_2">테스터</span>
                  </button>
                  <span id="mini-message" class="_text_fixture_1">투명 미니 채팅</span>
                </div>
              </div>
              <div id="mini-system-notice">안내 메시지</div>
            </div>
          </div>
          <div id="mini-input-surface">
            <form id="mini-native-input">
              <button id="mini-profile-button" class="_setting_button_fixture_9" type="button" aria-label="프로필">
                <img id="mini-profile-image" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
              </button>
              <textarea id="mini-chat-input" placeholder="채팅을 입력해주세요"></textarea>
              <button id="mini-emoji-button" class="_emoji_button_fixture_5" type="button" aria-label="이모티콘">
                <img id="mini-emoji-image" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
              </button>
            </form>
          </div>
        </div>
      </aside>
    </div>
  </body>
</html>`;
}

async function createHarness({
  html = createChatDocument(),
  initialOptions = {},
  storageGetDelayMs = 0,
  initialStorageChange = null,
  storageSetDelays = [],
  optionsUpdateResponseDelays = [],
  storageEventsAfterCallbacks = false
} = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const pageErrors = [];
  const requests = [];

  page.on("pageerror", (error) => pageErrors.push(error));

  await context.route("**/*", async (route) => {
    const request = route.request();
    requests.push({ type: request.resourceType(), url: request.url() });

    if (request.resourceType() === "document") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: html
      });
      return;
    }

    await route.abort("blockedbyclient");
  });

  await page.addInitScript(
    ({
      options,
      getDelayMs,
      firstStorageChange,
      setDelays,
      responseDelays,
      storageKey,
      readOptionsMessage,
      updateOptionsMessage,
      eventsAfterCallbacks
    }) => {
      const clone = (value) => JSON.parse(JSON.stringify(value));
      const storageListeners = [];
      const messageListeners = [];
      const store = { [storageKey]: clone(options) };
      let optionsUpdateQueue = Promise.resolve();
      let optionsUpdateIndex = 0;
      const state = {
        appliedScalesAfterEvents: [],
        committed: [],
        pending: 0,
        requested: [],
        store,
        resetLogs() {
          this.appliedScalesAfterEvents.length = 0;
          this.committed.length = 0;
          this.requested.length = 0;
        },
        failNextOptionsUpdate(delayMs = 0) {
          this.nextOptionsUpdateFailureDelay = Math.max(0, Number(delayMs) || 0);
        },
        delayNextOptionsRead(delayMs = 0) {
          this.nextOptionsReadDelay = Math.max(0, Number(delayMs) || 0);
        },
        emitOptionsChange(nextOptions) {
          const oldValue = clone(store[storageKey]);
          const newValue = clone(nextOptions);

          store[storageKey] = newValue;
          for (const listener of [...storageListeners]) {
            listener({
              [storageKey]: { oldValue, newValue: clone(newValue) }
            }, "local");
          }
        }
      };

      const getResult = (keys) => {
        if (typeof keys === "string") {
          return Object.prototype.hasOwnProperty.call(store, keys)
            ? { [keys]: clone(store[keys]) }
            : {};
        }

        if (Array.isArray(keys)) {
          return Object.fromEntries(
            keys
              .filter((key) => Object.prototype.hasOwnProperty.call(store, key))
              .map((key) => [key, clone(store[key])])
          );
        }

        if (keys && typeof keys === "object") {
          return Object.fromEntries(
            Object.entries(keys).map(([key, fallback]) => [
              key,
              Object.prototype.hasOwnProperty.call(store, key) ? clone(store[key]) : fallback
            ])
          );
        }

        return clone(store);
      };

      const chromeMock = {
        runtime: {
          lastError: null,
          onMessage: {
            addListener(listener) {
              messageListeners.push(listener);
            },
            hasListener(listener) {
              return messageListeners.includes(listener);
            },
            removeListener(listener) {
              const index = messageListeners.indexOf(listener);
              if (index >= 0) messageListeners.splice(index, 1);
            }
          },
          sendMessage(message, callback) {
            if (message?.type === readOptionsMessage) {
              optionsUpdateQueue.then(() => {
                const found = Object.prototype.hasOwnProperty.call(store, storageKey);
                const optionsAtRead = clone(store[storageKey] || {});
                const delay = state.nextOptionsReadDelay;

                state.nextOptionsReadDelay = 0;
                window.setTimeout(() => {
                  callback?.({
                    ok: true,
                    found,
                    options: optionsAtRead
                  });
                }, delay);
              });
              return;
            }

            if (message?.type === updateOptionsMessage) {
              const updateIndex = optionsUpdateIndex;
              optionsUpdateIndex += 1;
              optionsUpdateQueue = optionsUpdateQueue.then(() => new Promise((resolveUpdate) => {
                if (state.nextOptionsUpdateFailureDelay !== null) {
                  const delay = state.nextOptionsUpdateFailureDelay;

                  state.nextOptionsUpdateFailureDelay = null;
                  window.setTimeout(() => {
                    callback?.({ ok: false, error: "forced-options-update-failure" });
                    resolveUpdate();
                  }, delay);
                  return;
                }

                const current = clone(store[storageKey] || {});
                const update = message.patch;
                const nextOptions = { ...current, ...clone(update || {}) };

                chromeMock.storage.local.set({ [storageKey]: nextOptions }, () => {
                  const responseOptions = clone(store[storageKey]);
                  const responseDelay = Math.max(0, Number(responseDelays[updateIndex] ?? 0));

                  window.setTimeout(() => {
                    callback?.({ ok: true, options: responseOptions });
                  }, responseDelay);
                  resolveUpdate();
                });
              }));
              return;
            }

            window.setTimeout(() => callback?.({ ok: false, error: "test-background-disabled" }), 0);
          }
        },
        storage: {
          local: {
            get(keys, callback) {
              const result = getResult(keys);

              window.setTimeout(() => callback(result), Math.max(0, Number(getDelayMs) || 0));
            },
            set(items, callback) {
              const requestIndex = state.requested.length;
              const requestedOptions = items[storageKey] ? clone(items[storageKey]) : null;
              const delay = Number(setDelays[requestIndex] ?? 0);

              state.requested.push({
                index: requestIndex,
                scale: requestedOptions?.miniFloatingChatScale ?? null,
                useNicknameFontSize: requestedOptions?.useNicknameFontSize ?? null,
                nicknameFontSizePt: requestedOptions?.nicknameFontSizePt ?? null
              });
              state.pending += 1;

              window.setTimeout(() => {
                const changes = {};

                for (const [key, value] of Object.entries(items)) {
                  const oldValue = Object.prototype.hasOwnProperty.call(store, key)
                    ? clone(store[key])
                    : undefined;
                  store[key] = clone(value);
                  changes[key] = { oldValue, newValue: clone(value) };
                }

                state.committed.push({
                  index: requestIndex,
                  scale: store[storageKey]?.miniFloatingChatScale ?? null
                });
                state.pending -= 1;

                const notifyStorageListeners = () => {
                  for (const listener of [...storageListeners]) {
                    listener(changes, "local");
                  }

                  state.appliedScalesAfterEvents.push(
                    Number(document.documentElement.dataset.chzzkChatUiToggleMiniFloatingChatScale)
                  );
                };

                if (eventsAfterCallbacks) {
                  callback?.();
                  window.setTimeout(notifyStorageListeners, 0);
                } else {
                  notifyStorageListeners();
                  callback?.();
                }
              }, Math.max(0, delay));
            }
          },
          onChanged: {
            addListener(listener) {
              storageListeners.push(listener);
            },
            hasListener(listener) {
              return storageListeners.includes(listener);
            },
            removeListener(listener) {
              const index = storageListeners.indexOf(listener);
              if (index >= 0) storageListeners.splice(index, 1);
            }
          }
        }
      };

      const chromeTarget = globalThis.chrome || {};
      chromeTarget.runtime = chromeMock.runtime;
      chromeTarget.storage = chromeMock.storage;
      globalThis.chrome = chromeTarget;
      globalThis.__storageHarness = state;
      globalThis.__initialStorageChange = firstStorageChange;
      state.nextOptionsUpdateFailureDelay = null;
      state.nextOptionsReadDelay = 0;
    },
    {
      options: initialOptions,
      getDelayMs: storageGetDelayMs,
      firstStorageChange: initialStorageChange,
      setDelays: storageSetDelays,
      responseDelays: optionsUpdateResponseDelays,
      storageKey: STORAGE_KEY,
      readOptionsMessage: READ_OPTIONS_MESSAGE,
      updateOptionsMessage: UPDATE_OPTIONS_MESSAGE,
      eventsAfterCallbacks: storageEventsAfterCallbacks
    }
  );

  await page.goto(LIVE_URL, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ path: CONTENT_STYLE_PATH });

  for (const scriptPath of CONTENT_SCRIPT_PATHS) {
    await page.addScriptTag({ path: scriptPath });
  }

  if (initialStorageChange) {
    await page.evaluate(() => {
      window.__storageHarness.emitOptionsChange(window.__initialStorageChange);
    });
  }

  await page.waitForFunction(() =>
    document.documentElement.dataset.chzzkChatUiToggleReady === "true"
  );

  return {
    context,
    page,
    pageErrors,
    requests,
    async close() {
      await context.close();
    }
  };
}

async function createPopupHarness({ initialOptions = {}, customPreset = null } = {}) {
  const context = await browser.newContext({ viewport: { width: 460, height: 760 } });
  const page = await context.newPage();
  const pageErrors = [];

  page.on("pageerror", (error) => pageErrors.push(error));

  await context.route("https://popup.test/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname === "/popup.js") {
      await route.fulfill({
        status: 200,
        contentType: "text/javascript; charset=utf-8",
        body: fs.readFileSync(POPUP_SCRIPT_PATH, "utf8")
      });
      return;
    }

    if (pathname === "/popup.css") {
      await route.fulfill({
        status: 200,
        contentType: "text/css; charset=utf-8",
        body: fs.readFileSync(POPUP_STYLE_PATH, "utf8")
      });
      return;
    }

    if (pathname === "/popup.html" || pathname === "/") {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: fs.readFileSync(POPUP_HTML_PATH, "utf8")
      });
      return;
    }

    await route.abort("blockedbyclient");
  });

  await page.addInitScript(
    ({ options, preset, storageKey, presetStorageKey, readOptionsMessage, updateOptionsMessage }) => {
      const clone = (value) => JSON.parse(JSON.stringify(value));
      const store = { [storageKey]: clone(options) };

      if (preset) {
        store[presetStorageKey] = clone(preset);
      }

      const state = {
        store,
        writes: []
      };

      const getResult = (keys) => {
        if (typeof keys === "string") {
          return Object.prototype.hasOwnProperty.call(store, keys)
            ? { [keys]: clone(store[keys]) }
            : {};
        }

        if (Array.isArray(keys)) {
          return Object.fromEntries(
            keys
              .filter((key) => Object.prototype.hasOwnProperty.call(store, key))
              .map((key) => [key, clone(store[key])])
          );
        }

        return clone(store);
      };

      globalThis.chrome = {
        runtime: {
          lastError: null,
          sendMessage(message, callback) {
            if (message?.type === readOptionsMessage) {
              window.setTimeout(() => callback?.({
                ok: true,
                found: true,
                options: clone(store[storageKey])
              }), 0);
              return;
            }

            if (message?.type === updateOptionsMessage) {
              const nextOptions = {
                ...clone(store[storageKey]),
                ...clone(message.patch || {})
              };

              store[storageKey] = nextOptions;
              state.writes.push({ key: storageKey, value: clone(nextOptions) });
              window.setTimeout(() => callback?.({ ok: true, options: clone(nextOptions) }), 0);
              return;
            }

            window.setTimeout(() => callback?.(null), 0);
          }
        },
        storage: {
          local: {
            get(keys, callback) {
              window.setTimeout(() => callback(getResult(keys)), 0);
            },
            set(items, callback) {
              for (const [key, value] of Object.entries(items)) {
                store[key] = clone(value);
                state.writes.push({ key, value: clone(value) });
              }

              window.setTimeout(() => callback?.(), 0);
            }
          }
        },
        tabs: {
          query(_query, callback) {
            callback([{ id: 1, url: "https://example.test/" }]);
          },
          sendMessage(_tabId, _message, _options, callback) {
            const response = typeof _options === "function" ? _options : callback;
            response?.(null);
          }
        }
      };
      globalThis.__popupHarness = state;
    },
    {
      options: initialOptions,
      preset: customPreset,
      storageKey: STORAGE_KEY,
      presetStorageKey: PRESET_STORAGE_KEY,
      readOptionsMessage: READ_OPTIONS_MESSAGE,
      updateOptionsMessage: UPDATE_OPTIONS_MESSAGE
    }
  );

  await page.goto("https://popup.test/popup.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() =>
    document.querySelector("[data-view='home']")?.classList.contains("view--active") &&
    document.getElementById("statusLabel")?.textContent === "치지직 탭 아님"
  );

  return {
    context,
    page,
    pageErrors,
    async close() {
      await context.close();
    }
  };
}

async function setPopupChatWindowSettings(page, mode, fullscreenOnly) {
  await page.evaluate(({ nextMode, nextFullscreenOnly }) => {
    const radio = document.querySelector(`input[name="chatMode"][value="${nextMode}"]`);
    const fullscreen = document.querySelector('[data-option="miniFloatingChatFullscreenOnly"]');

    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    fullscreen.checked = nextFullscreenOnly;
    fullscreen.dispatchEvent(new Event("change", { bubbles: true }));
  }, { nextMode: mode, nextFullscreenOnly: fullscreenOnly });

  await page.waitForFunction(
    ({ storageKey, nextMode, nextFullscreenOnly }) => {
      const options = window.__popupHarness.store[storageKey];
      const currentMode = options.useMiniFloatingChat
        ? "mini"
        : options.useGuestChatFrame
          ? "guest"
          : "default";

      return currentMode === nextMode &&
        (options.miniFloatingChatFullscreenOnly === true) === nextFullscreenOnly;
    },
    { storageKey: STORAGE_KEY, nextMode: mode, nextFullscreenOnly: fullscreenOnly }
  );
}

async function readFixtureGuestChatTogglePlacement(target) {
  return target.evaluate(({ buttonId, localSendButtonAttr }) => {
    const button = document.getElementById(buttonId);
    const localSendButton = document.querySelector(`[${localSendButtonAttr}="true"]`);
    const originalSendButton = document.getElementById("native-send-button");
    const sendButton = localSendButton || originalSendButton;
    const buttonRect = button?.getBoundingClientRect();
    const sendButtonRect = sendButton?.getBoundingClientRect();
    const header = document.querySelector("header");

    return {
      ariaPressed: button?.getAttribute("aria-pressed") || null,
      buttonCount: document.querySelectorAll(`#${buttonId}`).length,
      buttonType: button?.getAttribute("type") || null,
      centerDifference: buttonRect && sendButtonRect
        ? Math.abs(
            buttonRect.top + buttonRect.height / 2 -
            (sendButtonRect.top + sendButtonRect.height / 2)
          )
        : null,
      gap: buttonRect && sendButtonRect ? sendButtonRect.left - buttonRect.right : null,
      insideForm: Boolean(button?.closest("form")),
      insideHeader: Boolean(button && header?.contains(button)),
      localSendButtonCount: document.querySelectorAll(`[${localSendButtonAttr}="true"]`).length,
      nextIsSendButton: button?.nextElementSibling === sendButton,
      sameParent: Boolean(button && sendButton && button.parentElement === sendButton.parentElement),
      sendButtonIsLocal: sendButton === localSendButton,
      sendButtonNextIsOriginal: localSendButton?.nextElementSibling === originalSendButton
    };
  }, {
    buttonId: GUEST_CHAT_TOGGLE_BUTTON_ID,
    localSendButtonAttr: LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR
  });
}

async function injectContentScripts(target) {
  await target.addStyleTag({ path: CONTENT_STYLE_PATH });

  for (const scriptPath of CONTENT_SCRIPT_PATHS) {
    await target.addScriptTag({ path: scriptPath });
  }

  await target.waitForFunction(() =>
    document.documentElement.dataset.chzzkChatUiToggleReady === "true"
  );
}

async function createLocalOnlyChatHarness({ recordLocalOnlyInputEvents = false } = {}) {
  const harness = await createHarness({
    html: createLocalOnlyChatDocument(),
    initialOptions: { useGuestChatFrame: false }
  });

  await harness.page.evaluate((guestChatUrl) => {
    const iframe = document.createElement("iframe");

    iframe.id = "guest-chat-test-frame";
    iframe.src = guestChatUrl;
    iframe.setAttribute("credentialless", "");
    iframe.credentialless = true;
    document.body.append(iframe);
  }, GUEST_CHAT_URL);

  const deadline = Date.now() + 5_000;
  let frame = null;

  while (Date.now() < deadline) {
    frame = harness.page.frames().find((candidate) => candidate.url() === GUEST_CHAT_URL) || null;

    if (frame) {
      break;
    }

    await harness.page.waitForTimeout(25);
  }

  assert.ok(frame, "credentialless guest-chat fixture frame을 찾을 수 있어야 합니다");
  const credentiallessState = await frame.evaluate(async () => ({
    attribute: window.frameElement?.hasAttribute("credentialless") === true,
    property: window.frameElement?.credentialless === true,
    tagName: window.frameElement?.tagName || null,
    hasStorageAccess: typeof document.hasStorageAccess === "function"
      ? await document.hasStorageAccess()
      : null
  }));
  assert.deepEqual(credentiallessState, {
    attribute: true,
    property: true,
    tagName: "IFRAME",
    hasStorageAccess: false
  });

  if (recordLocalOnlyInputEvents) {
    await frame.evaluate((fieldAttr) => {
      window.__localOnlyInputEvents = [];

      for (const eventType of [
        "beforeinput",
        "compositionend",
        "compositionstart",
        "compositionupdate",
        "input",
        "keydown",
        "keyup"
      ]) {
        window.addEventListener(eventType, (event) => {
          if (!event.composedPath().some(
            (node) => node instanceof HTMLElement && node.hasAttribute(fieldAttr)
          )) {
            return;
          }

          window.__localOnlyInputEvents.push({
            inputType: event.inputType || "",
            isComposing: event.isComposing === true,
            isTrusted: event.isTrusted,
            key: event.key || "",
            type: event.type
          });
        }, true);
      }
    }, LOCAL_ONLY_CHAT_FIELD_ATTR);
  }

  await injectContentScripts(frame);
  await frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`).waitFor({ state: "visible" });

  return {
    ...harness,
    frame,
    async reloadGuestFrame() {
      await frame.goto(GUEST_CHAT_URL, { waitUntil: "domcontentloaded" });
      await injectContentScripts(frame);
      await frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`).waitFor({ state: "visible" });
      return frame;
    }
  };
}

function createBackgroundHarness({ initialOptions = {}, storageSetDelays = [] } = {}) {
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const source = fs.readFileSync(BACKGROUND_SCRIPT_PATH, "utf8");
  const messageListeners = [];
  const store = { [STORAGE_KEY]: clone(initialOptions) };
  const writes = [];
  let writeIndex = 0;
  const chrome = {
    action: {
      openPopup() {
        return Promise.resolve();
      }
    },
    runtime: {
      lastError: null,
      onInstalled: { addListener() {} },
      onMessage: {
        addListener(listener) {
          messageListeners.push(listener);
        }
      }
    },
    storage: {
      local: {
        get(key, callback) {
          const result = Object.prototype.hasOwnProperty.call(store, key)
            ? { [key]: clone(store[key]) }
            : {};

          setTimeout(() => callback(result), 0);
        },
        set(items, callback) {
          const index = writeIndex;
          const delay = Number(storageSetDelays[index] ?? 0);

          writeIndex += 1;
          writes.push({ index, options: clone(items[STORAGE_KEY]) });
          setTimeout(() => {
            Object.assign(store, clone(items));
            callback?.();
          }, Math.max(0, delay));
        }
      }
    },
    tabs: {
      onRemoved: { addListener() {} },
      sendMessage(_tabId, _message, callback) {
        callback?.();
      }
    }
  };
  const context = vm.createContext({
    chrome,
    clearTimeout,
    console,
    setTimeout,
    URL
  });

  vm.runInContext(source, context, { filename: "background.js" });
  assert.equal(messageListeners.length, 1);

  return {
    store,
    writes,
    send(message) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("background response timeout")), 2_000);
        const returned = messageListeners[0](message, {}, (response) => {
          clearTimeout(timeout);
          resolve(clone(response));
        });

        if (returned !== true) {
          clearTimeout(timeout);
          reject(new Error(`background listener did not keep the response channel open: ${returned}`));
        }
      });
    }
  };
}

function assertNoPageErrors(pageErrors) {
  assert.deepEqual(
    pageErrors.map((error) => error.stack || error.message),
    [],
    "content script 실행 중 처리되지 않은 브라우저 오류가 없어야 합니다"
  );
}

function assertNonDecreasing(values, message) {
  for (let index = 1; index < values.length; index += 1) {
    assert.ok(values[index] >= values[index - 1], message);
  }
}

before(async () => {
  browser = await chromium.launch({
    executablePath: resolveEdgeExecutable(),
    headless: true
  });
});

after(async () => {
  await browser?.close();
});

test("style presets preserve every chat window selection", { timeout: 30_000 }, async () => {
  const harness = await createPopupHarness();
  const chatWindowScenarios = [
    { mode: "default", fullscreenOnly: false },
    { mode: "guest", fullscreenOnly: true },
    { mode: "mini", fullscreenOnly: true }
  ];
  const presetScenarios = [
    {
      id: "default",
      expected: {
        showNicknames: true,
        showBadges: true,
        showChatBoxes: true,
        showNonChatPanels: false
      }
    },
    {
      id: "clean",
      expected: {
        showNicknames: false,
        showBadges: false,
        showChatBoxes: true,
        showBoldText: true
      }
    },
    {
      id: "minimal",
      expected: {
        showNicknames: true,
        showBadges: false,
        showChatBoxes: false,
        showBoldText: false
      }
    }
  ];

  try {
    assert.equal(
      await harness.page.locator('[data-preset="default"]').textContent(),
      "정돈",
      "초기화의 기본값과 구분되도록 기본 스타일 프리셋은 정돈으로 표시되어야 합니다"
    );

    for (const chatWindow of chatWindowScenarios) {
      await setPopupChatWindowSettings(
        harness.page,
        chatWindow.mode,
        chatWindow.fullscreenOnly
      );

      for (const preset of presetScenarios) {
        await harness.page.locator(`[data-preset="${preset.id}"]`).click();
        await harness.page.waitForFunction(
          ({ storageKey, presetId, expected, mode, fullscreenOnly }) => {
            const options = window.__popupHarness.store[storageKey];
            const currentMode = options.useMiniFloatingChat
              ? "mini"
              : options.useGuestChatFrame
                ? "guest"
                : "default";
            const activePreset = document.querySelector("[data-preset].is-active")?.dataset.preset;

            return currentMode === mode &&
              (options.miniFloatingChatFullscreenOnly === true) === fullscreenOnly &&
              activePreset === presetId &&
              Object.entries(expected).every(([key, value]) =>
                document.querySelector(`[data-option="${key}"]`)?.checked === value
              );
          },
          {
            storageKey: STORAGE_KEY,
            presetId: preset.id,
            expected: preset.expected,
            mode: chatWindow.mode,
            fullscreenOnly: chatWindow.fullscreenOnly
          }
        );

        const result = await harness.page.evaluate((storageKey) => ({
          options: window.__popupHarness.store[storageKey],
          checkedMode: document.querySelector('input[name="chatMode"]:checked')?.value,
          fullscreenOnly: document.querySelector(
            '[data-option="miniFloatingChatFullscreenOnly"]'
          )?.checked,
          activePreset: document.querySelector("[data-preset].is-active")?.dataset.preset
        }), STORAGE_KEY);

        assert.equal(result.checkedMode, chatWindow.mode);
        assert.equal(result.fullscreenOnly, chatWindow.fullscreenOnly);
        assert.equal(result.activePreset, preset.id);
      }
    }

    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("custom preset save and load exclude chat window settings", { timeout: 20_000 }, async () => {
  const harness = await createPopupHarness({
    initialOptions: {
      useMiniFloatingChat: true,
      miniFloatingChatFullscreenOnly: true,
      showBadges: true
    }
  });

  try {
    await harness.page.evaluate(() => {
      const badges = document.querySelector('[data-option="showBadges"]');
      badges.checked = false;
      badges.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await harness.page.waitForFunction((storageKey) =>
      window.__popupHarness.store[storageKey].showBadges === false,
      STORAGE_KEY
    );

    await harness.page.locator("#saveCustomPresetButton").click();
    await harness.page.waitForFunction((presetStorageKey) =>
      window.__popupHarness.store[presetStorageKey]?.showBadges === false,
      PRESET_STORAGE_KEY
    );

    const savedPreset = await harness.page.evaluate(
      (presetStorageKey) => window.__popupHarness.store[presetStorageKey],
      PRESET_STORAGE_KEY
    );
    assert.equal(Object.hasOwn(savedPreset, "useGuestChatFrame"), false);
    assert.equal(Object.hasOwn(savedPreset, "useMiniFloatingChat"), false);
    assert.equal(Object.hasOwn(savedPreset, "miniFloatingChatFullscreenOnly"), false);
    assert.equal(savedPreset.showBadges, false);

    await setPopupChatWindowSettings(harness.page, "guest", false);
    assert.equal(
      await harness.page.locator('[data-preset="custom"]').evaluate((button) =>
        button.classList.contains("is-active")
      ),
      true
    );

    await harness.page.locator('[data-preset="default"]').click();
    await harness.page.waitForFunction((storageKey) =>
      window.__popupHarness.store[storageKey].showBadges === true,
      STORAGE_KEY
    );
    await harness.page.locator('[data-preset="custom"]').click();
    await harness.page.waitForFunction((storageKey) => {
      const options = window.__popupHarness.store[storageKey];
      return options.showBadges === false &&
        options.useGuestChatFrame === true &&
        options.useMiniFloatingChat === false &&
        options.miniFloatingChatFullscreenOnly === false;
    }, STORAGE_KEY);

    assert.equal(
      await harness.page.locator('input[name="chatMode"]:checked').getAttribute("value"),
      "guest"
    );
    assert.equal(
      await harness.page.locator('[data-preset="custom"]').evaluate((button) =>
        button.classList.contains("is-active")
      ),
      true
    );
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("legacy custom preset chat window values cannot replace the current selection", { timeout: 20_000 }, async () => {
  const harness = await createPopupHarness({
    initialOptions: {
      useGuestChatFrame: false,
      useMiniFloatingChat: true,
      miniFloatingChatFullscreenOnly: true
    },
    customPreset: {
      useGuestChatFrame: true,
      useMiniFloatingChat: false,
      miniFloatingChatFullscreenOnly: false,
      showBadges: false,
      showChatBoxes: false
    }
  });

  try {
    await harness.page.locator('[data-preset="custom"]').click();
    await harness.page.waitForFunction((storageKey) => {
      const options = window.__popupHarness.store[storageKey];
      return options.showBadges === false &&
        options.showChatBoxes === false &&
        options.useGuestChatFrame === false &&
        options.useMiniFloatingChat === true &&
        options.miniFloatingChatFullscreenOnly === true;
    }, STORAGE_KEY);

    assert.equal(
      await harness.page.locator('input[name="chatMode"]:checked').getAttribute("value"),
      "mini"
    );
    assert.equal(
      await harness.page.locator('[data-preset="custom"]').evaluate((button) =>
        button.classList.contains("is-active")
      ),
      true
    );
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("채팅 박스 불투명도는 기본 100%이고 옵션과 미리보기에 즉시 반영된다", { timeout: 20_000 }, async () => {
  const harness = await createPopupHarness({
    initialOptions: {
      showChatBoxes: true,
      chatBoxColor: "#808080"
    }
  });

  try {
    await harness.page.locator('[data-goto="style"]').click();
    const slider = harness.page.locator("#chatBoxOpacity");
    const output = harness.page.locator("#chatBoxOpacityValue");

    await slider.waitFor({ state: "visible" });
    assert.equal(await slider.inputValue(), "100");
    assert.equal(await output.textContent(), "100%");
    assert.equal(
      await harness.page.locator('#boxColorChips .color-chip[aria-label="#dfdfdf"]').evaluate((button) =>
        button.classList.contains("is-active")
      ),
      true
    );
    assert.equal(
      await harness.page.locator("#chatPreview").evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--preview-box").trim()
      ),
      "rgba(223, 223, 223, 1)"
    );

    await slider.evaluate((element) => {
      element.value = "35";
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.equal(await output.textContent(), "35%");
    assert.equal(
      await harness.page.locator("#chatPreview").evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--preview-box").trim()
      ),
      "rgba(223, 223, 223, 0.35)"
    );

    await slider.dispatchEvent("change");
    await harness.page.waitForFunction(
      (storageKey) => window.__popupHarness.store[storageKey]?.chatBoxOpacity === 35,
      STORAGE_KEY
    );

    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("나만 보기 전환 버튼은 기본·나만 보기 채팅의 전송 버튼 바로 왼쪽에만 표시된다", { timeout: 30_000 }, async () => {
  const harness = await createHarness({
    html: createLocalOnlyChatDocument(),
    initialOptions: {
      useGuestChatFrame: false,
      showGuestChatToggleButton: true
    }
  });

  try {
    const pageButton = harness.page.locator(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`);

    await pageButton.waitFor({ state: "visible" });

    const defaultPlacement = await readFixtureGuestChatTogglePlacement(harness.page);

    assert.equal(defaultPlacement.buttonCount, 1);
    assert.equal(defaultPlacement.buttonType, "button");
    assert.equal(defaultPlacement.ariaPressed, "false");
    assert.equal(defaultPlacement.insideForm, true);
    assert.equal(defaultPlacement.insideHeader, false);
    assert.equal(defaultPlacement.sameParent, true);
    assert.equal(defaultPlacement.nextIsSendButton, true);
    assert.equal(defaultPlacement.sendButtonIsLocal, false);
    assert.ok(defaultPlacement.gap >= 0 && defaultPlacement.gap <= 12);
    assert.ok(defaultPlacement.centerDifference <= 1);

    await harness.page.evaluate((storageKey) => {
      window.__storageHarness.emitOptionsChange({
        ...window.__storageHarness.store[storageKey],
        showGuestChatToggleButton: false
      });
    }, STORAGE_KEY);
    await harness.page.waitForFunction((buttonId) => !document.getElementById(buttonId), GUEST_CHAT_TOGGLE_BUTTON_ID);

    await harness.page.evaluate((storageKey) => {
      window.__storageHarness.emitOptionsChange({
        ...window.__storageHarness.store[storageKey],
        showGuestChatToggleButton: true
      });
    }, STORAGE_KEY);
    await pageButton.waitFor({ state: "visible" });

    await harness.page.evaluate(() => {
      window.__guestToggleSiteEvents = { nativeClick: 0, submit: 0 };
      document.getElementById("native-send-button").addEventListener("click", () => {
        window.__guestToggleSiteEvents.nativeClick += 1;
      });
      document.getElementById("native-chat-form").addEventListener("submit", (event) => {
        event.preventDefault();
        window.__guestToggleSiteEvents.submit += 1;
      });
    });

    await pageButton.click();
    await harness.page.waitForFunction((storageKey) =>
      window.__storageHarness.store[storageKey].useGuestChatFrame === true,
      STORAGE_KEY
    );
    assert.deepEqual(await harness.page.evaluate(() => window.__guestToggleSiteEvents), {
      nativeClick: 0,
      submit: 0
    });
    assert.equal(await harness.page.evaluate(() => window.__inlineSiteSendAttempts || 0), 0);

    const frameDeadline = Date.now() + 5_000;
    let guestFrame = null;

    while (Date.now() < frameDeadline) {
      guestFrame = harness.page.frames().find((frame) => {
        try {
          return new URL(frame.url()).searchParams.get("chzzkChatUiToggleGuest") === "1";
        } catch (_error) {
          return false;
        }
      }) || null;

      if (guestFrame) break;
      await harness.page.waitForTimeout(25);
    }

    assert.ok(guestFrame, "나만 보기 credentialless frame을 찾을 수 있어야 합니다.");
    await guestFrame.evaluate((storageKey) => {
      window.__storageHarness.store[storageKey] = {
        ...window.__storageHarness.store[storageKey],
        useGuestChatFrame: true,
        showGuestChatToggleButton: true
      };
    }, STORAGE_KEY);
    await injectContentScripts(guestFrame);
    await guestFrame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`).waitFor({ state: "visible" });
    await guestFrame.locator(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`).waitFor({ state: "visible" });

    const localOnlyPlacement = await readFixtureGuestChatTogglePlacement(guestFrame);

    assert.equal(localOnlyPlacement.buttonCount, 1);
    assert.equal(localOnlyPlacement.buttonType, "button");
    assert.equal(localOnlyPlacement.ariaPressed, "true");
    assert.equal(localOnlyPlacement.insideForm, true);
    assert.equal(localOnlyPlacement.insideHeader, false);
    assert.equal(localOnlyPlacement.sameParent, true);
    assert.equal(localOnlyPlacement.nextIsSendButton, true);
    assert.equal(localOnlyPlacement.sendButtonIsLocal, true);
    assert.equal(localOnlyPlacement.sendButtonNextIsOriginal, true);
    assert.equal(localOnlyPlacement.localSendButtonCount, 1);
    assert.ok(localOnlyPlacement.gap >= 0 && localOnlyPlacement.gap <= 12);
    assert.ok(localOnlyPlacement.centerDifference <= 1);

    await guestFrame.evaluate(() => {
      window.__guestToggleSiteEvents = { nativeClick: 0, submit: 0 };
      document.getElementById("native-send-button").addEventListener("click", () => {
        window.__guestToggleSiteEvents.nativeClick += 1;
      });
      document.getElementById("native-chat-form").addEventListener("submit", (event) => {
        event.preventDefault();
        window.__guestToggleSiteEvents.submit += 1;
      });
    });
    const requestCountBeforeFrameClick = harness.requests.length;

    await guestFrame.locator(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`).click();
    await guestFrame.waitForFunction((storageKey) =>
      window.__storageHarness.store[storageKey].useGuestChatFrame === false,
      STORAGE_KEY
    );
    await guestFrame.evaluate(() => {
      for (let index = 0; index < 10; index += 1) {
        syncGuestChatUi();
      }
    });

    const repeatedPlacement = await readFixtureGuestChatTogglePlacement(guestFrame);

    assert.equal(repeatedPlacement.buttonCount, 1);
    assert.equal(repeatedPlacement.localSendButtonCount, 1);
    assert.equal(repeatedPlacement.nextIsSendButton, true);
    assert.equal(repeatedPlacement.sendButtonNextIsOriginal, true);
    assert.deepEqual(await guestFrame.evaluate(() => window.__guestToggleSiteEvents), {
      nativeClick: 0,
      submit: 0
    });
    assert.equal(await guestFrame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`).count(), 0);
    assert.equal(harness.requests.length, requestCountBeforeFrameClick);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("나만 보는 채팅은 원본 수신 행을 보존하고 사이트 전송 경로 없이 같은 로그에만 추가한다", { timeout: 20_000 }, async () => {
  const harness = await createLocalOnlyChatHarness();

  try {
    const requestCountBeforeInput = harness.requests.length;
    const input = harness.frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`);

    const emptyComposerState = await input.evaluate((field) => ({
      clientHeight: field.clientHeight,
      overflowY: getComputedStyle(field).overflowY,
      placeholder: field.getAttribute("placeholder"),
      scrollHeight: field.scrollHeight
    }));
    assert.equal(emptyComposerState.placeholder, "나만 보는 채팅, 실제로 전송되지 않음");
    assert.equal(emptyComposerState.overflowY, "hidden");
    assert.ok(emptyComposerState.scrollHeight <= emptyComposerState.clientHeight + 1);

    await harness.frame.evaluate(({ fieldAttr, sendButtonAttr }) => {
      window.__siteSendAttempts = { click: 0, keydown: 0, submit: 0 };
      window.addEventListener("keydown", (event) => {
        if (event.composedPath().some((node) => node instanceof HTMLElement && node.hasAttribute(fieldAttr))) {
          window.__siteSendAttempts.keydown += 1;
        }
      }, true);
      window.addEventListener("click", (event) => {
        if (event.composedPath().some((node) => node instanceof HTMLElement && node.hasAttribute(sendButtonAttr))) {
          window.__siteSendAttempts.click += 1;
        }
      }, true);
      document.getElementById("native-chat-form").addEventListener("submit", (event) => {
        event.preventDefault();
        window.__siteSendAttempts.submit += 1;
      });
    }, {
      fieldAttr: LOCAL_ONLY_CHAT_FIELD_ATTR,
      sendButtonAttr: LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR
    });

    await input.fill("안녕 <img src=x onerror=alert(1)>");
    await input.press("Enter");

    const rows = harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`);
    assert.equal(await rows.count(), 1);
    assert.equal(
      await rows.first().locator("[data-chzzk-chat-ui-toggle-message-text='true']").textContent(),
      "안녕 <img src=x onerror=alert(1)>"
    );
    assert.equal(await rows.first().locator("img").count(), 0);
    assert.equal(await harness.frame.locator("#remote-row-1, #remote-row-2").count(), 2);
    assert.equal(
      await rows.first().evaluate((row) => row.closest("[role='log']") !== null),
      true
    );
    assert.equal(
      await rows.first().evaluate((row) => row.parentElement === document.getElementById("remote-row-2").parentElement),
      true
    );
    assert.equal(
      await harness.frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`).getAttribute("class"),
      await harness.frame.locator(`#native-chat-input`).getAttribute("class")
    );
    assert.equal(
      await harness.frame.locator(`#native-chat-input`).getAttribute(LOCAL_ONLY_CHAT_ORIGINAL_FIELD_ATTR),
      "true"
    );
    assert.deepEqual(
      await harness.frame.evaluate(() => window.__siteSendAttempts),
      { click: 0, keydown: 0, submit: 0 }
    );
    assert.equal(await harness.frame.evaluate(() => window.__inlineSiteSendAttempts || 0), 0);
    assert.equal(harness.requests.length, requestCountBeforeInput);

    await harness.frame.evaluate((localRowAttr) => {
      const source = document.getElementById("remote-row-1");
      const row = source.cloneNode(true);
      const firstNativeRow = [...source.parentElement.children].find(
        (candidate) => candidate.getAttribute(localRowAttr) !== "true"
      );

      row.id = "remote-row-3";
      row.removeAttribute("data-chzzk-chat-ui-toggle-chat-row");
      for (const timestamp of row.querySelectorAll("[data-chzzk-chat-ui-toggle-generated-timestamp]")) {
        timestamp.remove();
      }
      row.querySelector("[class*='_chatting_message_'] > [class*='_text_']").textContent = "원본 채팅 3";
      source.parentElement.insertBefore(row, firstNativeRow || null);
    }, LOCAL_ONLY_CHAT_ROW_ATTR);

    await harness.frame.waitForFunction(() => document.getElementById("remote-row-3") !== null);
    assert.equal(await harness.frame.locator("#remote-row-1, #remote-row-2, #remote-row-3").count(), 3);
    assert.equal(await rows.count(), 1);
    assert.equal(
      await rows.first().evaluate((row) => row.previousElementSibling?.id),
      "remote-row-3"
    );
    assert.equal(
      await rows.first().evaluate((row) => row.nextElementSibling?.id),
      "remote-row-1"
    );

    await harness.frame.evaluate((localRowAttr) => {
      const localRow = document.querySelector(`[${localRowAttr}="true"]`);
      const source = document.getElementById("remote-row-3");
      const remoteRow = source.cloneNode(true);

      window.__localOnlyRowBeforeRecovery = localRow;
      localRow.remove();
      remoteRow.id = "remote-row-4";
      remoteRow.removeAttribute(localRowAttr);
      source.parentElement.insertBefore(remoteRow, source.parentElement.firstElementChild);
    }, LOCAL_ONLY_CHAT_ROW_ATTR);

    await harness.frame.waitForFunction(
      (localRowAttr) => document.querySelectorAll(`[${localRowAttr}="true"]`).length === 1,
      LOCAL_ONLY_CHAT_ROW_ATTR
    );
    assert.equal(await harness.frame.locator("#remote-row-1, #remote-row-2, #remote-row-3, #remote-row-4").count(), 4);
    assert.deepEqual(
      await rows.first().evaluate((row, localRowAttr) => {
        const siblings = [...row.parentElement.children];
        const rowIndex = siblings.indexOf(row);

        return {
          newerRemoteIds: siblings
            .slice(0, rowIndex)
            .filter((candidate) => candidate.getAttribute(localRowAttr) !== "true")
            .map((candidate) => candidate.id),
          olderSiblingId: row.nextElementSibling?.id || null,
          sameNode: row === window.__localOnlyRowBeforeRecovery
        };
      }, LOCAL_ONLY_CHAT_ROW_ATTR),
      {
        newerRemoteIds: ["remote-row-4", "remote-row-3"],
        olderSiblingId: "remote-row-1",
        sameNode: true
      }
    );
    assert.equal(
      await rows.first().locator("[data-chzzk-chat-ui-toggle-message-text='true']").textContent(),
      "안녕 <img src=x onerror=alert(1)>"
    );
    assert.deepEqual(
      await harness.frame.evaluate(() => ["remote-row-1", "remote-row-2"].map((id) => {
        const row = document.getElementById(id);
        return row.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']")?.textContent || "";
      })),
      ["원본 채팅 1", "원본 채팅 2"]
    );

    await harness.frame.evaluate((localRowAttr) => {
      const outgoingOldestRow = document.getElementById("remote-row-2");
      const replacementWithSameSignature = outgoingOldestRow.cloneNode(true);
      const container = outgoingOldestRow.parentElement;

      replacementWithSameSignature.id = "remote-row-5";
      outgoingOldestRow.remove();
      const firstNativeRow = [...container.children].find(
        (candidate) => candidate.getAttribute(localRowAttr) !== "true"
      );
      container.insertBefore(replacementWithSameSignature, firstNativeRow || null);
    }, LOCAL_ONLY_CHAT_ROW_ATTR);
    await harness.frame.waitForFunction(() =>
      document.getElementById("remote-row-5") !== null &&
      document.getElementById("remote-row-2") === null
    );
    assert.deepEqual(
      await rows.first().evaluate((row, localRowAttr) => {
        const siblings = [...row.parentElement.children];
        const rowIndex = siblings.indexOf(row);

        return siblings
          .slice(0, rowIndex)
          .filter((candidate) => candidate.getAttribute(localRowAttr) !== "true")
          .map((candidate) => candidate.id);
      }, LOCAL_ONLY_CHAT_ROW_ATTR),
      ["remote-row-5", "remote-row-4", "remote-row-3"]
    );

    await harness.frame.evaluate((localRowAttr) => {
      const container = document.getElementById("remote-row-4").parentElement;
      const source = document.getElementById("remote-row-4");

      for (let index = 6; index <= 16; index += 1) {
        const remoteRow = source.cloneNode(true);
        const firstNativeRow = [...container.children].find(
          (candidate) => candidate.getAttribute(localRowAttr) !== "true"
        );

        remoteRow.id = `remote-row-${index}`;
        remoteRow.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']").textContent = `원본 채팅 ${index}`;
        container.insertBefore(remoteRow, firstNativeRow || null);
      }
    }, LOCAL_ONLY_CHAT_ROW_ATTR);
    await harness.frame.waitForFunction(() => document.getElementById("remote-row-16") !== null);
    const buriedState = await rows.first().evaluate((row, localRowAttr) => {
      const wrapper = row.parentElement;
      const rowRect = row.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const newestRemote = document.getElementById("remote-row-16");
      const siblings = [...wrapper.children];
      const rowIndex = siblings.indexOf(row);

      return {
        localHasLayoutBox: rowRect.width > 0 && rowRect.height > 0,
        localBuriedAboveViewport: rowRect.bottom <= wrapperRect.top + 1,
        newerRemoteCount: siblings
          .slice(0, rowIndex)
          .filter((candidate) => candidate.getAttribute(localRowAttr) !== "true")
          .length,
        newestRemoteAtLatestDomEdge: wrapper.firstElementChild === newestRemote
      };
    }, LOCAL_ONLY_CHAT_ROW_ATTR);
    assert.deepEqual(buriedState, {
      localHasLayoutBox: true,
      localBuriedAboveViewport: true,
      newerRemoteCount: 14,
      newestRemoteAtLatestDomEdge: true
    });
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("나만 보는 채팅은 반복 지문 한 건의 먼 위치를 수신 개수로 과대 계산하지 않는다", { timeout: 20_000 }, async () => {
  const harness = await createLocalOnlyChatHarness();

  try {
    const input = harness.frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`);

    await harness.frame.evaluate(() => {
      const newestRow = document.getElementById("remote-row-1");
      const secondRow = document.getElementById("remote-row-2");
      const container = newestRow.parentElement;
      const thirdRow = secondRow.cloneNode(true);
      const duplicateNewestSignatureRow = newestRow.cloneNode(true);
      const fifthRow = secondRow.cloneNode(true);

      thirdRow.id = "remote-row-repeat-third";
      thirdRow.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']").textContent =
        "반복 지문 사이 채팅";
      duplicateNewestSignatureRow.id = "remote-row-duplicate-newest-signature";
      fifthRow.id = "remote-row-repeat-fifth";
      fifthRow.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']").textContent =
        "반복 지문 뒤 채팅";
      container.append(thirdRow, duplicateNewestSignatureRow, fifthRow);
    });
    await harness.frame.waitForFunction(() =>
      document.getElementById("remote-row-repeat-fifth") !== null
    );

    await input.fill("반복 지문 계산 확인용 로컬 메시지");
    await input.press("Enter");
    const localRow = harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`);
    await localRow.waitFor({ state: "visible" });
    await localRow.evaluate((row) => {
      window.__repeatSignatureLocalRow = row;
    });

    await harness.frame.evaluate(() => {
      document.getElementById("remote-row-1")
        .querySelector("[data-chzzk-chat-ui-toggle-message-text='true']")
        .textContent = "재사용된 최신 실제 채팅";
    });
    await harness.frame.waitForFunction((localRowAttr) => {
      const row = document.querySelector(`[${localRowAttr}="true"]`);

      return Boolean(
        row &&
        row.previousElementSibling?.id === "remote-row-1" &&
        row.nextElementSibling?.id === "remote-row-2"
      );
    }, LOCAL_ONLY_CHAT_ROW_ATTR);
    assert.deepEqual(await localRow.evaluate((row, localRowAttr) => {
      const siblings = [...row.parentElement.children];
      const rowIndex = siblings.indexOf(row);

      return {
        newerRemoteIds: siblings
          .slice(0, rowIndex)
          .filter((candidate) => candidate.getAttribute(localRowAttr) !== "true")
          .map((candidate) => candidate.id),
        sameNode: row === window.__repeatSignatureLocalRow
      };
    }, LOCAL_ONLY_CHAT_ROW_ATTR), {
      newerRemoteIds: ["remote-row-1"],
      sameNode: true
    });
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("나만 보는 채팅은 가상 목록 밖의 서로 다른 시점 메시지를 재동기화해도 행을 왕복 이동하지 않는다", { timeout: 20_000 }, async () => {
  const harness = await createLocalOnlyChatHarness();

  try {
    const input = harness.frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`);

    await harness.frame.evaluate(() => {
      const outsideButton = document.createElement("button");

      outsideButton.id = "local-only-outside-focus-target";
      outsideButton.type = "button";
      outsideButton.textContent = "채팅 밖";
      document.body.append(outsideButton);
    });
    const outsideButton = harness.frame.locator("#local-only-outside-focus-target");
    const replaceOldestRemote = async (id, text) => {
      await harness.frame.evaluate(({ id: nextId, localRowAttr, text: nextText }) => {
        const container = document.getElementById("remote-row-1")?.parentElement ||
          document.querySelector("._wrapper_log_fixture");
        const nativeRows = [...container.children].filter(
          (candidate) => candidate.getAttribute(localRowAttr) !== "true"
        );
        const newestRemote = nativeRows[0];
        const oldestRemote = nativeRows.at(-1);
        const nextRemote = newestRemote.cloneNode(true);

        nextRemote.id = nextId;
        nextRemote.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']").textContent =
          nextText;
        oldestRemote.remove();
        const firstNativeRow = [...container.children].find(
          (candidate) => candidate.getAttribute(localRowAttr) !== "true"
        );
        container.insertBefore(nextRemote, firstNativeRow || null);
      }, { id, localRowAttr: LOCAL_ONLY_CHAT_ROW_ATTR, text });
      await harness.frame.waitForFunction((nextId) => document.getElementById(nextId) !== null, id);
    };

    await input.click();
    await input.fill("먼저 보낸 로컬 메시지");
    await input.press("Enter");
    await outsideButton.click();
    await replaceOldestRemote("remote-row-window-3", "가상 목록 실제 채팅 3");
    await harness.frame.waitForFunction(() =>
      window.localOnlyChatMessages?.length === 1 &&
      window.localOnlyChatMessages[0].newerRemoteCount === 1
    );

    await input.click();
    await input.fill("나중에 보낸 로컬 메시지");
    await input.press("Enter");
    await outsideButton.click();
    await replaceOldestRemote("remote-row-window-4", "가상 목록 실제 채팅 4");
    await harness.frame.waitForFunction(() =>
      window.localOnlyChatMessages?.length === 2 &&
      window.localOnlyChatMessages[0].newerRemoteCount === 2 &&
      window.localOnlyChatMessages[1].newerRemoteCount === 1
    );

    await harness.frame.evaluate((localRowAttr) => {
      window.observer.disconnect();
      const container = document.querySelector(`[${localRowAttr}="true"]`).parentElement;

      window.__olderEdgeLocalNodes = window.localOnlyChatMessages.map((message) => message.row);
      window.__olderEdgeOwnedMutationCount = 0;
      window.__olderEdgeMutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];

          if (changedNodes.some(
            (node) => node instanceof Element && node.getAttribute(localRowAttr) === "true"
          )) {
            window.__olderEdgeOwnedMutationCount += 1;
          }
        }
      });
      window.__olderEdgeMutationObserver.observe(container, { childList: true });
    }, LOCAL_ONLY_CHAT_ROW_ATTR);

    await replaceOldestRemote("remote-row-window-5", "가상 목록 실제 채팅 5");
    await harness.frame.evaluate(() => window.syncLocalOnlyChatRows());
    await harness.frame.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await harness.frame.evaluate(() => {
      window.__olderEdgeOwnedMutationCount = 0;
      window.syncLocalOnlyChatRows();
    });
    await harness.frame.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    assert.deepEqual(await harness.frame.evaluate((localRowAttr) => {
      const rows = [...document.querySelectorAll(`[${localRowAttr}="true"]`)];

      return {
        localMessageCounts: window.localOnlyChatMessages.map(
          (message) => message.newerRemoteCount
        ),
        localTextsNewestFirst: rows.map((row) =>
          row.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']")?.textContent || ""
        ),
        sameNodes: window.localOnlyChatMessages.every(
          (message, index) => message.row === window.__olderEdgeLocalNodes[index]
        ),
        secondSyncOwnedMutationCount: window.__olderEdgeOwnedMutationCount
      };
    }, LOCAL_ONLY_CHAT_ROW_ATTR), {
      localMessageCounts: [3, 2],
      localTextsNewestFirst: ["나중에 보낸 로컬 메시지", "먼저 보낸 로컬 메시지"],
      sameNodes: true,
      secondSyncOwnedMutationCount: 0
    });

    await harness.frame.evaluate(() => {
      window.__olderEdgeOriginalSync = window.syncLocalOnlyChatRows;
      window.__olderEdgeSyncCalls = 0;
      window.__olderEdgeSyncGuardTripped = false;
      window.syncLocalOnlyChatRows = (...args) => {
        window.__olderEdgeSyncCalls += 1;

        if (window.__olderEdgeSyncCalls > 25) {
          window.__olderEdgeSyncGuardTripped = true;
          window.observer.disconnect();
          return;
        }

        return window.__olderEdgeOriginalSync(...args);
      };
      window.__olderEdgeHeartbeat = 0;
      window.__olderEdgeHeartbeatTimer = window.setInterval(() => {
        window.__olderEdgeHeartbeat += 1;
      }, 10);
      window.observer.observe(document.body ?? document.documentElement, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });

    await harness.frame.evaluate((localRowAttr) => {
      const rows = [...document.querySelectorAll(`[${localRowAttr}="true"]`)];
      const newerLocalRow = rows[0];
      const olderLocalRow = rows[1];

      newerLocalRow.parentElement.append(newerLocalRow);
      olderLocalRow.before(newerLocalRow);
    }, LOCAL_ONLY_CHAT_ROW_ATTR);
    await harness.frame.waitForTimeout(100);
    assert.deepEqual(await harness.frame.evaluate(() => ({
      guardTripped: window.__olderEdgeSyncGuardTripped,
      syncCalls: window.__olderEdgeSyncCalls
    })), {
      guardTripped: false,
      syncCalls: 0
    });

    await harness.frame.evaluate(() => {
      window.__olderEdgeMutationObserver.takeRecords();
      window.__olderEdgeSyncCalls = 0;
      window.__olderEdgeOwnedMutationCount = 0;
    });
    await replaceOldestRemote("remote-row-window-6", "가상 목록 실제 채팅 6");
    await harness.frame.waitForTimeout(300);
    const liveObserverState = await harness.frame.evaluate((localRowAttr) => {
      const rows = [...document.querySelectorAll(`[${localRowAttr}="true"]`)];

      return {
        composerCount: document.querySelectorAll(
          '[data-chzzk-chat-ui-toggle-local-only-field="true"]'
        ).length,
        guardTripped: window.__olderEdgeSyncGuardTripped,
        heartbeat: window.__olderEdgeHeartbeat,
        localMessageCounts: window.localOnlyChatMessages.map(
          (message) => message.newerRemoteCount
        ),
        localRowCount: rows.length,
        localTextsNewestFirst: rows.map((row) =>
          row.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']")?.textContent || ""
        ),
        ownedMutationCount: window.__olderEdgeOwnedMutationCount,
        sendButtonCount: document.querySelectorAll(
          '[data-chzzk-chat-ui-toggle-local-only-send-button="true"]'
        ).length,
        syncCalls: window.__olderEdgeSyncCalls
      };
    }, LOCAL_ONLY_CHAT_ROW_ATTR);
    assert.equal(liveObserverState.guardTripped, false);
    assert.ok(liveObserverState.heartbeat >= 5);
    assert.ok(liveObserverState.syncCalls >= 1 && liveObserverState.syncCalls <= 5);
    assert.deepEqual({
      composerCount: liveObserverState.composerCount,
      localMessageCounts: liveObserverState.localMessageCounts,
      localRowCount: liveObserverState.localRowCount,
      localTextsNewestFirst: liveObserverState.localTextsNewestFirst,
      ownedMutationCount: liveObserverState.ownedMutationCount,
      sendButtonCount: liveObserverState.sendButtonCount
    }, {
      composerCount: 1,
      localMessageCounts: [4, 3],
      localRowCount: 2,
      localTextsNewestFirst: ["나중에 보낸 로컬 메시지", "먼저 보낸 로컬 메시지"],
      ownedMutationCount: 0,
      sendButtonCount: 1
    });
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.frame.evaluate(() => {
      window.__olderEdgeMutationObserver?.disconnect();
      window.clearInterval(window.__olderEdgeHeartbeatTimer);

      if (window.__olderEdgeOriginalSync) {
        window.syncLocalOnlyChatRows = window.__olderEdgeOriginalSync;
      }
    }).catch(() => {});
    await harness.close();
  }
});

test("나만 보는 채팅은 빈 목록 뒤 첫 실제 채팅에도 밀려 올라간다", { timeout: 20_000 }, async () => {
  const harness = await createLocalOnlyChatHarness();

  try {
    const input = harness.frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`);

    await harness.frame.evaluate(() => {
      const firstRemote = document.getElementById("remote-row-1");
      const secondRemote = document.getElementById("remote-row-2");

      window.__emptyTimelineContainer = firstRemote.parentElement;
      window.__emptyTimelineRemoteTemplate = firstRemote.cloneNode(true);
      firstRemote.remove();
      secondRemote.remove();
    });
    await harness.frame.waitForFunction(() =>
      document.querySelectorAll("#remote-row-1, #remote-row-2").length === 0
    );

    await input.fill("빈 목록에서 쓴 로컬 메시지");
    await input.press("Enter");
    const localRow = harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`);
    await localRow.waitFor({ state: "visible" });
    await localRow.evaluate((row) => {
      window.__emptyTimelineLocalRow = row;
    });

    await harness.frame.evaluate(() => {
      const remoteRow = window.__emptyTimelineRemoteTemplate;

      remoteRow.id = "remote-row-first-after-empty";
      remoteRow.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']").textContent = "첫 실제 채팅";
      window.__emptyTimelineContainer.prepend(remoteRow);
    });
    await harness.frame.waitForFunction((localRowAttr) => {
      const remoteRow = document.getElementById("remote-row-first-after-empty");
      const row = document.querySelector(`[${localRowAttr}="true"]`);

      return Boolean(
        remoteRow &&
        row &&
        row.parentElement === remoteRow.parentElement &&
        remoteRow.nextElementSibling === row
      );
    }, LOCAL_ONLY_CHAT_ROW_ATTR);
    assert.deepEqual(await localRow.evaluate((row) => {
      const remoteRow = document.getElementById("remote-row-first-after-empty");
      const rowRect = row.getBoundingClientRect();
      const remoteRect = remoteRow.getBoundingClientRect();

      return {
        remoteIsVisuallyNewer: remoteRect.top + remoteRect.height / 2 > rowRect.top + rowRect.height / 2,
        sameNode: row === window.__emptyTimelineLocalRow
      };
    }), {
      remoteIsVisuallyNewer: true,
      sameNode: true
    });
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("나만 보는 채팅은 겹치지 않는 과거 가상 목록에 최신 메시지처럼 재배치되지 않는다", { timeout: 20_000 }, async () => {
  const harness = await createLocalOnlyChatHarness();

  try {
    const input = harness.frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`);

    await input.fill("최신 목록의 로컬 메시지");
    await input.press("Enter");
    const localRow = harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`);
    await localRow.waitFor({ state: "visible" });

    await localRow.evaluate((row) => {
      window.__virtualSliceLocalRow = row;
    });
    await harness.frame.evaluate(() => {
      const firstRemote = document.getElementById("remote-row-1");
      const secondRemote = document.getElementById("remote-row-2");
      const container = firstRemote.parentElement;
      const historyFirst = firstRemote.cloneNode(true);
      const historySecond = firstRemote.cloneNode(true);

      window.__virtualSliceContainer = container;
      window.__virtualSliceNativeRows = [firstRemote, secondRemote];
      historyFirst.id = "history-row-1";
      historySecond.id = "history-row-2";
      historyFirst.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']").textContent = "과거 채팅 1";
      firstRemote.remove();
      secondRemote.remove();
      container.append(historyFirst, historySecond);
    });
    await harness.frame.waitForFunction((localRowAttr) =>
      document.querySelectorAll(`[${localRowAttr}="true"]`).length === 0 &&
      document.getElementById("history-row-1") !== null,
      LOCAL_ONLY_CHAT_ROW_ATTR
    );
    assert.equal(
      await harness.frame.evaluate(() => window.__virtualSliceLocalRow.isConnected),
      false
    );

    await input.fill("과거 목록에서 쓴 두 번째 로컬 메시지");
    await input.press("Enter");
    await harness.frame.waitForFunction((localRowAttr) =>
      document.querySelectorAll(`[${localRowAttr}="true"]`).length === 1,
      LOCAL_ONLY_CHAT_ROW_ATTR
    );
    await harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`).evaluate((row) => {
      window.__virtualSliceSecondLocalRow = row;
    });
    assert.equal(
      await harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`).locator(
        "[data-chzzk-chat-ui-toggle-message-text='true']"
      ).textContent(),
      "과거 목록에서 쓴 두 번째 로컬 메시지"
    );

    await harness.frame.evaluate((localRowAttr) => {
      const container = document.getElementById("history-row-1").parentElement;
      const remoteRow = document.getElementById("history-row-1").cloneNode(true);
      const firstNativeRow = [...container.children].find(
        (candidate) => candidate.getAttribute(localRowAttr) !== "true"
      );

      remoteRow.id = "history-row-new";
      remoteRow.querySelector("[data-chzzk-chat-ui-toggle-message-text='true']").textContent =
        "과거 목록 뒤 새로 들어온 실제 채팅";
      container.insertBefore(remoteRow, firstNativeRow || null);
    }, LOCAL_ONLY_CHAT_ROW_ATTR);
    await harness.frame.waitForFunction(() => {
      const remoteRow = document.getElementById("history-row-new");

      return Boolean(
        remoteRow &&
        remoteRow.nextElementSibling === window.__virtualSliceSecondLocalRow &&
        window.__virtualSliceSecondLocalRow.nextElementSibling?.id === "history-row-1"
      );
    });
    assert.deepEqual(await harness.frame.evaluate(() => {
      const remoteRow = document.getElementById("history-row-new");
      const remoteRect = remoteRow.getBoundingClientRect();
      const localRect = window.__virtualSliceSecondLocalRow.getBoundingClientRect();

      return {
        localSameNode: window.__virtualSliceSecondLocalRow.isConnected,
        remoteIsVisuallyNewer:
          remoteRect.top + remoteRect.height / 2 > localRect.top + localRect.height / 2
      };
    }), {
      localSameNode: true,
      remoteIsVisuallyNewer: true
    });

    await harness.frame.evaluate(() => {
      window.__virtualSliceSecondLocalRow.remove();
    });
    await harness.frame.waitForFunction((localRowAttr) => {
      const row = document.querySelector(`[${localRowAttr}="true"]`);

      return Boolean(
        row === window.__virtualSliceSecondLocalRow &&
        row.isConnected &&
        document.getElementById("history-row-new")?.nextElementSibling === row
      );
    }, LOCAL_ONLY_CHAT_ROW_ATTR);

    await harness.frame.evaluate(() => {
      document.getElementById("history-row-new").remove();
      document.getElementById("history-row-1").remove();
      document.getElementById("history-row-2").remove();
      window.__virtualSliceContainer.append(...window.__virtualSliceNativeRows);
    });
    await harness.frame.waitForFunction((localRowAttr) => {
      const rows = [...document.querySelectorAll(`[${localRowAttr}="true"]`)];

      return Boolean(
        rows.length === 2 &&
        window.__virtualSliceSecondLocalRow.nextElementSibling === window.__virtualSliceLocalRow &&
        window.__virtualSliceLocalRow.nextElementSibling?.id === "remote-row-1"
      );
    }, LOCAL_ONLY_CHAT_ROW_ATTR);
    assert.deepEqual(await harness.frame.evaluate((localRowAttr) => ({
      localRowCount: document.querySelectorAll(`[${localRowAttr}="true"]`).length,
      originalLocalSameNode: window.__virtualSliceLocalRow.isConnected,
      secondLocalSameNode: window.__virtualSliceSecondLocalRow.isConnected,
      secondLocalBeforeOriginalLocal:
        window.__virtualSliceSecondLocalRow.nextElementSibling === window.__virtualSliceLocalRow,
      originalLocalBesideOriginalTimeline:
        window.__virtualSliceLocalRow.nextElementSibling?.id === "remote-row-1"
    }), LOCAL_ONLY_CHAT_ROW_ATTR), {
      localRowCount: 2,
      originalLocalSameNode: true,
      secondLocalSameNode: true,
      secondLocalBeforeOriginalLocal: true,
      originalLocalBesideOriginalTimeline: true
    });
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("나만 보는 채팅은 Enter·버튼·submit을 로컬 처리하고 IME·Shift+Enter를 구분한다", { timeout: 20_000 }, async () => {
  const harness = await createLocalOnlyChatHarness();

  try {
    const input = harness.frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`);
    const rows = harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`);
    const requestCountBeforeInput = harness.requests.length;

    await harness.frame.evaluate(({ fieldAttr, sendButtonAttr }) => {
      window.__siteSendAttempts = {
        beforeinput: 0,
        click: 0,
        compositionend: 0,
        compositionstart: 0,
        keydown: 0,
        keypress: 0,
        keyup: 0,
        submit: 0
      };
      for (const eventType of [
        "beforeinput",
        "compositionend",
        "compositionstart",
        "keydown",
        "keypress",
        "keyup"
      ]) {
        window.addEventListener(eventType, (event) => {
          if (event.composedPath().some((node) => node instanceof HTMLElement && node.hasAttribute(fieldAttr))) {
            window.__siteSendAttempts[eventType] += 1;
          }
        }, true);
      }
      window.addEventListener("click", (event) => {
        if (event.composedPath().some((node) => node instanceof HTMLElement && node.hasAttribute(sendButtonAttr))) {
          window.__siteSendAttempts.click += 1;
        }
      }, true);
      window.addEventListener("submit", () => {
        window.__siteSendAttempts.submit += 1;
      }, true);
    }, {
      fieldAttr: LOCAL_ONLY_CHAT_FIELD_ATTR,
      sendButtonAttr: LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR
    });

    await input.fill("첫 줄");
    await input.press("Shift+Enter");
    await input.type("둘째 줄");
    assert.equal(await rows.count(), 0);
    assert.equal(await input.inputValue(), "첫 줄\n둘째 줄");
    assert.notEqual(await input.evaluate((field) => getComputedStyle(field).overflowY), "hidden");

    await input.press("Enter");
    assert.equal(await rows.count(), 1);
    assert.equal(await input.evaluate((field) => getComputedStyle(field).overflowY), "hidden");
    assert.equal(
      await rows.first().locator("[data-chzzk-chat-ui-toggle-message-text='true']").textContent(),
      "첫 줄\n둘째 줄"
    );

    assert.equal(await harness.frame.evaluate(() => {
      const originalSubmit = window.submitLocalOnlyChatMessage;

      if (typeof originalSubmit !== "function") {
        return false;
      }

      window.__localOnlySubmitCalls = 0;
      window.submitLocalOnlyChatMessage = (...args) => {
        window.__localOnlySubmitCalls += 1;
        return originalSubmit(...args);
      };
      return true;
    }), true);

    await input.fill("조합 종료 직후");
    const immediateEnterState = await input.evaluate((element) => {
      window.__localOnlySubmitCalls = 0;
      element.dispatchEvent(new CompositionEvent("compositionstart", {
        bubbles: true,
        composed: true
      }));
      element.dispatchEvent(new CompositionEvent("compositionend", {
        bubbles: true,
        composed: true
      }));
      const submitCallsAfterCompositionEnd = window.__localOnlySubmitCalls;
      const inputValueAfterCompositionEnd = element.value;
      const keydownCanceled = !element.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        keyCode: 13,
        bubbles: true,
        cancelable: true
      }));
      const submitCallsAfterKeydown = window.__localOnlySubmitCalls;
      const keypressCanceled = !element.dispatchEvent(new KeyboardEvent("keypress", {
        key: "Enter",
        keyCode: 13,
        bubbles: true,
        cancelable: true
      }));
      const beforeinputCanceled = !element.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: "insertParagraph"
      }));
      const keyupCanceled = !element.dispatchEvent(new KeyboardEvent("keyup", {
        key: "Enter",
        keyCode: 13,
        bubbles: true,
        cancelable: true
      }));

      return {
        beforeinputCanceled,
        inputValueAfterCompositionEnd,
        finalInputValue: element.value,
        finalSubmitCalls: window.__localOnlySubmitCalls,
        keydownCanceled,
        keypressCanceled,
        keyupCanceled,
        submitCallsAfterCompositionEnd,
        submitCallsAfterKeydown
      };
    });
    assert.deepEqual(immediateEnterState, {
      beforeinputCanceled: true,
      inputValueAfterCompositionEnd: "조합 종료 직후",
      finalInputValue: "",
      finalSubmitCalls: 1,
      keydownCanceled: true,
      keypressCanceled: true,
      keyupCanceled: true,
      submitCallsAfterCompositionEnd: 0,
      submitCallsAfterKeydown: 1
    });
    assert.equal(await rows.count(), 2);
    assert.equal(
      await rows.filter({ hasText: "조합 종료 직후" })
        .locator("[data-chzzk-chat-ui-toggle-message-text='true']")
        .textContent(),
      "조합 종료 직후"
    );

    await input.fill("조합 중 줄바꿈");
    const composingShiftEnterState = await input.evaluate((element) => {
      window.__localOnlySubmitCalls = 0;
      element.dispatchEvent(new CompositionEvent("compositionstart", {
        bubbles: true,
        composed: true
      }));
      element.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        keyCode: 229,
        isComposing: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      }));
      const composingLineBreakCanceled = !element.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: "insertLineBreak",
        isComposing: true
      }));
      element.dispatchEvent(new CompositionEvent("compositionend", {
        bubbles: true,
        composed: true
      }));
      const trailingLineBreakCanceled = !element.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: "insertLineBreak"
      }));
      element.dispatchEvent(new KeyboardEvent("keyup", {
        key: "Enter",
        keyCode: 13,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      }));

      return {
        composingLineBreakCanceled,
        inputValue: element.value,
        submitCalls: window.__localOnlySubmitCalls,
        trailingLineBreakCanceled
      };
    });
    assert.deepEqual(composingShiftEnterState, {
      composingLineBreakCanceled: false,
      inputValue: "조합 중 줄바꿈",
      submitCalls: 0,
      trailingLineBreakCanceled: false
    });
    assert.equal(await rows.count(), 2);

    await input.fill("한글 마지");
    const imeCycleState = await input.evaluate((element) => {
      window.__localOnlySubmitCalls = 0;
      element.dispatchEvent(new CompositionEvent("compositionstart", {
        bubbles: true,
        composed: true
      }));
      element.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        keyCode: 229,
        isComposing: true,
        bubbles: true,
        cancelable: true
      }));
      const composingKeypressCanceled = !element.dispatchEvent(new KeyboardEvent("keypress", {
        key: "Enter",
        keyCode: 229,
        isComposing: true,
        bubbles: true,
        cancelable: true
      }));
      element.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
        data: "막",
        inputType: "insertCompositionText",
        isComposing: true
      }));
      element.value = "한글 마지막";
      element.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        composed: true,
        data: "막",
        inputType: "insertCompositionText",
        isComposing: true
      }));
      element.dispatchEvent(new CompositionEvent("compositionend", {
        bubbles: true,
        composed: true,
        data: "막"
      }));
      const trailingLineBreakCanceled = !element.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: "insertParagraph"
      }));
      element.dispatchEvent(new KeyboardEvent("keyup", {
        key: "Enter",
        keyCode: 13,
        bubbles: true,
        cancelable: true
      }));

      return {
        composingKeypressCanceled,
        inputValue: element.value,
        submitCalls: window.__localOnlySubmitCalls,
        trailingLineBreakCanceled
      };
    });
    assert.deepEqual(imeCycleState, {
      composingKeypressCanceled: false,
      inputValue: "",
      submitCalls: 1,
      trailingLineBreakCanceled: true
    });
    assert.equal(await rows.count(), 3);
    assert.equal(
      await rows.filter({ hasText: "한글 마지막" })
        .locator("[data-chzzk-chat-ui-toggle-message-text='true']")
        .textContent(),
      "한글 마지막"
    );
    await harness.frame.waitForTimeout(500);
    assert.equal(await rows.count(), 3);
    assert.equal(await harness.frame.evaluate(() => window.__localOnlySubmitCalls), 1);

    await input.fill("버튼 전송");
    await harness.frame.locator(`[${LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR}="true"]`).click();
    assert.equal(await rows.count(), 4);

    await input.fill("모바일 입력");
    await input.evaluate((element) => {
      element.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: "insertParagraph"
      }));
    });
    assert.equal(await rows.count(), 5);

    await input.fill("submit 우회");
    const submitWasCanceled = await harness.frame.evaluate(() => {
      const form = document.getElementById("native-chat-form");

      return !form.dispatchEvent(new SubmitEvent("submit", {
        bubbles: true,
        cancelable: true,
        submitter: document.querySelector("[data-chzzk-chat-ui-toggle-local-only-send-button='true']")
      }));
    });
    assert.equal(submitWasCanceled, true);
    assert.equal(await rows.count(), 6);
    assert.deepEqual(
      await harness.frame.evaluate(() => window.__siteSendAttempts),
      {
        beforeinput: 0,
        click: 0,
        compositionend: 0,
        compositionstart: 0,
        keydown: 0,
        keypress: 0,
        keyup: 0,
        submit: 0
      }
    );
    assert.equal(await harness.frame.evaluate(() => window.__inlineSiteSendAttempts || 0), 0);
    assert.equal(harness.requests.length, requestCountBeforeInput);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("나만 보는 채팅은 실제 Edge IME 조합 뒤 첫 Enter 한 번만 로컬 처리한다", { timeout: 20_000 }, async () => {
  const harness = await createLocalOnlyChatHarness({ recordLocalOnlyInputEvents: true });
  let cdp = null;

  try {
    const input = harness.frame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`);
    const rows = harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`);
    const message = `한글 조합 Enter ${Date.now().toString(36)}`;
    const requestCountBeforeInput = harness.requests.length;

    cdp = await harness.context.newCDPSession(harness.page);
    await input.focus();
    await cdp.send("Input.imeSetComposition", {
      text: message,
      selectionStart: message.length,
      selectionEnd: message.length
    });
    await cdp.send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    });
    await cdp.send("Input.insertText", { text: message });
    await cdp.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    });

    await harness.frame.waitForFunction(
      (localRowAttr) => document.querySelectorAll(`[${localRowAttr}="true"]`).length === 1,
      LOCAL_ONLY_CHAT_ROW_ATTR
    );
    assert.equal(await input.inputValue(), "");
    assert.equal(await rows.count(), 1);
    assert.equal(
      await rows.locator("[data-chzzk-chat-ui-toggle-message-text='true']").textContent(),
      message
    );

    await harness.frame.waitForTimeout(350);
    assert.equal(await rows.count(), 1);
    assert.equal(await harness.frame.locator("#remote-row-1, #remote-row-2").count(), 2);
    assert.equal(harness.requests.length, requestCountBeforeInput);

    const events = await harness.frame.evaluate(() => window.__localOnlyInputEvents);
    const compositionStartIndex = events.findIndex((event) => event.type === "compositionstart");
    const enterKeydownIndex = events.findIndex(
      (event) => event.type === "keydown" && event.key === "Enter"
    );
    const compositionEndIndex = events.findIndex((event) => event.type === "compositionend");
    const enterKeyupIndex = events.findIndex(
      (event) => event.type === "keyup" && event.key === "Enter"
    );
    const composingBeforeInput = events.find(
      (event) => event.type === "beforeinput" && event.isComposing
    );
    const composingInput = events.find(
      (event) => event.type === "input" && event.isComposing
    );

    assert.ok(compositionStartIndex >= 0);
    assert.ok(compositionStartIndex < enterKeydownIndex);
    assert.ok(enterKeydownIndex < compositionEndIndex);
    assert.ok(compositionEndIndex < enterKeyupIndex);
    assert.equal(events[compositionStartIndex].isTrusted, true);
    assert.equal(events[enterKeydownIndex].isTrusted, true);
    assert.equal(events[enterKeydownIndex].isComposing, true);
    assert.equal(events[enterKeyupIndex].isTrusted, true);
    assert.equal(events[enterKeyupIndex].isComposing, false);
    assert.equal(composingBeforeInput?.isTrusted, true);
    assert.equal(composingInput?.isTrusted, true);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await cdp?.detach().catch(() => {});
    await harness.close();
  }
});

test("나만 보는 채팅은 실제 수신 행을 건드리지 않고 로컬 100개만 유지하며 새로고침 시 비운다", { timeout: 25_000 }, async () => {
  const harness = await createLocalOnlyChatHarness();

  try {
    await harness.frame.evaluate((fieldAttr) => {
      const input = document.querySelector(`[${fieldAttr}="true"]`);

      for (let index = 0; index <= 100; index += 1) {
        input.value = `메시지 ${index}`;
        input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        input.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
          composed: true
        }));
      }
    }, LOCAL_ONLY_CHAT_FIELD_ATTR);

    const rows = harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`);
    assert.equal(await rows.count(), 100);
    assert.equal(
      await rows.first().locator("[data-chzzk-chat-ui-toggle-message-text='true']").textContent(),
      "메시지 100"
    );
    assert.equal(
      await rows.last().locator("[data-chzzk-chat-ui-toggle-message-text='true']").textContent(),
      "메시지 1"
    );
    assert.equal(await harness.frame.locator("#remote-row-1, #remote-row-2").count(), 2);

    await harness.reloadGuestFrame();
    assert.equal(await harness.frame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`).count(), 0);
    assert.equal(await harness.frame.locator("#remote-row-1, #remote-row-2").count(), 2);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("나만 보는 입력 가로채기는 최상위 페이지와 미니 채팅 프레임에 연결되지 않는다", { timeout: 20_000 }, async () => {
  const harness = await createHarness({ html: createLocalOnlyChatDocument() });

  try {
    assert.equal(await harness.page.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`).count(), 0);
    assert.equal(await harness.page.locator(`#native-chat-input`).isVisible(), true);
    assert.equal(await harness.page.locator(`[${LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR}="true"]`).count(), 0);
    assert.equal(await harness.page.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`).count(), 0);

    const assertNativeEventsPassThrough = async (target) => target.evaluate(() => {
      const input = document.getElementById("native-chat-input");
      const button = document.getElementById("native-send-button");
      const form = document.getElementById("native-chat-form");
      const counts = { click: 0, keydown: 0, submit: 0 };

      input.addEventListener("keydown", () => { counts.keydown += 1; });
      button.addEventListener("click", () => { counts.click += 1; });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        counts.submit += 1;
      });
      button.disabled = false;
      button.type = "button";
      input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true
      }));
      button.click();
      form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));

      return counts;
    });

    assert.deepEqual(await assertNativeEventsPassThrough(harness.page), {
      click: 1,
      keydown: 1,
      submit: 1
    });

    await harness.page.evaluate((miniChatUrl) => {
      const iframe = document.createElement("iframe");

      iframe.id = "mini-chat-test-frame";
      iframe.src = miniChatUrl;
      document.body.append(iframe);
    }, MINI_CHAT_URL);

    const deadline = Date.now() + 5_000;
    let miniFrame = null;

    while (Date.now() < deadline) {
      miniFrame = harness.page.frames().find((candidate) => candidate.url() === MINI_CHAT_URL) || null;
      if (miniFrame) break;
      await harness.page.waitForTimeout(25);
    }

    assert.ok(miniFrame);
    await injectContentScripts(miniFrame);
    assert.equal(await miniFrame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`).count(), 0);
    assert.equal(await miniFrame.locator(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`).count(), 0);
    assert.equal(await miniFrame.locator(`#native-chat-input`).isVisible(), true);
    assert.deepEqual(await assertNativeEventsPassThrough(miniFrame), {
      click: 1,
      keydown: 1,
      submit: 1
    });

    const untrustedGuestUrl = `${GUEST_CHAT_URL}&untrusted=1`;
    await harness.page.evaluate((url) => {
      const iframe = document.createElement("iframe");

      iframe.id = "untrusted-guest-chat-test-frame";
      iframe.src = url;
      document.body.append(iframe);
    }, untrustedGuestUrl);

    let untrustedGuestFrame = null;
    const untrustedDeadline = Date.now() + 5_000;

    while (Date.now() < untrustedDeadline) {
      untrustedGuestFrame = harness.page.frames().find((candidate) => candidate.url() === untrustedGuestUrl) || null;
      if (untrustedGuestFrame) break;
      await harness.page.waitForTimeout(25);
    }

    assert.ok(untrustedGuestFrame);
    const spoofedIsolationState = await untrustedGuestFrame.evaluate(async () => {
      const frameElement = window.frameElement;

      if (!frameElement || String(frameElement.tagName || "").toUpperCase() !== "IFRAME") {
        return null;
      }

      const nativeHasAttribute = frameElement.hasAttribute.bind(frameElement);

      Object.defineProperty(frameElement, "hasAttribute", {
        configurable: true,
        value(attributeName) {
          return attributeName === "credentialless" || nativeHasAttribute(attributeName);
        }
      });
      Object.defineProperty(frameElement, "credentialless", {
        configurable: true,
        value: true
      });
      Object.defineProperty(document, "hasStorageAccess", {
        configurable: true,
        value: async () => true
      });

      return {
        attribute: frameElement.hasAttribute("credentialless"),
        property: frameElement.credentialless,
        hasStorageAccess: await document.hasStorageAccess()
      };
    });
    assert.deepEqual(spoofedIsolationState, {
      attribute: true,
      property: true,
      hasStorageAccess: true
    });
    await injectContentScripts(untrustedGuestFrame);
    assert.equal(await untrustedGuestFrame.locator(`[${LOCAL_ONLY_CHAT_FIELD_ATTR}="true"]`).count(), 0);
    assert.equal(await untrustedGuestFrame.locator(`[${LOCAL_ONLY_CHAT_SEND_BUTTON_ATTR}="true"]`).count(), 0);
    assert.equal(await untrustedGuestFrame.locator(`[${LOCAL_ONLY_CHAT_ROW_ATTR}="true"]`).count(), 0);
    assert.equal(await untrustedGuestFrame.locator(`#${GUEST_CHAT_TOGGLE_BUTTON_ID}`).count(), 0);
    assert.equal(await untrustedGuestFrame.locator("#native-chat-input").isVisible(), true);
    assert.deepEqual(await assertNativeEventsPassThrough(untrustedGuestFrame), {
      click: 1,
      keydown: 1,
      submit: 1
    });
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("미니 채팅은 외피와 빈 영역만 투명화하고 기존 채팅 스타일과 입력을 유지한다", { timeout: 30_000 }, async () => {
  const harness = await createHarness({
    html: createMiniChatDocument(),
    initialOptions: {
      useMiniFloatingChat: true,
      miniFloatingChatBounds: {
        left: 40,
        top: 40,
        width: 475,
        height: 686
      },
      showChatBoxes: false,
      showNicknames: true,
      showBadges: true,
      showTimestamps: true,
      showLargeText: true,
      chatFontSizePt: 18,
      useNicknameFontSize: true,
      nicknameFontSizePt: 16,
      showBoldText: true,
      useChatTextColor: true,
      chatTextColor: "#123456"
    }
  });

  try {
    const panel = harness.page.locator("#chzzk-chat-ui-toggle-mini-chat-panel");
    const frameElement = panel.locator("#chzzk-chat-ui-toggle-mini-chat-frame");

    await panel.waitFor({ state: "visible" });

    const deadline = Date.now() + 5_000;
    let miniFrame = null;

    while (Date.now() < deadline) {
      miniFrame = harness.page.frames().find((candidate) =>
        candidate.url().includes("chzzkChatUiToggleMini=1")
      ) || null;
      if (miniFrame) break;
      await harness.page.waitForTimeout(25);
    }

    assert.ok(miniFrame);
    await injectContentScripts(miniFrame);
    await miniFrame.waitForFunction(() =>
      document.documentElement.dataset.chzzkChatUiToggleMiniChatEmbed === "true" &&
      document.querySelector("#mini-native-header")
        ?.getAttribute("data-chzzk-chat-ui-toggle-mini-chat-hidden-control") === "true"
    );

    const outerState = await panel.evaluate((element) => {
      const style = getComputedStyle(element);
      const controlsElement = element.querySelector(".chzzk-chat-ui-toggle-mini-chat__controls");
      const controlsStyle = controlsElement ? getComputedStyle(controlsElement) : null;
      const dragHandle = element.querySelector(".chzzk-chat-ui-toggle-mini-chat__drag-handle");
      const actions = element.querySelector(".chzzk-chat-ui-toggle-mini-chat__actions");
      const minimizeButton = element.querySelector(".chzzk-chat-ui-toggle-mini-chat__minimize");
      const resizeHandle = element.querySelector(".chzzk-chat-ui-toggle-mini-chat__resize");
      const resizeStyle = resizeHandle ? getComputedStyle(resizeHandle) : null;

      return {
        background: style.backgroundColor,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        controlsBackground: controlsStyle?.backgroundColor || null,
        controlsDisplay: controlsStyle?.display || null,
        controlsHeight: controlsElement?.getBoundingClientRect().height || 0,
        controlsPosition: controlsStyle?.position || null,
        controlsBottom: controlsStyle?.bottom || null,
        controlsRight: controlsStyle?.right || null,
        dragHandleHeight: dragHandle?.getBoundingClientRect().height || 0,
        dragHandleWidth: dragHandle?.getBoundingClientRect().width || 0,
        actionsDirection: actions ? getComputedStyle(actions).flexDirection : null,
        actionsHeight: actions?.getBoundingClientRect().height || 0,
        actionsWidth: actions?.getBoundingClientRect().width || 0,
        actionButtonHeight: minimizeButton?.getBoundingClientRect().height || 0,
        actionButtonWidth: minimizeButton?.getBoundingClientRect().width || 0,
        actionButtonFontSize: minimizeButton
          ? getComputedStyle(minimizeButton).fontSize
          : null,
        scaleControlCount: element.querySelectorAll("[data-mini-chat-scale-delta]").length,
        resizeHandleCount: element.querySelectorAll(".chzzk-chat-ui-toggle-mini-chat__resize").length,
        resizeBackground: resizeStyle?.backgroundColor || null,
        resizeHeight: resizeHandle?.getBoundingClientRect().height || 0,
        resizeWidth: resizeHandle?.getBoundingClientRect().width || 0
      };
    });
    const frameBackground = await frameElement.evaluate((element) => getComputedStyle(element).backgroundColor);
    const innerState = await miniFrame.evaluate(() => {
      const ids = [
        "mini-app-root",
        "aside-chatting",
        "mini-chat-shell",
        "mini-log-shell",
        "mini-chat-log"
      ];
      const backgroundById = Object.fromEntries(ids.map((id) => {
        const element = document.getElementById(id);
        return [id, element ? getComputedStyle(element).backgroundColor : null];
      }));
      const input = document.getElementById("mini-chat-input");
      const inputSurface = document.getElementById("mini-input-surface");
      const inputContainer = document.getElementById("mini-native-input");
      const profileButton = document.getElementById("mini-profile-button");
      const profileImage = document.getElementById("mini-profile-image");
      const emojiButton = document.getElementById("mini-emoji-button");
      const emojiImage = document.getElementById("mini-emoji-image");
      const message = document.getElementById("mini-message");
      const nickname = document.getElementById("mini-nickname");
      const badge = document.getElementById("mini-badge");
      const timestamp = document.getElementById("mini-native-timestamp");
      const row = document.getElementById("mini-chat-row");
      const notice = document.getElementById("mini-system-notice");
      const header = document.getElementById("mini-native-header");
      const inputCenterY = inputContainer
        ? inputContainer.getBoundingClientRect().top + inputContainer.getBoundingClientRect().height / 2
        : 0;
      const centerOffset = (element) => {
        if (!element) {
          return null;
        }

        const rect = element.getBoundingClientRect();
        return rect.top + rect.height / 2 - inputCenterY;
      };

      return {
        backgroundById,
        rootBackground: getComputedStyle(document.documentElement).backgroundColor,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        embed: document.documentElement.dataset.chzzkChatUiToggleMiniChatEmbed,
        headerDisplay: header ? getComputedStyle(header).display : null,
        headerHeight: header?.getBoundingClientRect().height || 0,
        headerDecoyDisplay: getComputedStyle(document.getElementById("mini-header-decoy")).display,
        headerDecoyMarked: document.getElementById("mini-header-decoy")
          ?.getAttribute("data-chzzk-chat-ui-toggle-mini-chat-hidden-control") || null,
        inputSurfaceBackground: inputSurface
          ? getComputedStyle(inputSurface).backgroundColor
          : null,
        inputBackground: inputContainer ? getComputedStyle(inputContainer).backgroundColor : null,
        inputBorderRadius: inputContainer ? getComputedStyle(inputContainer).borderRadius : null,
        inputHeight: inputContainer?.getBoundingClientRect().height || 0,
        inputPaddingLeft: inputContainer ? getComputedStyle(inputContainer).paddingLeft : null,
        inputPaddingRight: inputContainer ? getComputedStyle(inputContainer).paddingRight : null,
        inputHorizontalInset: inputSurface && inputContainer
          ? inputSurface.getBoundingClientRect().width - inputContainer.getBoundingClientRect().width
          : null,
        profileButtonCenterOffset: centerOffset(profileButton),
        profileImageCenterOffset: centerOffset(profileImage),
        profileButtonTop: profileButton ? getComputedStyle(profileButton).top : null,
        emojiButtonCenterOffset: centerOffset(emojiButton),
        emojiImageCenterOffset: centerOffset(emojiImage),
        emojiButtonTop: emojiButton ? getComputedStyle(emojiButton).top : null,
        inputVisible: Boolean(input && input.getBoundingClientRect().height > 0),
        messageColor: message ? getComputedStyle(message).color : null,
        messageFontSize: message ? Number.parseFloat(getComputedStyle(message).fontSize) : null,
        messageFontWeight: message ? getComputedStyle(message).fontWeight : null,
        nicknameFontSize: nickname ? Number.parseFloat(getComputedStyle(nickname).fontSize) : null,
        nicknameVisible: Boolean(nickname && getComputedStyle(nickname).display !== "none"),
        badgeVisible: Boolean(badge && getComputedStyle(badge).display !== "none"),
        timestampVisible: Boolean(timestamp && getComputedStyle(timestamp).display !== "none"),
        noticeBackground: notice ? getComputedStyle(notice).backgroundColor : null,
        rowBackground: row ? getComputedStyle(row).backgroundColor : null,
        boxOpacity: document.documentElement.dataset.chzzkChatUiToggleChatBoxOpacity,
        rowMarkedTransparent: row?.hasAttribute(
          "data-chzzk-chat-ui-toggle-mini-chat-transparent-surface"
        ) || false,
        noticeMarkedTransparent: notice?.hasAttribute(
          "data-chzzk-chat-ui-toggle-mini-chat-transparent-surface"
        ) || false,
        transparentSurfaceCount: document.querySelectorAll(
          '[data-chzzk-chat-ui-toggle-mini-chat-transparent-surface="true"]'
        ).length
      };
    });

    const actionsBox = await panel.locator(".chzzk-chat-ui-toggle-mini-chat__actions").boundingBox();
    const emojiButtonBox = await miniFrame.locator("#mini-emoji-button").boundingBox();
    const transparent = "rgba(0, 0, 0, 0)";

    assert.ok(actionsBox && emojiButtonBox);
    assert.ok(
      actionsBox.x >= emojiButtonBox.x + emojiButtonBox.width - 0.1,
      JSON.stringify({ actionsBox, emojiButtonBox })
    );
    assert.equal(outerState.background, transparent);
    assert.equal(outerState.borderColor, transparent);
    assert.equal(outerState.boxShadow, "none");
    assert.equal(outerState.controlsBackground, transparent);
    assert.equal(outerState.controlsDisplay, "flex");
    assert.ok(Math.abs(outerState.controlsHeight - 52) <= 0.1);
    assert.equal(outerState.controlsPosition, "absolute");
    assert.equal(outerState.controlsBottom, "8px");
    assert.equal(outerState.controlsRight, "0px");
    assert.ok(Math.abs(outerState.dragHandleHeight - 24) <= 0.1);
    assert.ok(Math.abs(outerState.dragHandleWidth - 8) <= 0.1);
    assert.equal(outerState.actionsDirection, "column");
    assert.ok(Math.abs(outerState.actionsHeight - 32) <= 0.1);
    assert.ok(Math.abs(outerState.actionsWidth - 16) <= 0.1);
    assert.ok(Math.abs(outerState.actionButtonHeight - 16) <= 0.1);
    assert.ok(Math.abs(outerState.actionButtonWidth - 16) <= 0.1);
    assert.equal(outerState.actionButtonFontSize, "12px");
    assert.equal(outerState.scaleControlCount, 0);
    assert.equal(outerState.resizeHandleCount, 1);
    assert.equal(outerState.resizeBackground, transparent);
    assert.ok(Math.abs(outerState.resizeHeight - 10) <= 0.1);
    assert.ok(Math.abs(outerState.resizeWidth - 10) <= 0.1);
    assert.equal(frameBackground, transparent);
    assert.equal(innerState.embed, "true");
    assert.equal(innerState.rootBackground, transparent);
    assert.equal(innerState.bodyBackground, transparent);
    assert.deepEqual(
      Object.values(innerState.backgroundById),
      Array(Object.keys(innerState.backgroundById).length).fill(transparent)
    );
    assert.equal(innerState.headerDisplay, "none");
    assert.equal(innerState.headerHeight, 0);
    assert.notEqual(innerState.headerDecoyDisplay, "none");
    assert.equal(innerState.headerDecoyMarked, null);
    assert.equal(innerState.rowBackground, "rgb(217, 222, 228)");
    assert.equal(innerState.noticeBackground, "rgb(238, 240, 243)");
    assert.equal(innerState.rowMarkedTransparent, false);
    assert.equal(innerState.noticeMarkedTransparent, false);
    assert.equal(innerState.messageColor, "rgb(18, 52, 86)");
    assert.ok(Math.abs(innerState.messageFontSize - 24) <= 0.1);
    assert.equal(innerState.messageFontWeight, "650");
    assert.ok(Math.abs(innerState.nicknameFontSize - (16 * 4 / 3)) <= 0.1);
    assert.equal(innerState.nicknameVisible, true);
    assert.equal(innerState.badgeVisible, true);
    assert.equal(innerState.timestampVisible, true);
    assert.equal(innerState.boxOpacity, "100");
    assert.equal(innerState.inputSurfaceBackground, transparent);
    assert.equal(innerState.inputBackground, "rgba(226, 227, 232, 0.98)");
    assert.equal(innerState.inputBorderRadius, "10px");
    assert.ok(Math.abs(innerState.inputHeight - 52) <= 0.1);
    assert.equal(innerState.inputPaddingLeft, "8px");
    assert.equal(innerState.inputPaddingRight, "8px");
    assert.ok(Math.abs(innerState.inputHorizontalInset - 20) <= 0.1);
    assert.ok(Math.abs(innerState.profileButtonCenterOffset) <= 0.1);
    assert.ok(Math.abs(innerState.profileImageCenterOffset) <= 0.1);
    assert.equal(innerState.profileButtonTop, "0px");
    assert.ok(Math.abs(innerState.emojiButtonCenterOffset) <= 0.1);
    assert.ok(Math.abs(innerState.emojiImageCenterOffset) <= 0.1);
    assert.equal(innerState.emojiButtonTop, "0px");
    assert.equal(innerState.inputVisible, true);
    assert.ok(innerState.transparentSurfaceCount >= 5);

    await miniFrame.locator("#mini-chat-input").fill("입력 유지 확인");
    assert.equal(await miniFrame.locator("#mini-chat-input").inputValue(), "입력 유지 확인");
    await miniFrame.locator("#mini-chat-input").click();
    assert.equal(
      await miniFrame.evaluate(() => document.activeElement?.id),
      "mini-chat-input"
    );

    await miniFrame.evaluate((storageKey) => {
      const nextOptions = {
        ...window.__storageHarness.store[storageKey],
        showChatBoxes: true,
        chatBoxColor: "#4b8bff",
        chatBoxOpacity: 40
      };

      window.__storageHarness.emitOptionsChange(nextOptions);
    }, STORAGE_KEY);
    await miniFrame.waitForFunction(() =>
      document.documentElement.dataset.chzzkChatUiToggleChatBoxes === "on"
    );
    const chatBoxState = await miniFrame.locator("#mini-chat-row").evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      backgroundVariable: getComputedStyle(document.documentElement)
        .getPropertyValue("--chzzk-chat-ui-toggle-box-bg")
        .trim(),
      configuredColor: document.documentElement.dataset.chzzkChatUiToggleChatBoxColor,
      configuredOpacity: document.documentElement.dataset.chzzkChatUiToggleChatBoxOpacity,
      markedTransparent: element.hasAttribute(
        "data-chzzk-chat-ui-toggle-mini-chat-transparent-surface"
      )
    }));
    assert.equal(chatBoxState.background, "rgba(75, 139, 255, 0.4)");
    assert.equal(chatBoxState.background, chatBoxState.backgroundVariable);
    assert.equal(chatBoxState.configuredColor, "#4b8bff");
    assert.equal(chatBoxState.configuredOpacity, "40");
    assert.equal(chatBoxState.markedTransparent, false);
    assert.equal(
      await miniFrame.locator("#mini-message").evaluate((element) => getComputedStyle(element).color),
      "rgb(18, 52, 86)"
    );

    await miniFrame.evaluate(() => {
      const replacement = document.createElement("div");

      replacement.id = "mini-replaced-header";
      replacement.className = "_header_replacement_9";
      replacement.innerHTML = "<strong>채팅</strong><button type='button'>−</button><span>100%</span><button type='button'>+</button>";
      document.getElementById("mini-native-header").replaceWith(replacement);
    });
    await miniFrame.waitForFunction(() =>
      document.getElementById("mini-replaced-header")
        ?.getAttribute("data-chzzk-chat-ui-toggle-mini-chat-hidden-control") === "true"
    );
    assert.equal(
      await miniFrame.locator("#mini-replaced-header").evaluate((element) =>
        getComputedStyle(element).display
      ),
      "none"
    );

    const beforeDrag = await panel.boundingBox();
    const dragHandleBox = await panel.locator(".chzzk-chat-ui-toggle-mini-chat__drag-handle").boundingBox();
    assert.ok(beforeDrag && dragHandleBox);
    await harness.page.mouse.move(
      dragHandleBox.x + dragHandleBox.width / 2,
      dragHandleBox.y + dragHandleBox.height / 2
    );
    await harness.page.mouse.down();
    await harness.page.mouse.move(
      dragHandleBox.x + dragHandleBox.width / 2 + 30,
      dragHandleBox.y + dragHandleBox.height / 2 + 20
    );
    await harness.page.mouse.up();
    const afterDrag = await panel.boundingBox();
    assert.ok(afterDrag);
    assert.ok(afterDrag.x > beforeDrag.x + 20);

    const beforeResize = await panel.boundingBox();
    const resizeHandle = panel.locator(".chzzk-chat-ui-toggle-mini-chat__resize");
    const resizeBox = await resizeHandle.boundingBox();
    assert.ok(beforeResize && resizeBox);
    await harness.page.mouse.move(
      resizeBox.x + resizeBox.width / 2,
      resizeBox.y + resizeBox.height / 2
    );
    await harness.page.mouse.down();
    await harness.page.mouse.move(
      resizeBox.x + resizeBox.width / 2 + 24,
      resizeBox.y + resizeBox.height / 2 - 24
    );
    await harness.page.mouse.up();
    const afterResize = await panel.boundingBox();
    assert.ok(afterResize);
    assert.ok(afterResize.width > beforeResize.width + 15);
    assert.ok(afterResize.height < beforeResize.height - 15);

    await panel.locator(".chzzk-chat-ui-toggle-mini-chat__minimize").click();
    const bubble = harness.page.locator("#chzzk-chat-ui-toggle-mini-chat-bubble");
    await bubble.waitFor({ state: "visible" });
    assert.equal(await panel.count(), 0);
    await bubble.click();
    const restoredPanel = harness.page.locator("#chzzk-chat-ui-toggle-mini-chat-panel");
    await restoredPanel.waitFor({ state: "visible" });
    assert.equal(await bubble.count(), 0);
    await restoredPanel.locator(".chzzk-chat-ui-toggle-mini-chat__close").click();
    await harness.page.waitForFunction((storageKey) =>
      window.__storageHarness.store[storageKey]?.useMiniFloatingChat === false &&
      !document.getElementById("chzzk-chat-ui-toggle-mini-chat-panel")
    , STORAGE_KEY);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("본문의 HH:mm은 timestamp가 아니며 timestamp 숨김에서도 보인다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    html: createChatDocument("12:34"),
    initialOptions: { showTimestamps: false }
  });

  try {
    await harness.page.waitForFunction(() =>
      document.querySelector("#chat-row")?.getAttribute("data-chzzk-chat-ui-toggle-chat-row") === "true"
    );

    const result = await harness.page.evaluate(() => {
      const message = document.querySelector("#message");
      const generated = [...document.querySelectorAll(
        "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
      )];
      const style = getComputedStyle(message);

      return {
        generatedCount: generated.length,
        generatedHasTimestampRole: generated[0]
          ?.getAttribute("data-chzzk-chat-ui-toggle-role")
          ?.split(/\s+/)
          .includes("timestamp") ?? false,
        messageHasTimestampRole:
          message
            ?.getAttribute("data-chzzk-chat-ui-toggle-role")
            ?.split(/\s+/)
            .includes("timestamp") ?? false,
        messageText: message?.textContent,
        messageVisible:
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          message.getClientRects().length > 0,
        timestampsDataset: document.documentElement.dataset.chzzkChatUiToggleTimestamps
      };
    });

    assert.equal(result.timestampsDataset, "off");
    assert.equal(result.messageText, "12:34");
    assert.equal(result.messageHasTimestampRole, false);
    assert.equal(result.messageVisible, true);
    assert.equal(result.generatedCount, 1);
    assert.equal(result.generatedHasTimestampRole, true);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("실제 네이티브 HH:mm은 timestamp로 인식하고 생성 시간을 중복하지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    html: createChatDocument("정상 메시지", { nativeTimestamp: "09:41" }),
    initialOptions: {
      showTimestamps: true,
      showLargeText: true,
      chatFontSizePt: 36,
      useNicknameFontSize: true,
      nicknameFontSizePt: 24
    }
  });

  try {
    await harness.page.waitForFunction(() =>
      document.querySelector("#native-timestamp")
        ?.getAttribute("data-chzzk-chat-ui-toggle-role")
        ?.split(/\s+/)
        .includes("timestamp") === true
    );

    const result = await harness.page.evaluate(() => ({
      generatedCount: document.querySelectorAll(
        "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
      ).length,
      nativeRole: document.querySelector("#native-timestamp")
        ?.getAttribute("data-chzzk-chat-ui-toggle-role") ?? "",
      nativeVisible: getComputedStyle(document.querySelector("#native-timestamp")).display !== "none",
      prefixCount: document.querySelectorAll(
        "#chat-row [data-chzzk-chat-ui-toggle-prefix]"
      ).length,
      nicknameSize: Number.parseFloat(
        getComputedStyle(document.querySelector("#nickname")).fontSize
      )
    }));

    assert.match(result.nativeRole, /(?:^|\s)timestamp(?:\s|$)/);
    assert.equal(result.generatedCount, 0);
    assert.equal(result.nativeVisible, true);
    assert.equal(result.prefixCount, 1);
    assert.ok(Math.abs(result.nicknameSize - 32) <= 0.5);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("늦게 붙는 배지와 이모트는 생성 timestamp node와 text를 교체하지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    html: createChatDocument("변하지 않는 메시지"),
    initialOptions: { showTimestamps: true }
  });

  try {
    await harness.page.waitForFunction(() =>
      document.querySelectorAll(
        "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
      ).length === 1
    );

    await harness.page.evaluate(() => {
      const row = document.querySelector("#chat-row");
      const nicknameButton = row.querySelector(".live_chatting_message_nickname");
      const message = row.querySelector("#message");
      const generated = row.querySelector("[data-chzzk-chat-ui-toggle-generated-timestamp]");
      const badge = document.createElement("span");
      const emote = document.createElement("span");

      window.__generatedTimestampBefore = generated;
      window.__generatedTimestampTextBefore = generated.textContent;

      badge.id = "late-badge";
      badge.className = "live_chatting_badge";
      badge.innerHTML = '<svg aria-label="배지" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"></circle></svg>';
      nicknameButton.insertAdjacentElement("beforebegin", badge);

      emote.id = "late-emote";
      emote.className = "live_chatting_emote";
      emote.innerHTML = '<svg aria-label="이모트" viewBox="0 0 10 10"><rect width="10" height="10"></rect></svg>';
      message.append(emote);
    });

    await harness.page.waitForFunction(() =>
      document.querySelector("#late-badge")
        ?.getAttribute("data-chzzk-chat-ui-toggle-role")
        ?.split(/\s+/)
        .includes("badge") === true
    );

    const result = await harness.page.evaluate(() => {
      const generated = document.querySelector(
        "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
      );

      return {
        generatedCount: document.querySelectorAll(
          "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
        ).length,
        sameNode: generated === window.__generatedTimestampBefore,
        sameText: generated?.textContent === window.__generatedTimestampTextBefore,
        textBefore: window.__generatedTimestampTextBefore,
        textAfter: generated?.textContent ?? null
      };
    });

    assert.equal(result.generatedCount, 1);
    assert.equal(
      result.sameNode,
      true,
      `무관한 DOM 변화 뒤 timestamp node가 교체되었습니다 (${result.textBefore} -> ${result.textAfter})`
    );
    assert.equal(result.sameText, true);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("닉네임 별도 크기는 재스캔과 늦은 배지 추가 뒤에도 모든 행에서 유지된다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    initialOptions: {
      showLargeText: true,
      chatFontSizePt: 36,
      useNicknameFontSize: true,
      nicknameFontSizePt: 24
    }
  });

  try {
    await harness.page.waitForFunction(() =>
      document.querySelector("#chat-row")?.getAttribute("data-chzzk-chat-ui-toggle-chat-row") === "true"
    );

    const collectSizes = () => harness.page.evaluate(() => {
      const row = document.querySelector("#chat-row");
      const nickname = document.querySelector("#nickname");
      const message = document.querySelector("#message");

      return {
        row: Number.parseFloat(getComputedStyle(row).fontSize),
        nickname: Number.parseFloat(getComputedStyle(nickname).fontSize),
        message: Number.parseFloat(getComputedStyle(message).fontSize),
        prefixCount: row.querySelectorAll("[data-chzzk-chat-ui-toggle-prefix]").length,
        nicknameRole: nickname.getAttribute("data-chzzk-chat-ui-toggle-role") ?? ""
      };
    });
    const before = await collectSizes();

    await harness.page.evaluate(() => {
      const badge = document.createElement("span");

      badge.id = "nickname-size-late-badge";
      badge.className = "live_chatting_badge";
      badge.innerHTML = '<svg aria-label="배지" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"></circle></svg>';
      document.querySelector(".live_chatting_message_nickname")
        .insertAdjacentElement("beforebegin", badge);
    });

    await harness.page.waitForFunction(() =>
      document.querySelector("#nickname-size-late-badge")
        ?.getAttribute("data-chzzk-chat-ui-toggle-role")
        ?.split(/\s+/)
        .includes("badge") === true
    );
    await harness.page.evaluate(() => new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    ));

    const after = await collectSizes();
    const assertSize = (actual, expected, label) => {
      assert.ok(
        Math.abs(actual - expected) <= 0.5,
        `${label}: expected ${expected}px, received ${actual}px`
      );
    };

    for (const [label, state] of [["before", before], ["after", after]]) {
      assertSize(state.row, 48, `${label} row`);
      assertSize(state.message, 48, `${label} message`);
      assertSize(state.nickname, 32, `${label} nickname`);
      assert.equal(state.prefixCount, 1, `${label}: nickname prefix annotation must be restored`);
      assert.match(state.nicknameRole, /(?:^|\s)nickname(?:\s|$)/);
    }

    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("동일 문자열 characterData 행 재사용은 생성 timestamp node를 교체한다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    html: createChatDocument("같은 메시지"),
    initialOptions: { showTimestamps: true }
  });

  try {
    await harness.page.waitForFunction(() =>
      document.querySelectorAll(
        "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
      ).length === 1
    );

    await harness.page.evaluate(() => {
      const messageTextNode = document.querySelector("#message")?.firstChild;

      window.__generatedTimestampBeforeReuse = document.querySelector(
        "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
      );
      messageTextNode.data = messageTextNode.data;
    });

    await harness.page.waitForFunction(() => {
      const generated = document.querySelector(
        "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
      );

      return generated && generated !== window.__generatedTimestampBeforeReuse;
    });

    const result = await harness.page.evaluate(() => ({
      generatedCount: document.querySelectorAll(
        "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
      ).length,
      sameNode: document.querySelector(
        "#chat-row [data-chzzk-chat-ui-toggle-generated-timestamp]"
      ) === window.__generatedTimestampBeforeReuse
    }));

    assert.equal(result.generatedCount, 1);
    assert.equal(result.sameNode, false);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("채팅 행과 함께 추가된 비채팅 패널은 같은 mutation batch에서 즉시 주석된다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    initialOptions: { showNonChatPanels: false }
  });

  try {
    await harness.page.evaluate(() => {
      const fragment = document.createDocumentFragment();
      const row = document.querySelector("#chat-row").cloneNode(true);
      const panel = document.createElement("section");

      row.id = "second-chat-row";
      panel.id = "sports-panel";
      panel.className = "live_chatting_list_item";
      panel.setAttribute("aria-controls", "broadcast-information-sports-panel");
      panel.textContent = "스포츠 중계 정보 펼치기";
      fragment.append(row, panel);
      document.querySelector("[role='log']").appendChild(fragment);
    });

    await harness.page.waitForFunction(() =>
      document.querySelector("#sports-panel")
        ?.getAttribute("data-chzzk-chat-ui-toggle-non-chat-panel") === "true"
    );

    const result = await harness.page.evaluate(() => ({
      panelAnnotated:
        document.querySelector("#sports-panel")
          ?.getAttribute("data-chzzk-chat-ui-toggle-non-chat-panel") === "true",
      rowAnnotated:
        document.querySelector("#second-chat-row")
          ?.getAttribute("data-chzzk-chat-ui-toggle-chat-row") === "true"
    }));

    assert.equal(result.panelAnnotated, true);
    assert.equal(result.rowAnnotated, true);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("미니 채팅 배율 + 연속 입력은 두 단계 증가하고 저장 순서가 역전되지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    initialOptions: {
      useMiniFloatingChat: true,
      miniFloatingChatScale: 100
    },
    storageSetDelays: [80, 5],
    storageEventsAfterCallbacks: true
  });

  try {
    await harness.page.waitForFunction(() =>
      document.getElementById("chzzk-chat-ui-toggle-mini-chat-panel") instanceof HTMLElement
    );

    await harness.page.evaluate(() => {
      window.__storageHarness.resetLogs();
      updateMiniChatScale(10);
      updateMiniChatScale(10);
    });

    await harness.page.waitForFunction(() =>
      window.__storageHarness.requested.length > 0 && window.__storageHarness.pending === 0
    );
    await harness.page.waitForTimeout(50);

    const result = await harness.page.evaluate((storageKey) => ({
      committedScales: window.__storageHarness.committed
        .map((entry) => entry.scale)
        .filter(Number.isFinite),
      appliedScalesAfterEvents: window.__storageHarness.appliedScalesAfterEvents,
      datasetScale: Number(
        document.documentElement.dataset.chzzkChatUiToggleMiniFloatingChatScale
      ),
      panelScale: Number(
        document.querySelector("#chzzk-chat-ui-toggle-mini-chat-panel")?.dataset.scale
      ),
      requestedScales: window.__storageHarness.requested
        .map((entry) => entry.scale)
        .filter(Number.isFinite),
      storedScale: window.__storageHarness.store[storageKey]?.miniFloatingChatScale
    }), STORAGE_KEY);

    assert.deepEqual(result.requestedScales, [110, 120]);
    assert.deepEqual(result.committedScales, [110, 120]);
    assert.deepEqual(result.appliedScalesAfterEvents, [120, 120]);
    assert.equal(result.storedScale, 120);
    assert.equal(result.datasetScale, 120);
    assert.equal(result.panelScale, 120);
    assertNonDecreasing(result.requestedScales, "저장 요청 배율이 이전 값으로 되돌아가면 안 됩니다");
    assertNonDecreasing(result.committedScales, "저장 완료 배율 순서가 역전되면 안 됩니다");
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("팝업 닉네임 크기 저장 직후 미니 채팅을 조작해도 새 설정을 덮어쓰지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    initialOptions: {
      useMiniFloatingChat: true,
      miniFloatingChatScale: 100,
      showLargeText: true,
      chatFontSizePt: 36,
      useNicknameFontSize: false,
      nicknameFontSizePt: 13
    },
    storageSetDelays: [5, 80],
    storageEventsAfterCallbacks: true
  });

  try {
    await harness.page.waitForFunction(() =>
      document.getElementById("chzzk-chat-ui-toggle-mini-chat-panel") instanceof HTMLElement
    );

    await harness.page.evaluate(({ updateOptionsMessage }) => {
      window.__storageHarness.resetLogs();
      const popupPatch = {
        useNicknameFontSize: true,
        nicknameFontSizePt: 24
      };

      chrome.runtime.sendMessage({
        type: updateOptionsMessage,
        patch: popupPatch
      }, () => {});
      updateMiniChatScale(10);
    }, {
      updateOptionsMessage: UPDATE_OPTIONS_MESSAGE
    });

    await harness.page.waitForFunction(() =>
      window.__storageHarness.requested.length === 2 && window.__storageHarness.pending === 0
    );
    await harness.page.waitForTimeout(50);

    const result = await harness.page.evaluate((storageKey) => ({
      stored: window.__storageHarness.store[storageKey],
      datasetScale: Number(
        document.documentElement.dataset.chzzkChatUiToggleMiniFloatingChatScale
      ),
      nicknameToggle: document.documentElement.dataset.chzzkChatUiToggleNicknameFontSize,
      nicknameSize: Number(
        document.documentElement.dataset.chzzkChatUiToggleNicknameFontSizePt
      )
    }), STORAGE_KEY);

    assert.equal(result.stored.miniFloatingChatScale, 110);
    assert.equal(result.stored.useNicknameFontSize, true);
    assert.equal(result.stored.nicknameFontSizePt, 24);
    assert.equal(result.datasetScale, 110);
    assert.equal(result.nicknameToggle, "on");
    assert.equal(result.nicknameSize, 24);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("외부 설정으로 rebase한 미니 저장이 실패해도 최신 닉네임 설정은 유지된다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    initialOptions: {
      useMiniFloatingChat: true,
      miniFloatingChatScale: 100,
      showLargeText: true,
      chatFontSizePt: 36,
      useNicknameFontSize: false,
      nicknameFontSizePt: 13
    }
  });

  try {
    await harness.page.waitForFunction(() =>
      document.getElementById("chzzk-chat-ui-toggle-mini-chat-panel") instanceof HTMLElement
    );

    await harness.page.evaluate((storageKey) => {
      window.__storageHarness.failNextOptionsUpdate(80);
      updateMiniChatScale(10);
      window.__storageHarness.emitOptionsChange({
        ...window.__storageHarness.store[storageKey],
        useNicknameFontSize: true,
        nicknameFontSizePt: 24
      });
    }, STORAGE_KEY);

    await harness.page.waitForFunction(() =>
      document.documentElement.dataset.chzzkChatUiToggleNicknameFontSize === "on" &&
      Number(document.documentElement.dataset.chzzkChatUiToggleMiniFloatingChatScale) === 110
    );
    await harness.page.waitForTimeout(140);

    const result = await harness.page.evaluate((storageKey) => ({
      stored: window.__storageHarness.store[storageKey],
      datasetScale: Number(
        document.documentElement.dataset.chzzkChatUiToggleMiniFloatingChatScale
      ),
      nicknameToggle: document.documentElement.dataset.chzzkChatUiToggleNicknameFontSize,
      nicknameSize: Number(
        document.documentElement.dataset.chzzkChatUiToggleNicknameFontSizePt
      )
    }), STORAGE_KEY);

    assert.equal(result.stored.miniFloatingChatScale, 100);
    assert.equal(result.stored.useNicknameFontSize, true);
    assert.equal(result.stored.nicknameFontSizePt, 24);
    assert.equal(result.datasetScale, 100);
    assert.equal(result.nicknameToggle, "on");
    assert.equal(result.nicknameSize, 24);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("새 storage 변경 뒤 늦게 끝난 초기 읽기는 닉네임 설정을 되돌리지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    initialOptions: {
      showLargeText: true,
      chatFontSizePt: 36,
      useNicknameFontSize: false,
      nicknameFontSizePt: 13
    },
    storageGetDelayMs: 120,
    initialStorageChange: {
      showLargeText: true,
      chatFontSizePt: 36,
      useNicknameFontSize: true,
      nicknameFontSizePt: 24
    }
  });

  try {
    await harness.page.waitForTimeout(220);

    const result = await harness.page.evaluate((storageKey) => ({
      stored: window.__storageHarness.store[storageKey],
      nicknameToggle: document.documentElement.dataset.chzzkChatUiToggleNicknameFontSize,
      nicknameSize: Number(
        document.documentElement.dataset.chzzkChatUiToggleNicknameFontSizePt
      ),
      nicknameComputedSize: Number.parseFloat(
        getComputedStyle(document.querySelector("#nickname")).fontSize
      )
    }), STORAGE_KEY);

    assert.equal(result.stored.useNicknameFontSize, true);
    assert.equal(result.stored.nicknameFontSizePt, 24);
    assert.equal(result.nicknameToggle, "on");
    assert.equal(result.nicknameSize, 24);
    assert.ok(Math.abs(result.nicknameComputedSize - 32) <= 0.5);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("실제 background FIFO는 미니 patch 뒤 팝업 patch를 병합해 둘 다 보존한다", async () => {
  const harness = createBackgroundHarness({
    initialOptions: {
      useMiniFloatingChat: true,
      miniFloatingChatScale: 100,
      showLargeText: true,
      chatFontSizePt: 36,
      useNicknameFontSize: false,
      nicknameFontSizePt: 13
    },
    storageSetDelays: [80, 5]
  });

  const miniUpdate = harness.send({
    type: UPDATE_OPTIONS_MESSAGE,
    patch: { miniFloatingChatScale: 110 }
  });
  const popupUpdate = harness.send({
    type: UPDATE_OPTIONS_MESSAGE,
    patch: {
      useNicknameFontSize: true,
      nicknameFontSizePt: 24
    }
  });
  const [miniResult, popupResult] = await Promise.all([miniUpdate, popupUpdate]);
  const stored = harness.store[STORAGE_KEY];

  assert.equal(miniResult.ok, true);
  assert.equal(popupResult.ok, true);
  assert.equal(harness.writes.length, 2);
  assert.equal(harness.writes[1].options.miniFloatingChatScale, 110);
  assert.equal(harness.writes[1].options.useNicknameFontSize, true);
  assert.equal(harness.writes[1].options.nicknameFontSizePt, 24);
  assert.equal(stored.miniFloatingChatScale, 110);
  assert.equal(stored.useNicknameFontSize, true);
  assert.equal(stored.nicknameFontSizePt, 24);
});

test("게스트 채팅 저장 응답이 늦어도 저장된 최신 상태를 되돌리지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    html: createLocalOnlyChatDocument(),
    initialOptions: {
      useGuestChatFrame: false,
      showGuestChatToggleButton: true
    },
    optionsUpdateResponseDelays: [900]
  });

  try {
    await harness.page.evaluate((buttonId) => {
      const button = document.getElementById(buttonId);

      if (!(button instanceof HTMLButtonElement)) {
        throw new Error("guest chat toggle button fixture is missing");
      }

      window.__guestToggleDone = false;
      toggleGuestChatFrame(button).finally(() => {
        window.__guestToggleDone = true;
      });
    }, GUEST_CHAT_TOGGLE_BUTTON_ID);

    await harness.page.waitForFunction(() => window.__guestToggleDone === true);

    const result = await harness.page.evaluate((storageKey) => ({
      stored: window.__storageHarness.store[storageKey],
      rendered: currentOptions.useGuestChatFrame,
      dataset: document.documentElement.dataset.chzzkChatUiToggleGuestChatFrame,
      buttonPressed: document.querySelector("#chzzk-chat-ui-toggle-guest-chat-toggle")
        ?.getAttribute("aria-pressed")
    }), STORAGE_KEY);

    assert.equal(result.stored.useGuestChatFrame, true);
    assert.equal(result.rendered, true);
    assert.equal(result.dataset, "on");
    assert.equal(result.buttonPressed, "true");
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("늦은 게스트 채팅 READ 응답이 더 최신 storage 변경을 덮지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    html: createLocalOnlyChatDocument(),
    initialOptions: {
      useGuestChatFrame: false,
      useNicknameFontSize: false,
      nicknameFontSizePt: 13
    }
  });

  try {
    await harness.page.evaluate(({ storageKey, buttonId }) => {
      const button = document.getElementById(buttonId);

      if (!(button instanceof HTMLButtonElement)) {
        throw new Error("guest chat toggle button fixture is missing");
      }

      window.__storageHarness.delayNextOptionsRead(180);
      window.__guestReadRaceDone = false;
      toggleGuestChatFrame(button).finally(() => {
        window.__guestReadRaceDone = true;
      });

      window.setTimeout(() => {
        window.__storageHarness.emitOptionsChange({
          ...window.__storageHarness.store[storageKey],
          useGuestChatFrame: false,
          useNicknameFontSize: true,
          nicknameFontSizePt: 24
        });
      }, 20);
    }, { storageKey: STORAGE_KEY, buttonId: GUEST_CHAT_TOGGLE_BUTTON_ID });

    await harness.page.waitForFunction(() => window.__guestReadRaceDone === true);

    const result = await harness.page.evaluate((storageKey) => ({
      stored: window.__storageHarness.store[storageKey],
      renderedGuestFrame: currentOptions.useGuestChatFrame,
      renderedNicknameToggle: currentOptions.useNicknameFontSize,
      renderedNicknameSize: currentOptions.nicknameFontSizePt
    }), STORAGE_KEY);

    assert.equal(result.stored.useGuestChatFrame, false);
    assert.equal(result.stored.useNicknameFontSize, true);
    assert.equal(result.stored.nicknameFontSizePt, 24);
    assert.equal(result.renderedGuestFrame, false);
    assert.equal(result.renderedNicknameToggle, true);
    assert.equal(result.renderedNicknameSize, 24);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("늦은 미니 채팅 성공 응답이 더 최신 storage 변경을 덮지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    initialOptions: {
      useMiniFloatingChat: true,
      miniFloatingChatScale: 100,
      showLargeText: true,
      chatFontSizePt: 36,
      useNicknameFontSize: false,
      nicknameFontSizePt: 13
    }
  });

  try {
    await harness.page.waitForFunction(() =>
      document.getElementById("chzzk-chat-ui-toggle-mini-chat-panel") instanceof HTMLElement
    );

    await harness.page.evaluate((storageKey) => {
      window.__storageHarness.delayNextOptionsRead(180);
      updateMiniChatScale(10);

      window.setTimeout(() => {
        window.__storageHarness.emitOptionsChange({
          ...window.__storageHarness.store[storageKey],
          useNicknameFontSize: true,
          nicknameFontSizePt: 24
        });
      }, 20);
    }, STORAGE_KEY);

    await harness.page.waitForFunction(() =>
      window.__storageHarness.requested.length === 1 &&
      window.__storageHarness.pending === 0 &&
      document.documentElement.dataset.chzzkChatUiToggleNicknameFontSize === "on"
    );
    await harness.page.waitForTimeout(260);

    const result = await harness.page.evaluate((storageKey) => ({
      stored: window.__storageHarness.store[storageKey],
      datasetScale: Number(
        document.documentElement.dataset.chzzkChatUiToggleMiniFloatingChatScale
      ),
      nicknameToggle: document.documentElement.dataset.chzzkChatUiToggleNicknameFontSize,
      nicknameSize: Number(
        document.documentElement.dataset.chzzkChatUiToggleNicknameFontSizePt
      )
    }), STORAGE_KEY);

    assert.equal(result.stored.miniFloatingChatScale, 110);
    assert.equal(result.stored.useNicknameFontSize, true);
    assert.equal(result.stored.nicknameFontSizePt, 24);
    assert.equal(result.datasetScale, 110);
    assert.equal(result.nicknameToggle, "on");
    assert.equal(result.nicknameSize, 24);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("완료된 미니 patch는 뒤의 대기 patch에 다시 섞이지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    initialOptions: {
      useMiniFloatingChat: true,
      miniFloatingChatScale: 100,
      miniFloatingChatBounds: {
        left: 700,
        top: 200,
        width: 360,
        height: 520
      }
    },
    optionsUpdateResponseDelays: [100, 350]
  });

  try {
    await harness.page.waitForFunction(() =>
      document.querySelector("#chzzk-chat-ui-toggle-mini-chat-panel") instanceof HTMLElement
    );

    await harness.page.evaluate((storageKey) => {
      const nextBounds = {
        left: 640,
        top: 160,
        width: 380,
        height: 500
      };

      window.__queuedMiniWritesDone = false;
      Promise.all([
        updateMiniChatOptions({ miniFloatingChatScale: 110 }, "mini-test-scale"),
        updateMiniChatOptions({ miniFloatingChatBounds: nextBounds }, "mini-test-bounds")
      ]).finally(() => {
        window.__queuedMiniWritesDone = true;
      });

      window.setTimeout(() => {
        window.__storageHarness.emitOptionsChange({
          ...window.__storageHarness.store[storageKey],
          miniFloatingChatScale: 90
        });
      }, 20);
    }, STORAGE_KEY);

    await harness.page.waitForFunction(() =>
      window.__storageHarness.requested.length === 2 &&
      window.__storageHarness.pending === 0 &&
      miniChatOptionsWriteInFlight === true
    );

    const pendingResult = await harness.page.evaluate(() => ({
      datasetScale: Number(
        document.documentElement.dataset.chzzkChatUiToggleMiniFloatingChatScale
      ),
      queuedPatch: miniChatOptionsOptimisticPatch,
      writeInFlight: miniChatOptionsWriteInFlight
    }));

    assert.equal(pendingResult.datasetScale, 90);
    assert.equal(pendingResult.queuedPatch.miniFloatingChatScale, undefined);
    assert.ok(pendingResult.queuedPatch.miniFloatingChatBounds);
    assert.equal(pendingResult.writeInFlight, true);

    await harness.page.waitForFunction(() => window.__queuedMiniWritesDone === true);

    const settledResult = await harness.page.evaluate((storageKey) => ({
      storedScale: window.__storageHarness.store[storageKey].miniFloatingChatScale,
      datasetScale: Number(
        document.documentElement.dataset.chzzkChatUiToggleMiniFloatingChatScale
      )
    }), STORAGE_KEY);

    assert.equal(settledResult.storedScale, 90);
    assert.equal(settledResult.datasetScale, 90);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("미니 버블 복원 저장이 미확정 timeout이어도 다시 최소화하지 않는다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    initialOptions: {
      useMiniFloatingChat: true,
      miniFloatingChatScale: 100,
      miniFloatingChatBounds: {
        left: 700,
        top: 200,
        width: 360,
        height: 520
      }
    },
    storageSetDelays: [1600]
  });

  try {
    await harness.page.waitForFunction(() =>
      document.querySelector("#chzzk-chat-ui-toggle-mini-chat-panel") instanceof HTMLElement
    );

    await harness.page.evaluate(() => {
      const panel = document.querySelector("#chzzk-chat-ui-toggle-mini-chat-panel");

      minimizeMiniFloatingChatToBubble(panel);
      window.__miniBubbleRestoreDone = false;
      restoreMiniFloatingChatFromBubble().finally(() => {
        window.__miniBubbleRestoreDone = true;
      });
    });

    await harness.page.waitForFunction(() => window.__miniBubbleRestoreDone === true);

    const timeoutResult = await harness.page.evaluate(() => ({
      minimized: miniChatMinimized,
      bubbleExists: Boolean(document.querySelector("#chzzk-chat-ui-toggle-mini-chat-bubble")),
      panelExists: Boolean(document.querySelector("#chzzk-chat-ui-toggle-mini-chat-panel"))
    }));

    assert.equal(timeoutResult.minimized, false);
    assert.equal(timeoutResult.bubbleExists, false);
    assert.equal(timeoutResult.panelExists, true);

    await harness.page.waitForFunction(() =>
      window.__storageHarness.pending === 0 &&
      document.querySelector("#chzzk-chat-ui-toggle-mini-chat-panel") instanceof HTMLElement
    );

    const settledResult = await harness.page.evaluate((storageKey) => ({
      minimized: miniChatMinimized,
      bubbleExists: Boolean(document.querySelector("#chzzk-chat-ui-toggle-mini-chat-bubble")),
      panelExists: Boolean(document.querySelector("#chzzk-chat-ui-toggle-mini-chat-panel")),
      storedBounds: window.__storageHarness.store[storageKey].miniFloatingChatBounds,
      currentBounds: currentOptions.miniFloatingChatBounds
    }), STORAGE_KEY);

    assert.equal(settledResult.minimized, false);
    assert.equal(settledResult.bubbleExists, false);
    assert.equal(settledResult.panelExists, true);
    assert.deepEqual(settledResult.currentBounds, settledResult.storedBounds);
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});

test("오디오 컴프레서는 주 영상에 설정값을 적용하고 끄면 원음 경로로 우회한다", { timeout: 15_000 }, async () => {
  const harness = await createHarness({
    html: `<!doctype html>
      <html lang="ko">
        <head><meta charset="utf-8"><title>Audio compressor fixture</title></head>
        <body>
          <div id="live_player_layout">
            <div class="pzp-pc"><video id="primary-video"></video></div>
          </div>
        </body>
      </html>`,
    initialOptions: {
      useAudioCompressor: true,
      audioCompressorThreshold: -42,
      audioCompressorKnee: 24,
      audioCompressorRatio: 8,
      audioCompressorAttack: 0.03,
      audioCompressorRelease: 0.4,
      audioCompressorGain: 1.35
    }
  });

  try {
    await harness.page.mouse.click(10, 10);
    await harness.page.waitForFunction(() =>
      document.documentElement.dataset.chzzkChatUiToggleAudioCompressorState === "on"
    );

    const enabled = await harness.page.evaluate(() => ({
      state: document.documentElement.dataset.chzzkChatUiToggleAudioCompressorState,
      videoId: audioCompressorState.video?.id,
      threshold: audioCompressorState.compressor?.threshold.value,
      knee: audioCompressorState.compressor?.knee.value,
      ratio: audioCompressorState.compressor?.ratio.value,
      attack: audioCompressorState.compressor?.attack.value,
      release: audioCompressorState.compressor?.release.value,
      gain: audioCompressorState.gain?.gain.value
    }));

    assert.equal(enabled.state, "on");
    assert.equal(enabled.videoId, "primary-video");
    assert.equal(enabled.threshold, -42);
    assert.equal(enabled.knee, 24);
    assert.equal(enabled.ratio, 8);
    assert.ok(Math.abs(enabled.attack - 0.03) < 0.001);
    assert.ok(Math.abs(enabled.release - 0.4) < 0.001);
    assert.ok(Math.abs(enabled.gain - 1.35) < 0.001);

    await harness.page.evaluate(() => {
      applyOptions({
        ...currentOptions,
        useAudioCompressor: false
      });
    });
    await harness.page.waitForFunction(() =>
      document.documentElement.dataset.chzzkChatUiToggleAudioCompressorState === "off"
    );

    const disabled = await harness.page.evaluate(() => ({
      state: document.documentElement.dataset.chzzkChatUiToggleAudioCompressorState,
      error: audioCompressorState.lastError
    }));

    assert.equal(disabled.state, "off");
    assert.equal(disabled.error, "");
    assertNoPageErrors(harness.pageErrors);
  } finally {
    await harness.close();
  }
});
