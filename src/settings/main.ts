import { mountSettingsUi } from '@/lib/mountSettingsUi';
import './index.css';

const root = document.getElementById('root');
if (root) {
  const header = document.createElement('header');
  header.className = 'settings-page-header';
  const title = document.createElement('h1');
  title.className = 'settings-page-header-title';
  title.textContent = 'Settings';
  header.appendChild(title);
  root.appendChild(header);

  const content = document.createElement('div');
  content.className = 'settings-page-content';
  root.appendChild(content);
  mountSettingsUi(content);
}
