/** App orchestration: layout, theme, routing, rendering. */

import { el, clear } from './components.js';
import { loadData, findBean } from './data.js';
import { parseHash, onRouteChange } from './router.js';
import { renderHome } from './views/home.js';
import { renderBean } from './views/bean.js';

const REPO_URL = 'https://github.com/DevSecNinja/bean-book';
const NEW_REVIEW_URL = `${REPO_URL}/issues/new?template=bean-review.yml`;

const THEMES = ['auto', 'light', 'dark'];
const THEME_KEY = 'bean-book-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function themeToggle() {
  let current = localStorage.getItem(THEME_KEY) || 'auto';
  applyTheme(current);
  const labels = { auto: '🌗 Auto', light: '☀️ Light', dark: '🌙 Dark' };
  const btn = el('button', {
    class: 'theme-toggle', type: 'button', 'aria-label': 'Change colour theme',
    text: labels[current],
  });
  btn.addEventListener('click', () => {
    current = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    localStorage.setItem(THEME_KEY, current);
    applyTheme(current);
    btn.textContent = labels[current];
  });
  return btn;
}

function header() {
  return el('header', { class: 'site-header' },
    el('a', { class: 'brand', href: '#/' },
      el('span', { class: 'brand-mark', 'aria-hidden': 'true', text: '☕' }),
      el('span', { class: 'brand-name', text: 'Bean Book' }),
    ),
    el('nav', { class: 'site-nav' },
      el('a', { class: 'btn ghost', href: NEW_REVIEW_URL, target: '_blank', rel: 'noopener', text: 'Add a review' }),
      themeToggle(),
    ),
  );
}

function footer(data, buildId) {
  const shortHash = (buildId || '').split('-')[0] || 'dev';
  const generated = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  return el('footer', { class: 'site-footer' },
    el('p', {},
      el('a', { href: REPO_URL, target: '_blank', rel: 'noopener', text: 'Bean Book on GitHub' }),
      ' · reviews sourced from GitHub Issues',
    ),
    el('p', { class: 'muted small' },
      generated ? `Data updated ${generated} · ` : '',
      el('code', { class: 'build', title: 'Build commit', text: shortHash }),
    ),
  );
}

export async function initApp(root, { buildId } = {}) {
  clear(root);
  const content = el('main', { class: 'content', id: 'content', tabindex: '-1' });

  let data;
  try {
    data = await loadData();
  } catch {
    root.append(header(), el('main', { class: 'content' },
      el('div', { class: 'empty' },
        el('h1', { text: 'Nothing brewing yet' }),
        el('p', { text: 'No reviews have been published yet. Check back soon!' }),
        el('a', { class: 'btn primary', href: NEW_REVIEW_URL, target: '_blank', rel: 'noopener', text: '☕ Add the first review' }),
      ),
    ), footer(null, buildId));
    return;
  }

  root.append(header(), content, footer(data, buildId));

  const render = (route) => {
    if (route.name === 'bean') {
      const bean = findBean(data, route.slug);
      if (bean) {
        renderBean(content, bean);
      } else {
        clear(content);
        content.append(el('div', { class: 'empty' },
          el('h1', { text: 'Bean not found' }),
          el('a', { class: 'btn', href: '#/', text: '← Back to all beans' }),
        ));
      }
    } else {
      renderHome(content, data);
    }
    content.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  };

  onRouteChange(render);
  render(parseHash());
}
