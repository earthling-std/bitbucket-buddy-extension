# Extension package

This folder is the Web Extension (Manifest V3) used by both Chrome and Safari.

## Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose this `extension` directory.

## Safari (macOS)

1. Install **Xcode** from the App Store.
2. Run Apple’s converter (adjust app name and output path as you like):

   ```bash
   xcrun safari-web-extension-converter /path/to/bibucket-commit-message-extension/extension \
     --app-name "BitbucketMergeMessage" \
     --swift
   ```

3. Open the generated Xcode project, select the Safari Web Extension target, set your **Team** for signing, then **Run** to install the containing app and enable the extension in **Safari → Settings → Extensions**.

Safari may require small manifest tweaks (for example `browser_specific_settings`) if a future Safari version complains; update `manifest.json` only if needed.

## URL pattern

The content script runs on Bitbucket Cloud pull request URLs:

`https://bitbucket.org/{workspace}/{repo}/pull-requests/{id}`

(`pull-requests` is plural.)
