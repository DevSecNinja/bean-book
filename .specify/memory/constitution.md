# Bean Book Constitution

<!-- Governing principles for the Bean Book coffee-review website. -->

## Core Principles

### I. No Backend, Static-First

The site MUST be a fully static site deployable to GitHub Pages with no runtime
server, database, or third-party hosted service. All dynamic data is produced at
build time from GitHub Issues and shipped as static JSON. If a feature appears to
require a backend, it MUST be redesigned as a build-time or client-only capability.

### II. Minimal, Trusted Dependencies

The runtime ships **zero** third-party JavaScript dependencies: vanilla HTML, CSS
and ES modules only. Build/test tooling MUST be kept minimal and limited to
well-trusted packages (e.g. vitest). Adding any dependency requires a written
justification in the plan and pinning to the latest stable version.

### III. Untrusted Input Is Hostile (NON-NEGOTIABLE)

Every field sourced from a GitHub Issue is untrusted, because anyone can submit a
review. The build pipeline MUST validate and sanitize all issue-derived data:
whitelist fields, validate enums/numbers against the issue form's allowed values,
allow only `http(s)` URLs, strip control characters, and never emit raw HTML. The
frontend MUST render user text via DOM text nodes (`textContent`), never
`innerHTML`. No unsanitized value ever reaches the DOM or the data file.

### IV. Offline-First PWA

The site MUST be installable and work offline as a PWA: a web app manifest, a
service worker that pre-caches the app shell, network-first for HTML/data and
cache-first for static assets, and a `__BUILD_ID__` cache-buster stamped at deploy
so every commit auto-updates clients. The current build's commit hash MUST be
visible in the footer.

### V. Accessible & Responsive

The UI MUST be usable with a keyboard and screen reader: semantic HTML, labelled
controls, sufficient colour contrast, and visible focus. It MUST support light and
dark themes (respecting the system preference) and work on mobile and desktop.

### VI. Owner-Moderated Publishing

Only issues that are **closed** and carry the `published` label are built into the
site. Open, unlabeled, or spam submissions never appear. Publication is an explicit
owner action; the pipeline enforces this gate.

## Development Workflow

- Follow the GitHub Spec Kit flow: constitution → specify → clarify → plan → tasks
  → analyze → implement.
- Commits follow Conventional Commits.
- Tooling is pinned and managed with **mise**; dependencies are Renovate-managed.
- Automated tests (vitest) cover the issue parser, sanitizer, and aggregator, plus
  an accessibility smoke check. Tests MUST pass before deploy.
- CI/CD lives in a single combined pipeline that tests, generates the data
  artifact from published issues, stamps the build id, and deploys to GitHub Pages.

## Governance

This constitution supersedes ad-hoc practice. Amendments are made via pull request
that updates this file, states the rationale, and bumps the version below. Any
change that relaxes Principle III (input safety) or Principle I (no backend)
requires explicit maintainer approval and a documented threat/impact assessment.
All plans and reviews MUST verify compliance with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-07-08 | **Last Amended**: 2026-07-08
