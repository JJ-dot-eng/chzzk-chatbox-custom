const { mkdirSync } = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright-core");

const CDP_URL = process.env.EDGE_CDP_URL || "http://127.0.0.1:9333";
const LIVE_URL =
  process.env.CHZZK_LIVE_URL ||
  "https://chzzk.naver.com/live/1b0561f3051c10a24b9d8ec9a6cb3374";
const STORAGE_KEY = "chzzkChatUiToggleOptions";
const ROLE_ATTR = "data-chzzk-chat-ui-toggle-role";
const OUTPUT_DIR = path.join(process.cwd(), "output", "playwright");

const onOptions = {
  showNicknames: true,
  showBadges: true,
  showTimestamps: true
};

const offOptions = {
  showNicknames: false,
  showBadges: false,
  showTimestamps: false
};

function summarizeFrameState(frameStates) {
  return frameStates.reduce(
    (summary, state) => {
      for (const key of ["nickname", "badge", "timestamp"]) {
        summary.counts[key] += state.counts[key] || 0;
        summary.hidden[key] += state.hidden[key] || 0;
        summary.visible[key] += state.visible[key] || 0;
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
      visible: { nickname: 0, badge: 0, timestamp: 0 }
    }
  );
}

async function collectFrameStates(page) {
  const states = [];

  for (const frame of page.frames()) {
    try {
      const state = await frame.evaluate((roleAttr) => {
        const roles = ["nickname", "badge", "timestamp"];
        const counts = {};
        const hidden = {};
        const visible = {};
        const samples = {};

        for (const role of roles) {
          const elements = [...document.querySelectorAll(`[${roleAttr}~="${role}"]`)];
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

        return {
          url: location.href,
          title: document.title,
          readyState: document.readyState,
          hasStyle: Boolean(document.getElementById("chzzk-chat-ui-toggle-style")),
          hasRootDataset: document.documentElement.hasAttribute("data-chzzk-chat-ui-toggle-nicknames"),
          rootDataset: {
            nicknames: document.documentElement.dataset.chzzkChatUiToggleNicknames || null,
            badges: document.documentElement.dataset.chzzkChatUiToggleBadges || null,
            timestamps: document.documentElement.dataset.chzzkChatUiToggleTimestamps || null
          },
          counts,
          hidden,
          visible,
          samples
        };
      }, ROLE_ATTR);

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
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-on-before.png"), fullPage: false });

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
    waitUntil: "domcontentloaded",
    timeout: 15000
  });

  for (const id of ["showNicknames", "showBadges", "showTimestamps"]) {
    await popup.locator(`#${id}`).setChecked(false);
  }

  await page.bringToFront();
  await page.waitForTimeout(1500);
  const off = {
    states: await collectFrameStates(page)
  };
  off.summary = summarizeFrameState(off.states);
  assertSummary("popup off state", off.summary);
  assertOffState(off.summary);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "chzzk-live-off.png"), fullPage: false });

  await popup.bringToFront();
  for (const id of ["showNicknames", "showBadges", "showTimestamps"]) {
    await popup.locator(`#${id}`).setChecked(true);
  }

  await page.bringToFront();
  await page.waitForTimeout(1500);
  const onAfter = {
    states: await collectFrameStates(page)
  };
  onAfter.summary = summarizeFrameState(onAfter.states);
  assertSummary("popup on state", onAfter.summary);
  assertOnState(onAfter.summary);
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
          "output/playwright/chzzk-live-off.png",
          "output/playwright/chzzk-live-on-after.png"
        ],
        summaries: {
          before: before.summary,
          off: off.summary,
          onAfter: onAfter.summary
        },
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
