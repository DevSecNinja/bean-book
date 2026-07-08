/** Load and lightly shape the generated beans data. */

let cache = null;

/**
 * Fetch data/beans.json (relative to the app, so it works on a Pages project
 * path and offline via the service worker cache).
 * @returns {Promise<{generatedAt:string, buildId:string, beans:object[]}>}
 */
export async function loadData() {
  if (cache) return cache;
  const res = await fetch('/data/beans.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.beans)) {
    throw new Error('Malformed data file');
  }
  cache = data;
  return data;
}

/** Find a bean by slug. */
export function findBean(data, slug) {
  return data.beans.find((b) => b.slug === slug) ?? null;
}

/** Distinct sorted roaster names, for the filter control. */
export function roasters(data) {
  return [...new Set(data.beans.map((b) => b.roaster))].sort((a, b) => a.localeCompare(b));
}
