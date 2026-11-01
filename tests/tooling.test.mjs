import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { validateContentScripts } from "../tools/lib/manifest-content-scripts.mjs";
import { runPowerShell } from "../tools/run-powershell.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));

async function fixture(t, missingFile) {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "chzzk-tooling-"));
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  const fixtureManifest = structuredClone(manifest);
  fixtureManifest.content_scripts.push({
    matches: ["https://chzzk.naver.com/live/*"],
    js: ["extra/second.js"],
    css: ["extra/second.css"]
  });
  for (const entry of fixtureManifest.content_scripts) {
    for (const file of [...entry.js, ...entry.css]) {
      if (file === missingFile) continue;
      const target = path.join(fixtureRoot, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, "");
    }
  }
  return { manifest: fixtureManifest, root: fixtureRoot };
}

test("실제 매니페스트의 모든 content_scripts 검증이 통과한다", async () => {
  await validateContentScripts(manifest, { root });
});

test("두 항목의 파일이 모두 존재하면 추가 항목의 기본 옵션 생략을 허용한다", async (t) => {
  const source = await fixture(t);
  await validateContentScripts(source.manifest, source);
  const second = source.manifest.content_scripts[1];
  for (const runAt of ["document_start", "document_end", "document_idle"]) {
    second.run_at = runAt;
    second.all_frames = false;
    await validateContentScripts(source.manifest, source);
  }
  delete second.css;
  await validateContentScripts(source.manifest, source);
  second.css = ["extra/second.css"];
  delete second.js;
  await validateContentScripts(source.manifest, source);
});

for (const type of ["js", "css"]) {
  test(`두 번째 항목의 ${type} 파일이 없으면 인덱스와 파일명을 포함해 실패한다`, async (t) => {
    const file = `extra/second.${type}`;
    const source = await fixture(t, file);
    await assert.rejects(validateContentScripts(source.manifest, source), {
      message: `content_scripts[1].${type} file not found: ${file}`
    });
  });
}

const invalidSecondEntries = [
  ["null 항목", null, /content_scripts\[1\] must be an object/],
  ["배열 항목", [], /content_scripts\[1\] must be an object/],
  ["문자열 항목", "second.js", /content_scripts\[1\] must be an object/],
  ["matches 생략", { matches: undefined }, /content_scripts\[1\]\.matches/],
  ["빈 matches", { matches: [] }, /content_scripts\[1\]\.matches/],
  ["문자열 matches", { matches: "https://chzzk.naver.com/*" }, /content_scripts\[1\]\.matches/],
  ["문자열이 아닌 match", { matches: [42] }, /content_scripts\[1\]\.matches/],
  ["다른 호스트", { matches: ["https://example.com/*"] }, /content_scripts\[1\]\.matches/],
  ["유사 호스트", { matches: ["https://chzzk.naver.com.example.com/*"] }, /content_scripts\[1\]\.matches/],
  ["다른 프로토콜", { matches: ["http://chzzk.naver.com/*"] }, /content_scripts\[1\]\.matches/],
  ["잘못된 run_at", { run_at: "later" }, /content_scripts\[1\]\.run_at/],
  ["잘못된 all_frames", { all_frames: "true" }, /content_scripts\[1\]\.all_frames/],
  ["파일 없음", { js: [], css: [] }, /content_scripts\[1\] must have at least one/],
  ["js 배열 아님", { js: "extra/second.js" }, /content_scripts\[1\]\.js must be an array/],
  ["css 배열 아님", { css: null }, /content_scripts\[1\]\.css must be an array/],
  ["빈 js 경로", { js: [" "] }, /content_scripts\[1\]\.js paths/],
  ["문자열이 아닌 css 경로", { css: [42] }, /content_scripts\[1\]\.css paths/],
  ["절대 경로", { js: ["/second.js"] }, /content_scripts\[1\]\.js path must be relative/],
  ["Windows 절대 경로", { js: ["C:\\second.js"] }, /content_scripts\[1\]\.js path must be relative/],
  ["외부 URL 경로", { js: ["https://example.com/second.js"] }, /content_scripts\[1\]\.js path must be relative/],
  ["상위 디렉터리 경로", { css: ["../second.css"] }, /content_scripts\[1\]\.css path must be relative/],
  ["디렉터리 참조", { js: ["extra"] }, /content_scripts\[1\]\.js file not found/]
];

for (const [label, change, expectedError] of invalidSecondEntries) {
  test(`두 번째 항목 거부: ${label}`, async (t) => {
    const source = await fixture(t);
    source.manifest.content_scripts[1] = change === null || Array.isArray(change) || typeof change !== "object"
      ? change
      : { ...source.manifest.content_scripts[1], ...change };
    await assert.rejects(validateContentScripts(source.manifest, source), expectedError);
  });
}

test("첫 항목의 엄격한 matches·시점·프레임·CSS·JS 순서 조건을 유지한다", async (t) => {
  const source = await fixture(t);
  const original = structuredClone(source.manifest.content_scripts[0]);
  for (const change of [
    { matches: ["https://chzzk.naver.com/live/*"] },
    { run_at: "document_end" },
    { all_frames: false },
    { css: ["content.css", "extra/second.css"] },
    { js: [...original.js].reverse() }
  ]) {
    source.manifest.content_scripts[0] = { ...original, ...change };
    await assert.rejects(validateContentScripts(source.manifest, source), /content_scripts\[0\]/);
  }
});

test("content_scripts는 비어 있지 않은 배열이어야 한다", async () => {
  for (const contentScripts of [undefined, null, [], {}]) {
    await assert.rejects(
      validateContentScripts({ ...manifest, content_scripts: contentScripts }, { root }),
      /manifest.content_scripts must be a non-empty array/
    );
  }
});

test("검증 CLI가 저장소 루트에서 종료 코드 0을 반환한다", () => {
  const result = spawnSync(process.execPath, ["tools/validate-extension.mjs"], { cwd: root, stdio: "inherit" });
  assert.ifError(result.error);
  assert.equal(result.status, 0);
});

test("npm 스크립트가 모든 OS용 npm과 Node PowerShell 실행기를 사용한다", () => {
  for (const script of Object.values(packageJson.scripts)) assert(!script.includes("npm.cmd"));
  assert(packageJson.scripts.check.endsWith("&& npm test"));
  assert.equal(packageJson.scripts.package, "npm run check && node tools/run-powershell.mjs tools/package-extension.ps1");
  assert.equal(packageJson.scripts.test, "node --test tests/extension-regressions.test.cjs tests/tooling.test.mjs");
});

test("PowerShell 실행기는 OS에 맞는 명령·인자를 사용하고 출력과 종료 코드를 전달한다", () => {
  for (const [platform, command] of [["win32", "powershell"], ["linux", "pwsh"], ["darwin", "pwsh"]]) {
    const env = { PATH: "" };
    const script = "tools/package extension.ps1";
    const status = runPowerShell(script, {
      platform,
      env,
      spawn(actualCommand, args, options) {
        assert.equal(actualCommand, command);
        assert.deepEqual(args, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script]);
        assert.deepEqual(options, { env, stdio: "inherit", shell: false });
        return { status: 23 };
      }
    });
    assert.equal(status, 23);
  }
  assert.equal(runPowerShell("test.ps1", { spawn: () => ({ status: null, signal: "SIGTERM" }) }), 1);
});

function assertPowerShellMissing(script, errors, status) {
  assert.equal(status, 1);
  assert.equal(errors.length, 1);
  assert(errors[0].includes(script));
  assert.match(errors[0], /패키징에는 PowerShell\(Windows PowerShell 또는 pwsh\)이 필요합니다/);
  assert.match(errors[0], /npm run check는 모든 OS에서 실행할 수 있습니다/);
}

test("PowerShell 명령을 찾지 못하면 PowerShell 요구 안내와 실패 코드를 반환한다", () => {
  const script = "tools/package-extension.ps1";
  const errors = [];
  const status = runPowerShell(script, {
    platform: "linux",
    spawn: () => ({ status: null, error: Object.assign(new Error("spawn pwsh ENOENT"), { code: "ENOENT" }) }),
    reportError: (message) => errors.push(message)
  });
  assertPowerShellMissing(script, errors, status);
});

test(
  "빈 PATH의 비 Windows 환경에서는 실제 실행 시에도 PowerShell 요구 안내를 반환한다",
  { skip: process.platform === "win32" && "Windows에서는 실제 PowerShell 실행을 피한다" },
  () => {
    const script = "tools/package-extension.ps1";
    const errors = [];
    const status = runPowerShell(script, {
      platform: "linux",
      env: { PATH: "" },
      reportError: (message) => errors.push(message)
    });
    assertPowerShellMissing(script, errors, status);
  }
);
