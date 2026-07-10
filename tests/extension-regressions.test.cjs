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
const STORAGE_KEY = "chzzkChatUiToggleOptions";
const READ_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_READ_OPTIONS";
const UPDATE_OPTIONS_MESSAGE = "CHZZK_CHAT_UI_TOGGLE_UPDATE_OPTIONS";
const LIVE_URL = `https://chzzk.naver.com/live/${"a".repeat(32)}`;

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
      document.querySelector(
        '#chzzk-chat-ui-toggle-mini-chat-panel [data-mini-chat-scale-delta="10"]'
      ) instanceof HTMLButtonElement
    );

    await harness.page.evaluate(() => {
      window.__storageHarness.resetLogs();
      const scaleUp = document.querySelector(
        '#chzzk-chat-ui-toggle-mini-chat-panel [data-mini-chat-scale-delta="10"]'
      );

      scaleUp.click();
      scaleUp.click();
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
      document.querySelector(
        '#chzzk-chat-ui-toggle-mini-chat-panel [data-mini-chat-scale-delta="10"]'
      ) instanceof HTMLButtonElement
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
      document.querySelector(
        '#chzzk-chat-ui-toggle-mini-chat-panel [data-mini-chat-scale-delta="10"]'
      ).click();
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
      document.querySelector(
        '#chzzk-chat-ui-toggle-mini-chat-panel [data-mini-chat-scale-delta="10"]'
      ) instanceof HTMLButtonElement
    );

    await harness.page.evaluate((storageKey) => {
      window.__storageHarness.failNextOptionsUpdate(80);
      document.querySelector(
        '#chzzk-chat-ui-toggle-mini-chat-panel [data-mini-chat-scale-delta="10"]'
      ).click();
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
    initialOptions: {
      useGuestChatFrame: false,
      showGuestChatToggleButton: true
    },
    optionsUpdateResponseDelays: [900]
  });

  try {
    await harness.page.evaluate(() => {
      const button = createGuestChatToggleButton();
      document.body.append(button);
      window.__guestToggleDone = false;
      toggleGuestChatFrame(button).finally(() => {
        window.__guestToggleDone = true;
      });
    });

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
    initialOptions: {
      useGuestChatFrame: false,
      useNicknameFontSize: false,
      nicknameFontSizePt: 13
    }
  });

  try {
    await harness.page.evaluate((storageKey) => {
      const button = createGuestChatToggleButton();
      document.body.append(button);
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
    }, STORAGE_KEY);

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
      document.querySelector(
        '#chzzk-chat-ui-toggle-mini-chat-panel [data-mini-chat-scale-delta="10"]'
      ) instanceof HTMLButtonElement
    );

    await harness.page.evaluate((storageKey) => {
      window.__storageHarness.delayNextOptionsRead(180);
      document.querySelector(
        '#chzzk-chat-ui-toggle-mini-chat-panel [data-mini-chat-scale-delta="10"]'
      ).click();

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
