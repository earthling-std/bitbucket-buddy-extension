import { mountSettingsUi } from '@/lib/mountSettingsUi';
import './App.css';
import './index.css';

const root = document.getElementById('root');
if (root) {
  const shell = document.createElement('div');
  shell.className = 'sidepanel-app';
  if (typeof (globalThis as { browser?: unknown }).browser !== 'undefined') {
    shell.classList.add('sidepanel-app--firefox-sidebar');
  }
  root.appendChild(shell);
  mountSettingsUi(shell);
}
