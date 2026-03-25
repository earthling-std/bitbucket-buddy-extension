import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import sonnerCss from 'sonner/dist/styles.css?inline';
import { initMergeMessageTransform } from './merge-message';

const HOST_ID = 'bitbucket-merge-commit-sonner';

/** Mount Sonner in a shadow root, then watch for merge modal and rewrite commit message. */
export function startBitbucketMergeCommitContent(): void {
  if (!document.getElementById(HOST_ID)) {
    const host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = sonnerCss;
    shadow.appendChild(style);

    const mount = document.createElement('div');
    shadow.appendChild(mount);

    createRoot(mount).render(
      <StrictMode>
        <Toaster position="bottom-right" richColors duration={4000} />
      </StrictMode>,
    );
  }

  initMergeMessageTransform();
}
