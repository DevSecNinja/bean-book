# Tasks: Bean Book Website

**Feature**: 001-bean-book-website | **Spec**: ./spec.md | **Plan**: ./plan.md

Tasks are grouped by user story. `[P]` = parallelizable. Each story is an
independently testable slice.

## Phase 1: Foundational (blocks all stories)

- [ ] T001 Add repo config: `package.json` (scripts, dev deps), `.mise.toml`,
  `renovate.json5`, `.gitignore`, merge `.vscode/settings.json`.
- [ ] T002 Add `scripts/lib/parse-issue.js` — parse issue-form body into a raw
  review object keyed by the template's `### <label>` sections. [P]
- [ ] T003 Add `scripts/lib/sanitize.js` — validate/sanitize a raw review:
  enums, rating grid, numbers, `http(s)` URLs, control/HTML stripping, drop
  unknowns; reject invalid reviews. [P]
- [ ] T004 Add `scripts/lib/aggregate.js` — normalize identity and aggregate
  reviews into beans (average rating, merged facts, slug). [P]
- [ ] T005 Add `scripts/build-data.js` — fetch closed+`published` bean-review
  issues via GitHub API (token), pipe through parse→sanitize→aggregate, write
  `data/beans.json`; fall back to `data/beans.sample.json` without network.

## Phase 2: User Story 1 — Browse beans (P1)

- [ ] T010 `index.html` app shell + `styles.css` (modern light/dark, responsive).
- [ ] T011 `src/data.js` load & shape `beans.json`.
- [ ] T012 `src/components.js` + `src/format.js` safe DOM builders + formatting.
- [ ] T013 `src/views/home.js` bean gallery with search + filters.
- [ ] T014 `src/main.js` + `src/app.js` + `src/router.js` boot + hash routing.
- [ ] T015 Seed `data/beans.sample.json` and `data/beans.json` from real issues.

**Checkpoint**: Home gallery renders and filters from `beans.json`.

## Phase 3: User Story 2 — Bean detail (P1)

- [ ] T020 `src/views/bean.js` detail page: header with average rating + facts.
- [ ] T021 Individual review cards with GitHub username + avatar, rating, notes,
  flavour tags, safe website link.

**Checkpoint**: `#/bean/:slug` shows aggregated rating + all reviews.

## Phase 4: User Story 3 — Offline PWA (P2)

- [ ] T030 `manifest.webmanifest` + `icons/` (SVG + 192/512 PNG + apple-touch).
- [ ] T031 `service-worker.js` (app-shell precache, network-first HTML/data,
  cache-first assets, `__BUILD_ID__`).
- [ ] T032 SW registration + auto-update + build-hash footer in `src/main.js`.

**Checkpoint**: Works offline on repeat visit; updates on new build.

## Phase 5: User Story 4 — Submit CTA + publish gate (P3)

- [ ] T040 "Add a review" CTA linking to the issue form; empty-state.
- [ ] T041 Confirm publish gate in `build-data.js` (closed + `published`).

## Phase 6: CI/CD + Tests + Polish

- [ ] T050 `scripts/serve.js` zero-dep dev server; `npm start`.
- [ ] T051 vitest: `tests/parse-issue.test.js`, `tests/sanitize.test.js`
  (incl. malicious inputs), `tests/aggregate.test.js`. [P]
- [ ] T052 `tests/a11y.test.js` jsdom + axe smoke test. [P]
- [ ] T053 `.github/workflows/ci-cd.yml` single pipeline: test → build data →
  stamp BUILD_ID → assemble `_site` → deploy to GitHub Pages; rebuild on issues.
- [ ] T054 `README.md` (how it works, how to submit, local dev).
- [ ] T055 Validate: run build on fixtures, `npm test`, serve + smoke check.
