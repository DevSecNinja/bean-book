/**
 * Aggregate sanitized reviews into beans.
 *
 * Identity: reviews are grouped by a normalized roaster+name key so the same
 * bean reviewed by multiple people (or with minor casing/whitespace/diacritic
 * differences) collapses into one Bean with an averaged rating and the list of
 * individual reviews (Untappd-style).
 */

/** Normalize a string for identity matching (not for display). */
export function normalize(str) {
  if (typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Build a URL-safe slug from roaster + name. */
export function slugify(roaster, name) {
  const base = `${roaster} ${name}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'bean';
}

const SEP = '\u241f';
const key = (roaster, name) => `${normalize(roaster)}${SEP}${normalize(name)}`;

/** Most recent first; falls back to issue id. */
function byRecency(a, b) {
  const ta = Date.parse(a.submittedAt ?? '') || 0;
  const tb = Date.parse(b.submittedAt ?? '') || 0;
  if (tb !== ta) return tb - ta;
  return (b.id ?? 0) - (a.id ?? 0);
}

// Bean-level facts: intrinsic properties of the bean, taken from the most-recent
// non-empty value across reviews. Purchase-specific data (cost, weight,
// currency) deliberately lives on each Review, not here.
const FACT_FIELDS = [
  'roastType', 'roastLevel', 'blend', 'decaf', 'organic', 'species',
  'process', 'variety', 'origins', 'website', 'roastDate',
];

function isEmpty(v) {
  return v == null || (Array.isArray(v) && v.length === 0);
}

function mergeFacts(sortedReviews) {
  const facts = {};
  for (const field of FACT_FIELDS) {
    let value = null;
    for (const review of sortedReviews) {
      if (!isEmpty(review[field])) {
        value = review[field];
        break;
      }
    }
    facts[field] = value;
  }
  return facts;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Cheapest observed price per 100g across a bean's reviews.
 * Returns { value, currency } or null. Currencies aren't converted; we report
 * the lowest per-100g figure together with the currency it was paid in.
 */
function bestValuePer100g(reviews) {
  let best = null;
  for (const r of reviews) {
    if (r.cost != null && r.weightGrams > 0) {
      const per = (r.cost / r.weightGrams) * 100;
      if (best === null || per < best.value) best = { value: round2(per), currency: r.currency };
    }
  }
  return best;
}

/**
 * @param {object[]} reviews - sanitized reviews (non-null)
 * @returns {object[]} beans, best-rated first
 */
export function aggregate(reviews) {
  const groups = new Map();
  for (const review of reviews) {
    if (!review) continue;
    const k = key(review.roaster, review.name);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(review);
  }

  const usedSlugs = new Set();
  const beans = [];

  for (const [k, group] of groups) {
    const sorted = [...group].sort(byRecency);
    const primary = sorted[0];

    let slug = slugify(primary.roaster, primary.name);
    let unique = slug;
    let n = 2;
    while (usedSlugs.has(unique)) unique = `${slug}-${n++}`;
    usedSlugs.add(unique);

    const averageRating = round2(
      sorted.reduce((sum, r) => sum + r.rating, 0) / sorted.length,
    );

    const flavours = [];
    for (const r of sorted) {
      for (const f of r.flavours ?? []) {
        if (!flavours.includes(f)) flavours.push(f);
      }
    }

    beans.push({
      slug: unique,
      key: k,
      name: primary.name,
      roaster: primary.roaster,
      averageRating,
      reviewCount: sorted.length,
      valuePer100g: bestValuePer100g(sorted),
      facts: mergeFacts(sorted),
      flavours,
      reviews: sorted,
    });
  }

  beans.sort((a, b) => {
    if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
    return a.name.localeCompare(b.name);
  });

  return beans;
}
