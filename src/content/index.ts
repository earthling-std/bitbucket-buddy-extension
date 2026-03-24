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

function tryTransformMergeMessage(textarea: HTMLTextAreaElement): void {
  const value = textarea.value;
  if (!value.startsWith('Merged in ')) return;

  const next = transformBitbucketMergeCommitMessage(value);
  if (next === null || next === value) return;

  setNativeTextareaValue(textarea, next);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
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
}

function startPollingIfNeeded(): void {
  if (pollTimer !== null) return;
  tick();
  pollTimer = setInterval(tick, 250);
}

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
