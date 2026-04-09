import { getExtensionApi } from '@/lib/extensionApi';
import { showContentToast } from './toast';
import {
  DEFAULT_MERGE_FORMATTER_SETTINGS,
  MERGE_FORMATTER_STORAGE_KEY,
  type MergeFormatterSettings,
  getMergeStrategyLabelFromDialog,
  mergeFormatterAllowedForLabel,
  parseMergeFormatterSettings,
} from '../lib/mergeFormatterSettings';
import { transformBitbucketMergeCommitMessage } from '../lib/transformMergeMessage';

function setNativeTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(textarea),
    'value',
  )?.set;
  if (setter) {
    setter.call(textarea, value);
  } else {
    textarea.value = value;
  }
}

function isMergePullRequestModal(root: Element): boolean {
  if (root.getAttribute('data-testid') !== 'modal-dialog') return false;
  const title = root.querySelector('[data-testid="modal-dialog--title-text"]');
  return title?.textContent?.includes('Merge pull request') ?? false;
}

function findMergeCommitTextarea(): HTMLTextAreaElement | null {
  const dialogs = document.querySelectorAll<HTMLElement>('[data-testid="modal-dialog"]');
  for (const dialog of dialogs) {
    if (!isMergePullRequestModal(dialog)) continue;
    const ta = dialog.querySelector<HTMLTextAreaElement>(
      'textarea[name="merge-dialog-commit-message-textfield"]',
    );
    if (ta) return ta;
  }
  return null;
}

function findMergeDialogForTextarea(textarea: HTMLTextAreaElement): Element | null {
  return textarea.closest('[data-testid="modal-dialog"]');
}

let cachedSettings: MergeFormatterSettings = { ...DEFAULT_MERGE_FORMATTER_SETTINGS };

async function refreshSettingsFromStorage(): Promise<void> {
  const raw = await getExtensionApi().storage.local.get(MERGE_FORMATTER_STORAGE_KEY);
  cachedSettings = parseMergeFormatterSettings(raw[MERGE_FORMATTER_STORAGE_KEY]);
}

const replacedToastSent = new WeakSet<HTMLTextAreaElement>();
const closeSourceBranchProcessed = new WeakSet<Element>();

function tryTickCloseSourceBranch(dialog: Element): void {
  if (!cachedSettings.closeSourceBranch) return;
  if (closeSourceBranchProcessed.has(dialog)) return;

  let checkbox: HTMLInputElement | null = null;
  for (const label of dialog.querySelectorAll<HTMLLabelElement>('label')) {
    if (!label.textContent?.includes('Close source branch')) continue;
    const forId = label.getAttribute('for');
    if (forId) {
      checkbox = dialog.querySelector<HTMLInputElement>(`#${CSS.escape(forId)}`);
    }
    if (!checkbox) {
      checkbox = label.querySelector<HTMLInputElement>('input[type="checkbox"]');
    }
    break;
  }

  if (!checkbox) return; // not rendered yet — retry on next tick
  closeSourceBranchProcessed.add(dialog);
  if (!checkbox.checked) checkbox.click();
}

function tryTransformMergeMessage(textarea: HTMLTextAreaElement): void {
  const dialog = findMergeDialogForTextarea(textarea);
  const strategyLabel = dialog ? getMergeStrategyLabelFromDialog(dialog) : null;
  if (!mergeFormatterAllowedForLabel(cachedSettings, strategyLabel)) {
    return;
  }

  const mode = cachedSettings.commitMessage;
  if (mode === 'bitbucket_default') {
    return;
  }

  const value = textarea.value;
  if (!value.startsWith('Merged in ')) return;

  const lineFormat = mode === 'pr_title_only' ? 'pr_title_only' : 'pr_title_and_details';

  const next = transformBitbucketMergeCommitMessage(
    value,
    lineFormat,
    cachedSettings.shortPrReference,
  );
  if (next === null || next === value) return;

  setNativeTextareaValue(textarea, next);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));

  if (!replacedToastSent.has(textarea)) {
    replacedToastSent.add(textarea);
    showContentToast('Commit message updated.');
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopPolling(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function tick(): void {
  const ta = findMergeCommitTextarea();
  if (!ta) {
    stopPolling();
    return;
  }
  tryTransformMergeMessage(ta);
  const dialog = findMergeDialogForTextarea(ta);
  if (dialog) tryTickCloseSourceBranch(dialog);
}

function startPollingIfNeeded(): void {
  if (pollTimer !== null) return;
  tick();
  pollTimer = setInterval(tick, 250);
}

export function initMergeMessageTransform(): void {
  void refreshSettingsFromStorage();

  getExtensionApi().storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const ch = changes[MERGE_FORMATTER_STORAGE_KEY];
    if (ch?.newValue !== undefined) {
      cachedSettings = parseMergeFormatterSettings(ch.newValue);
    }
  });

  const observer = new MutationObserver(() => {
    if (findMergeCommitTextarea()) startPollingIfNeeded();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (findMergeCommitTextarea()) startPollingIfNeeded();
    });
  } else if (findMergeCommitTextarea()) {
    startPollingIfNeeded();
  }
}
