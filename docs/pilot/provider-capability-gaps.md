# Provider capability gaps — inspected 2026-10-23

Revalidated read-only on 2026-10-26: account-specific backup/PITR and restore
history, actual hosting/proxy log retention/access, and an isolated exact-artifact
staging surface remain unexposed to this session. No database records, raw logs
or secret values were retrieved. Collection-disabled source fe2e8c9 is shipped;
this does not close these mandatory pilot/collection activation prerequisites.

Source: integration owner's read-only account-control discovery at
`output/provider-release-c-capabilities-20261023.md`. That private operational
evidence is not uploaded or copied here. These are scoped observations of exposed
controls, not claims that a feature is impossible on the provider. Accepted B
was left unchanged; no secrets, raw logs, IP addresses, SQL rows or production
writes were requested by this documentation lane.

| Required capability                                                                      | Actual exposed state                                                                                                                                                                                                                                                    | Evidence needed before the C gate can close                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Deployment-scoped analytics role/credential; exclude broad DB keys while preserving data | Not exposed. Secret-existence/input/non-secret environment setters do not show role management, per-deployment binding or effective container exclusions. Broad DB secret metadata exists, including one runtime-managed key; effective live environment is unverified. | Authorized DB-role/credential management plus deployment binding/exclusion evidence, with existing legacy resource/data preserved. Do not detach, rotate or delete it as a shortcut. |
| Study ingress/external credential custody and named researchers                          | No usable role/identity/secret-manager/study-ingress management interface exposed                                                                                                                                                                                       | External restricted custody, attributable named access/revocation and separate insert-only submission binding; no research credentials in general app secrets.                       |
| Approved additive DDL execution                                                          | Patched Node 22.23.4 one-off shell control available, but approved manager/runtime dependency, scoped administrator binding and writable target not established during discovery                                                                                        | Root-reviewed manager/dependency contract and explicit target/credential/write authority. Historical helpers or broad shared-secret presence are not authorization.                  |
| Production backup/PITR                                                                   | Account-specific retention, oldest/newest restorable points and restore history unavailable                                                                                                                                                                             | Matching resource metadata and a rehearsed restore/deletion-replay proof. Row checksums or build success are not recoverability proof.                                               |
| Hosting/proxy log policy                                                                 | Actual applicable retention, access and minimum settings unavailable                                                                                                                                                                                                    | Account-specific applicable log classes, shortest supported retention (target 7 days) and owner/provider confirmation. Do not replace this with a generic product claim.             |
| Isolated exact-artifact staging                                                          | Workspace preview interface exists but was not running and is configured for development; a production start path exists                                                                                                                                                | Approved isolated staging URL, credential separation, synthetic contexts and byte-for-byte artifact comparison. A SHA marker or dev preview alone does not prove equivalence.        |

The discovery also observed preserved B dist metadata. That establishes neither
current C deployment nor staging acceptance. Root must revalidate drift-prone
capabilities at activation. Technical implementation can continue against frozen
contracts; telemetry/research activation, recovery/staging sign-off and the
overall C release gate remain open until evidence closes every required gap.
