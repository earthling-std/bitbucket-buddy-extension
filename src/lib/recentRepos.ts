import { getExtensionApi } from './extensionApi';

export const RECENT_REPOS_STORAGE_KEY = 'recentRepos';
const MAX_RECENT_REPOS = 10;

export type RecentRepo = {
  workspace: string;
  slug: string;
  visitedAt: number;
};

export async function loadRecentRepos(): Promise<RecentRepo[]> {
  const raw = await getExtensionApi().storage.local.get(RECENT_REPOS_STORAGE_KEY);
  const data = raw[RECENT_REPOS_STORAGE_KEY];
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is RecentRepo =>
      item !== null &&
      typeof item === 'object' &&
      typeof item.workspace === 'string' &&
      typeof item.slug === 'string' &&
      typeof item.visitedAt === 'number',
  );
}

export async function clearRecentRepos(): Promise<void> {
  await getExtensionApi().storage.local.remove(RECENT_REPOS_STORAGE_KEY);
}

export async function recordRecentRepo(workspace: string, slug: string): Promise<void> {
  const repos = await loadRecentRepos();
  const now = Date.now();
  const idx = repos.findIndex((r) => r.workspace === workspace && r.slug === slug);
  if (idx !== -1) {
    repos[idx].visitedAt = now;
  } else {
    repos.push({ workspace, slug, visitedAt: now });
  }
  repos.sort((a, b) => b.visitedAt - a.visitedAt);
  await getExtensionApi().storage.local.set({
    [RECENT_REPOS_STORAGE_KEY]: repos.slice(0, MAX_RECENT_REPOS),
  });
}
