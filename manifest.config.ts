import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Bitbucket: Format commit message',
  description: 'Format the commit message for Bitbucket pull requests',
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
    128: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
      128: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: ['storage'],
  content_scripts: [
    {
      js: ['src/content/bootstrap.tsx'],
      matches: [
        'https://bitbucket.org/*/*/pull-requests/*',
        'https://bitbucket.org/*/*/pull-request/*',
      ],
      run_at: 'document_idle',
    },
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
