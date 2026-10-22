# Security Audit And Release Remediation, October 22, 2026

Audit date: October 22, 2026, America/New_York. Live primary-advisory checks were
refreshed through 12:59 EDT / 16:59 UTC; local validation continued afterward.
This is a repository/local
validation result, **not production security sign-off or incident-recovery clearance**.

### Release Continuation

The user subsequently authorized commit, merge and deployment. Replit access was
restored: the app is `8be7f233-2556-442c-ae8c-40eccc810e27`, published at
`https://aifactorysimulation.com` and `https://ai-factory-mithorizon.replit.app`.
Its workspace was still at `1159ce54056ee8c05ced31c7fe58766f993ad8f4`, before
GitHub's tutorial fixes. Replit completed its automatic development-database
upgrade to private Helium PostgreSQL 16.10. Separate production inspection found
Neon PostgreSQL 16.15; an external connection using certificate/hostname-validated
TLS succeeded. Metadata shows broad provider-managed role privileges; host-level
controls and the actual running process role remain unverified.

Tailwind 4.3.3 replaces the vulnerable glob chain, and tailwind-merge 3.7.0 preserves
class conflict handling. Full npm audit now reports **zero vulnerabilities**, with
no CI exceptions. A fresh OSV query covers all **509 unique name/version pairs**
in the **619-record lockfile**, also with zero findings. Standard `pg` replaces the
Neon-only WebSocket driver to support both private Helium and validated-TLS Neon.
Startup checks ownership columns; migration is an explicit transactional operation,
never hidden in startup/build. A build-time Git revision is exposed by `/api/health`.

Production backup/isolated restore was blocked by auto-review pending specific
approval to copy production records inside the same Replit project. No backup,
application schema migration or deployment has been performed at this checkpoint.
The application release has now merged through
[PR #2](https://github.com/mithorizon7/AIFactorySimulatorMH/pull/2) at
`8d3c13008d09f86fc9df53877cb3c9449e5fa311`. Both final head CI runs
[branch](https://github.com/mithorizon7/AIFactorySimulatorMH/actions/runs/39834691893)
and [PR](https://github.com/mithorizon7/AIFactorySimulatorMH/actions/runs/39834697016)
passed every stage, including all 14 security and five browser checks and
production-mode smoke. Merged-main run 39835186492 also passed. Replit independently
passed those checks on the reviewed application source, then verified the exact
clean merged 8d3c130 with runtime/build/smoke and matching release marker. The default
Replit Node 22 module is only 22.22.0, so build/start now use a checksum-pinned
official Node 22.23.4 Linux runtime without changing the system installation.
Read-only production aggregates found zero accounts, one save, one leaderboard
entry and no other application tables. No individual records were retrieved or
displayed. Because production is not empty, the private-backup approval gate
remains in force; no production backup, migration or deployment was performed.
The current queue and verification state are maintained in
`docs/security-2026-10-22-checklist.md`; the following initial-access observations
are historical where this continuation explicitly supersedes them.

## Urgent Findings And Next Actions

1. Deploy the ownership and server fixes only after applying the additive database
   migration and configuring exact production hosts. The old API exposes the most
   recent save globally; the accessible published app is behind GitHub, but its
   exact deployed revision is not exposed. Owner: project/deployment administrator.
2. Replace the deployed Node 20 selection with a verified patched Node 22 runtime.
   Node 22.23.4 was downloaded from nodejs.org, checksum-verified and used locally.
   The existing machine-wide Node 22.12.0 was not altered. Owner: deployment/device administrator.
3. The seven initial **build-only** reports rooted in `braces@3.0.3` are now
   resolved by migrating to Tailwind 4.3.3. Full and production audit: zero
   advisories. Keep development/build configuration trusted and previews private.
4. The installed local Chrome 155.0.8059.85 and PostgreSQL 17.9 need their vendors'
   security updates. These are outside project mutation scope; no global update,
   database restart, credential rotation or production change was performed.

## Prior Work Reused

The March 30 tutorial checklist and January 30 dependency-update commit were
reviewed. Existing tutorial fixes and the user's uncommitted narrative-hook change
were preserved. The original tutorial investigations were not repeated. Type,
build and browser checks were rerun because runtime/toolchain changes invalidate
their earlier results. The March claim of zero production advisories and its five
accepted esbuild reports were stale: the initial fresh scan found 27 affected
packages. The esbuild issue is now patched; the remaining brace-parser issue is
different. No previous production audit completion could be verified. The older
`adc2f23` commit named for security only removed Replit port entries; it is not
evidence of comprehensive security hardening.

## Asset And Access Inventory

| Asset | Observed Evidence | Coverage / Missing Evidence |
| --- | --- | --- |
| Repository | Public `mithorizon7/AIFactorySimulatorMH`, local starting HEAD `c372658ea89b1e2c8a640cce345b0d2a1d9f3317`; one pre-existing narrative edit | Current files and reachable local Git history inspected; no history rewriting or publishing |
| Workspaces / languages | One npm project; TypeScript server/shared code and browser React; no workspace manifests, Python environment, Docker/devcontainer or native application project found | Host/vendor binaries and old build caches beyond accessible records cannot be ruled out |
| Browser app | React/React DOM 18.3.1, client-side simulator, Vite middleware during development | No RSC package, server functions, real LLM inference, file upload, webhook, shell execution, user-supplied fetch destination or privileged AI tool API found |
| API / storage | Express 4.22.1; Drizzle ORM 0.39.3 before, 0.45.4 after; standard pg 8.23.1 replaces Neon-only serverless driver; memory fallback for non-hosted tests | API tested using isolated MemStorage; production schema/TLS inspected read-only. Real hosted production refuses missing DATABASE_URL |
| Runtime | Machine default Node 22.12.0; Replit declared Node 20; project-local verified Node 22.23.4/npm 10.9.9 used for checks | Host selection now Node 22 with guards; running production patch version unknown |
| Delivery | Replit app and both production domains identified; Cloud Run/Autoscale target, checksum-pinned Node wrapper, only port 5000 mapping retained | Source release merged; provider inspection completed. Actual live revision/runtime and migrated/deployed ownership still await release execution |
| CI | Initially no workflows; new minimal-permission, SHA-pinned workflow now passes branch, PR and merged-main checks | Main run 39835186492 passed on merged 8d3c130; runner-host trust/kernel inventory still requires provider evidence |
| Infrastructure | No Railway/Vercel deployment configuration, workers, scheduled jobs, self-managed GitLab, Oracle or DNS appliances declared | Absence of repository files does not rule out external supporting services; administrator/provider inventory required |
| Local tools / device | macOS 26.6.2 build 25G83; local PostgreSQL 17.9; Chrome 155.0.8059.85; no Bun, uv, Docker, gitleaks, semgrep or trivy executable located on PATH | OS trust/update status, other installations, actual provider host kernels and managed database revisions unverified |
| Automation browser | Playwright 1.58.2 -> 1.64.1; matching Chromium 156.0.8078.4 installed under ignored project output | Latest package does not prove browser trust/patch parity with Chrome 156.0.8078.47/.48; production smoke restricts browser requests to loopback |
| Coding-agent configuration | No custom model-provider/base_url override in inspected Codex config; MCP section names only inventoried | Not proof of historic gateway routing or trace privacy. External gateways, agent session archives and their access/audit logs remain unverified |

## Compromise And Secret Precheck

Before project execution, the manifests, installed lock metadata, lifecycle script
metadata, hooks, artifact sources, project logs and available dependency history
were examined with shell utilities and system Python using `-I -S` to disable
environment imports/site startup hooks. All npm artifact URLs were on
`registry.npmjs.org`; installed versions matched the original lock where installed.
Only expected esbuild/native optional-package lifecycle entries were found; all
subsequent installs used `--ignore-scripts`. No active Git hooks were found.

`tools/security-precheck.py` checked 2,114 named historical objects, eligible text
blobs up to 2 MB, and working files up to 10 MB. It reports credential types,
locations and line numbers only. No recognized credentials or LiteLLM indicators
were found in that coverage. The accessible project install logs begin October 22;
they do not establish October 21 build/install history. No project Python/container
history or matching global LiteLLM package paths/known temporary markers were found
in the limited checked locations. No affected artifact digest was identified.

This was a focused pattern/IOC check, not a full forensic investigation, entropy
secret scan, malware sandbox or proof of no compromise. No credible compromise
evidence was established, so blanket credential revocation is not justified by
these results. Provider/host history, deleted artifacts, containers, gateway logs
and cloud audit records remain incomplete. Replit subsequently returned sampled
deployment logs for October 17-22, apparently capped near 100 entries per daily
query. Targeted structured error queries found no matches; this is not complete
security/access-log coverage or proof of no intrusion. Retention remains unverified.

Evidence is in ignored `output/security/2026-10-22/`, under mode-0700 directories.
No private source or secret values were uploaded to a scanning service. npm/OSV
received dependency names and versions; GitHub/provider queries were read-only.

## Prioritized Findings

All local fixes below still require production deployment/verification.

| ID / Priority | Advisory / Affected Asset And Version | Exposure And Evidence | Remediation / Owner / Status |
| --- | --- | --- | --- |
| S1 / High | Broken object ownership, old `server/routes.ts` and both storage implementations | Anonymous GET returned global latest save; POST accepted caller userId and appended records. Confirmed by source; new two-owner regression passes | Server-generated 256-bit HttpOnly/SameSite cookie, hashed ownership, owner-filtered reads, per-owner save upserts; administrator must apply migration and deploy. **Remediated locally** |
| S2 / High | [Node October advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases), Node 22.12.0 / declared EOL 20 | Runtime affected independent of npm packages. HTTP parser now rejects compressed bodies, but that is not a runtime patch | Pin/guard 22.23.4; verified local binary SHA-256 `c9e1dbc748b33ed2d14f42445191ecaf14c56259c7a9a26d0042c49ec2b66428`; deployment/device owners must replace actual runtimes. **Local validation remediated; deployment/default machine runtime pending** |
| S3 / High | [Vite advisory set](https://github.com/vitejs/vite/security/advisories), Vite 5.4.21 and `allowedHosts:true` | Public development binding, disabled host checks and custom transform middleware create file-disclosure/DNS-rebinding exposure; exact individual advisory prerequisites differ | Vite 6.4.5, exact Host validation before API, loopback local default, bounded fs allow/deny lists, no Vite production imports. No public-production exposure verified. **Remediated locally** |
| S4 / High | Development process termination in `server/vite.ts` | Error logger called process.exit, including for ordinary Vite request errors | Remove exit from request error logging. **Remediated locally**, project owner deploys |
| S5 / High package severity | [ws GHSA-96hv-2xvq-fx4p](https://github.com/websockets/ws/security/advisories/GHSA-96hv-2xvq-fx4p) / memory disclosure advisory; ws 8.18.0 | Used by outbound Neon client and development tooling; no own privileged production WS server found. May 22 fragment-DoS fix is 8.21.0 | Updated to 8.22.0. **Remediated locally**, administrator rebuilds |
| S6 / Critical package severity, conditional reachability | [proxy-addr GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), 2.0.7; [shell-quote advisories](https://github.com/advisories/GHSA-395f-4hp3-45gv), 1.8.3 | Initial npm scan flags critical packages. Proxy issue requires trusted-subnet/IP handling; no trust-proxy configuration existed. shell-quote was build tooling, not a proven remote shell path | proxy-addr 2.0.8; vulnerable shell-quote chain removed by updates; default forwarded-IP distrust preserved. **Remediated locally** |
| S7 / High package severity, not reachable in reviewed SQL | [Drizzle GHSA-gpj5-g38j-94v9](https://github.com/drizzle-team/drizzle-orm/security/advisories/GHSA-gpj5-g38j-94v9), ORM 0.39.3 | Advisory affects attacker-controlled identifiers/aliases; reviewed queries use static schema and parameterized values | ORM 0.45.4 and kit 0.31.11. **Remediated locally**; provider-backed query/migration test pending |
| S8 / Medium | Validation, request amplification and logging, application code | Unbounded names/arbitrary breakthrough JSON, lenient numeric parsing, full bodies/query values/error args logged, Zod failures converted to 500 | Strict bounded schemas, 16 KiB uncompressed JSON, real 400/413/415 responses, per-process API/write limits, memory caps, metadata-only logs, secure headers/no-store. **Remediated locally** |
| S9 / Medium | Leaderboard replay and client trust | Previously arbitrary repeated entries; eligibility checked only in browser | Per-owner leaderboard upsert and 5/minute write limit; scores remain **self-reported**. Verified competitive results require authoritative/replayed gameplay; owner decides future scope |
| S10 / High, build-only | [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), braces 3.0.3 | Deep untrusted glob patterns can exhaust stack; seven initial package reports shared this chain | **Resolved** by Tailwind 4.3.3 migration, eliminating the affected chain. Full npm/OSV scans now zero; strict CI has no advisory exceptions |

Other patched chains include Babel, body-parser, brace-expansion, browserslist,
lodash, nanoid, PostCSS/selector parser, source-map-js, uuid, qs and old esbuild.
Their precise before-scan ranges and GHSA URLs are in `npm-audit-before.json`.
No forced audit fix or indiscriminate major-version upgrade was used. The esbuild
override applies only to the legacy Drizzle loader; installed-tree and SBOM checks
validate that current tsx retains its own supported esbuild.
Vite 6.4 is a [supported security-backport branch](https://vite.dev/releases), so
6.4.5 was chosen to receive the fixes with a smaller compatibility change.

## Mandatory Baseline Applicability Matrix

"Not applicable" below is limited to inventoried project components; paired
"unverified" entries require external evidence, not a conclusion from absent files.

| Baseline | Current Primary Guidance / Dates | Project Status / Exact Next Evidence |
| --- | --- | --- |
| A PHP | [PHP October 21 notice](https://www.php.net/), [CERT-EU 2026-018](https://cert.europa.eu/publications/security-advisories/2026-018), [AWS incident](https://aws.amazon.com/blogs/security/amazon-threat-intelligence-identifies-php2shell-exploitation-prior-to-public-disclosure-in-madpot/) and [bulletin](https://aws.amazon.com/security/security-bulletins/2026-143-aws/): CVE-2026-109618/-109619; PHP 8.2.35/8.3.36/8.4.27/8.5.12 or vendor backports. AWS observed an attempt October 17, before disclosure | **Not applicable to declared Node server; unverified host/appliances.** Obtain deployed/embedded runtimes and logs from at least October 17, with retention gaps. [Palo Alto vendor assessment](https://security.paloaltonetworks.com/CVE-2026-109618) must govern product impact, not an assumption of proven upstream RCE in every appliance |
| B Node | [October 21 release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases): 22.23.4/24.22.1/26.12.1; [support schedule](https://nodejs.org/en/about/previous-releases) lists Node 20 EOL | **Remediated in local audit runtime/pins; deployment/default local runtime pending.** Ten issues assessed below; collect running process version, image/build provenance and trust overrides per environment |
| C Bun | [October 22 Bun 1.4.4](https://bun.com/blog/bun-v1.4.4): network/TLS, WS, DB-client/package-manager fixes. Web reader failed; official release HTML retrieved separately and NSS 3.131.1 update confirmed | **Not applicable to located project/runtime tools; external images/compiled executables unverified.** No QPACK-specific resolution was established from this release; do not conflate certificate and QPACK fixes |
| D Railway | [October 21 disclosure](https://blog.railway.com/p/security-disclosure-wednesday-october-21st) requires secret/private-registry rotation. [Status](https://status.railway.com/): API tokens invalidated October 22 04:17 UTC; latest displayed 16:14 UTC update has Pro/Enterprise operating, Hobby/Free/Trial not yet all enabled | **Unverified external service inventory**, no repo Railway link found. Obtain project/environment list; if used, revoke provider/DB/registry secrets separately, verify bucket replacements, reconnect GitHub, replace API integration tokens and redeploy consumers |
| E LiteLLM | [Maintainer incident](https://docs.litellm.ai/blog/security-incident-oct-21-2026), [StepSecurity](https://www.stepsecurity.io/blog/litellm-1-107-0-compromised-pypi-backdoored-wheels-credential-stealer), [Wiz](https://www.wiz.io/blog/litellm-compromised-steals-credentials): October 21 malicious 1.107.0 wheels, floating container tags; recommended clean pin 1.106.2 | **No current project match found; historic host/gateway exposure unverified.** Match historical pulls/installs to full vendor digests/windows, not source tag. See incident checklist; a clean lockfile does not close this item |
| F Trust stores | [Python guidance](https://discuss.python.org/t/information-for-python-users-regarding-emudhra-emsign-ca-certificate-security-incident/109576), [uv GHSA](https://github.com/astral-sh/uv/security/advisories/GHSA-hq85-5cpj-mr62), [certifi GHSA](https://github.com/certifi/python-certifi/security/advisories/GHSA-6q48-6c7w-9gw2): pip 26.2.2, uv 0.13.4, certifi 2026.10.19; October 20 guidance. Go 1.26.10/1.27.3; webpki 0.103.16, roots/root-certs 1.0.10 | **Local Node bundled CA remediated by patched runtime; deployed and device stores unverified.** No project Python/pip/uv environment. System Python used `-I -S` for local file inspection, not network bootstrap. Its LibreSSL/system paths do not prove trust remediation. Inventory embedded bundles; follow trusted vendor bootstrap, never disable TLS verification |
| G GitLab | [October 21 release](https://docs.gitlab.com/releases/patches/patch-release-gitlab-19-5-1-released/): 12 issues including CVE-2026-110264; supported fixes 19.5.1/19.4.3/19.3.6; selected older critical-only backports are not complete release coverage | **Not applicable to observed GitHub repository/CI; external self-managed GitLab/runners unverified.** Obtain product/runner versions and supported upgrade stops |
| H Oracle/Java | [October 20 CPU](https://www.oracle.com/security-alerts/cpuoct2026.html), [October 21 CVE-2026-91403 alert](https://www.oracle.com/security-alerts/alert-cve-2026-91403.html): later JSSE issue needs its vendor's specific fixes | **Not applicable to project code; external JDK/Oracle unverified.** Determine actual distribution, product/version and out-of-band patch; affected-build examples are not fixed versions. Some patch detail requires My Oracle Support |
| I DNS | [BIND matrix](https://kb.isc.org/docs/aa-00913), October 21: CVE-2026-19630/-94300/-96888/-97313, 9.20.30 stable, branch/vendor-specific alternatives. [Unbound 1.26.2](https://nlnetlabs.nl/projects/unbound/download/), October 21: CVE-2026-97206/-50106/-96405/-109125/-35501 | **Unverified provider/network DNS infrastructure.** Obtain actual resolver implementations, versions/backports and configurations; no repo package update establishes DNS remediation |
| J Network/security products | [Cisco October 21 complete 14-advisory set](https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-notice-QGwHnJ6k), [Splunk SOAR](https://advisory.splunk.com/), [Fortinet notice](https://www.fortinet.com/blog/ciso-collective/fortinet-releases-security-hardening-release-for-multiple-products) | **Unverified device inventory.** Cisco: Snort 3.12.4.0, Expressway X15.5.20, UC 15SU5, Secure Client 5.1.20.333, IOS XR branch SMUs. SOAR SVD-2026-1010/1011/1012: 8.7.0+. Fortinet October 22 hardening: use product/branch matrices; confirm portal firmware and manual/cloud updates even before November 10 details. Separate from PHP2Shell and historical Smart Install |
| K HTTP/3 | [FoxIO October 20 report](https://foxio.io/blog/header-accordions-qpack-amplification-attacks-against-http-3-servers): implementation-specific amplification; quic-go 0.57.0 fixed November 21, 2025; quiche 0.29.3 July 14, 2026; lsquic 4.9.0 | **No direct project HTTP/3 server; provider edge unverified.** Obtain Replit ingress/library version and resource limits, then match affected implementation/fix; do not assume all QUIC servers or Bun fixes cover QPACK |
| L Infrastructure | [Ubuntu CVE-2026-99999](https://ubuntu.com/security/CVE-2026-99999), [Red Hat](https://access.redhat.com/security/cve/cve-2026-99999), [Atlassian October 20 bulletin](https://confluence.atlassian.com/security/security-bulletin-october-20-2026-1874690162.html), [BeyondTrust BT26-05](https://www.beyondtrust.com/trust-center/security-advisories/bt26-05) | **Unverified Linux provider hosts / appliances; native macOS not the affected Linux kernel.** Obtain host build/backports and reboot/livepatch evidence. BeyondTrust: disclosure October 15, SaaS fix October 9, KEV October 16, self-hosted patch BT26-05-RS for 24.3.1-26.2.3. Atlassian fixes vary by product/branch and bundled components |
| M Cloud Shell / WS | [Google release notes](https://docs.cloud.google.com/shell/docs/release-notes): CVE-2026-85267 service fix July 28; no customer action required. [Research URL](https://cymulate.com/blog/cve-2026-85267-google-cloud-shell-oauth-token-theft/) inaccessible in research tool | **Cloud Shell project use unverified; no repository fix or blanket Google revocation warranted.** Own development WS protected by patched Vite; production has only outbound Neon WS, no privileged tunnel route identified. Historic tunnel/provider access still unverified |
| N Broader stack/devices | [PostgreSQL August 13 fixes](https://www.postgresql.org/about/news/postgresql-186-1711-1615-1519-1424-and-19-beta-3-released-3365/): 18.6/17.11/16.15/15.19/14.24. [RHSA-2026:86594](https://access.redhat.com/errata/RHSA-2026:86594): RHEL8 .NET runtime 8.0.32/SDK 8.0.132. [Chrome](https://chromereleases.googleblog.com/), [Mozilla](https://www.mozilla.org/en-US/security/advisories/), [Apple](https://support.apple.com/en-us/100100), [RingRTC CVE](https://nvd.nist.gov/vuln/detail/CVE-2026-113380) | **Application dependencies remediated locally except S10; actual DB/device/native/MCP versions unverified.** Local PostgreSQL 17.9 is older than 17.11. Chrome 155 is older than the October 20 stable fix 156.0.8078.47/.48. RingRTC needs 2.72.0 if present. No .NET/Signal dependency identified in repo; no blanket Bluetooth action supported |

### All Ten Node Issues

Additional trust-bundle source matrices: [Go releases](https://go.dev/doc/devel/release),
[rustls-webpki](https://rustsec.org/advisories/RUSTSEC-2026-0382),
[webpki-roots](https://rustsec.org/advisories/RUSTSEC-2026-0381) and
[webpki-root-certs](https://rustsec.org/advisories/RUSTSEC-2026-0383).

The October 21 patch also updates c-ares, CA certificates, OpenSSL, SQLite and
Undici as applicable. These assessments do not depend on npm audit reporting them.

| CVE | Condition / Assessment For This Project |
| --- | --- |
| 2026-105482 | NUL DNS-name handling: Node 22 affected runtime; no user-controlled DNS name route identified |
| 2026-105483 | Fullwidth-IP TLS hostname bypass: listed 24/26, not this chosen 22 line |
| 2026-106069 | Loose-IP TLS hostname bypass: Node 22 affected runtime/outbound TLS |
| 2026-111497 | Brotli out-of-bounds write/RCE: Node 22 affected; incoming compressed bodies now rejected and runtime patched |
| 2026-105481 | Keep-alive response sequencing: Node 22 affected HTTP client runtime |
| 2026-106072 | Noncanonical IPv4 certificate validation: Node 22 affected TLS runtime |
| 2026-106074 | UUID/randomInt snapshot entropy: no custom startup snapshot or SEA build found; runtime patched |
| 2026-106070 | ZipFile prefix validation: listed Node 26, not chosen 22 line |
| 2026-106071 | Permission wildcard overgrant: listed Node 26, not chosen 22 line |
| 2026-106073 | realpathSync permission bypass: no reliance on experimental permission model found; runtime patched |

### Database/Advisory Cross-Checks

CISA official JSON was downloaded successfully: snapshot **2026.10.21**, released
2026-10-21T14:04:39.8983Z, 1,754 entries. The relevant new BeyondTrust entry is
confirmed with October 16 addition; Atlassian CVE-2026-21589 was added October 15.
The PHP/Node baseline CVEs were absent in this snapshot. This is not proof of no
exploitation or complete October 22 KEV coverage. [CISA feed](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json).

OSV batch name/version queries were cross-checked against GitHub/npm advisories.
The final release query covers all 509 unique name/version pairs in the 619-record
lockfile and returns zero findings. Earlier intermediate-graph scans found the
brace-parser advisory, which the Tailwind 4 migration subsequently removed. Different database
refresh times explain why scanner lists
must be assessed together; neither certifies source or runtime behavior.

## Repository Changes And Validation

Changes: owner-scoped saves/leaderboard, additive ownership migration, strict API
inputs, storage upserts/caps, HTTP security middleware, privacy-preserving logs,
development/production separation, runtime guards/pins, narrowed public Replit
ports, targeted lock updates, ignored secret-file patterns and placeholder-only
environment example. CI uses SHA-pinned checkout/setup-node with contents-read
permissions, no persisted checkout token and no deployment credentials.

| Check | Result / Coverage |
| --- | --- |
| Compromise precheck | Passed focused IOC/pattern check; bounds and historic gaps above |
| npm audit before | 27 package reports: 2 critical, 16 high, 7 moderate, 2 low |
| npm audit after | Zero vulnerabilities, including development/build dependencies after Tailwind 4 migration |
| npm audit --omit=dev | Passed, zero reported production advisories |
| npm ci/install --ignore-scripts | Passed with reviewed registry/lifecycle metadata, no lifecycle execution |
| npm ls --all --json / CycloneDX SBOM | Passed after narrowing esbuild override; includes resolved optional/platform dependency metadata |
| npm run check | Passed on patched local Node |
| npm run test:security | 9 API tests plus 5 advisory/transport tests passed: ownership/upserts, hidden hashes, bounded inputs, Origin/Host/compression, rate limits, headers, secure cookies, log privacy, validated database TLS and fail-closed CI advisory checks |
| npm run audit:security | Passed strict zero-finding gate, rejecting every advisory and scanner/incomplete-output failure |
| npm run test:tutorial | Passed existing target-availability checks |
| npm run build | Passed; lottie-web contains eval-capable code and bundle-size warning. CSP does not permit unsafe-eval; checked production flow had no uncaught page errors |
| npm run test:regression | Five browser tests passed: desktop/mobile full tutorial, core navigation, mobile tab containment and continuous-play autosave. Navigation waits for DOM/UI assertions rather than unrelated remote fonts |
| Local production smoke | Passed built server boot, assets, CSP, API 404, welcome/start, desktop/mobile captures, no uncaught page errors; no real database credentials used |
| git diff --check | Passed |
| Live database migration / provider integration | **Not run.** Actual production database/schema/TLS inspected read-only; production-data backup/restore approval is pending before migration. Unpatched local PostgreSQL was not started |
| Production / CI actual execution | Branch, PR and merged-main CI passed; Replit source preparation validations passed. **No production deployment or credential rotation performed** |

Compatibility limits: old unowned saves cannot safely be assigned to visitors and
will be unreachable; cached clients sending userId:null remain accepted, but cannot
claim a numeric user ID. Clearing the cookie creates a new anonymous owner; there
is no account recovery. Each owner has one current save and leaderboard result.
The unchanged game client starts fresh rather than restoring API saves. Integer
database bounds still apply; fractional money/revenue are rounded at autosave.
Production requires PUBLIC_HOSTS or REPLIT_DOMAINS, and may need explicit proxy
CIDRs. Memory storage is not durable; DB credentials are needed for persistence.
The mobile tab container now grows with its grid instead of overlapping content.
An independent autosave timer fix uses the latest state snapshot rather than
restarting its 30-second interval every game tick. Expanded browser checks cover
the full desktop/mobile tutorial, mobile tab containment and continuous-play saves.

No container/OS scanner or full SAST/entropy-secret tool was installed; container
images are absent from the repo, and provider host/managed native-component checks
require their metadata. Manual source review covered API/storage/error paths,
database parameterization, the trusted-source chart style injection, frontend
requests, CSP and the absence of privileged AI/server tool routes. A negative
dependency scan does not replace those checks or establish exhaustive coverage.

## Production Checklist, Requires Administrator Authorization/Access

- [ ] Identify the Replit app, every production/staging/preview deployment and old reachable revision; obtain actual URL, build logs and runtime metadata. Do not treat GitHub's empty deployment list as no deployments.
- [ ] Export database backup and review the additive migration. Apply with a project migration role; it does not delete legacy rows. On a large table, plan index creation/locking with the database operator.
- [ ] Configure exact PUBLIC_HOSTS, server-only DATABASE_URL and verified TRUSTED_PROXIES. Confirm HTTPS and that ingress strips spoofed forwarded headers.
- [ ] Select patched Node 22, verify `node --version` is at least 22.23.4 in builder and running service, and record executable/image provenance and CA overrides.
- [ ] Clean rebuild with `npm ci --ignore-scripts` and `npm run build`; prune dev dependencies only after building. Avoid reusing any cache later identified as compromised.
- [ ] Deploy reviewed repository changes; no push, deployment or migration was performed during this audit.
- [ ] Verify saves with two fresh browser contexts: each POST/GET is isolated, repeat save replaces one row, anonymous GET cannot retrieve another save, and responses do not expose owner hashes. Test real Neon-backed upserts.
- [ ] Verify HTTPS cookie attributes, disallowed Host/Origin rejection, 400/413/415 behavior, no-store/security headers, static-only production, navigation/tutorial and leaderboard flows.
- [ ] Configure shared/edge limits for multiple replicas and database quotas/retention. Per-process limits and per-owner upserts do not prevent unlimited distributed creation of new owners.
- [ ] Obtain Neon/PostgreSQL actual server revision (16.15 minimum on branch 16 per current vendor release), TLS enforcement, role grants, network controls, backups and provider patch evidence. No browser database credentials were found; RLS/grants were not inspected.
- [ ] Obtain Replit/Neon host-kernel and HTTP/3/trust-store remediation evidence; an updated app container does not establish host remediation.
- [ ] Review access/security logs from October 17 onward; record retention coverage. Inspect provider changes/usage/billing if anomalies are found.

Migration command, only in the authorized project's deployment console with its
connection already configured as a secret; do not paste the value into chat/logs:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/security-save-ownership.sql
node --version
npm ci --ignore-scripts
npm run check
npm run test:security
npm run build
npm audit --omit=dev
npm prune --omit=dev --ignore-scripts
NODE_ENV=production node dist/index.js
```

Deployment rollback: keep the additive columns/indexes. Roll back to a reviewed
build retaining ownership guards, or temporarily block save/leaderboard endpoints
at ingress. Do not re-expose the old global-save API as a rollback strategy.

## Conditional Credential / Incident-Response Checklist

No specific exposed credential identifier was found. The following actions are
conditional on provider use/exposure evidence, and require coordinated owner action.

- [ ] If Railway supported any environment, inventory environment-variable and private-registry consumers. Revoke/reissue third-party provider, database, registry and bucket credentials at their issuing services; replacing Railway variables alone is not revocation.
- [ ] Replace invalidated Railway API tokens in the specific CI/integration secret stores; verify restored calls. Reconnect GitHub and redeploy bucket consumers under current provider guidance. Verify running deployments use replacements; don't assume the Railway token reset covers other secrets.
- [ ] If LiteLLM was used, preserve historical wheel/container hashes and install/pull/start timestamps. Maintainer wheel interval: October 21 11:39:51-13:23 UTC; affected image tags pointed at compromised artifacts starting 11:46:56 UTC, GHCR unavailable by 13:51 and Docker Hub repointed by 14:20. Match the vendor's complete image-index digests, including database/non-root variants.
- [ ] On credible LiteLLM exposure, do not start Python/pip/apps or delete hooks/evidence. Isolate the affected environment, preserve protected logs/hashes/markers and process/persistence evidence, then recover from trusted artifacts. Version removal alone is not recovery.
- [ ] Coordinate revocation across shared projects: cloud keys/roles and temporary sessions, provider/master/virtual keys, DB secrets, GitHub CLI OAuth tokens, SSH/GPG access, agent sessions and registry credentials reachable from an exposed host. Put replacements only into a trusted recovered environment.
- [ ] Inspect relevant gateway prompts/responses, tool traces and CI artifacts for credential patterns using redacted output. Investigate the vendor's suspected logged-response path; do not assume every coding tool leaked tokens.
- [ ] Review CloudTrail GetCallerIdentity, model-discovery and IAM-enumeration events and out-of-infrastructure role use; correlate with host/install times. Check GCP/provider access, usage and billing where applicable. No such cloud logs were accessible here.

## One-Time Device / Account / Network Checklist

- [ ] Update the machine's default Node 22.12.0 through its administrator/version manager; repository pins and the audit-local runtime do not update it globally.
- [ ] Update local PostgreSQL 17.9 to its vendor's patched branch release and plan any service restart separately. Verify the actual process revision rather than the package label alone.
- [ ] Update Chrome 155.0.8059.85 and verify macOS, Firefox, Electron, automation browsers and embedded trust bundles. Current Playwright still packages Chromium 156.0.8078.4; local smoke was confined to loopback, and browser CA/patch parity is not certified.
- [ ] Inventory Python/pip vendored certifi, uv, Rust/webpki, Go and Java trust consumers, plus CI/buildpack images. Use vendor trusted-bootstrap guidance; never turn off certificate checks.
- [ ] Inventory Cisco/Snort/Expressway/UC/IOS XR/Secure Client (including macOS Posture), Splunk SOAR, Fortinet, BIND/Unbound, PAN-OS/Panorama, Atlassian and BeyondTrust supporting this project. Apply branch/product-specific patches and compromise guidance only where present.
- [ ] For Fortinet, confirm scheduled hardening firmware availability and supported paths: FortiOS 8.0.2/7.6.8/7.4.13/7.2.14; FortiManager/Analyzer 8.0.2/7.6.8/7.4.12/7.2.13; recent FortiMail/Authenticator fixes also apply by branch. Detailed November advisories are not a reason to defer vendor-mandated available updates.
- [ ] Check Signal/RingRTC 2.72.0 if installed/relevant. Google Cloud Shell's historical service disclosure alone requires no blanket token revocation. No unsupported Bluetooth instructions were adopted.

## Confidence And Closure Evidence

An independent read-only review of the final server/storage/schema/migration and
dependency/workflow changes found no additional actionable issues. The final CI
gate was separately tested against new-advisory, production-dependency and
incomplete-scanner-output cases.

High confidence: reviewed ownership/logging/input/development-server weaknesses,
resolved dependency versions, patched audit runtime provenance and passing local
checks. Moderate coverage: bounded redacted secret/IOC/history review and manual
source analysis; no evidence of compromise found within those limits.

Blockers to production sign-off: deployment access and actual runtime/artifact
metadata; database migration plus real Neon-backed tests; edge/kernel/trust-store
provider evidence; relevant October incident/access history; resolution or explicit
owner decision on the unpatched build dependency. CI must run after publication.
Closing those items requires the concrete evidence listed above, not another
claim based solely on package scans. This audit does not guarantee complete safety.
