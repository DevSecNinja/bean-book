/** App orchestration: layout, theme, routing, rendering. */

import { el, clear } from './components.js';
import { loadData, findBean } from './data.js';
import { parseRoute, onRouteChange, interceptLinks } from './router.js';
import { renderHome } from './views/home.js';
import { renderBean } from './views/bean.js';

const SITE_URL = 'https://coffee.ravensberg.org';
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
    el('a', { class: 'brand', href: '/' },
      el('span', { class: 'brand-mark', 'aria-hidden': 'true', text: '☕' }),
      el('span', { class: 'brand-name', text: 'Bean Book' }),
    ),
    el('nav', { class: 'site-nav' },
      el('a', { class: 'btn ghost', href: NEW_REVIEW_URL, target: '_blank', rel: 'noopener', text: 'Add a review' }),
      themeToggle(),
    ),
  );
}

/** Keep <title> and social/canonical meta in sync during client navigation. */
function setMeta(name, attr, value) {
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

function updateHead(route, bean) {
  const path = route.name === 'bean' && bean ? `/bean/${bean.slug}/` : '/';
  const url = `${SITE_URL}${path}`;
  let title;
  let description;
  if (route.name === 'bean' && bean) {
    const facts = bean.facts ?? {};
    const bits = [
      `Rated ${bean.averageRating}/5 from ${bean.reviewCount} review${bean.reviewCount === 1 ? '' : 's'}`,
      facts.origins?.length ? facts.origins.join(', ') : null,
      bean.flavours?.length ? bean.flavours.join(', ') : null,
    ].filter(Boolean);
    title = `${bean.name} — ${bean.roaster} | Bean Book`;
    description = `${bean.name} by ${bean.roaster}. ${bits.join('. ')}.`;
  } else {
    title = 'Bean Book — Coffee bean reviews';
    description = 'A hand-kept log of coffee beans worth remembering — ratings, roasters and tasting notes. Untappd, but for coffee.';
  }
  document.title = title;
  setMeta('description', 'name', description);
  setMeta('og:title', 'property', title);
  setMeta('og:description', 'property', description);
  setMeta('og:url', 'property', url);
  setMeta('twitter:title', 'name', title);
  setMeta('twitter:description', 'name', description);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

function footer(data, buildId) {
  const shortHash = (buildId || '').split('-')[0] || 'dev';
  const isRealHash = /^[0-9a-f]{7,40}$/i.test(shortHash);
  const generated = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const build = isRealHash
    ? el('a', {
        class: 'build', href: `${REPO_URL}/commit/${shortHash}`,
        target: '_blank', rel: 'noopener', title: 'View this build’s commit', text: shortHash,
      })
    : el('code', { class: 'build', title: 'Build commit', text: shortHash });
  return el('footer', { class: 'site-footer' },
    el('p', {},
      el('a', { href: REPO_URL, target: '_blank', rel: 'noopener', text: 'Bean Book on GitHub' }),
      ' · reviews sourced from GitHub Issues',
    ),
    el('p', { class: 'muted small' },
      generated ? `Data updated ${generated} · ` : '',
      build,
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
    let bean = null;
    if (route.name === 'bean') {
      bean = findBean(data, route.slug);
      if (bean) {
        renderBean(content, bean);
      } else {
        clear(content);
        content.append(el('div', { class: 'empty' },
          el('h1', { text: 'Bean not found' }),
          el('a', { class: 'btn', href: '/', text: '← Back to all beans' }),
        ));
      }
    } else {
      renderHome(content, data);
    }
    updateHead(route, bean);
    content.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  };

  onRouteChange(render);
  interceptLinks();
  render(parseRoute());
}
