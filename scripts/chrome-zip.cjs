#!/usr/bin/env node
/**
 * Zip extension/ for Chrome Web Store (manifest.json at zip root).
 */

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const root = path.join(__dirname, "..");
const extensionDir = path.join(root, "extension");
const distDir = path.join(root, "dist");
const outPath = path.join(distDir, "chrome-web-store.zip");

function main() {
  if (!fs.existsSync(path.join(extensionDir, "manifest.json"))) {
    console.error("Missing extension/manifest.json");
    process.exit(1);
  }

  fs.mkdirSync(distDir, { recursive: true });

  const output = fs.createWriteStream(outPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  const done = new Promise((resolve, reject) => {
    output.on("close", resolve);
    archive.on("error", reject);
  });

  archive.pipe(output);
  archive.directory(extensionDir, false);
  archive.finalize();

  return done.then(() => {
    const bytes = archive.pointer();
    console.log("Wrote", outPath, `(${bytes} bytes)`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
