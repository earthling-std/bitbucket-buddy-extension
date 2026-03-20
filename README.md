# Bitbucket merge commit message extension

Browser extension for **Chrome** and **Safari** that adjusts the default merge commit message on Bitbucket Cloud pull request pages.

When the **Merge pull request** dialog appears and the commit message still matches Bitbucket’s default template (starting with `Merged in … (pull request #N)`), it is rewritten to:

`{subject} (pull request #N)` followed by the rest of the message (blank lines and bullet lines preserved).

If you edit the message or it no longer matches that template, the extension does not overwrite your text.

## Privacy

No network requests, analytics, or remote code. All logic runs in the page as a content script.

## Install

See [extension/README.md](extension/README.md) for loading the unpacked extension in Chrome and wrapping it for Safari with `safari-web-extension-converter`.

## Public deployment (Chrome + Safari)

### Chrome Web Store

1. Create a [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole) and complete the one-time registration fee if required.
2. Build a zip whose **root contains** `manifest.json`:

   ```bash
   npm install
   npm run chrome:zip
   ```

   Output: [`dist/chrome-web-store.zip`](dist/chrome-web-store.zip) (gitignored).

3. **Upload manually:** In the developer dashboard, **New item** (or your item) → upload that zip. Complete listing, privacy, and single-purpose declarations as required.

4. **Upload via API (optional):** Enable the [Chrome Web Store API](https://developer.chrome.com/docs/webstore/using_webstore_api), create OAuth credentials, and set the variables in [`scripts/chrome-web-store.env.example`](scripts/chrome-web-store.env.example). Then:

   ```bash
   set -a && source scripts/chrome-web-store.env   # or export vars yourself
   npm run chrome:deploy
   ```

   - `chrome:deploy` runs `chrome:zip` then uploads `dist/chrome-web-store.zip`.
   - Set `CHROME_WEBSTORE_PUBLISH=1` when sourcing env to call **publish** after upload (submits for review per Google’s rules).

5. Submit for review; after approval the listing is public.

Official overview: [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish).

### Safari (Mac App Store)

Safari extensions are distributed **inside a macOS app** built in Xcode (see [extension/README.md](extension/README.md) for `safari-web-extension-converter`).

1. Join the [Apple Developer Program](https://developer.apple.com/programs/) (paid).
2. Generate the Xcode project from the `extension` folder, set signing for the **app** and **Safari Web Extension** targets, bump version/build, archive the macOS app.
3. Upload with **Transporter** or Xcode **Organizer** → **Distribute App** → **App Store Connect**.
4. In App Store Connect, create the macOS app record, complete metadata, privacy labels (no data collection if accurate), and submit for **App Review**. Users install your app from the Mac App Store, then enable the extension under **Safari → Settings → Extensions**.

There is no separate public “Safari extension store”; discovery is your app’s App Store page. If you also want iOS users, you must add an iOS app target and meet Apple’s rules for Safari extensions on iPhone/iPad.

## Test

Requires **Node.js 18+** (for `node --test`). From the repo root:

```bash
npm test
```

Tests live in [`test/`](test/) and cover [`extension/transform-merge-message.js`](extension/transform-merge-message.js). There is no bundler or extra dependencies.

## Develop

### Quick start (Chrome)

From the repo root:

```bash
npm run dev
```

This runs [`scripts/dev.cjs`](scripts/dev.cjs), which starts **Chrome/Chromium** with [`extension/`](extension/) loaded via `--load-extension` and opens Bitbucket (override the URL with `DEV_URL`, the binary with `CHROME_PATH`; use `TEMP_PROFILE=1` for a disposable profile).

After you change extension files, **reload the extension** on `chrome://extensions` and refresh the tab—`npm run dev` does not watch files.

### Chrome (manual load)

1. Load the unpacked extension once: `chrome://extensions` → **Developer mode** → **Load unpacked** → select [`extension/`](extension/).
2. Open a Bitbucket PR URL (`…/pull-requests/…`), open **Merge pull request**, confirm the commit message rewrites as expected.
3. After you edit `extension/*.js` or `manifest.json`, click **Reload** on the extension card on `chrome://extensions` (or toggle the extension off/on). Refresh the Bitbucket tab if the page was already open.

Use **Inspect views: service worker** only if you add a background script later; for this project, use **Errors** on the extension card, or open DevTools on the Bitbucket tab → **Console** (content script errors appear in the page console).

### Debug (Chrome)

1. **Confirm the script runs**  
   - URL must match [`extension/manifest.json`](extension/manifest.json): `https://bitbucket.org/<workspace>/<repo>/pull-requests/<id>` (**pull-requests** is plural).  
   - On `chrome://extensions`, open **Details** for this extension and check **Site access** / errors.  
   - On the PR page, open DevTools (**Console**). Content-script logs and errors show there.

2. **Verbose logging**  
   On `bitbucket.org`, in the console run:

   ```js
   localStorage.setItem("bbMergeMsgDebug", "1");
   ```

   Reload the PR page, open **Merge pull request** again. You should see `[Bitbucket merge msg]` lines explaining skips or rewrites. Turn off with `localStorage.removeItem("bbMergeMsgDebug")`.

3. **Set breakpoints**  
   In DevTools → **Sources** → **Page** (or the webpack/vite tree if any), find **Content scripts** (or expand the extension id) and open `content.js`, then set breakpoints. Alternatively add a `debugger;` line in [`extension/content.js`](extension/content.js) while investigating.

4. **If the message never changes**  
   - **Merge strategy** must be one that produces the default `Merged in … (pull request #N)` first line.  
   - **UI language**: the modal title must be exactly **Merge pull request** (English). Other locales need a code change to match your title string.  
   - **Selectors**: Bitbucket may change `data-testid` or `name` on the textarea; inspect the modal in DevTools and compare to [`extension/content.js`](extension/content.js).

### Safari

1. Generate/open the Xcode project from [`extension/README.md`](extension/README.md) and run the app once so the extension is installed.
2. After changing extension files, rebuild/run from Xcode (or use your usual scheme) so the embedded extension bundle updates, then reload the Bitbucket page.

### Files

- [extension/manifest.json](extension/manifest.json) — Manifest V3 entrypoint.
- [extension/content.js](extension/content.js) — observes the DOM for the merge modal and updates the textarea (React-friendly setter + `input` / `change` events).
- [extension/transform-merge-message.js](extension/transform-merge-message.js) — pure string transform (also `require`’d by tests under Node).
