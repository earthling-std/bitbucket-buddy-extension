import { useCallback, useEffect, useState } from 'react';
import {
  COMMIT_MESSAGE_OPTIONS,
  DEFAULT_MERGE_FORMATTER_SETTINGS,
  loadMergeFormatterSettings,
  saveMergeFormatterSettings,
  type DefaultCommitMessageMode,
  type MergeFormatterSettings,
} from '@/lib/mergeFormatterSettings';
import './Settings.css';

export default function Settings() {
  const [settings, setSettings] = useState<MergeFormatterSettings | null>(null);

  useEffect(() => {
    void loadMergeFormatterSettings().then(setSettings);
  }, []);

  const update = useCallback((patch: Partial<MergeFormatterSettings>) => {
    setSettings((prev) => {
      const base = prev ?? DEFAULT_MERGE_FORMATTER_SETTINGS;
      const next = { ...base, ...patch };
      void saveMergeFormatterSettings(next);
      return next;
    });
  }, []);

  if (!settings) {
    return <p className="settings-loading">Loading settings…</p>;
  }

  return (
    <div className="settings-root">
      <h1 className="settings-page-title">Merge message formatter</h1>

      <section className="settings-section" aria-labelledby="merge-strategy-heading">
        <h2 id="merge-strategy-heading" className="settings-section-title">
          Merge strategy
        </h2>
        <p className="settings-section-desc">
          Enable the formatter only for the strategies you use. Bitbucket must show that strategy in the
          merge dialog.
        </p>
        <ul className="settings-list">
          <li>
            <label className="settings-row">
              <input
                type="checkbox"
                checked={settings.mergeCommits}
                onChange={(e) => update({ mergeCommits: e.target.checked })}
              />
              <span>
                <strong>Merge commits</strong>
                <span className="settings-hint">&quot;Merge commit&quot;</span>
              </span>
            </label>
          </li>
          <li>
            <label className="settings-row">
              <input
                type="checkbox"
                checked={settings.squashCommits}
                onChange={(e) => update({ squashCommits: e.target.checked })}
              />
              <span>
                <strong>Squash commits</strong>
                <span className="settings-hint">
                  &quot;Squash&quot;, &quot;Squash, fast-forward&quot;
                </span>
              </span>
            </label>
          </li>
          <li>
            <label className="settings-row">
              <input
                type="checkbox"
                checked={settings.rebaseCommits}
                onChange={(e) => update({ rebaseCommits: e.target.checked })}
              />
              <span>
                <strong>Rebase commits</strong>
                <span className="settings-hint">
                  &quot;Rebase, merge&quot;, &quot;Rebase, fast-forward&quot;
                </span>
              </span>
            </label>
          </li>
        </ul>
      </section>

      <section className="settings-section" aria-labelledby="commit-message-heading">
        <h2 id="commit-message-heading" className="settings-section-title">
          Commit message
        </h2>
        <p className="settings-section-desc">
          How to change the default merge commit message when an enabled strategy is active.
        </p>
        <div className="settings-commit-field">
          <select
            id="commit-message-mode"
            className="settings-select"
            value={settings.commitMessage}
            onChange={(e) =>
              update({ commitMessage: e.target.value as DefaultCommitMessageMode })
            }
          >
            {COMMIT_MESSAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
