/**
 * Minimal hash router. Routes:
 *   #/            -> home (bean gallery)
 *   #/bean/:slug  -> bean detail
 */

export function parseHash(hash = window.location.hash) {
  const clean = hash.replace(/^#/, '');
  const parts = clean.split('/').filter(Boolean); // ['', 'bean', 'slug'] -> ['bean','slug']
  if (parts[0] === 'bean' && parts[1]) {
    return { name: 'bean', slug: decodeURIComponent(parts[1]) };
  }
  return { name: 'home' };
}

export function onRouteChange(handler) {
  window.addEventListener('hashchange', () => handler(parseHash()));
}

export function go(path) {
  window.location.hash = path;
}
