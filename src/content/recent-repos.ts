import { recordRecentRepo } from '@/lib/recentRepos';

function extractRepo(pathname: string): { workspace: string; slug: string } | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
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
