import path from 'node:path'
import { crx, type CrxPlugin } from '@crxjs/vite-plugin'
import { defineConfig } from 'vite'
import zip from 'vite-plugin-zip-pack'
import { name, version } from './package.json'
import { sidePanelPath } from './manifest.config'

const browserTarget = process.env.TARGET_BROWSER === 'firefox' ? 'firefox' : 'chrome'
const zipPrefix = browserTarget === 'firefox' ? 'firefox' : 'chrome'

const manifest =
  browserTarget === 'firefox'
    ? (await import('./manifest.firefox.ts')).default
    : (await import('./manifest.chrome.ts')).default

/** @crxjs only discovers sidepanel HTML via `side_panel.default_path`; restore it for the build, then strip for Firefox output. */
function firefoxSidepanelBundleShim(): CrxPlugin {
  return {
    name: 'firefox-sidepanel-bundle-shim',
    enforce: 'pre',
    transformCrxManifest(manifest) {
      if (browserTarget !== 'firefox' || manifest.side_panel) return undefined
      return { ...manifest, side_panel: { default_path: sidePanelPath } }
    },
  }
}

function firefoxStripChromeOnlyManifestKeys(): CrxPlugin {
  return {
    name: 'firefox-strip-chrome-only-manifest-keys',
    enforce: 'post',
    renderCrxManifest(manifest) {
      if (browserTarget !== 'firefox') return undefined
      const next = { ...manifest }
      delete next.side_panel
      return next
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  plugins: [
    firefoxSidepanelBundleShim(),
    crx({ manifest, browser: browserTarget }),
    firefoxStripChromeOnlyManifestKeys(),
    zip({ outDir: 'release', outFileName: `${zipPrefix}-${name}-${version}.zip` }),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//, /moz-extension:\/\//],
    },
  },
})
