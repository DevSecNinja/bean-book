/**
 * Path-based router (History API).
 *
 * Real, crawlable URLs:
 *   /            -> home (bean gallery)
 *   /bean/:slug/ -> bean detail
 *
 * Clicks on internal links are intercepted for snappy in-app navigation, but
 * the links remain real paths so each page is a prerendered, indexable URL.
 */

const BEAN_RE = /\/bean\/([^/]+)\/?$/;

export function parseRoute(loc = window.location) {
  const m = BEAN_RE.exec(loc.pathname);
  if (m) return { name: 'bean', slug: decodeURIComponent(m[1]) };
  return { name: 'home' };
}

export function onRouteChange(handler) {
  window.addEventListener('popstate', () => handler(parseRoute()));
}

export function navigate(path) {
  if (path === window.location.pathname + window.location.search) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Intercept same-origin left-clicks on links so navigation stays client-side.
 * External links, new-tab clicks and downloads fall through to the browser.
 */
export function interceptLinks() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = e.target.closest && e.target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    navigate(url.pathname + url.search);
  });
}
