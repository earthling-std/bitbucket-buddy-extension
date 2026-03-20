#!/usr/bin/env node
/**
 * Upload dist/chrome-web-store.zip to the Chrome Web Store (API v2).
 *
 * Prerequisites: https://developer.chrome.com/docs/webstore/using_webstore_api
 *
 * Required env:
 *   CHROME_WEBSTORE_CLIENT_ID
 *   CHROME_WEBSTORE_CLIENT_SECRET
 *   CHROME_WEBSTORE_REFRESH_TOKEN
 *   CHROME_WEBSTORE_PUBLISHER_ID   — Account → Publisher ID in Dev Console
 *   CHROME_WEBSTORE_EXTENSION_ID   — 32-char item id (same as chrome://extensions id after publish)
 *
 * Optional:
 *   CHROME_WEBSTORE_PUBLISH=1       — call :publish after a successful upload (submits for review)
 *   CHROME_WEBSTORE_ZIP            — override zip path (default: dist/chrome-web-store.zip)
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const defaultZip = path.join(root, "dist", "chrome-web-store.zip");

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return v.trim();
}

async function refreshAccessToken() {
  const body = new URLSearchParams({
    client_id: requireEnv("CHROME_WEBSTORE_CLIENT_ID"),
    client_secret: requireEnv("CHROME_WEBSTORE_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: requireEnv("CHROME_WEBSTORE_REFRESH_TOKEN"),
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OAuth token refresh failed (${res.status}): ${text}`);
  }
  const data = JSON.parse(text);
  if (!data.access_token) {
    throw new Error(`OAuth response missing access_token: ${text}`);
  }
  return data.access_token;
}

async function fetchStatus(token, publisherId, extensionId) {
  const url = `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${extensionId}:fetchStatus`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`fetchStatus failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

async function uploadZip(token, publisherId, extensionId, zipPath) {
  const buf = fs.readFileSync(zipPath);
  const url = `https://chromewebstore.googleapis.com/upload/v2/publishers/${publisherId}/items/${extensionId}:upload`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/zip",
      "Content-Length": String(buf.length),
    },
    body: buf,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function publishItem(token, publisherId, extensionId) {
  const url = `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${extensionId}:publish`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Publish failed (${res.status}): ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function waitForUploadIdle(token, publisherId, extensionId, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await fetchStatus(token, publisherId, extensionId);
    const state = status.uploadState || status.upload_state;
    if (state && state !== "UPLOAD_IN_PROGRESS") {
      return status;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Timed out waiting for upload to finish (still UPLOAD_IN_PROGRESS)");
}

async function main() {
  const zipPath = process.env.CHROME_WEBSTORE_ZIP || defaultZip;
  if (!fs.existsSync(zipPath)) {
    console.error("Zip not found:", zipPath);
    console.error("Run: npm run chrome:zip");
    process.exit(1);
  }

  const publisherId = requireEnv("CHROME_WEBSTORE_PUBLISHER_ID");
  const extensionId = requireEnv("CHROME_WEBSTORE_EXTENSION_ID");

  console.log("Refreshing access token…");
  const token = await refreshAccessToken();

  console.log("Uploading", zipPath, "…");
  const uploadResult = await uploadZip(token, publisherId, extensionId, zipPath);
  console.log("Upload response:", JSON.stringify(uploadResult, null, 2));

  const state = uploadResult.uploadState || uploadResult.upload_state;
  if (state === "UPLOAD_IN_PROGRESS") {
    console.log("Waiting for processing…");
    const finalStatus = await waitForUploadIdle(token, publisherId, extensionId);
    console.log("Status:", JSON.stringify(finalStatus, null, 2));
  }

  if (process.env.CHROME_WEBSTORE_PUBLISH === "1") {
    console.log("Publishing (submits for review)…");
    const pub = await publishItem(token, publisherId, extensionId);
    console.log("Publish response:", JSON.stringify(pub, null, 2));
  } else {
    console.log(
      "Skipping publish. Set CHROME_WEBSTORE_PUBLISH=1 to call :publish after upload."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
