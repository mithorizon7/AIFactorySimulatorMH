import { z } from "zod";
import { assertGameStateInvariants } from "@shared/game/normalize";
import { expectedCash } from "@shared/game/ledger";
import { buildCompletedRunSummary } from "@shared/game/completed-summary";
import { gameStateSchema, type GameStateV2 } from "@shared/game/schemas/state";
import {
  experienceStateSchema,
  type ExperienceStateV1,
} from "@shared/experience/schemas";
import {
  completedRunSummaryV1Schema,
  personalBestRecordV1Schema,
  type CompletedRunSummaryV1,
  type PersonalBestRecordV1,
} from "@shared/game/schemas/completedRuns";
import {
  SUPPORTED_RULESET_VERSIONS,
  isSupportedRuleset,
  SNAPSHOT_VERSION,
  COMMAND_SCHEMA_VERSION,
} from "@shared/version";

export const DATABASE_NAME = "ai-factory";
export const LEASE_DURATION_MS = 60_000;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const payloadSchema = z
  .object({
    runId: z.string().uuid(),
    revision: z.number().int().nonnegative(),
    status: z.enum(["active", "paused", "completed", "abandoned"]),
    rulesetVersion: z.enum(SUPPORTED_RULESET_VERSIONS),
    snapshotVersion: z.literal(SNAPSHOT_VERSION),
    commandSchemaVersion: z.literal(COMMAND_SCHEMA_VERSION),
    simulation: gameStateSchema,
    experience: experienceStateSchema,
  })
  .strict()
  .refine((payload) => payload.rulesetVersion === payload.simulation.rulesetVersion, {
    message: "Snapshot header and simulation ruleset must match",
    path: ["rulesetVersion"],
  });
export type SnapshotPayload = z.infer<typeof payloadSchema>;
export type Snapshot = SnapshotPayload & {
  checksum: string;
  createdAt: string;
  savedAt: string;
  abandonedAt: string | null;
  writerId: string;
  writerEpoch: number;
  leaseExpiresAt: number;
};
export interface WriterLease {
  writerId: string;
  writerEpoch: number;
  expiresAt: number;
}
export type LoadResult =
  | { kind: "empty" | "corrupt" | "unsupported" }
  | { kind: "ready" | "recovered"; snapshot: Snapshot };
export class WriterConflictError extends Error {
  constructor() {
    super("Another tab owns this run. Take over explicitly to make changes.");
    this.name = "WriterConflictError";
  }
}
export class RevisionConflictError extends Error {
  constructor() {
    super("The saved revision changed. Reload or take over before writing.");
    this.name = "RevisionConflictError";
  }
}

/** JSON only: sorted keys, arrays retain order; undefined/nonfinite values rejected. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value))
    return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  )
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`,
      )
      .join(",")}}`;
  throw new TypeError("Snapshot contains a non-JSON value");
}
export async function checksumPayload(
  payload: SnapshotPayload,
): Promise<string> {
  const bytes = new TextEncoder().encode(
    canonicalJson(
      (({ simulation, experience, ...rest }) => ({
        ...rest,
        simulationState: simulation,
        experienceState: experience,
      }))(payloadSchema.parse(payload)),
    ),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
function validateSimulation(state: GameStateV2) {
  assertGameStateInvariants(state);
  if (
    Math.abs(expectedCash(state) - state.money) > 0.011 ||
    Math.abs(
      Object.values(state.facts.spendByCategory).reduce(
        (sum, amount) => sum + amount,
        0,
      ) - state.facts.totalSpend,
    ) > 0.011
  )
    throw new Error("Snapshot cash ledger does not reconcile");
  if (state.facts.capacityPressureTicks > state.clock.activeTick)
    throw new Error("Snapshot capacity time does not reconcile");
}
function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error);
  });
}
function completed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error ?? new Error("Storage transaction aborted"));
  });
}
export function snapshotPayload(
  runId: string,
  revision: number,
  simulation: GameStateV2,
  experience: ExperienceStateV1,
  status: SnapshotPayload["status"] = simulation.clock.status === "completed"
    ? "completed"
    : simulation.clock.status === "paused"
      ? "paused"
      : "active",
): SnapshotPayload {
  return payloadSchema.parse({
    runId,
    revision,
    status,
    rulesetVersion: simulation.rulesetVersion,
    snapshotVersion: SNAPSHOT_VERSION,
    commandSchemaVersion: COMMAND_SCHEMA_VERSION,
    simulation,
    experience,
  });
}
async function validSnapshot(raw: unknown): Promise<Snapshot | null> {
  if (!raw || typeof raw !== "object") return null;
  const {
    checksum,
    savedAt,
    createdAt,
    abandonedAt,
    writerId,
    writerEpoch,
    leaseExpiresAt,
    ...payload
  } = raw as Snapshot;
  const parsed = payloadSchema.safeParse(payload);
  if (
    !parsed.success ||
    typeof savedAt !== "string" ||
    !Number.isFinite(Date.parse(savedAt)) ||
    typeof createdAt !== "string" ||
    !Number.isFinite(Date.parse(createdAt)) ||
    typeof checksum !== "string"
  )
    return null;
  try {
    validateSimulation(parsed.data.simulation);
  } catch {
    return null;
  }
  return (await checksumPayload(parsed.data)) === checksum
    ? {
        ...parsed.data,
        checksum,
        savedAt,
        createdAt,
        abandonedAt,
        writerId,
        writerEpoch,
        leaseExpiresAt,
      }
    : null;
}

export class GameRepository {
  static async exportLegacyDatabase(): Promise<unknown | null> {
    const factory = globalThis.indexedDB;
    if (!factory?.databases) return null;
    const databases = await factory.databases();
    if (!databases.some((database) => database.name === "ai-factory-local"))
      return null;
    // Preserve the preproduction database verbatim; never reinterpret partial records.
    return GameRepository.exportUnsupportedDatabase({
      name: "ai-factory-local",
      factory,
    });
  }
  private constructor(
    private db: IDBDatabase,
    private now: () => number,
  ) {}
  /** Recovery-only reader for a confirmed newer database. Never migrates or creates. */
  static async exportUnsupportedDatabase(
    options: { name?: string; factory?: IDBFactory } = {},
  ): Promise<unknown> {
    const factory = options.factory ?? globalThis.indexedDB;
    if (!factory) throw new Error("Browser storage is unavailable");
    const opening = factory.open(options.name ?? DATABASE_NAME);
    // If another context deleted the database after VersionError, abort creation.
    opening.onupgradeneeded = () => opening.transaction?.abort();
    let blocked = false;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      opening.onsuccess = () => {
        if (blocked) opening.result.close();
        else resolve(opening.result);
      };
      opening.onerror = () => reject(opening.error);
      opening.onblocked = () => {
        blocked = true;
        reject(
          new Error(
            "Recovery export is blocked by another tab. Close that tab and retry.",
          ),
        );
      };
    });
    try {
      const names = Array.from(db.objectStoreNames);
      const stores: Record<string, { key: IDBValidKey; value: unknown }[]> =
        Object.create(null);
      if (names.length) {
        const tx = db.transaction(names, "readonly");
        const done = completed(tx);
        await Promise.all(
          names.map(async (name) => {
            const store = tx.objectStore(name);
            const [keys, values] = await Promise.all([
              request(store.getAllKeys()),
              request(store.getAll()),
            ]);
            stores[name] = keys.map((key, index) => ({
              key,
              value: values[index],
            }));
          }),
        );
        await done;
      }
      return { databaseVersion: db.version, unsupportedDatabase: true, stores };
    } finally {
      db.close();
    }
  }
  static async open(
    options: { name?: string; factory?: IDBFactory; now?: () => number } = {},
  ): Promise<GameRepository> {
    const factory = options.factory ?? globalThis.indexedDB;
    if (!factory)
      throw new Error(
        "Browser storage is unavailable. This run is temporary until storage is restored.",
      );
    const opening = factory.open(options.name ?? DATABASE_NAME, 1);
    opening.onupgradeneeded = () => {
      const db = opening.result;
      // The first schema creates stores only; future migrations must preserve old stores.
      const runs = db.createObjectStore("runs", { keyPath: "runId" });
      for (const field of ["status", "savedAt", "rulesetVersion"])
        runs.createIndex(field, field);
      const backups = db.createObjectStore("recoveryBackups", {
        keyPath: "backupId",
      });
      for (const field of ["runId", "createdAt"])
        backups.createIndex(field, field);
      db.createObjectStore("meta", { keyPath: "key" });
      db.createObjectStore("completedRuns", { keyPath: "runId" });
      db.createObjectStore("completedSnapshots", { keyPath: "runId" });
      db.createObjectStore("personalBests", {
        keyPath: ["rulesetVersion", "metric"],
      });
    };
    let blocked = false;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      opening.onsuccess = () => {
        if (blocked) opening.result.close();
        else resolve(opening.result);
      };
      opening.onerror = () => reject(opening.error);
      opening.onblocked = () => {
        blocked = true;
        reject(
          new Error(
            "Storage upgrade blocked by another tab. Close the older tab and retry.",
          ),
        );
      };
    });
    db.onversionchange = () => db.close();
    const repository = new GameRepository(db, options.now ?? Date.now);
    await repository.maintenance();
    return repository;
  }
  close() {
    this.db.close();
  }
  async loadActive(): Promise<LoadResult> {
    const tx = this.db.transaction(
      ["meta", "runs", "recoveryBackups"],
      "readonly",
    );
    const done = completed(tx);
    const active = await request(tx.objectStore("meta").get("activeRunId"));
    if (!active) {
      await done;
      return { kind: "empty" };
    }
    const raw = await request(tx.objectStore("runs").get(active.runId));
    const backups = await request(tx.objectStore("recoveryBackups").getAll());
    await done;
    const snapshot = await validSnapshot(raw);
    if (snapshot) return { kind: "ready", snapshot };
    // Never silently downgrade a future ruleset or snapshot, even if an old backup exists.
    if (
      raw &&
      (raw.snapshotVersion !== SNAPSHOT_VERSION ||
        raw.commandSchemaVersion !== COMMAND_SCHEMA_VERSION ||
        !isSupportedRuleset(raw.rulesetVersion))
    )
      return { kind: "unsupported" };
    for (const backup of backups
      .filter((item) => item.runId === active.runId)
      .sort((a, b) => b.revision - a.revision)) {
      const recovered = await validSnapshot(backup.snapshot);
      if (recovered) return { kind: "recovered", snapshot: recovered };
    }
    return { kind: "corrupt" };
  }
  async acquireWriter(
    writerId: string,
    takeover = false,
  ): Promise<WriterLease> {
    const tx = this.db.transaction("meta", "readwrite");
    const done = completed(tx);
    const store = tx.objectStore("meta");
    const record = await request(store.get("writer"));
    const previous = record?.lease as WriterLease | undefined;
    if (
      previous &&
      previous.expiresAt > this.now() &&
      previous.writerId !== writerId &&
      !takeover
    ) {
      await done;
      throw new WriterConflictError();
    }
    const lease = {
      writerId,
      writerEpoch: (previous?.writerEpoch ?? 0) + 1,
      expiresAt: this.now() + LEASE_DURATION_MS,
    };
    store.put({ key: "writer", lease });
    await done;
    return lease;
  }
  private async guard(tx: IDBTransaction, lease: WriterLease) {
    const record = await request(tx.objectStore("meta").get("writer"));
    if (
      !record ||
      record.lease.writerId !== lease.writerId ||
      record.lease.writerEpoch !== lease.writerEpoch ||
      record.lease.expiresAt <= this.now()
    )
      throw new WriterConflictError();
  }
  async heartbeat(lease: WriterLease): Promise<WriterLease> {
    const tx = this.db.transaction("meta", "readwrite");
    const done = completed(tx);
    try {
      await this.guard(tx, lease);
      const renewed = { ...lease, expiresAt: this.now() + LEASE_DURATION_MS };
      tx.objectStore("meta").put({ key: "writer", lease: renewed });
      await done;
      return renewed;
    } catch (error) {
      await done;
      throw error;
    }
  }
  async release(lease: WriterLease): Promise<void> {
    const tx = this.db.transaction("meta", "readwrite");
    const done = completed(tx);
    const store = tx.objectStore("meta");
    const current = await request(store.get("writer"));
    if (
      current?.lease.writerId === lease.writerId &&
      current.lease.writerEpoch === lease.writerEpoch
    )
      store.put({ key: "writer", lease: { ...lease, expiresAt: 0 } });
    await done;
  }
  async save(
    payload: SnapshotPayload,
    lease: WriterLease,
    options: { replace?: boolean; recovered?: boolean } = {},
  ): Promise<Snapshot> {
    const parsed = payloadSchema.parse(payload);
    validateSimulation(parsed.simulation);
    const timestamp = new Date(this.now()).toISOString();
    let abandoned: Snapshot | undefined;
    let previousActive: Snapshot | undefined;
    if (options.replace) {
      const read = this.db.transaction(["meta", "runs"], "readonly");
      const readDone = completed(read);
      const active = await request(read.objectStore("meta").get("activeRunId"));
      if (active && active.runId !== parsed.runId)
        previousActive = await request(
          read.objectStore("runs").get(active.runId),
        );
      await readDone;
      if (previousActive && (await validSnapshot(previousActive))) {
        const oldPayload = snapshotPayload(
          previousActive.runId,
          previousActive.revision + 1,
          previousActive.simulation,
          previousActive.experience,
          "abandoned",
        );
        abandoned = {
          ...previousActive,
          ...oldPayload,
          checksum: await checksumPayload(oldPayload),
          savedAt: timestamp,
          abandonedAt: timestamp,
        };
      }
    }
    const nextLease = options.replace
      ? {
          ...lease,
          writerEpoch: lease.writerEpoch + 1,
          expiresAt: this.now() + LEASE_DURATION_MS,
        }
      : lease;
    const snapshot: Snapshot = {
      ...parsed,
      checksum: await checksumPayload(parsed),
      createdAt: timestamp,
      savedAt: timestamp,
      abandonedAt: null,
      writerId: nextLease.writerId,
      writerEpoch: nextLease.writerEpoch,
      leaseExpiresAt: nextLease.expiresAt,
    };
    const tx = this.db.transaction(
      ["meta", "runs", "recoveryBackups"],
      "readwrite",
    );
    const done = completed(tx);
    try {
      await this.guard(tx, lease);
      const store = tx.objectStore("runs");
      const existing = await request(store.get(parsed.runId));
      const active = await request(tx.objectStore("meta").get("activeRunId"));
      if (active && active.runId !== parsed.runId && !options.replace)
        throw new RevisionConflictError();
      if (
        existing &&
        !options.recovered &&
        existing.revision !== parsed.revision - 1
      )
        throw new RevisionConflictError();
      if (!existing && parsed.revision !== 0) throw new RevisionConflictError();
      if (existing) snapshot.createdAt = existing.createdAt;
      if (existing)
        tx.objectStore("recoveryBackups").put({
          backupId: `${parsed.runId}:${existing.revision}`,
          runId: parsed.runId,
          revision: existing.revision,
          retainedAt: this.now(),
          createdAt: timestamp,
          snapshot: existing,
        });
      if (options.replace && active && active.runId !== parsed.runId) {
        const old = await request(store.get(active.runId));
        if (old) {
          if (
            !previousActive ||
            canonicalJson(old) !== canonicalJson(previousActive) ||
            old.revision !== previousActive.revision
          )
            throw new RevisionConflictError();
          tx.objectStore("recoveryBackups").put({
            backupId: `${old.runId}:abandoned:${this.now()}`,
            runId: old.runId,
            revision: old.revision,
            retainedAt: this.now(),
            createdAt: timestamp,
            abandoned: true,
            snapshot: old,
          });
          // A future/corrupt source remains byte-for-byte untouched and exportable.
          // Only validated source records receive lifecycle transitions.
          if (abandoned) store.put(abandoned);
        }
      }
      if (options.replace)
        tx.objectStore("meta").put({ key: "writer", lease: nextLease });
      store.put(snapshot);
      tx.objectStore("meta").put({ key: "activeRunId", runId: parsed.runId });
      const backupStore = tx.objectStore("recoveryBackups");
      const previousBackups = (await request(backupStore.getAll())).sort(
        (a, b) => b.revision - a.revision,
      );
      const backupCounts = new Map<string, number>();
      for (const row of previousBackups) {
        const count = backupCounts.get(row.runId) ?? 0;
        backupCounts.set(row.runId, count + 1);
        if (count >= 3) backupStore.delete(row.backupId);
      }
      if (options.replace) {
        const abandonedRuns = (await request(store.getAll()))
          .filter((row) => row.status === "abandoned")
          .sort(
            (a, b) =>
              Date.parse(b.abandonedAt) - Date.parse(a.abandonedAt) ||
              b.runId.localeCompare(a.runId),
          );
        for (const row of abandonedRuns.slice(5)) {
          store.delete(row.runId);
          for (const backup of previousBackups)
            if (backup.runId === row.runId) backupStore.delete(backup.backupId);
        }
      }
      await done;
      return snapshot;
    } catch (error) {
      tx.abort();
      await done.catch(() => {});
      throw error;
    }
  }
  async complete(
    raw: CompletedRunSummaryV1,
    lease: WriterLease,
  ): Promise<void> {
    const summary = completedRunSummaryV1Schema.parse(raw);
    const read = this.db.transaction(
      ["runs", "completedSnapshots"],
      "readonly",
    );
    const readDone = completed(read);
    const retained = await request(
      read.objectStore("completedSnapshots").get(summary.runId),
    );
    const rawSnapshot =
      retained ?? (await request(read.objectStore("runs").get(summary.runId)));
    await readDone;
    const verified = await validSnapshot(rawSnapshot);
    if (!verified)
      throw new Error("The completed snapshot is corrupt or unsupported");
    const derived = buildCompletedRunSummary({
      simulation: verified.simulation,
      runId: verified.runId,
      revision: verified.revision,
      checksum: verified.checksum,
      completedAt: summary.completedAt,
    });
    if (canonicalJson(derived) !== canonicalJson(summary))
      throw new Error("Completion facts do not match the durable simulation");
    const tx = this.db.transaction(
      ["meta", "runs", "completedSnapshots", "completedRuns", "personalBests"],
      "readwrite",
    );
    const done = completed(tx);
    try {
      await this.guard(tx, lease);
      const sourceStore = tx.objectStore("completedSnapshots");
      const retainedSnapshot = await request(sourceStore.get(summary.runId));
      const snapshot =
        retainedSnapshot ??
        (await request(tx.objectStore("runs").get(summary.runId)));
      if (
        !snapshot ||
        canonicalJson(snapshot) !== canonicalJson(verified) ||
        snapshot.checksum !== summary.completedSnapshotChecksum ||
        snapshot.revision !== summary.completedSnapshotRevision ||
        snapshot.simulation.clock.status !== "completed"
      )
        throw new Error(
          "Completion does not match the durable completed snapshot",
        );
      const runs = tx.objectStore("completedRuns");
      const existing = await request(runs.get(summary.runId));
      if (existing) {
        if (canonicalJson(existing) !== canonicalJson(summary))
          throw new Error("Completed runs are immutable");
        await done;
        return;
      }
      runs.add(summary);
      if (!retainedSnapshot) sourceStore.add(verified);
      const values = {
        active_time_seconds: summary.activeTime.activeTimeSeconds,
        total_spend: summary.money.totalSpend,
        earned_revenue: summary.money.earnedRevenue,
        mean_capacity_shortfall_ratio: summary.capacity.meanShortfallRatio,
        emergency_interventions:
          summary.interventions.emergencyCapacity +
          summary.interventions.emergencyFunding,
      };
      const bests = tx.objectStore("personalBests");
      for (const [metric, value] of Object.entries(values)) {
        const direction = metric === "earned_revenue" ? "max" : "min";
        const previous = (await request(
          bests.get([summary.rulesetVersion, metric]),
        )) as PersonalBestRecordV1 | undefined;
        if (
          previous &&
          (direction === "min"
            ? previous.value <= value
            : previous.value >= value)
        )
          continue;
        bests.put(
          personalBestRecordV1Schema.parse({
            personalBestSchemaVersion: 1,
            rulesetVersion: summary.rulesetVersion,
            runId: summary.runId,
            summarySchemaVersion: summary.summarySchemaVersion,
            sourceSnapshotChecksum: summary.completedSnapshotChecksum,
            completedAt: summary.completedAt,
            metric,
            direction,
            value,
            unit:
              metric === "active_time_seconds"
                ? "seconds"
                : metric === "emergency_interventions"
                  ? "count"
                  : metric === "mean_capacity_shortfall_ratio"
                    ? "ratio"
                    : "currency",
          }),
        );
      }
      await done;
    } catch (error) {
      tx.abort();
      await done.catch(() => {});
      throw error;
    }
  }
  async history(): Promise<{
    completedRuns: CompletedRunSummaryV1[];
    personalBests: PersonalBestRecordV1[];
  }> {
    const tx = this.db.transaction(
      ["completedRuns", "personalBests"],
      "readonly",
    );
    const done = completed(tx);
    const completedRuns = await request(
      tx.objectStore("completedRuns").getAll(),
    );
    const personalBests = await request(
      tx.objectStore("personalBests").getAll(),
    );
    await done;
    return { completedRuns, personalBests };
  }
  async exportRecovery(): Promise<unknown> {
    const tx = this.db.transaction(
      [
        "runs",
        "recoveryBackups",
        "meta",
        "completedSnapshots",
        "completedRuns",
        "personalBests",
      ],
      "readonly",
    );
    const done = completed(tx);
    const snapshots = await request(tx.objectStore("runs").getAll());
    const backups = await request(tx.objectStore("recoveryBackups").getAll());
    const metadata = await request(tx.objectStore("meta").getAll());
    const completedSnapshots = await request(
      tx.objectStore("completedSnapshots").getAll(),
    );
    const completedRuns = await request(
      tx.objectStore("completedRuns").getAll(),
    );
    const personalBests = await request(
      tx.objectStore("personalBests").getAll(),
    );
    await done;
    return {
      databaseVersion: 1,
      runs: snapshots,
      recoveryBackups: backups,
      meta: metadata,
      snapshots,
      backups,
      metadata,
      completedSnapshots,
      completedRuns,
      personalBests,
    };
  }
  async maintenance(): Promise<void> {
    const tx = this.db.transaction(
      [
        "recoveryBackups",
        "meta",
        "runs",
        "completedRuns",
        "completedSnapshots",
      ],
      "readwrite",
    );
    const done = completed(tx);
    const backups = tx.objectStore("recoveryBackups");
    const records = await request(backups.getAll());
    const counts = new Map<string, number>();
    for (const row of records.sort(
      (a, b) => b.retainedAt - a.retainedAt || b.revision - a.revision,
    )) {
      const count = counts.get(row.runId) ?? 0;
      counts.set(row.runId, count + 1);
      if (row.retainedAt < this.now() - RETENTION_MS || count >= 3)
        backups.delete(row.backupId);
    }
    // Preserve the epoch tombstone so an expired lease can never revive a stale writer.
    const metadata = tx.objectStore("meta");
    const writer = await request(metadata.get("writer"));
    if (writer?.lease.expiresAt < this.now())
      metadata.put({ ...writer, lease: { ...writer.lease, expiresAt: 0 } });
    const active = await request(metadata.get("activeRunId"));
    const snapshots = tx.objectStore("runs");
    let abandonedCount = 0;
    for (const row of (await request(snapshots.getAll())).sort(
      (a, b) =>
        Date.parse(b.savedAt) - Date.parse(a.savedAt) ||
        b.runId.localeCompare(a.runId),
    )) {
      const expired =
        Date.parse(row.abandonedAt ?? row.savedAt) < this.now() - RETENTION_MS;
      if (row.status === "abandoned") abandonedCount += 1;
      if (
        (row.status === "abandoned" && (expired || abandonedCount > 5)) ||
        (row.status === "completed" && expired)
      ) {
        snapshots.delete(row.runId);
        if (row.status === "abandoned")
          for (const backup of records)
            if (backup.runId === row.runId) backups.delete(backup.backupId);
        if (row.runId === active?.runId) metadata.delete("activeRunId");
      }
    }
    const completedSnapshots = tx.objectStore("completedSnapshots");
    for (const row of await request(completedSnapshots.getAll()))
      if (Date.parse(row.savedAt) < this.now() - RETENTION_MS)
        completedSnapshots.delete(row.runId);
    await done;
  }
}
