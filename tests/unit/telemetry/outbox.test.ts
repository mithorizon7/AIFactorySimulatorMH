import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import {
  OUTBOX_MAX_AGE_MS,
  type TelemetryEvent,
} from "../../../shared/telemetry/contracts";
import {
  GAME_DATABASE_NAME,
  OUTBOX_MAX_ATTEMPTS,
  TelemetryOutbox,
  TelemetryOutboxLayoutError,
  type TelemetryIndexedDbFactory,
} from "../../../client/src/lib/telemetry/outbox";

function event(number: number): TelemetryEvent {
  return {
    schemaVersion: 1,
    eventId: `00000000-0000-4000-8000-${number.toString(16).padStart(12, "0")}`,
    runId: "22222222-2222-4222-8222-222222222222",
    buildSha: "a".repeat(40),
    rulesetVersion: "release-b.1",
    occurredAt: "2026-10-23T12:00:00.000Z",
    type: "run_started",
    properties: {},
  };
}

function openDatabase(
  factory: IDBFactory,
  name: string,
  version?: number,
): Promise<IDBDatabase> {
  const opening =
    version === undefined ? factory.open(name) : factory.open(name, version);
  return new Promise((resolve, reject) => {
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
  });
}

async function createV1(
  factory: IDBFactory,
  name: string,
  malformed = false,
): Promise<void> {
  const opening = factory.open(name, 1);
  opening.onupgradeneeded = () => {
    const database = opening.result;
    const runs = database.createObjectStore("runs", { keyPath: "runId" });
    runs.createIndex("status", "status");
    runs.createIndex("savedAt", "savedAt");
    if (!malformed) runs.createIndex("rulesetVersion", "rulesetVersion");
    const backups = database.createObjectStore("recoveryBackups", {
      keyPath: "backupId",
    });
    backups.createIndex("runId", "runId");
    backups.createIndex("createdAt", "createdAt");
    database.createObjectStore("meta", { keyPath: "key" });
    database.createObjectStore("completedRuns", { keyPath: "runId" });
    database.createObjectStore("completedSnapshots", { keyPath: "runId" });
    database.createObjectStore("personalBests", {
      keyPath: ["rulesetVersion", "metric"],
    });
  };
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
  });
  database.close();
}

describe("optional v2 telemetry outbox", () => {
  it("waits for an existing game database instead of creating game stores", async () => {
    const factory = new IDBFactory();
    const name = `${GAME_DATABASE_NAME}-absent`;
    await expect(
      TelemetryOutbox.open({
        factory: factory as TelemetryIndexedDbFactory,
        databaseName: name,
      }),
    ).resolves.toBeNull();
    expect(
      (await factory.databases()).some((database) => database.name === name),
    ).toBe(false);
  });

  it("upgrades only the exact v1 layout and adds the exact additive v2 store", async () => {
    const factory = new IDBFactory();
    const name = `${GAME_DATABASE_NAME}-upgrade`;
    await createV1(factory, name);

    const outbox = await TelemetryOutbox.open({
      factory: factory as TelemetryIndexedDbFactory,
      databaseName: name,
    });
    expect(outbox).not.toBeNull();
    const database = await openDatabase(factory, name);
    expect(database.version).toBe(2);
    expect(Array.from(database.objectStoreNames).sort()).toEqual([
      "completedRuns",
      "completedSnapshots",
      "meta",
      "personalBests",
      "recoveryBackups",
      "runs",
      "telemetryOutbox",
    ]);
    const transaction = database.transaction(
      ["runs", "telemetryOutbox"],
      "readonly",
    );
    const runs = transaction.objectStore("runs");
    expect(runs.keyPath).toBe("runId");
    expect(Array.from(runs.indexNames).sort()).toEqual([
      "rulesetVersion",
      "savedAt",
      "status",
    ]);
    const store = transaction.objectStore("telemetryOutbox");
    expect(store.keyPath).toBe("event.eventId");
    expect(store.autoIncrement).toBe(false);
    for (const name of ["queuedAt", "nextAttemptAt"]) {
      const index = store.index(name);
      expect(index.keyPath).toBe(name);
      expect(index.unique).toBe(false);
      expect(index.multiEntry).toBe(false);
    }
    database.close();
    outbox?.close();
  });

  it("refuses an unknown v1 layout without modifying it", async () => {
    const factory = new IDBFactory();
    const name = `${GAME_DATABASE_NAME}-malformed`;
    await createV1(factory, name, true);
    await expect(
      TelemetryOutbox.open({
        factory: factory as TelemetryIndexedDbFactory,
        databaseName: name,
      }),
    ).rejects.toBeInstanceOf(TelemetryOutboxLayoutError);
    const database = await openDatabase(factory, name);
    expect(database.version).toBe(1);
    expect(database.objectStoreNames.contains("telemetryOutbox")).toBe(false);
    database.close();
  });

  it("bounds storage to 100 records, drops the oldest, and expires records after 24 hours", async () => {
    const factory = new IDBFactory();
    const name = `${GAME_DATABASE_NAME}-retention`;
    let now = 1_000_000;
    await createV1(factory, name);
    const outbox = await TelemetryOutbox.open({
      factory: factory as TelemetryIndexedDbFactory,
      databaseName: name,
      now: () => now,
    });
    if (!outbox) throw new Error("Expected v1 game storage to upgrade.");
    for (let number = 1; number <= 101; number++)
      await outbox.enqueue(event(number));
    expect(await outbox.size()).toBe(100);
    expect((await outbox.due(100))[0]?.event.eventId).toBe(event(2).eventId);

    now += OUTBOX_MAX_AGE_MS + 1;
    expect(await outbox.due(100)).toEqual([]);
    expect(await outbox.size()).toBe(0);
    outbox.close();
  });

  it("uses capped exponential retries and purges an opted-out v2 queue without upgrading v1", async () => {
    const factory = new IDBFactory();
    const v1Name = `${GAME_DATABASE_NAME}-v1-clear`;
    await createV1(factory, v1Name);
    await TelemetryOutbox.clearExisting({
      factory: factory as TelemetryIndexedDbFactory,
      databaseName: v1Name,
    });
    const v1 = await openDatabase(factory, v1Name);
    expect(v1.version).toBe(1);
    v1.close();

    const name = `${GAME_DATABASE_NAME}-retry`;
    let now = 1_000_000;
    await createV1(factory, name);
    const outbox = await TelemetryOutbox.open({
      factory: factory as TelemetryIndexedDbFactory,
      databaseName: name,
      now: () => now,
    });
    if (!outbox) throw new Error("Expected v1 game storage to upgrade.");
    await outbox.enqueue(event(1));
    for (let attempt = 1; attempt < OUTBOX_MAX_ATTEMPTS; attempt++) {
      await outbox.recordFailure([event(1).eventId]);
      expect((await outbox.due())[0]).toBeUndefined();
      now += 5 * 60_000;
    }
    await outbox.recordFailure([event(1).eventId]);
    expect(await outbox.size()).toBe(0);
    outbox.close();
  });
});
