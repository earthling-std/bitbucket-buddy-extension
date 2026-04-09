import pkg from './package.json'

export const sidePanelPath = 'src/sidepanel/index.html' as const

/**
 * Bitbucket Cloud is a SPA: content scripts are registered on the *initial* load URL only.
 * If the user lands on e.g. /workspace/repo/src/branch/... and later navigates to a pull request,
 * the page does not reload, so matches limited to /pull-requests/... never inject.
 *
 * Each pattern matches a fixed number of path segments after the host (`*` = one segment).
 * Depth 2 covers repo root; deeper paths cover source browser, nested branches, PR routes, etc.
 */
export function bitbucketRepoPathMatches(maxSegments = 25): string[] {
  const out: string[] = []
  for (let n = 2; n <= maxSegments; n++) {
    out.push(`https://bitbucket.org/${Array(n).fill('*').join('/')}`)
  }
  return out
}

/** Fields common to Chrome and Firefox builds. */
export const manifestConfig = {
  manifest_version: 3 as const,
  name: 'Bitbucket Buddy',
  description: 'Format the commit message for Bitbucket pull requests',
  version: pkg.version,
  icons: {
    16: 'public/logo-16.png',
    32: 'public/logo-32.png',
    48: 'public/logo-48.png',
    128: 'public/logo-128.png',
  },
  action: {
    default_icon: {
      16: 'public/logo-16.png',
      32: 'public/logo-32.png',
      48: 'public/logo-48.png',
      128: 'public/logo-128.png',
    },
    default_popup: 'src/popup/index.html',
  },
  options_ui: {
    page: 'src/settings/index.html',
    open_in_tab: true,
  },
  permissions: ['storage'],
  content_scripts: [
    {
      js: ['src/content/bootstrap.ts'],
      matches: bitbucketRepoPathMatches(),
      run_at: 'document_idle' as const,
    },
  ],
}
