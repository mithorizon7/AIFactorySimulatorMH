import { expect, it } from "vitest";
import { readMigration } from "../../../server/telemetry/migration";
import { TELEMETRY_MIGRATION_CHECKSUM } from "../../../server/telemetry/migration-contract";
it("pins the exact reviewed additive SQL for runtime attestation", async () => {
  expect((await readMigration()).checksum).toBe(TELEMETRY_MIGRATION_CHECKSUM);
});
