import { recordRecentRepo } from '@/lib/recentRepos';

// Bitbucket reserved second-path segments that are workspace/account pages, not repos.
const NON_REPO_SLUGS = new Set(['workspace', 'projects', 'account', 'dashboard', 'profile']);

function extractRepo(pathname: string): { workspace: string; slug: string } | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  if (NON_REPO_SLUGS.has(parts[1])) return null;
  return { workspace: parts[0], slug: parts[1] };
}

let lastKey = '';

function maybeRecord(): void {
  const repo = extractRepo(window.location.pathname);
  if (!repo) return;
  const key = `${repo.workspace}/${repo.slug}`;
  if (key === lastKey) return;
  lastKey = key;
  void recordRecentRepo(repo.workspace, repo.slug);
}

export function initRecentRepoTracking(): void {
  maybeRecord();

  const origPushState = history.pushState.bind(history);
  history.pushState = (...args: Parameters<typeof history.pushState>) => {
    origPushState(...args);
    maybeRecord();
  };

  const origReplaceState = history.replaceState.bind(history);
  history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
    origReplaceState(...args);
    maybeRecord();
  };

  window.addEventListener('popstate', maybeRecord);

  // Fallback: catch any navigation not covered above (e.g. framework internals)
  // maybeRecord is cheap (string comparison) when the URL hasn't changed.
  new MutationObserver(maybeRecord).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}
