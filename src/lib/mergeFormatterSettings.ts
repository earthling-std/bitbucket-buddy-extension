export const MERGE_FORMATTER_STORAGE_KEY = 'mergeFormatterSettings';

/** How to rewrite the merge dialog commit message when a strategy is enabled. */
export type DefaultCommitMessageMode =
  | 'bitbucket_default'
  | 'pr_title_only'
  | 'pr_title_and_details';

export type MergeFormatterSettings = {
  mergeCommits: boolean;
  squashCommits: boolean;
  rebaseCommits: boolean;
  /** Single format applied to every enabled merge strategy. */
  commitMessage: DefaultCommitMessageMode;
};

/**
 * Fresh installs: `commitMessage` defaults to `pr_title_and_details`.
 * Same applies when storage omits `commitMessage` or it is invalid (see `parseMergeFormatterSettings`).
 */
export const DEFAULT_MERGE_FORMATTER_SETTINGS: MergeFormatterSettings = {
  mergeCommits: true,
  squashCommits: true,
  rebaseCommits: true,
  commitMessage: 'pr_title_and_details',
};

const VALID_MODES: DefaultCommitMessageMode[] = [
  'bitbucket_default',
  'pr_title_only',
  'pr_title_and_details',
];

function isDefaultCommitMessageMode(v: unknown): v is DefaultCommitMessageMode {
  return typeof v === 'string' && (VALID_MODES as string[]).includes(v);
}

/** Merge raw storage object with defaults (invalid fields ignored). */
export function parseMergeFormatterSettings(raw: unknown): MergeFormatterSettings {
  const base = { ...DEFAULT_MERGE_FORMATTER_SETTINGS };
  if (!raw || typeof raw !== 'object') return base;

  const o = raw as Record<string, unknown>;
  if (typeof o.mergeCommits === 'boolean') base.mergeCommits = o.mergeCommits;
  if (typeof o.squashCommits === 'boolean') base.squashCommits = o.squashCommits;
  if (typeof o.rebaseCommits === 'boolean') base.rebaseCommits = o.rebaseCommits;
  if (isDefaultCommitMessageMode(o.commitMessage)) {
    base.commitMessage = o.commitMessage;
  }
  // Missing or invalid `commitMessage` keeps `base.commitMessage` === `pr_title_and_details`.

  return base;
}

/** Dropdown order: 1 default, 2 PR title only, 3 PR title + details (runtime default when unset). */
export const COMMIT_MESSAGE_OPTIONS: {
  value: DefaultCommitMessageMode;
  label: string;
}[] = [
  {
    value: 'bitbucket_default',
    label: 'Default message',
  },
  {
    value: 'pr_title_only',
    label: 'Pull request title',
  },
  {
    value: 'pr_title_and_details',
    label: 'Pull request title and commit details',
  },
];

export type MergeStrategyCategory = 'merge' | 'squash' | 'rebase' | 'unknown';

/** Normalize Bitbucket merge-strategy label for matching. */
function normalizeStrategyLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Map visible merge strategy (from Bitbucket UI) to a category for settings toggles.
 * Covers common Bitbucket Cloud labels and minor spelling variants.
 */
export function categorizeMergeStrategyLabel(
  label: string | null | undefined,
): MergeStrategyCategory {
  if (!label) return 'unknown';
  const n = normalizeStrategyLabel(label);

  if (n === 'merge commit') return 'merge';

  if (n === 'squash') return 'squash';
  if (n === 'squash, fast-forward' || n === 'squash, fast forward' || n === 'squash, fast foward') {
    return 'squash';
  }

  if (n === 'rebase, merge' || n === 'rebase, then merge') return 'rebase';
  if (
    n === 'rebase, fast-forward' ||
    n === 'rebase, fast forward' ||
    n === 'rebase, fast foward'
  ) {
    return 'rebase';
  }

  return 'unknown';
}

export function mergeFormatterAllowedForCategory(
  settings: MergeFormatterSettings,
  category: MergeStrategyCategory,
): boolean {
  switch (category) {
    case 'merge':
      return settings.mergeCommits;
    case 'squash':
      return settings.squashCommits;
    case 'rebase':
      return settings.rebaseCommits;
    default:
      return false;
  }
}

export function mergeFormatterAllowedForLabel(
  settings: MergeFormatterSettings,
  label: string | null | undefined,
): boolean {
  return mergeFormatterAllowedForCategory(settings, categorizeMergeStrategyLabel(label));
}

export async function loadMergeFormatterSettings(): Promise<MergeFormatterSettings> {
  const raw = await chrome.storage.local.get(MERGE_FORMATTER_STORAGE_KEY);
  return parseMergeFormatterSettings(raw[MERGE_FORMATTER_STORAGE_KEY]);
}

export async function saveMergeFormatterSettings(
  settings: MergeFormatterSettings,
): Promise<void> {
  await chrome.storage.local.set({ [MERGE_FORMATTER_STORAGE_KEY]: settings });
}

/** Read current strategy label from the merge modal (react-select). */
export function getMergeStrategyLabelFromDialog(dialog: Element): string | null {
  const input = dialog.querySelector<HTMLInputElement>('input#merge-strategy');
  if (!input) return null;

  const describedBy = input.getAttribute('aria-describedby');
  if (describedBy) {
    for (const id of describedBy.split(/\s+/).filter(Boolean)) {
      const el = document.getElementById(id);
      const text = el?.textContent?.trim();
      if (text) return text;
    }
  }

  const control =
    input.closest('[class*="-control"]') ??
    input.closest('[class*="control"]') ??
    input.parentElement?.parentElement;
  const single = control?.querySelector('[class*="-singleValue"], [class*="singleValue"]');
  const text = single?.textContent?.trim();
  return text ?? null;
}
