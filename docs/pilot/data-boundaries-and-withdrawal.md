# Study data procedure — pilot-data-1

Collection disabled. This specifies activation requirements and a rehearsal
procedure, not an assertion that a database, role, contact or deletion job exists.
The integration owner owns schema/migration/provider changes; the research owner
owns consent and lawful/institutional review. No raw-data ingestion is authorized.

## Separation required before activation

| Dataset                          | Permitted contents                                                                                        | Required access and retention                                                                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| General product telemetry        | Allowlisted anonymous product events; assessment completion/aggregate correctness only                    | Runtime analytics role cannot read research. Maximum 90 days; no raw answers, free text, identity, commands, snapshots or precise user agent.                                         |
| Restricted research schema       | Pseudonymous selected answers, task outcomes/times and bounded observations for the active study          | Submission role inserts but cannot query; named researcher reads only the approved study. Raw records deleted no later than 180 days after collection.                                |
| Separate consent/contact mapping | Permission revision/affirmation and minimum withdrawal linkage; contact only where approved and necessary | Custodian-only outside app runtime and separate from response storage. Proposed maximum 180 days, earlier on withdrawal; research owner must approve actual policy before invitation. |
| Deidentified aggregates          | Counts with denominators and approved grouped summaries that cannot be relinked                           | May remain after raw expiry; small cells/free text must be reviewed for reidentification. Never publish participant-level rows.                                                       |
| Hosting/proxy logs and backups   | Provider may retain IP/access metadata or copies of deleted data                                          | Actual account policy, access and expiry unknown. Verify shortest supported logging (target 7 days), backup expiry and restore-time deletion replay before collection.                |

No broad database or research credential belongs in client code, general app
runtime, shared application secret slots, this repository or canary reports.
GPC/opt-out defeats analytics opt-in; declining analytics does not affect study
permission or play. Do not infer permission for one dataset from another.

## Withdrawal, practiced with synthetic records first

1. The approved external study system creates a cryptographically random code,
   gives it privately to the participant and stores only its SHA-256 verifier in
   the restricted research record. Never store the raw code in the app, logs or
   telemetry. Do not derive codes from names, dates, email fragments or run IDs.
   A proposed generator compatible with the frozen operator contract is below;
   external custody/participant delivery still requires owner review.
2. The participant submits only the code through the approved private contact
   route. The custodian verifies it without asking for unrelated identity data.
   Keep the request out of GitHub, public chat, application logs and telemetry.
3. Stop new collection for that study identifier. Delete linked raw answers,
   observations, mapping and derived participant-level exports under the approved
   role. Do not delete unrelated game saves or provider databases.
4. Verify zero remaining linked records and controlled exports. Record only an
   operation ID, date, affected dataset classes, verification result and custodian
   attribution in the restricted audit record; never copy answers or the code.
5. Apply a deletion/tombstone mechanism to prevent restoration from backups or
   restored exports, and confirm final backup expiry. Do not promise immediate
   erasure of inaccessible provider copies. An unknown or excessive backup
   retention policy blocks collection, not a reason to claim deletion passed.
6. Tell the participant what was removed, what irreversibly deidentified
   aggregates cannot be relinked, and any approved bounded backup expiry. Failed
   deletion stays open with an owner and stops further affected collection.

The owner must approve an achievable response deadline and private contact before
activation. Do not invent an operational service level from this draft. A lost
code may make anonymous records impossible to locate; explain that limit before
consent without collecting extra identity to work around it.

## High-entropy code and operator boundary

Proposed generator for the approved external custodian process, not the app or
canary. This example is not executed by preparing this document:

```js
import { randomBytes, createHash } from "node:crypto";
const withdrawalCode = randomBytes(32).toString("base64url"); // 256 random bits
const withdrawalHash = createHash("sha256")
  .update(withdrawalCode)
  .digest("hex");
// Deliver withdrawalCode only through the approved private participant route.
// Store withdrawalHash in the restricted record. Never log either value here.
```

The 43-character random code satisfies the frozen 32–128-character base64url
operator contract without embedding any identity. No names, emails or birthdays
are collected to generate or recover it. There is no name-based lookup fallback.

Root's separate reviewed manager is `scripts/manage-pilot-data.ts`, exposed after
integration as `npm run data:manage -- migrate|retention|withdraw`. All operations
default to dry-run. `migrate --apply` needs explicit DDL authority; retention or
withdrawal deletion additionally needs `--apply --confirm-delete-expired` after
reviewing exact dry-run counts and deletion authorization. The flag name is also
used for withdrawal; it does not mean only expired rows are selected there.

The manager takes process-only `PILOT_DATA_OPERATOR_URL` and, for withdrawal,
`PILOT_WITHDRAWAL_CODE`; no legacy shared database-key fallback is allowed. Never
paste their values into shell history, repository files, shared app secrets or
CI logs. The CLI's counts and transaction do not establish named-researcher
credential lifecycle, external export deletion, backup expiry or provider access.
This lane did not run database operations or apply the migration in production.
The `pilot-v1` study remains inactive until independent authorization and evidence.

## Retention and access rehearsal evidence

Use synthetic records only, with a test clock or already-expired synthetic dates;
never shorten real retention by changing production clocks. Prove at least:

- Analytics credentials cannot query the research schema or consent mapping.
- Submission credentials can insert only the strict approved payload and cannot
  select/query/update arbitrary records; named researcher access is scoped and
  attributable, with revocation demonstrated outside the app runtime.
- General events reject raw answer/identity/free-text fields. Study ingestion is
  disabled without explicit permission and correct restricted role bindings.
- 90-day event and 180-day raw-research expiry delete the intended synthetic rows
  and leave newer/control records intact. Consent mapping follows the approved
  policy. Deletion job failure alerts without falsely reporting success.
- Code withdrawal removes the right synthetic records and exports without
  touching another synthetic participant or anonymous local game save.
- Restoring a backup cannot resurrect withdrawn/expired research into active
  use; deletion replay and bounded backup expiry are evidenced.

Record exact source, DDL/migration identity, isolated target, role checks,
timestamps, counts and outcome. No production collection or DDL execution is
authorized by this document. Presently unavailable provider controls are listed
in [capability gaps](provider-capability-gaps.md).
