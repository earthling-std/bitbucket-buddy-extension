import './mountSettingsUi.css';
import { clearRecentRepos } from '@/lib/recentRepos';
import {
  COMMIT_MESSAGE_OPTIONS,
  DEFAULT_MERGE_FORMATTER_SETTINGS,
  loadMergeFormatterSettings,
  saveMergeFormatterSettings,
  type DefaultCommitMessageMode,
  type MergeFormatterSettings,
} from '@/lib/mergeFormatterSettings';

function appendCheckboxRow(
  ul: HTMLUListElement,
  getSettings: () => MergeFormatterSettings,
  key: 'mergeCommits' | 'squashCommits' | 'rebaseCommits' | 'shortPrReference' | 'closeSourceBranch',
  title: string,
  hint: string,
  persist: (next: MergeFormatterSettings) => void,
): void {
  const li = document.createElement('li');
  const label = document.createElement('label');
  label.className = 'settings-row';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = getSettings()[key];
  input.addEventListener('change', () => {
    const next = { ...getSettings(), [key]: input.checked } as MergeFormatterSettings;
    persist(next);
  });

  const span = document.createElement('span');
  const strong = document.createElement('strong');
  strong.textContent = title;
  const hintEl = document.createElement('span');
  hintEl.className = 'settings-hint';
  hintEl.textContent = hint;

  span.appendChild(strong);
  span.appendChild(hintEl);
  label.appendChild(input);
  label.appendChild(span);
  li.appendChild(label);
  ul.appendChild(li);
}

export function buildHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'popup-header';

  const title = document.createElement('span');
  title.className = 'popup-header-title';
  title.textContent = 'Bitbucket Buddy';
  header.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'popup-header-actions';

  const trashBtn = document.createElement('button');
  trashBtn.className = 'popup-icon-btn';
  trashBtn.title = 'Clear history';
  trashBtn.setAttribute('aria-label', 'Clear history');
  trashBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>';
  trashBtn.addEventListener('click', () => {
    void clearRecentRepos().then(() => window.location.reload());
  });

  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'popup-icon-btn';
  settingsBtn.title = 'Settings';
  settingsBtn.setAttribute('aria-label', 'Settings');
  settingsBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>';
  settingsBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      void chrome.runtime.openOptionsPage();
    }
  });

  actions.appendChild(trashBtn);
  actions.appendChild(settingsBtn);
  header.appendChild(actions);

  return header;
}

/** Vanilla settings UI (no React; avoids innerHTML in extension bundles for AMO). */
export function mountSettingsUi(root: HTMLElement): void {
  const loading = document.createElement('p');
  loading.className = 'settings-loading';
  loading.textContent = 'Loading settings…';
  root.appendChild(loading);

  void loadMergeFormatterSettings().then((loaded) => {
    let settings: MergeFormatterSettings = { ...DEFAULT_MERGE_FORMATTER_SETTINGS, ...loaded };
    const getSettings = () => settings;

    const persist = (next: MergeFormatterSettings) => {
      settings = next;
      void saveMergeFormatterSettings(settings);
    };

    root.replaceChildren();

    const shell = document.createElement('div');
    shell.className = 'settings-root';

    const surface = document.createElement('div');
    surface.className = 'settings-surface';
    shell.appendChild(surface);

    const h1 = document.createElement('h1');
    h1.className = 'settings-page-title';
    h1.textContent = 'Pull Request';
    surface.appendChild(h1);

    const sec1 = document.createElement('section');
    sec1.className = 'settings-section';
    sec1.setAttribute('aria-labelledby', 'merge-strategy-heading');

    const h2a = document.createElement('h2');
    h2a.id = 'merge-strategy-heading';
    h2a.className = 'settings-section-title';
    h2a.textContent = 'Merge strategy';
    sec1.appendChild(h2a);

    const pa = document.createElement('p');
    pa.className = 'settings-section-desc';
    pa.textContent =
      'Enable message formatter only for the strategies you use. Bitbucket must show that strategy in the merge dialog.';
    sec1.appendChild(pa);

    const ul = document.createElement('ul');
    ul.className = 'settings-list';
    appendCheckboxRow(ul, getSettings, 'mergeCommits', 'Merge commits', '"Merge commit"', persist);
    appendCheckboxRow(
      ul,
      getSettings,
      'squashCommits',
      'Squash commits',
      '"Squash", "Squash, fast-forward"',
      persist,
    );
    appendCheckboxRow(
      ul,
      getSettings,
      'rebaseCommits',
      'Rebase commits',
      '"Rebase, merge", "Rebase, fast-forward"',
      persist,
    );
    sec1.appendChild(ul);
    surface.appendChild(sec1);

    const sec2 = document.createElement('section');
    sec2.className = 'settings-section';
    sec2.setAttribute('aria-labelledby', 'commit-message-heading');

    const h2b = document.createElement('h2');
    h2b.id = 'commit-message-heading';
    h2b.className = 'settings-section-title';
    h2b.textContent = 'Commit message';
    sec2.appendChild(h2b);

    const pb = document.createElement('p');
    pb.className = 'settings-section-desc';
    pb.textContent = 'How to change the default merge commit message when an enabled strategy is active.';
    sec2.appendChild(pb);

    const field = document.createElement('div');
    field.className = 'settings-commit-field';

    const select = document.createElement('select');
    select.id = 'commit-message-mode';
    select.className = 'settings-select';
    for (const opt of COMMIT_MESSAGE_OPTIONS) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      select.appendChild(o);
    }
    select.value = settings.commitMessage;
    select.addEventListener('change', () => {
      persist({
        ...getSettings(),
        commitMessage: select.value as DefaultCommitMessageMode,
      });
    });

    field.appendChild(select);
    sec2.appendChild(field);

    const ulPrRef = document.createElement('ul');
    ulPrRef.className = 'settings-list settings-list--after-commit-field';
    appendCheckboxRow(
      ulPrRef,
      getSettings,
      'shortPrReference',
      'Use short PR reference',
      'Use (PR #N) instead of (pull request #N) in commit message.',
      persist,
    );
    sec2.appendChild(ulPrRef);

    surface.appendChild(sec2);

    const sec3 = document.createElement('section');
    sec3.className = 'settings-section';
    sec3.setAttribute('aria-labelledby', 'source-branch-heading');

    const h2c = document.createElement('h2');
    h2c.id = 'source-branch-heading';
    h2c.className = 'settings-section-title';
    h2c.textContent = 'Delete branch';
    sec3.appendChild(h2c);

    const ulBranch = document.createElement('ul');
    ulBranch.className = 'settings-list';
    appendCheckboxRow(
      ulBranch,
      getSettings,
      'closeSourceBranch',
      'Delete branch after the pull request is merged',
      'Automatically tick "Close source branch" in the merge dialog.',
      persist,
    );
    sec3.appendChild(ulBranch);
    surface.appendChild(sec3);

    root.appendChild(shell);
  });
}
