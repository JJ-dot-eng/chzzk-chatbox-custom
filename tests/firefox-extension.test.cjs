const assert = require("node:assert/strict");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { after, before, test } = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..");
const TEMP_ROOT = path.join(REPO_ROOT, ".tmp", "firefox-port");
const STORAGE_KEY = "chzzkChatUiToggleOptions";
const EXTENSION_UUID = "2f1ab420-2733-47ef-b6c2-797c7280be51";
const LIVE_URL = `https://chzzk.naver.com/live/${"a".repeat(32)}`;
const RANDOM_NAME_ATTR = "data-chzzk-chat-ui-toggle-random-name";
const MINI_FRAME_ID = "chzzk-chat-ui-toggle-mini-chat-frame";
let browserProcess;
let bidi;
let page;
let popup;
let runDirectory;
const pageErrors = [];
const interceptedRequests = [];
const eventHandlers = new Map();

function resolveFirefoxExecutable() {
  const registry = JSON.parse(fs.readFileSync(
    path.join(REPO_ROOT, "node_modules", "playwright-core", "browsers.json"), "utf8"
  ));
  const revision = registry.browsers.find((entry) => entry.name === "firefox").revision;
  const candidates = [
    path.join(TEMP_ROOT, "browsers", `firefox-${revision}`, "firefox", "firefox.exe"),
    path.join(TEMP_ROOT, "browsers", `firefox-${revision}`, "firefox", "firefox")
  ];
  const executable = candidates.find((candidate) => fs.existsSync(candidate));
  assert.ok(executable,
    "저장소 안의 Firefox가 필요합니다. PLAYWRIGHT_BROWSERS_PATH=.tmp/firefox-port/browsers로 playwright-core install firefox를 실행하세요.");
  return executable;
}

async function reservePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function connectBidi(port) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/session`);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Firefox BiDi connection timed out")), 10_000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Firefox BiDi connection failed")); }, { once: true });
  });
  const pending = new Map();
  let nextId = 0;
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.type === "event") {
      eventHandlers.get(message.method)?.(message.params);
      return;
    }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.type === "error") request.reject(new Error(`${message.error}: ${message.message}`));
    else request.resolve(message.result);
  });
  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`${method} timed out`));
        }, 15_000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); }
  };
}

function browserPage(popupContext) {
  const evaluate = async (fn, argument) => {
    const result = await bidi.send("script.evaluate", {
      expression: `Promise.resolve((${fn.toString()})(${JSON.stringify(argument) ?? "undefined"})).then(value => JSON.stringify(value) ?? "null")`,
      target: { context: popupContext }, awaitPromise: true
    });
    assert.equal(result.type, "success", JSON.stringify(result));
    return JSON.parse(result.result.value);
  };
  return {
    id: popupContext,
    evaluate,
    goto: (url) => bidi.send("browsingContext.navigate", { context: popupContext, url, wait: "complete" }),
    reload: () => bidi.send("browsingContext.reload", { context: popupContext, wait: "complete" }),
    locator(selector) {
      return {
        click: () => evaluate((selector) => document.querySelector(selector).click(), selector),
        setChecked: (checked) => evaluate(({ selector, checked }) => {
          const input = document.querySelector(selector);
          if (input.checked !== checked) input.click();
        }, { selector, checked }),
        isDisabled: () => evaluate((selector) => document.querySelector(selector).disabled, selector),
        textContent: () => evaluate((selector) => document.querySelector(selector).textContent, selector),
        getAttribute: (attribute) => evaluate(({ selector, attribute }) => document.querySelector(selector).getAttribute(attribute), { selector, attribute }),
        isVisible: () => evaluate((selector) => {
          const element = document.querySelector(selector);
          return Boolean(element?.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
        }, selector),
        count: () => evaluate((selector) => document.querySelectorAll(selector).length, selector),
        waitFor: () => waitForFunction((selector) => Boolean(document.querySelector(selector)), selector)
      };
    },
    waitForFunction,
    async screenshot({ path: filename }) {
      const { data } = await bidi.send("browsingContext.captureScreenshot", { context: popupContext, origin: "document" });
      fs.writeFileSync(filename, Buffer.from(data, "base64"));
    }
  };
  async function waitForFunction(fn, argument) {
    const deadline = Date.now() + 10_000;
    while (!(await evaluate(fn, argument))) {
      assert.ok(Date.now() < deadline, `Firefox condition timed out: ${fn.toString()}`);
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
}

function stageExtension() {
  const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "manifest.firefox.json"), "utf8"));
  const directory = path.join(runDirectory, "extension");
  fs.mkdirSync(directory);
  const files = new Set([
    ...manifest.background.scripts,
    ...manifest.content_scripts.flatMap((entry) => [...(entry.js || []), ...(entry.css || [])]),
    ...Object.values(manifest.icons),
    manifest.action.default_popup,
    "popup.js", "popup.css"
  ]);
  for (const file of files) {
    const source = path.resolve(REPO_ROOT, file);
    const destination = path.resolve(directory, file);
    assert.ok(source.startsWith(`${REPO_ROOT}${path.sep}`));
    assert.ok(destination.startsWith(`${directory}${path.sep}`));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
  fs.writeFileSync(path.join(directory, "manifest.json"), JSON.stringify(manifest, null, 2));
  return { directory, manifest };
}

function chatFixture() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
    <title>Firefox CHZZK local fixture</title><style>
    html,body { margin: 0; background: #fff; color: #111; font: 14px sans-serif; }
    #aside-chatting { width: 400px; min-height: 360px; }
    header { display: flex; align-items: center; height: 48px; }
    [role="log"] { min-height: 200px; }
    .live_chatting_list_item { display: flex; align-items: center; gap: 6px; min-height: 36px; }
    button { color: inherit; font: inherit; }
    #badge { width: 14px; height: 14px; }
    textarea { width: 300px; height: 36px; }
    </style></head><body><aside id="aside-chatting">
      <header class="live_chatting_header_container">채팅 <button type="button" aria-label="설정">설정</button></header>
      <div class="live_chatting_list" role="log"><div id="chat-row" class="live_chatting_list_item">
        <span id="timestamp" class="live_chatting_message_time">12:34</span>
        <span id="badge" class="live_chatting_badge" aria-label="배지">◆</span>
        <button type="button" class="live_chatting_message_nickname"><span id="nickname" class="live_chatting_username_nickname">테스터</span></button>
        <div class="live_chatting_message_container"><span id="message" class="live_chatting_message_text">Firefox 테스트 채팅</span></div>
      </div></div>
      <div class="live_chatting_input_container"><textarea placeholder="채팅 입력"></textarea><button type="button">채팅</button></div>
    </aside></body></html>`;
}

async function updateOptions(patch) {
  const response = await popup.evaluate((patch) => browser.runtime.sendMessage({
    type: "CHZZK_CHAT_UI_TOGGLE_UPDATE_OPTIONS", patch
  }), patch);
  assert.equal(response?.ok, true, JSON.stringify(response));
  return response.options;
}

before(async () => {
  fs.mkdirSync(TEMP_ROOT, { recursive: true });
  runDirectory = fs.mkdtempSync(path.join(TEMP_ROOT, "smoke-"));
  const { directory, manifest } = stageExtension();
  const extensionId = manifest.browser_specific_settings.gecko.id;
  const port = await reservePort();
  const profile = path.join(runDirectory, "profile");
  fs.mkdirSync(profile);
  const preferences = {
    "extensions.webextensions.uuids": JSON.stringify({ [extensionId]: EXTENSION_UUID }),
    "remote.active-protocols": 1,
    "browser.shell.checkDefaultBrowser": false,
    "browser.startup.homepage_override.mstone": "ignore",
    "browser.startup.page": 0,
    "app.update.auto": false,
    "toolkit.telemetry.reportingpolicy.firstRun": false,
    "datareporting.policy.dataSubmissionEnabled": false
  };
  fs.writeFileSync(path.join(profile, "user.js"), Object.entries(preferences)
    .map(([key, value]) => `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`).join("\n"));
  browserProcess = spawn(resolveFirefoxExecutable(), ["-headless", "-no-remote", "-profile", profile,
    `--remote-debugging-port=${port}`, "--remote-allow-system-access"], {
    cwd: REPO_ROOT, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, TMP: runDirectory, TEMP: runDirectory, TMPDIR: runDirectory }
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Firefox startup timed out")), 15_000);
    const onOutput = (chunk) => {
      if (String(chunk).includes("WebDriver BiDi listening")) { clearTimeout(timer); resolve(); }
    };
    browserProcess.stdout.on("data", onOutput);
    browserProcess.stderr.on("data", onOutput);
    browserProcess.once("error", (error) => { clearTimeout(timer); reject(error); });
  });
  bidi = await connectBidi(port);
  await bidi.send("session.new", { capabilities: { alwaysMatch: { acceptInsecureCerts: true } } });
  eventHandlers.set("network.beforeRequestSent", (event) => {
    if (!event.isBlocked) return;
    const request = event.request;
    interceptedRequests.push({ method: request.method, url: request.url });
    const response = new URL(request.url).origin === "https://chzzk.naver.com"
      ? bidi.send("network.provideResponse", {
        request: request.request, statusCode: 200,
        headers: [{ name: "content-type", value: { type: "string", value: "text/html; charset=utf-8" } }],
        body: { type: "string", value: chatFixture() }
      })
      : bidi.send("network.failRequest", { request: request.request });
    response.catch((error) => pageErrors.push(error.message));
  });
  eventHandlers.set("log.entryAdded", (entry) => {
    if (entry.level === "error" && entry.type === "javascript") pageErrors.push(entry.text);
  });
  await bidi.send("session.subscribe", { events: ["network.beforeRequestSent", "log.entryAdded"] });
  await bidi.send("network.addIntercept", { phases: ["beforeRequestSent"], urlPatterns: [
    { type: "pattern", protocol: "https" }, { type: "pattern", protocol: "http" }
  ] });
  const installed = await bidi.send("webExtension.install", { extensionData: { type: "path", path: directory } });
  assert.equal(installed.extension, extensionId);
  // Separate windows avoid the bundled Firefox's headless tab-creation limitation.
  page = browserPage((await bidi.send("browsingContext.create", { type: "window" })).context);
  await bidi.send("browsingContext.setViewport", { context: page.id, viewport: { width: 1100, height: 800 } });
  await page.goto(LIVE_URL);
  await page.waitForFunction(() => document.documentElement.dataset.chzzkChatUiToggleReady === "true");
  popup = browserPage((await bidi.send("browsingContext.create", { type: "window" })).context);
  await popup.goto(`moz-extension://${EXTENSION_UUID}/${manifest.action.default_popup}`);
  // Load the popup document in the fixture's window while that CHZZK tab stays active,
  // matching the active-tab lookup performed by a toolbar popup.
  const bootstrapPopup = popup;
  await bootstrapPopup.evaluate(async (fixtureUrl) => {
    const tabs = await browser.tabs.query({});
    const fixture = tabs.find((tab) => tab.url === fixtureUrl);
    await browser.tabs.update(fixture.id, { active: true });
    await browser.tabs.create({ windowId: fixture.windowId, url: browser.runtime.getURL("popup.html"), active: false });
  }, LIVE_URL);
  let actualPopup;
  for (let attempt = 0; attempt < 100 && !actualPopup; attempt += 1) {
    const popupTree = await bidi.send("browsingContext.getTree");
    actualPopup = popupTree.contexts.find((entry) => entry.context !== bootstrapPopup.id && entry.url.startsWith("moz-extension://"));
    if (!actualPopup) await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.ok(actualPopup);
  popup = browserPage(actualPopup.context);
  await bidi.send("browsingContext.close", { context: bootstrapPopup.id });
  await popup.waitForFunction(() => document.querySelector("#statusLabel")?.textContent !== "준비 중");
}, { timeout: 30_000 });

after(async () => {
  if (bidi) await bidi.send("browser.close").catch(() => {});
  bidi?.close();
  if (browserProcess && browserProcess.exitCode === null) browserProcess.kill();
});

test("Firefox에 실제 확장을 설치하고 팝업에서 닉네임·배지·시간을 각각 켜고 끈다", async () => {
  await popup.locator('[data-goto="visibility"]').click();
  const options = ["showNicknames", "showBadges", "showTimestamps"];
  for (let mask = 0; mask < 8; mask += 1) {
    const visible = options.map((option, index) => Boolean(mask & (1 << index)));
    for (let index = 0; index < options.length; index += 1) {
      await popup.locator(`[data-option="${options[index]}"]`).setChecked(visible[index]);
    }
    await page.waitForFunction((expected) => ["nickname", "badge", "timestamp"].every((id, index) => {
      const element = document.getElementById(id);
      const displayed = element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
      return displayed === expected[index];
    }), visible);
    assert.equal(await page.locator("#message").textContent(), "Firefox 테스트 채팅");
    assert.equal(await page.locator("#message").isVisible(), true);
  }
  const stored = await popup.evaluate((key) => browser.storage.local.get(key), STORAGE_KEY);
  assert.equal(stored[STORAGE_KEY].showNicknames, true);
  assert.equal(stored[STORAGE_KEY].showBadges, true);
  assert.equal(stored[STORAGE_KEY].showTimestamps, true);
});

test("Firefox storage.session 별명이 같은 탭의 미니 채팅과 새로고침 후에도 일치한다", async () => {
  await updateOptions({ useRandomNicknames: true, randomNicknameMode: "custom", randomNicknamePrefix: "파폭", useMiniFloatingChat: true });
  await page.waitForFunction((attribute) => document.getElementById("nickname").hasAttribute(attribute), RANDOM_NAME_ATTR);
  const originalAlias = await page.locator("#nickname").getAttribute(RANDOM_NAME_ATTR);
  assert.match(originalAlias, /^파폭 \d+$/);
  await page.locator(`#${MINI_FRAME_ID}`).waitFor();
  const tree = await bidi.send("browsingContext.getTree", { root: page.id });
  const frameContext = tree.contexts[0].children.find((child) => child.url.includes("chzzkChatUiToggleMini"));
  assert.ok(frameContext);
  const frame = browserPage(frameContext.context);
  await frame.waitForFunction((attribute) => document.getElementById("nickname")?.hasAttribute(attribute), RANDOM_NAME_ATTR);
  assert.equal(await frame.locator("#nickname").getAttribute(RANDOM_NAME_ATTR), originalAlias);
  const session = await popup.evaluate(() => browser.storage.session.get(null));
  const allocated = Object.entries(session).filter(([key]) => key.startsWith("randomNames:") && key.endsWith(":name:테스터"));
  assert.equal(allocated.length, 1, "메인과 미니 프레임은 하나의 별명 배분을 공유해야 합니다");
  await page.reload();
  await page.waitForFunction(({ attribute, alias }) => document.getElementById("nickname")?.getAttribute(attribute) === alias,
    { attribute: RANDOM_NAME_ATTR, alias: originalAlias });
  assert.equal(await page.locator("#nickname").textContent(), "테스터", "원래 닉네임 데이터는 보존되어야 합니다");
});

test("Firefox의 미지원 나만 보기 모드를 안내하고 미니 채팅은 계속 사용할 수 있다", async (t) => {
  await popup.locator('[data-view="visibility"] [data-back]').click();
  await popup.locator('[data-goto="chat-mode"]').click();
  assert.equal(await popup.locator("#useGuestChatFrame").isDisabled(), true);
  assert.equal(await page.locator("#chzzk-chat-ui-toggle-guest-chat-toggle").count(), 0);
  assert.match(await popup.locator("#guestChatModeHint").textContent(), /이 브라우저에서는 지원되지 않습니다/);
  await updateOptions({ useGuestChatFrame: true, useMiniFloatingChat: true });
  await page.locator(`#${MINI_FRAME_ID}`).waitFor();
  assert.equal(await page.locator("#chzzk-chat-ui-toggle-guest-chat-frame").count(), 0);
  await page.screenshot({ path: path.join(runDirectory, "firefox-chat.png"), fullPage: true });
  // Background extension tabs throttle animations; finish the transition before the screenshot.
  await popup.evaluate(() => document.getAnimations().forEach((animation) => animation.finish()));
  await popup.screenshot({ path: path.join(runDirectory, "firefox-popup.png"), fullPage: true });
  assert.deepEqual(pageErrors, [], "실제 Firefox 확장 페이지와 콘텐츠 스크립트에 오류가 없어야 합니다");
  assert.ok(interceptedRequests.length > 0);
  assert.ok(interceptedRequests.every((request) => request.method === "GET"), "fixture 실행 중 쓰기 요청이 없어야 합니다");
  t.diagnostic(`Firefox screenshots: ${runDirectory}`);
});
