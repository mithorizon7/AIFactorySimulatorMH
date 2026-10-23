# Security delivery verification — 2026-10-23

This is the current delivery addendum to the historical
[October 22 audit](security-audit-2026-10-22.md), not a claim that every managed
system or historical incident has been inspected.

## Confirmed production remediation

Both existing production origins independently serve commit
`8902ed9062b71afc9dc47cdc8b7207bb64aa6496` on Node `22.23.4`. The reviewed source,
GitHub checks/merges, Replit build, public version response, static JavaScript
bytes and independent browser checks are recorded separately in the
[delivery record](end-to-end-delivery.md). The retired global-save, leaderboard
and ranking endpoints return JSON `410` for their supported probes. No database
credentials, rows or authentication data are part of browser-local gameplay.

The [Node October security advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
was refreshed on October 23. It lists ten fixes across supported release lines,
including Brotli RCE and certificate changes; not every issue applies to every
line. The actual deployed 22.23.4 runtime, rather than an npm dependency update,
closes the application's prior Node-runtime remediation gap.

The clean reviewed lock resolves Express 5.3.0, Vite 8.3.5 and Playwright 1.64.1.
The Release A full and production npm audits returned zero vulnerabilities.
Reachable source/history secret scanning found no detected secrets; that is not
proof of historical host cleanliness. The later Release B contract baseline
passes 184 tests with 92.46% statement coverage; named behavior/recovery gates,
not that percentage alone, remain the release requirement.

## Delivery drift found and corrected

Replit's publish preparation introduced a tooling-module change and an automatic
package-lock rewrite in two failed builds. The clean-source guard stopped both
before compilation, leaving the prior production artifact running. The reviewed
configuration now declares the observed tooling module. A tracked npm no-save
policy prevents ordinary install from rewriting the lock; lockfile reads,
integrity verification, frozen installation and ignored dependency lifecycle
scripts remain enabled. The successful final build passed these checks.

The provider workspace and prior checkpoints were preserved. Legacy production
database counts and in-database aggregate row checksums were unchanged after
deployment. No database rows were downloaded, migrated or deleted.

## Explicit remaining coverage gaps

- The official CISA KEV JSON endpoint returned HTTP 403 during the audit refresh.
  This is a coverage gap, not evidence that applicable issues are absent from KEV.
- The actual managed host kernel/backport/reboot state and platform trust stores
  are not attested by application-runtime or container checks.
- Backup/PITR retention, last successful restore point, restoration evidence,
  access-log retention/IP handling and complete history since October 17 require
  account-specific provider evidence. A read-only follow-up was requested; no
  inaccessible metadata is treated as verified.
- [Replit security](https://replit.com/security) and
  [Neon security](https://neon.com/security) describe platform controls, not this
  application's configured backup policy or a tested restore. A public
  [operational status page](https://status.replit.com/) is not a patch attestation.
- No source use of PHP, Bun, Java, self-managed GitLab, Railway, LiteLLM, Docker,
  DNS daemons or security appliances was found. This does not establish that
  unrelated workstation, account or provider infrastructure lacks those assets.
  The original audit's outside-repository checklist remains applicable.

The temporary inline-CSS CSP exception still has an explicit owner and expiry:
Release C accessibility/security sign-off. Inline/eval script execution is not
permitted. Release B/C must preserve enforced CSP and the retired-route contract.

## Confidence boundary

Confidence is high for the reviewed application's observable deployed controls,
runtime identity and tested local-first recovery paths. Historical compromise
absence and hidden managed infrastructure remain unverified. No credential
rotation or system-wide change was justified solely by absence of evidence.
