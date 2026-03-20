(function () {
  const MODAL_SELECTOR = '[data-testid="modal-dialog"]';
  const TITLE_TEXT_SELECTOR = '[data-testid="modal-dialog--title-text"]';
  const TEXTAREA_SELECTOR = 'textarea[name="merge-dialog-commit-message-textfield"]';

  let DEBUG = false;
  try {
    DEBUG = localStorage.getItem("bbMergeMsgDebug") === "1";
  } catch {
    /* private mode or storage blocked */
  }

  function dbg(...args) {
    if (DEBUG) console.log("[Bitbucket merge msg]", ...args);
  }

  let rafScheduled = false;
  let pollTimer = null;

  function scheduleScan() {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      scanAndRewrite();
    });
  }

  function mergeModalOpen() {
    for (const modal of document.querySelectorAll(MODAL_SELECTOR)) {
      if (!mergeModalTitleIsMergePr(modal)) continue;
      if (modal.querySelector(TEXTAREA_SELECTOR)) return true;
    }
    return false;
  }

  function ensurePollWhileModalOpen() {
    if (pollTimer != null) return;
    pollTimer = setInterval(() => {
      scanAndRewrite();
      if (!mergeModalOpen()) {
        clearInterval(pollTimer);
        pollTimer = null;
        dbg("modal closed, poll stopped");
      }
    }, 150);
    dbg("poll started (React often fills the textarea after mount)");
  }

  function mergeModalTitleIsMergePr(modal) {
    const titleEl = modal.querySelector(TITLE_TEXT_SELECTOR);
    if (!titleEl) return false;
    return titleEl.textContent.trim() === "Merge pull request";
  }

  function setTextareaValueForReact(textarea, value) {
    const proto = window.HTMLTextAreaElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) {
      desc.set.call(textarea, value);
    } else {
      textarea.value = value;
    }
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function scanAndRewrite() {
    let sawMergeModal = false;

    for (const modal of document.querySelectorAll(MODAL_SELECTOR)) {
      if (!mergeModalTitleIsMergePr(modal)) continue;

      const textarea = modal.querySelector(TEXTAREA_SELECTOR);
      if (!textarea) continue;

      sawMergeModal = true;

      const next = transformMergeMessage(textarea.value);
      if (next == null) {
        dbg("no rewrite", {
          length: textarea.value.length,
          firstLine: textarea.value.split(/\r?\n/)[0]?.slice(0, 100),
        });
        continue;
      }

      dbg("rewriting commit message");
      setTextareaValueForReact(textarea, next);
    }

    if (sawMergeModal) ensurePollWhileModalOpen();
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  scheduleScan();
})();
