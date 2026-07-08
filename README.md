# ☕ Bean Book

**Untappd, but for coffee beans.** A hand-kept, offline-capable log of coffee
beans worth remembering — ratings, roasters and tasting notes — built as a
static site and sourced entirely from GitHub Issues. No backend, no database.

## How it works

```text
You (or anyone) open a "Bean Review" issue  ──►  Owner closes it with the
   (structured GitHub Issue Form)                 `published` label
                                                        │
                                                        ▼
   CI pipeline fetches published issues  ──►  parses + sanitizes + aggregates
   (closed + `published` + `bean-review`)      into data/beans.json
                                                        │
                                                        ▼
              Static PWA (this repo) renders it  ──►  deployed to GitHub Pages
```

- **Publishing is owner-moderated.** A review only appears once its issue is
  **closed** and carries the **`published`** label. Open or unlabeled
  submissions never reach the site.
- **Untappd-style aggregation.** Reviews of the same bean (matched by a
  normalized roaster + name) are grouped into one bean page showing the average
  rating and every individual review, each crediting its GitHub author.
- **Untrusted input is treated as hostile.** Everything from an issue is
  validated and sanitized at build time (enums checked, ratings snapped to the
  1–5 / 0.25 grid, `http(s)`-only URLs, HTML/entities stripped). The frontend
  only ever renders text via `textContent`.

## Submit a review

Open a [Bean Review issue](../../issues/new?template=bean-review.yml) and fill in
the form. Once it's reviewed and published by the maintainer, it shows up on the
site.

## Publishing, updating & removing reviews

The build is **stateless**: every relevant event re-fetches *all* reviews that
are **closed** and carry the **`published`** label, regenerates `data/beans.json`
and redeploys. There is no "processed" marker to manage — `published` is simply
the on/off gate.

| I want to… | Do this | What happens |
|------------|---------|--------------|
| **Publish** a review | Close the issue with the `published` label (the maintainer does this; valid submissions from the repo owner are auto-published) | The `closed`/`labeled` event triggers a rebuild and the bean appears |
| **Update** a published review | **Just edit the issue** (title or body). No need to reopen or touch labels | The `edited` event triggers a rebuild; the new content replaces the old on the next deploy |
| **Unpublish** a review | Remove the `published` label, **or** reopen the issue | The `unlabeled`/`reopened` event rebuilds; the bean disappears (it no longer matches "closed + published") |

Changes go live once the **CI/CD** run finishes (~1–2 min) and the CDN
refreshes. A daily scheduled run and the manual **Run workflow** button are
backstops if an event is ever missed.

> Editing a published (closed) issue does **not** re-run the validation bot —
> that only runs on `bean-review` issues that aren't published yet.

## Tech

- Vanilla HTML + CSS + ES modules. **Zero runtime dependencies.**
- Offline **PWA**: web manifest + service worker (network-first for HTML/data,
  cache-first for assets, `BUILD_ID` cache-busting; commit hash shown in footer).
- Data pipeline & tests in Node; **vitest** for unit + a11y tests.
- Deployed to **GitHub Pages** via a single combined CI/CD workflow.

## Local development

```bash
mise install          # provisions Node (and lint tooling)
npm ci                # install dev dependencies
npm run build         # regenerate data/beans.json (uses the sample fixture
                      #   locally; live published issues when GITHUB_TOKEN is set)
npm start             # serve at http://localhost:8080
npm test              # run the unit + accessibility tests
```

`data/beans.sample.json` holds a small fixture (real seed reviews) so the site
renders locally without hitting the GitHub API. In CI, `npm run build` pulls the
live published issues instead.

## Project layout

```text
index.html, styles.css, manifest.webmanifest, service-worker.js
src/            # frontend ES modules (views, router, safe DOM helpers)
scripts/        # build-data.js + pure lib/ (parse, sanitize, aggregate)
data/           # generated beans.json + sample fixture
icons/          # PWA icons
tests/          # vitest unit + a11y tests
specs/          # Spec Kit spec, plan, data model, tasks
.specify/       # Spec Kit constitution & templates
```

## License

MIT — see [LICENSE](./LICENSE).
