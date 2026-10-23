# Release C accessibility and performance lane Checklist

## Metadata

- Created: 2026-10-23T03:37:40
- Last Updated: 2026-10-23T08:08:12Z
- Workspace: /private/tmp/aifactory-c-accessibility-20261023
- Checklist Doc: /private/tmp/aifactory-c-accessibility-20261023/docs/release-c-accessibility-and-performance-lane-production-checklist.md

## Scope

Bounded UI accessibility/performance lane from d6be278, branch
`codex/c-accessibility-performance`. Root nonce-CSP commit 1e461dc is cherry-picked
as e12e6d1 and prerequisite a0106dd as 92c63b1 for actual strict-policy qualification. B mechanics, shared contracts,
session wiring, dependency manifests and deployment remain integration-owned.
No human usability or complete WCAG certification is claimed.

## Sign-off Gate

- [x] G-001 [status:verified] Required work is complete within the bounded lane scope.
- [x] G-002 [status:verified] Findings are resolved or explicitly dispositioned with reasons.
- [x] G-003 [status:verified] Required validation supports the final local source/runtime state.
- [x] G-004 [status:verified] Consequential residual risks and follow-ups are disclosed.

## Rerun Matrix

UI/CSS changes require scoped type/lint/build plus the affected rendered matrix.
Nonce/CSP changes invalidate browser startup/dialog/character evidence. Bundle
changes require complete static import/preload graph counting plus observed
startup requests. Performance measurements belong only to the measured source.

## Audit Queue

- [x] Q-001 [status:verified] Establish isolated source, scope and trusted dependencies.
- [x] Q-002 [status:verified] Reflow Synergy tabs and enforce 44px actions/source disclosures.
- [x] Q-003 [status:verified] Add skip/focus behavior and restore Reset trigger focus.
- [x] Q-004 [status:verified] Lazy-load optional character route and use expression-free SVG player with motion preference cleanup.
- [x] Q-005 [status:verified] Count complete initial JS graph and per-asset gzip, with fixture regressions.
- [x] Q-006 [status:verified] Qualify final strict-CSP browsers and local performance evidence.

## Findings Log

- [x] F-001 [status:verified] [P2] confidence:high Reset dialog lost keyboard focus when dismissed.
  - Evidence: first Chromium/Firefox matrix failed trigger focus after Escape; explicit ref restoration resolves it in the refreshed three-browser matrix.
  - Owner: accessibility/performance lane.
- [x] F-002 [status:verified] [P2] confidence:high Eager optional Spark route imported full Lottie expression runtime into initial game JS.
  - Evidence: complete initial graph is 557,005 bytes raw / 157,839 bytes gzip, including shared runtime. Character route and SVG player are observed absent at startup.
  - Owner: accessibility/performance lane.
- [x] F-003 [status:verified] [P3] confidence:high Local HTTP WebKit tests cannot qualify production upgrade-insecure-requests.
  - Evidence: WebKit blank page had TLS failures loading upgraded assets. Loopback HTTPS test proxy preserves all production policy headers rather than weakening CSP.
  - Owner: accessibility/performance lane test harness.

## Fix Log

- [x] P-001 [status:verified] Implement explicit reset-focus return, skip landmark and visible focus, 44px primitive targets, reflowing synergy navigation.
  - Addresses: F-001 and the assigned C accessibility floor.
  - Evidence: final local production-mode three-browser matrix passed.
- [x] P-002 [status:verified] Conditional route/player imports, light SVG renderer, reduced-motion preference and unmount cleanup.
  - Addresses: F-002.
  - Evidence: complete graph budget and startup request assertions passed; no expression runtime in built JS.
- [x] P-003 [status:verified] Add loopback HTTPS-only cross-browser harness with short-lived generated test certificates; no application server changes.
  - Addresses: F-003.
  - Evidence: strict production CSP retained while all three browsers passed.

## Validation Log

- [x] V-001 [status:verified] Typecheck, scoped lint and build passed with nonce and prerequisite contracts.
  - Evidence: 2026-10-23 final source checks passed; root-owned package files were cherry-picked, not manually changed.
- [x] V-002 [status:verified] Initial graph helper fixtures passed 4/4: static imports/cycles/preloads/inline code, external fail-closed, lazy/string exclusion and query-distinct requests.
  - Evidence: 2026-10-23 Vitest passed 4/4; prior scoped presentation/A-canonical tests passed 16/16, preserving nine frozen A trajectories.
- [x] V-003 [status:verified] Pre-nonce production-mode matrix passed 12/12 on pinned Chromium/Firefox/WebKit over local HTTPS.
  - Evidence: 2026-10-23 pre-nonce matrix passed 12/12; superseded for release claims by V-004.
- [x] V-004 [status:verified] Repeat browser matrix after root nonce-CSP integration.
  - Evidence: 2026-10-23 final local strict-CSP Chromium/Firefox/WebKit matrix passed 12/12; output/c-accessibility-results.json. An earlier stale-dist run after a missing prerequisite build failure is excluded, not counted as nonce qualification.
- [x] V-005 [status:verified] Measure local cold LCP/CLS, active steady-state tasks, and accelerated retained-heap behavior with explicit scope/tolerance.
  - Evidence: 2026-10-23 output/c-performance-evidence.json passed diagnostic gates: median LCP 128ms, CLS 0, zero observed steady long tasks, retained heap +331,856 bytes over samples at active minutes 5–30. Last three samples rise by 26,180 then 7,132 bytes; 5MiB tolerance alone is not leakproof. Steady observation requested 30 wall seconds with first five seconds excluded (nominal 25 seconds); exact measured elapsed time was not separately exported.
- [x] V-006 [status:verified] Reuse the existing public-control completion strategy for later-era and completed-idle heap observations.
  - Evidence: 2026-10-23 output/c-full-run-performance-results.json passed 1/1 in 69.7 seconds. GNT2/3/4/6 sampled during play; after the existing final document reload, three GC samples at controlled-clock idle 30/60/90 seconds grew 8,368 bytes net. Reload contributes to heap reduction; no in-session release or universal leak absence is claimed.

## Residual Risks

- [x] R-001 [status:deferred] Root owns final integrated/served-SHA/full-release and human acceptance; local lane evidence does not substitute.
  - Rationale: outside this isolated implementation lane; integration owner must qualify the final combined source, production host and complete release scope.
- [x] R-002 [status:accepted_risk] Reflow equivalence at desktop 200%/400% uses effective CSS viewport widths; native browser UI zoom itself is not automated.
  - Rationale: tested 1280/640/320 CSS-pixel viewports on all five surfaces and separate actual 200% root text resize on Journey. This is bounded layout evidence, not native zoom, screen-reader/human testing or WCAG certification.

## Change Log

- 2026-10-23T03:37:40: Checklist initialized.
- 2026-10-23T08:08:12Z: Scoped implementation and final strict-CSP/heap evidence complete; integration and human boundaries retained.
