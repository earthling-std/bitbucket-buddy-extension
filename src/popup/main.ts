import { getExtensionApi } from '@/lib/extensionApi';
import { buildHeader } from '@/lib/mountSettingsUi';
import { loadRecentRepos, RECENT_REPOS_STORAGE_KEY, type RecentRepo } from '@/lib/recentRepos';
import './App.css';
import './index.css';

const REPO_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M7 8l0 8" /><path d="M9 18h4a4 4 0 0 0 4 -4v-3" /></svg>';

function buildRepoItem(repo: RecentRepo): HTMLElement {
  const item = document.createElement('button');
  item.className = 'popup-repo-item';

  const icon = document.createElement('span');
  icon.className = 'popup-repo-icon';
  icon.innerHTML = REPO_ICON;

  const info = document.createElement('div');
  info.className = 'popup-repo-info';

  const name = document.createElement('span');
  name.className = 'popup-repo-name';
  name.textContent = repo.slug;

  const subtitle = document.createElement('span');
  subtitle.className = 'popup-repo-subtitle';
  subtitle.textContent = `${repo.workspace}/${repo.slug}`;

  info.appendChild(name);
  info.appendChild(subtitle);
  item.appendChild(icon);
  item.appendChild(info);

  item.addEventListener('click', () => {
    const url = `https://bitbucket.org/${repo.workspace}/${repo.slug}/pull-requests/`;
    void getExtensionApi().tabs.create({ url, active: true });
  });

  return item;
}

function buildReposList(repos: RecentRepo[]): HTMLElement {
  const container = document.createElement('div');
  container.className = 'popup-repos';

  if (repos.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'popup-empty-state';

    const icon = document.createElement('span');
    icon.className = 'popup-empty-icon';
    icon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>';

    const text = document.createElement('p');
    text.className = 'popup-empty-text';
    text.innerHTML = 'Your recently visited repos<br/>will appear here.';

    empty.appendChild(icon);
    empty.appendChild(text);
    container.appendChild(empty);
    return container;
  }

  for (const repo of repos) {
    container.appendChild(buildRepoItem(repo));
  }

  return container;
}

const root = document.getElementById('root');
if (root) {
  const shell = document.createElement('div');
  shell.className = 'popup-app';
  root.appendChild(shell);
  shell.appendChild(buildHeader());

  const reposSlot = document.createElement('div');
  shell.appendChild(reposSlot);

  const renderRepos = (repos: RecentRepo[]) => {
    reposSlot.replaceChildren(buildReposList(repos));
  };

  void loadRecentRepos().then(renderRepos);

  getExtensionApi().storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(RECENT_REPOS_STORAGE_KEY in changes)) return;
    void loadRecentRepos().then(renderRepos);
  });
}
