import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const requiredRootFiles = [
  "manifest.json",
  "background.js",
  "content.js",
  "popup.html",
  "popup.css",
  "popup.js"
];

for (const file of requiredRootFiles) {
  await access(path.join(root, file));
}

if (manifest.manifest_version !== 3) {
  throw new Error("manifest_version must be 3.");
}

if (!manifest.permissions?.includes("storage")) {
  throw new Error("storage permission is required.");
}

if (!manifest.permissions?.includes("scripting")) {
  throw new Error("scripting permission is required for stale content-script refresh.");
}

if (!manifest.host_permissions?.includes("https://chzzk.naver.com/*")) {
  throw new Error("CHZZK host permission is missing.");
}

if (!manifest.host_permissions?.includes("https://*.chzzk.naver.com/*")) {
  throw new Error("CHZZK wildcard host permission is missing.");
}

if (manifest.action?.default_popup !== "popup.html") {
  throw new Error("default popup must point to popup.html.");
}

if (manifest.background?.service_worker !== "background.js") {
  throw new Error("background service worker must point to background.js.");
}

const contentScript = manifest.content_scripts?.[0];

if (!contentScript?.all_frames) {
  throw new Error("content script should run in all CHZZK frames.");
}

if (contentScript.run_at !== "document_start") {
  throw new Error("content script must run at document_start to avoid raw chat flashes.");
}

console.log("Extension manifest and root files are valid.");
