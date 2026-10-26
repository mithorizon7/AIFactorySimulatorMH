# Frontend QA — Release C accessibility/performance lane

- mode: original-design
- tier: 3
- implementation target: isolated codex/c-accessibility-performance source based on d6be278, with root CSP commit e12e6d1 and contracts commit 92c63b1; local production build at https://127.0.0.1:5014, entry index-B6ZRRrox.js.
- evidence: ../output/c-accessibility-results.json
- evidence: ../output/c-performance-evidence.json
- evidence: ../output/c-full-run-performance-results.json

## Verdict

Passed within the assigned local UI/performance scope. No open P0/P1/P2 issue was observed in the exercised flows. B mechanics and persistence strategy remain unchanged. This is not production qualification, human acceptance, native browser-zoom testing or full WCAG certification. The build was made from the isolated source before its final commit, so it does not claim an immutable served deployment SHA.

## Findings

- [P2] [status:resolved] Reset dialog dismissal lost trigger focus in Chromium/Firefox; explicit trigger-reference restoration now passes Escape and keyboard containment checks in all three browsers.
- [P2] [status:resolved] Eager optional Spark route pulled the full expression-capable animation runtime into startup. The route is now lazy, with the installed supported SVG-only light player and reduced-motion cleanup; startup requests exclude both optional chunks.
- [P2] [status:resolved] Synergy navigation clipped “Model Capability” at narrow widths. Wrapped 44px tabs and responsive card layout now pass geometry/overflow checks through 320 CSS pixels.

Local WebKit initially upgraded HTTP asset URLs under production CSP and failed TLS. The test-only loopback HTTPS proxy fixes the harness without relaxing application policy. Root-owned strict nonce policy remains `script-src 'self'`, `style-src 'self' 'nonce-…'`, `style-src-attr 'none'`. An earlier stale-dist matrix after a failed prerequisite build is explicitly excluded; the final rebuilt matrix is the evidence below.

## Visual and responsive evidence

The final production-mode matrix covers Dashboard, Training, Resources, Economy and Journey at 1280, 640 and 320 CSS-pixel widths in Chromium, Firefox and WebKit, including all four Synergy subtabs. All inspected visible main-content action/link/input/disclosure targets were at least 44×44 CSS pixels and no horizontal document overflow was found. Reset/header primitives also use 44px minimum targets.

640/320 are 200%/400% desktop-equivalent **reflow widths**, not actual native browser UI zoom. Separate actual root-font resize to 200% is exercised on Journey with an expanded source disclosure. Native zoom, screen-reader use and subjective readability remain unmeasured.

Rendered screenshots are retained under `output/playwright/c-accessibility/`: `resources-400-percent-equivalent.png`, `journey-200-percent-text.png`, and `spark-reduced-motion.png` for each browser. Narrow Resources was visually inspected for label clipping and usable wrapping; Spark retained the existing source animations and visible labels.

## Interaction and accessibility evidence

Final matrix: 12/12 passed across pinned Chromium/Firefox/WebKit. Welcome focus containment, keyboard activation, hidden-until-focused skip link, main landmark focus, Reset containment/Escape/trigger restoration pass. Five narrow rendered surfaces have zero serious/critical axe findings under the selected WCAG 2/2.1/2.2 A/AA rule tags. This severity-filtered automated scan is not an exhaustive AA conformance claim.

Reduced-motion Spark SVG remains unchanged over the sampled 250ms interval. Animation import cleanup destroys instances and unregisters preference listeners. Console/page errors, including strict CSP errors on the exercised startup/Spark route, were absent. Browser request evidence confirms lazy animation assets are not fetched at game startup.

## Media, performance, and runtime evidence

Complete initial HTML/static-import/modulepreload graph is 557,005 bytes raw and **157,839 gzip bytes**, including entry (157,471 gzip) and shared runtime (368 gzip). “300 KB” is explicitly implemented as **300 KiB = 307,200 bytes**; this candidate also passes decimal 300,000 bytes. Each distinct response is compressed independently at gzip level 9. Dynamic imports are excluded only with corroborating startup request checks. Query-distinct URLs, static re-exports, cycles, shared imports, preloads and inline scripts have fixture coverage. External initial JavaScript fails closed. The existing raw Release A regression gate remains active.

Five local, cold Chromium contexts at 1440×1024 with reduced motion measured LCP 196/124/112/128/128ms (median 128ms), CLS 0. This is an unthrottled loopback startup measurement, not a production-network/device percentile. The active GNT2 steady-state observer requests 30 wall seconds, discards the first five seconds, and recorded zero long tasks over 50ms in the nominal remaining 25-second window. Exact elapsed duration was not exported separately.

The accelerated no-investment GNT2 soak reached 30:00 active time. GC-controlled retained heap at 5/10/15/20/25/30 minutes was 6,275,832 / 6,458,280 / 6,525,128 / 6,574,376 / 6,600,556 / 6,607,688 bytes. Net +331,856; final increments +26,180 then +7,132 bytes flatten. The 5MiB diagnostic allowance alone is not proof of no persistent growth.

The **existing** public-control strategy also passed 1/1 in 69.7 wall seconds with optional heap sampling, preserving its durable-message reload, final scorecard and best-score assertions. Samples at ticks 300/600/900/1200/1500 reached GNT2/3/4/6/6 with 7,078,640 / 7,443,236 / 7,550,764 / 7,709,840 / 7,767,224 bytes retained. After the test's existing completed-run document reload, GC samples at controlled-clock idle 30/60/90 seconds were 4,772,392 / 4,772,544 / 4,780,760 bytes: +152 then +8,216, net +8,368 (256KiB diagnostic tolerance). The reload contributes to the drop; these are bounded post-reload plateau observations, not in-session reclamation proof or a universal leak claim. No state injection or second strategy was added.

Scoped typecheck/lint/build passed. Twenty distinct focused unit checks passed across batches: four import-graph fixtures, seven presentation checks and nine frozen canonical A trajectories. No dependency upgrades were made by this lane. Built JavaScript has no `eval(` or `new Function` matches. Vite's raw >500kB chunk warning remains disclosed rather than suppressed.

## Commands and artifacts

From the isolated worktree, with trusted integration `node_modules` symlink:

```sh
npm run check
npm run build
node scripts/check-bundle-budget.mjs
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/aifactory-browsers-20261022 node node_modules/@playwright/test/cli.js test --config tests/config/accessibility.playwright.config.ts
```

The config starts/stops the local HTTPS helper on 5014 and production backend on 5015. Its short-lived self-signed certificate exception is local-test-only. For diagnostic performance, start `node scripts/serve-accessibility-https.mjs` in a separate terminal, then:

```sh
BASE_URL=https://127.0.0.1:5014 LOCAL_TEST_TLS=1 PLAYWRIGHT_BROWSERS_PATH=/private/tmp/aifactory-browsers-20261022 node scripts/measure-release-c-performance.mjs --output output/c-performance-evidence.json
PERFORMANCE_HEAP=1 LOCAL_REUSE_SERVER=1 PLAYWRIGHT_BROWSERS_PATH=/private/tmp/aifactory-browsers-20261022 node node_modules/@playwright/test/cli.js test --config tests/config/performance.playwright.config.ts
```

The full-run JSON reporter contains the attached `public-full-run-heap` measurements. Generated screenshots, browser reports and temporary private keys are not committed; the source tests and this measured summary are the durable handoff. Integration owns the final combined-source rerun and served-SHA evidence.

## Residual P3 follow-ups

Native browser zoom, assistive-technology/human acceptance and broader production-device/network profiling remain outside this bounded automation. The raw entry-size warning could motivate later splitting, but complete startup gzip is below the approved floor and optional animation is confirmed lazy. Heap tolerances are diagnostics, not leak certification. Root must qualify the final integrated build and the rest of C before release closure.

final result: passed
