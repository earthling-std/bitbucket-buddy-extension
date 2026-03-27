const LABELS = [
  'praise',
  'suggestion',
  'issue',
  'question',
  'nitpick',
  'thought',
  'chore',
] as const;

const DECORATIONS = ['blocking', 'non-blocking', 'minor'] as const;

const LABEL_TOOLTIPS: Record<string, string> = {
  praise: 'Highlights something positive. Great for boosting morale.',
  suggestion: 'Proposes an improvement. Be explicit about why and how.',
  issue: 'Points out a bug or problem that likely needs fixing.',
  question: 'Asks for clarification when you are unsure about something.',
  nitpick: 'A trivial, non-blocking preference (e.g. naming, styling).',
  thought: 'An idea or reflection that does not require action.',
  chore: 'A minor maintenance task (e.g. updating docs, renaming).',
};

const DECORATION_TOOLTIPS: Record<string, string> = {
  blocking: 'Must be resolved before merging.',
  'non-blocking': 'A suggestion to consider, but not required.',
  minor: 'A small, low-priority change.',
};

type ConventionalLabel = (typeof LABELS)[number];
type ConventionalDecoration = (typeof DECORATIONS)[number];

const LABEL_PATTERN =
  /^(praise|suggestion|issue|question|nitpick|thought|chore)(\([^)]*\))?:\s*/;

const TOOLBAR_CSS = `
  :host {
    display: block;
    margin-top: 6px;
  }
  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 4px 0px 4px;
    font-family: var(--ds-font-family-body);
  }
  .toolbar-btn {
    font-family: var(--ds-font-family-body);
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid transparent;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.1s;
    white-space: nowrap;
    user-select: none;
    color: var(--ds-text-subtle, #505258);
    background: rbga(5,21,36,0.06);
    border: 1px solid rbga(5,21,36,0.06);

  }
  .toolbar-btn:hover { opacity: 0.78; }
  .toolbar-btn[aria-pressed="true"] { 
    background: var(--ds-background-success-hovered); 
    // border: 1px solid var(--ds-border-success);
    color: var(--ds-text-success); 
  }
  .divider {
    width: 1.5px;
    height: 28px;
    background: rgba(127,127,127,0.3);
    margin: 0 2px;
    flex-shrink: 0;
  }
  .deco-btn {
    // background: transparent;
    // border: 1px solid var(--ds-border, #c1c8cd);
  }
  .deco-btn[aria-pressed="true"] {
    background: var(--ds-background-discovery-hovered);
    color: var(--ds-text-discovery);
    // border: 1px solid var(--ds-border-discovery, #c1c8cd);

  }
`;

const TOOLTIP_ID = 'bbbuddy-cc-tooltip';

function getOrCreateTooltipEl(): HTMLDivElement {
  let el = document.getElementById(TOOLTIP_ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = TOOLTIP_ID;
    el.style.cssText = [
      'position:fixed',
      'z-index:2147483647',
      'background:#1e293b',
      'color:#f8fafc',
      'font-size:11px',
      'font-weight:700',
      'line-height:1.4',
      'padding:5px 8px',
      'border-radius:5px',
      'pointer-events:none',
      'white-space:normal',
      'max-width:220px',
      'box-shadow:0 2px 8px rgba(0,0,0,0.25)',
      "font-family:ui-sans-serif,system-ui,-apple-system,sans-serif",
      'display:none',
    ].join(';');
    document.body.appendChild(el);
  }
  return el;
}

function showTooltip(text: string, anchor: DOMRect): void {
  const el = getOrCreateTooltipEl();
  el.textContent = text;
  el.style.display = 'block';
  // Position above the anchor; adjust after the element has rendered dimensions
  requestAnimationFrame(() => {
    const w = el.offsetWidth;
    const left = Math.max(8, Math.min(anchor.left + anchor.width / 2 - w / 2, window.innerWidth - w - 8));
    const top = anchor.bottom + 6;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  });
}

function hideTooltip(): void {
  const el = document.getElementById(TOOLTIP_ID);
  if (el) el.style.display = 'none';
}

function addTooltip(btn: HTMLButtonElement, text: string): void {
  btn.addEventListener('mouseenter', () => showTooltip(text, btn.getBoundingClientRect()));
  btn.addEventListener('mouseleave', hideTooltip);
}

function findFirstTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  for (const child of node.childNodes) {
    const found = findFirstTextNode(child);
    if (found) return found;
  }
  return null;
}

function prependLabelPrefix(editor: HTMLElement, prefix: string): void {
  editor.focus();

  const text = editor.textContent ?? '';
  const match = text.match(LABEL_PATTERN);

  if (match) {
    // Select the existing label prefix so insertText replaces it
    const firstText = findFirstTextNode(editor);
    const sel = window.getSelection();
    if (firstText && sel) {
      const range = document.createRange();
      const len = Math.min(match[0].length, firstText.length);
      range.setStart(firstText, 0);
      range.setEnd(firstText, len);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } else {
    // Place caret at position 0
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.setStart(editor, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  document.execCommand('insertText', false, prefix);
}

function buildPrefix(label: ConventionalLabel, decoration: ConventionalDecoration | null): string {
  return decoration ? `${label}(${decoration}): ` : `${label}: `;
}

function createToolbarHost(editor: HTMLElement): HTMLDivElement {
  const host = document.createElement('div');
  host.setAttribute('data-bbbuddy-cc', 'true');
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = TOOLBAR_CSS;
  shadow.appendChild(style);

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Conventional comment labels');
  shadow.appendChild(toolbar);

  // Label + decoration state in closure
  let selectedDecoration: ConventionalDecoration | null = null;
  const labelButtons: HTMLButtonElement[] = [];
  const decoButtons: HTMLButtonElement[] = [];

  function setLabel(l: ConventionalLabel | null): void {
    for (const b of labelButtons) {
      b.setAttribute('aria-pressed', String(b.dataset['label'] === l));
    }
  }

  function setDecoration(d: ConventionalDecoration | null): void {
    selectedDecoration = d;
    for (const btn of decoButtons) {
      const pressed = btn.dataset['deco'] === d;
      btn.setAttribute('aria-pressed', String(pressed));
    }
  }

  // Label buttons
  for (const label of LABELS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toolbar-btn label--${label}';
    btn.textContent = label;
    btn.dataset['label'] = label;
    btn.setAttribute('aria-pressed', 'false');
    addTooltip(btn, LABEL_TOOLTIPS[label] ?? '');
    btn.addEventListener('click', () => {
      prependLabelPrefix(editor, buildPrefix(label, selectedDecoration));
      setLabel(label);
    });
    labelButtons.push(btn);
    toolbar.appendChild(btn);
  }

  // Divider
  const divider = document.createElement('div');
  divider.className = 'divider';
  divider.setAttribute('aria-hidden', 'true');
  toolbar.appendChild(divider);

  // Decoration buttons
  for (const deco of DECORATIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toolbar-btn deco-btn';
    btn.dataset['deco'] = deco;
    btn.setAttribute('aria-pressed', 'false');
    addTooltip(btn, DECORATION_TOOLTIPS[deco] ?? '');
    btn.textContent = `(${deco})`;
    btn.addEventListener('click', () => {
      const newDeco = selectedDecoration === deco ? null : deco;
      setDecoration(newDeco);
      // If a label prefix is already in the editor, update it with the new decoration
      const match = (editor.textContent ?? '').match(LABEL_PATTERN);
      if (match) {
        prependLabelPrefix(editor, buildPrefix(match[1] as ConventionalLabel, newDeco));
      }
    });
    decoButtons.push(btn);
    toolbar.appendChild(btn);
  }

  return host;
}

const injectedEditors = new WeakSet<HTMLElement>();

function isPrCommentEditor(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (!el.isContentEditable) return false;
  // Must have ProseMirror class or data-gramm fallback
  const hasProseMirror =
    el.classList.contains('ProseMirror') ||
    el.hasAttribute('data-gramm');
  if (!hasProseMirror) return false;
  // Must be visible
  if (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) return false;
  return true;
}

function findUntrackedEditors(): HTMLElement[] {
  const candidates = document.querySelectorAll<HTMLElement>(
    'div.ProseMirror[contenteditable="true"], div[contenteditable="true"][data-gramm]',
  );
  const result: HTMLElement[] = [];
  for (const el of candidates) {
    if (!injectedEditors.has(el) && isPrCommentEditor(el)) {
      result.push(el);
    }
  }
  return result;
}

function injectToolbar(editor: HTMLElement): void {
  injectedEditors.add(editor);
  const host = createToolbarHost(editor);
  editor.insertAdjacentElement('afterend', host);
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopPolling(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function isContextValid(): boolean {
  try {
    return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

function tick(): void {
  if (!isContextValid()) { stopPolling(); return; }
  const editors = findUntrackedEditors();
  if (editors.length === 0) return;
  for (const editor of editors) {
    injectToolbar(editor);
  }
}

function startPollingIfNeeded(): void {
  if (pollTimer !== null) return;
  tick();
  pollTimer = setInterval(tick, 300);
}

export function initConventionalComments(): void {
  const observer = new MutationObserver(() => {
    if (!isContextValid()) { observer.disconnect(); stopPolling(); return; }
    if (findUntrackedEditors().length > 0) startPollingIfNeeded();
    else stopPolling();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (findUntrackedEditors().length > 0) startPollingIfNeeded();
    });
  } else {
    if (findUntrackedEditors().length > 0) startPollingIfNeeded();
  }
}
