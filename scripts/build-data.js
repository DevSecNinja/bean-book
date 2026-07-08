/**
 * Build the static data file (data/beans.json) for the site.
 *
 * Source of truth: GitHub Issues created from the bean-review form that are
 * CLOSED and carry the `published` label (owner-moderated publishing).
 *
 * The same pipeline (parse -> sanitize -> aggregate) runs on either live issues
 * or a committed sample fixture, so builds and tests never require the network.
 *
 * Usage:
 *   GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo node scripts/build-data.js
 *   node scripts/build-data.js            # no token -> uses the sample fixture
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseIssue } from './lib/parse-issue.js';
import { sanitizeReview } from './lib/sanitize.js';
import { aggregate } from './lib/aggregate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'data', 'beans.json');
const SAMPLE = join(ROOT, 'data', 'beans.sample.json');

const REPO = process.env.GITHUB_REPOSITORY || 'DevSecNinja/bean-book';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const PUBLISH_LABEL = 'published';
const FORM_LABEL = 'bean-review';

async function fetchPublishedIssues() {
  const issues = [];
  const base = `https://api.github.com/repos/${REPO}/issues`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'bean-book-build',
    Authorization: `Bearer ${TOKEN}`,
  };
  for (let page = 1; page <= 20; page += 1) {
    const url = `${base}?state=closed&labels=${PUBLISH_LABEL},${FORM_LABEL}`
      + `&per_page=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    // Exclude pull requests (the issues endpoint includes them).
    for (const item of batch) {
      if (!item.pull_request) issues.push(item);
    }
    if (batch.length < 100) break;
  }
  return issues;
}

/** A closed, published, bean-review issue that isn't a PR. */
function isPublishable(issue) {
  if (!issue || issue.pull_request) return false;
  if (issue.state && issue.state !== 'closed') return false;
  const labels = (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l?.name));
  return labels.includes(PUBLISH_LABEL) && labels.includes(FORM_LABEL);
}

async function loadSampleIssues() {
  try {
    const text = await readFile(SAMPLE, 'utf8');
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  let issues;
  let source;
  if (TOKEN) {
    try {
      issues = await fetchPublishedIssues();
      source = 'github';
    } catch (err) {
      console.warn(`[build-data] live fetch failed (${err.message}); using sample.`);
      issues = await loadSampleIssues();
      source = 'sample-fallback';
    }
  } else {
    console.warn('[build-data] no GITHUB_TOKEN; using sample fixture.');
    issues = await loadSampleIssues();
    source = 'sample';
  }

  const reviews = issues
    .filter(isPublishable)
    .map(parseIssue)
    .map(sanitizeReview)
    .filter(Boolean);

  const beans = aggregate(reviews);

  const output = {
    generatedAt: new Date().toISOString(),
    buildId: '__BUILD_ID__',
    beanCount: beans.length,
    reviewCount: reviews.length,
    beans,
  };

  await writeFile(OUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(
    `[build-data] wrote ${beans.length} beans / ${reviews.length} reviews `
    + `to data/beans.json (source: ${source}).`,
  );
}

main().catch((err) => {
  console.error('[build-data] fatal:', err);
  process.exit(1);
});
