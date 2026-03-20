#!/usr/bin/env node
/**
 * Launches Chrome/Chromium with this repo's extension loaded unpacked.
 *
 * Usage: npm run dev
 *
 * Optional env:
 *   CHROME_PATH   — full path to the browser executable
 *   DEV_URL       — first tab URL (default: https://bitbucket.org/)
 *   TEMP_PROFILE  — if set to "1", use a throwaway user-data-dir under os.tmpdir()
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.join(__dirname, "..");
const extensionDir = path.join(root, "extension");
const startUrl = process.env.DEV_URL || "https://bitbucket.org/";

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const { platform } = process;

  if (platform === "darwin") {
    const candidates = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  if (platform === "linux") {
    const { execFileSync } = require("child_process");
    for (const name of ["google-chrome-stable", "google-chrome", "chromium", "chromium-browser"]) {
      try {
        const out = execFileSync("which", [name], { encoding: "utf8" }).trim();
        if (out && fs.existsSync(out)) return out;
      } catch {
        /* ignore */
      }
    }
  }

  if (platform === "win32") {
    const programFiles = process.env["PROGRAMFILES"] || "C:\\Program Files";
    const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
    const local = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const candidates = [
      path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(local, "Google", "Chrome", "Application", "chrome.exe"),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  return null;
}

function main() {
  if (!fs.existsSync(path.join(extensionDir, "manifest.json"))) {
    console.error("Missing extension/manifest.json — run from repo root.");
    process.exit(1);
  }

  const chrome = findChrome();
  if (!chrome) {
    console.error(
      "Could not find Chrome/Chromium. Set CHROME_PATH to the executable, or load unpacked manually:",
      extensionDir
    );
    process.exit(1);
  }

  const args = [`--load-extension=${extensionDir}`];

  if (process.env.TEMP_PROFILE === "1") {
    const dir = path.join(os.tmpdir(), `bitbucket-ext-dev-profile-${process.pid}`);
    fs.mkdirSync(dir, { recursive: true });
    args.push(`--user-data-dir=${dir}`);
    console.error("Using temporary profile:", dir);
  }

  args.push(startUrl);

  const child = spawn(chrome, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  console.log("Started:", chrome);
  console.log("Extension:", extensionDir);
  console.log("Open tab:", startUrl);
}

main();
