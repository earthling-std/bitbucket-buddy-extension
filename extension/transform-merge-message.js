/**
 * Rewrites Bitbucket's default merge message when it matches the
 * "Merged in … (pull request #N)" template.
 *
 * @param {string} text
 * @returns {string|null} transformed text, or null if no rewrite applies
 */
function transformMergeMessage(text) {
  const lines = text.split(/\r?\n/);
  const firstLineMatch = lines[0]?.match(/^Merged in .+ \(pull request #(\d+)\)\s*$/);
  if (!firstLineMatch) return null;

  const prNumber = firstLineMatch[1];
  let i = 1;
  while (i < lines.length && !lines[i].trim()) i++;

  const subject = lines[i]?.trim();
  if (!subject) return null;

  const tail = lines.slice(i + 1).join('\n');
  const result = `${subject} (pull request #${prNumber})\n${tail}`;

  if (text === result) return null;

  return result;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { transformMergeMessage };
}
