import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import path from "node:path";

export const contentScriptFiles = [
  "content-bootstrap.js",
  "content-options.js",
  "content-theme.js",
  "content-core.js",
  "content-audio.js",
  "content-mini-chat.js",
  "content-guest-chat.js",
  "content-chat-annotate.js",
  "content-runtime.js"
];

export async function validateContentScripts(manifest, { root }) {
  assert(
    Array.isArray(manifest.content_scripts) && manifest.content_scripts.length > 0,
    "manifest.content_scripts must be a non-empty array."
  );

  for (const [index, entry] of manifest.content_scripts.entries()) {
    const label = `content_scripts[${index}]`;
    assert(entry && typeof entry === "object" && !Array.isArray(entry), `${label} must be an object.`);
    assert(
      Array.isArray(entry.matches) && entry.matches.length > 0 &&
        entry.matches.every((match) =>
          typeof match === "string" && /^https:\/\/chzzk\.naver\.com\/[^\s]*$/u.test(match)
        ) && manifest.host_permissions?.includes("https://chzzk.naver.com/*"),
      `${label}.matches must be a non-empty array of strings within the https://chzzk.naver.com/* host permission scope.`
    );

    for (const key of ["js", "css"]) {
      if (!(key in entry)) continue;
      assert(Array.isArray(entry[key]), `${label}.${key} must be an array.`);
      for (const file of entry[key]) {
        assert(typeof file === "string" && file.trim() !== "", `${label}.${key} paths must be non-empty strings.`);
        const relativePath = path.posix.normalize(file.replaceAll("\\", "/"));
        assert(
          !path.win32.isAbsolute(file) && !path.posix.isAbsolute(file) &&
            !/^[a-z][a-z0-9+.-]*:/iu.test(file) &&
            relativePath !== ".." && !relativePath.startsWith("../"),
          `${label}.${key} path must be relative to the repo root: ${file}`
        );
        const fileStat = await stat(path.join(root, relativePath)).catch((error) => {
          if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
          throw error;
        });
        assert(fileStat?.isFile(), `${label}.${key} file not found: ${file}`);
      }
    }

    assert(entry.js?.length || entry.css?.length, `${label} must have at least one js or css file.`);
    assert(
      !("run_at" in entry) || ["document_start", "document_end", "document_idle"].includes(entry.run_at),
      `${label}.run_at must be document_start, document_end, or document_idle.`
    );
    assert(!("all_frames" in entry) || typeof entry.all_frames === "boolean", `${label}.all_frames must be boolean.`);
  }

  const contentScript = manifest.content_scripts[0];
  assert(
    Array.isArray(contentScript.matches) &&
      contentScript.matches.length === 1 &&
      contentScript.matches[0] === "https://chzzk.naver.com/*",
    "content_scripts[0].matches must be limited to https://chzzk.naver.com/*."
  );
  assert(contentScript.run_at === "document_start", "content_scripts[0].run_at must be document_start to avoid raw chat flashes.");
  assert(contentScript.all_frames === true, "content_scripts[0].all_frames should run in all CHZZK frames.");
  assert(
    Array.isArray(contentScript.css) &&
      contentScript.css.length === 1 &&
      contentScript.css[0] === "content.css",
    "content_scripts[0].css must load content.css."
  );
  assert(
    Array.isArray(contentScript.js) &&
      contentScript.js.length === contentScriptFiles.length &&
      contentScript.js.every((file, index) => file === contentScriptFiles[index]),
    "content_scripts[0].js files must load in the expected module order."
  );
}
