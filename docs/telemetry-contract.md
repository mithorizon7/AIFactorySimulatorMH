# Release C contract and activation boundary

Closed, versioned event schemas live in `shared/telemetry/contracts.ts`.
PostgreSQL tables use Drizzle definitions in `server/telemetry/schema.ts`.
Only `TELEMETRY_DATABASE_URL` may configure the runtime sink; never fall back to
legacy owner-level `DATABASE_URL` or `NEON_DATABASE_URL`. An unavailable sink
cannot block startup, save, resume, completion or core readiness.

`migrationVersion` reports an actually verified applied migration, not a desired
constant. It remains null when never configured or never verified. After a
successful verification the process retains the last verified version during
an outage; readiness separately reports degraded telemetry. A genuinely
different applied migration is a deployment mismatch, not a transient outage.
`migrationAttestation` explicitly distinguishes not-configured, never-verified,
last-verified and actual mismatch states, including the observed SQL checksum.
A cold-start database outage is unknown, not evidence of a migration mismatch:
it degrades analytics but does not independently roll back a passing core
browser canary. Initial C qualification still requires actual schema/role proof;
the unknown state cannot close that release gate.

Client analytics is off until explicit opt-in. GPC overrides opt-in. Opt-out
clears queued events; no event is sent with cookies or third-party endpoints.
The v2 IndexedDB upgrade only adds `telemetryOutbox`; all six v1 game stores,
checksums, run IDs and writer epochs remain unchanged. A rollback-compatible
core must recognize the exact known additive v2 layout before v2 is activated.
Unknown future layouts remain read-only/exportable rather than downgraded.

The backend receives at most 20 closed events per request. Receipt time is
authoritative; client time is bounded to receipt minus24h/plus5min. IDs provide
idempotency. Product retention is90days. The outbox has100events/24h, oldest
dropped first, bounded exponential retries, and no dependency on run ownership.

Raw five-question responses are never telemetry. Separate research schema,
submission-only credentials and named active-study readers are required.
No public research endpoint or participant collection is enabled by this
technical work. Research retention is180days; contacts/consent mapping stay
outside responses. Retention and withdrawal operations require explicit
custodian invocation; no existing application rows are deleted by migrations.

Provider activation is blocked until scoped credential creation/binding and
exclusion of broad legacy credentials from the telemetry runtime are verified.
Exposed Replit controls currently do not establish those capabilities. Keeping
collection disabled is a safety boundary, not proof that the readiness gate
has been satisfied. Actual backup/PITR, access-log retention and isolated
staging remain independently required evidence.
