import type { DefaultCommitMessageMode } from './mergeFormatterSettings';

const MERGED_FIRST_LINE =
  /^Merged in .+ \(pull request #(\d+)\)\s*$/;

/**
 * Bitbucket default squash merge message:
 *
 * Merged in <branch> (pull request #N)
 *
 * <title>
 *
 * <body...>
 *
 * `pr_title_and_details`: <title> (pull request #N) + body (bullets / commit list).
 * `pr_title_only`: single line <title> (pull request #N) — no commit details below.
 */
export function transformBitbucketMergeCommitMessage(
  text: string,
  lineFormat?: Exclude<DefaultCommitMessageMode, 'bitbucket_default'>,
): string | null {
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const firstLine = (lines[0] ?? '').trimEnd();
  const match = MERGED_FIRST_LINE.exec(firstLine);
  if (!match) return null;

  const prNum = match[1];
  let i = 1;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length) return null;

  const title = lines[i].trimEnd();
  const rest = lines.slice(i + 1);
  const body = rest.join('\n');

  const format = lineFormat ?? 'pr_title_and_details';

  const head = `${title} (pull request #${prNum})`;

  if (format === 'pr_title_only') {
    return head;
  }

  if (body.length === 0) return head;
  return `${head}\n${body}`;
}
