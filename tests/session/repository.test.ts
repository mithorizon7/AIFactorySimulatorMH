import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it, vi } from "vitest";
import { buildCompletedRunSummary } from "../../shared/game/completed-summary";
import { Era } from "../../shared/game/domain/era";
import { TrainingStatus } from "../../shared/game/domain/gameState";
import {
  GameRepository,
  WriterConflictError,
  RevisionConflictError,
  canonicalJson,
  checksumPayload,
  snapshotPayload,
} from "../../client/src/lib/persistence/repository";
import { GameSession } from "../../client/src/lib/persistence/session";
import { createFreshGameState } from "../../shared/game/factory";
import { createFreshExperienceState } from "../../shared/experience/schemas";
import { RULESET_VERSION } from "../../shared/version";

const runId = "11111111-1111-4111-8111-111111111111";
function payload(revision = 0) {
  return snapshotPayload(
    runId,
    revision,
    createFreshGameState({ ruleset: RULESET_VERSION, seed: 42 }),
    createFreshExperienceState(),
  );
}
async function fixture() {
  let now = 1_000_000;
  const factory = new IDBFactory();
  const repository = await GameRepository.open({ factory, now: () => now });
  return {
    repository,
    factory,
    advance: (duration: number) => {
      now += duration;
    },
  };
}
async function corrupt(
  factory: IDBFactory,
  update: (row: Record<string, unknown>) => void,
) {
  const opening = factory.open("ai-factory", 1);
  const db = await new Promise<IDBDatabase>((resolve) => {
    opening.onsuccess = () => resolve(opening.result);
  });
  const tx = db.transaction("runs", "readwrite");
  const store = tx.objectStore("runs");
  const get = store.get(runId);
  get.onsuccess = () => {
    update(get.result);
    store.put(get.result);
  };
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
  });
  db.close();
}

describe("canonical IndexedDB durability and ownership", () => {
  it("opens only the known additive v2 layout without downgrading or changing telemetry records", async () => {
    const { repository, factory } = await fixture();
    const lease = await repository.acquireWriter("before-upgrade");
    const saved = await repository.save(payload(), lease);
    repository.close();
    const upgrading = factory.open("ai-factory", 2);
    upgrading.onupgradeneeded = () => {
      const store = upgrading.result.createObjectStore("telemetryOutbox", {
        keyPath: "event.eventId",
      });
      store.createIndex("queuedAt", "queuedAt");
      store.createIndex("nextAttemptAt", "nextAttemptAt");
      store.put({
        event: { eventId: "untouched" },
        queuedAt: 1,
        nextAttemptAt: 2,
      });
    };
    const upgraded = await new Promise<IDBDatabase>((resolve, reject) => {
      upgrading.onsuccess = () => resolve(upgrading.result);
      upgrading.onerror = () => reject(upgrading.error);
    });
    upgraded.close();
    const reopened = await GameRepository.open({
      factory,
      now: () => 1_000_000,
    });
    expect(await reopened.loadActive()).toMatchObject({
      kind: "ready",
      snapshot: { checksum: saved.checksum, revision: 0, runId },
    });
    const fenced = await reopened.acquireWriter("after-upgrade", true);
    await reopened.save(payload(1), fenced);
    reopened.close();
    const exported = (await GameRepository.exportUnsupportedDatabase({
      factory,
    })) as {
      databaseVersion: number;
      stores: Record<string, { value: unknown }[]>;
    };
    expect(exported.databaseVersion).toBe(2);
    expect(exported.stores.telemetryOutbox[0].value).toEqual({
      event: { eventId: "untouched" },
      queuedAt: 1,
      nextAttemptAt: 2,
    });
    const futureOpening = factory.open("ai-factory", 3);
    const future = await new Promise<IDBDatabase>((resolve) => {
      futureOpening.onsuccess = () => resolve(futureOpening.result);
    });
    future.close();
    await expect(GameRepository.open({ factory })).rejects.toMatchObject({
      name: "VersionError",
    });
  });
  it("keeps at most five abandoned full runs and prunes them after thirty days", async () => {
    const { repository, advance } = await fixture();
    const session = await GameSession.open({
      repository,
      browserLifecycle: false,
    });
    for (let seed = 1; seed <= 8; seed++) {
      advance(1);
      await session.reset(seed);
    }
    const retained = (await repository.exportRecovery()) as {
      runs: { status: string }[];
      recoveryBackups: { runId: string }[];
    };
    expect(
      retained.runs.filter((row) => row.status === "abandoned"),
    ).toHaveLength(5);
    expect(retained.runs.filter((row) => row.status === "active")).toHaveLength(
      1,
    );
    advance(31 * 24 * 60 * 60 * 1000);
    await repository.maintenance();
    const expired = (await repository.exportRecovery()) as {
      runs: { status: string }[];
      recoveryBackups: unknown[];
    };
    expect(expired.runs).toHaveLength(1);
    expect(expired.recoveryBackups).toHaveLength(0);
    session.close();
  });
  it("checksums lifecycle status and preserves timestamps and writer fencing outside the digest", async () => {
    const { repository } = await fixture();
    const lease = await repository.acquireWriter("writer");
    const source = payload();
    const saved = await repository.save(source, lease);
    expect(saved.status).toBe("active");
    expect(saved.createdAt).toBe(saved.savedAt);
    expect(saved.abandonedAt).toBeNull();
    expect(saved.writerEpoch).toBe(lease.writerEpoch);
    expect(await checksumPayload({ ...source, status: "abandoned" })).not.toBe(
      saved.checksum,
    );
    const nextId = "33333333-3333-4333-8333-333333333333";
    const next = await repository.save(
      snapshotPayload(nextId, 0, source.simulation, source.experience),
      lease,
      { replace: true },
    );
    expect(next.writerEpoch).toBeGreaterThan(lease.writerEpoch);
    const exported = (await repository.exportRecovery()) as {
      runs: {
        runId: string;
        status: string;
        abandonedAt: string;
        checksum: string;
      }[];
    };
    const abandoned = exported.runs.find((row) => row.runId === runId)!;
    expect(abandoned.status).toBe("abandoned");
    expect(abandoned.abandonedAt).toBeTruthy();
    expect(abandoned.checksum).not.toBe(saved.checksum);
    await expect(repository.save(payload(1), lease)).rejects.toBeInstanceOf(
      WriterConflictError,
    );
    repository.close();
  });
  it("preserves and exports the old local database without migrating or deleting it", async () => {
    const factory = new IDBFactory();
    const opening = factory.open("ai-factory-local", 1);
    opening.onupgradeneeded = () =>
      opening.result
        .createObjectStore("oldRuns")
        .put({ partial: true }, "legacy");
    const db = await new Promise<IDBDatabase>((resolve) => {
      opening.onsuccess = () => resolve(opening.result);
    });
    db.close();
    vi.stubGlobal("indexedDB", factory);
    try {
      const session = await GameSession.open({ browserLifecycle: false });
      const exported = (await session.exportRecovery()) as {
        legacyDatabase: { stores: Record<string, unknown[]> };
      };
      expect(exported.legacyDatabase.stores.oldRuns).toEqual([
        { key: "legacy", value: { partial: true } },
      ]);
      session.close();
      expect((await factory.databases()).map((row) => row.name)).toContain(
        "ai-factory-local",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("leaves a newer database intact and reports unsupported opening instead of recreating it", async () => {
    const factory = new IDBFactory();
    const opening = factory.open("ai-factory", 2);
    opening.onupgradeneeded = () => {
      opening.result
        .createObjectStore("futureState")
        .add(
          { version: 99, futureOnly: { untouched: ["raw", 42] } },
          "original-key",
        );
    };
    const future = await new Promise<IDBDatabase>((resolve) => {
      opening.onsuccess = () => resolve(opening.result);
    });
    future.close();
    await expect(GameRepository.open({ factory })).rejects.toMatchObject({
      name: "VersionError",
    });
    vi.stubGlobal("indexedDB", factory);
    try {
      const session = await GameSession.open({ browserLifecycle: false });
      expect(session.getSnapshot()).toMatchObject({
        status: "error",
        writable: false,
        recovery: "unsupported",
      });
      expect(session.getSnapshot().error).toContain("newer application");
      expect(() => session.setExperience(createFreshExperienceState())).toThrow(
        WriterConflictError,
      );
      await expect(session.reset()).rejects.toBeInstanceOf(WriterConflictError);
      const exported = (await session.exportRecovery()) as {
        stored: { databaseVersion: number; stores: Record<string, unknown[]> };
      };
      expect(exported.stored.databaseVersion).toBe(2);
      expect(exported.stored.stores.futureState).toEqual([
        {
          key: "original-key",
          value: { version: 99, futureOnly: { untouched: ["raw", 42] } },
        },
      ]);
      session.close();
    } finally {
      vi.unstubAllGlobals();
    }
    const inspect = factory.open("ai-factory");
    const preserved = await new Promise<IDBDatabase>((resolve) => {
      inspect.onsuccess = () => resolve(inspect.result);
    });
    expect(preserved.version).toBe(2);
    expect(preserved.objectStoreNames.contains("futureState")).toBe(true);
    preserved.close();
  });
  it("rejects a matching checksum when the saved simulation violates engine invariants", async () => {
    const { repository, factory } = await fixture();
    const lease = await repository.acquireWriter("writer");
    await repository.save(payload(), lease);
    await repository.save(payload(1), lease);
    const contradicted = payload(1);
    contradicted.simulation.daysElapsed = 50;
    const checksum = await checksumPayload(contradicted);
    await corrupt(factory, (row) => {
      row.simulation = contradicted.simulation;
      row.checksum = checksum;
    });
    const loaded = await repository.loadActive();
    expect(loaded.kind).toBe("recovered");
    if (loaded.kind === "recovered") expect(loaded.snapshot.revision).toBe(0);
    repository.close();
  });
  it("rejects schema-valid contradictory engine states before saving", async () => {
    const { repository } = await fixture();
    const lease = await repository.acquireWriter("writer");
    const input = payload();
    input.simulation.daysElapsed = 12;
    await expect(repository.save(input, lease)).rejects.toThrow(
      "clock invariant",
    );
    input.simulation.daysElapsed = 0;
    input.simulation.money += 100;
    await expect(repository.save(input, lease)).rejects.toThrow("cash ledger");
    expect(await repository.loadActive()).toEqual({ kind: "empty" });
    repository.close();
  });
  it("increments same-tab reload epoch so late prior-document writes and release cannot win", async () => {
    const { repository } = await fixture();
    const old = await repository.acquireWriter("same-tab");
    const current = await repository.acquireWriter("same-tab");
    expect(current.writerEpoch).toBe(old.writerEpoch + 1);
    await repository.release(old);
    await expect(repository.save(payload(), old)).rejects.toBeInstanceOf(
      WriterConflictError,
    );
    await repository.save(payload(), current);
    repository.close();
  });
  it("uses revision to retain newest backups when timestamps tie", async () => {
    const { repository, factory } = await fixture();
    const lease = await repository.acquireWriter("writer");
    for (let revision = 0; revision < 9; revision++)
      await repository.save(payload(revision), lease);
    await repository.maintenance();
    await corrupt(factory, (row) => {
      row.checksum = "bad";
    });
    const result = await repository.loadActive();
    expect(result.kind).toBe("recovered");
    if (result.kind === "recovered") expect(result.snapshot.revision).toBe(7);
    repository.close();
  });
  it("atomically records immutable completions and independent metric bests from durable facts", async () => {
    const { repository, advance } = await fixture();
    let lease = await repository.acquireWriter("writer");
    const completedPayload = (id: string, ticks: number, revenue: number) => {
      const input = payload();
      input.runId = id;
      const state = input.simulation;
      state.currentEra = Era.GNT7;
      state.clock = { status: "completed", activeTick: ticks };
      state.daysElapsed = ticks;
      state.intelligence = state.agiThreshold;
      Object.values(state.training.runs).forEach((run) => {
        run.status = TrainingStatus.COMPLETE;
        run.daysRemaining = 0;
      });
      state.money += revenue;
      state.facts.earnedRevenue = revenue;
      state.facts.peakMoney = state.money;
      return input;
    };
    const first = await repository.save(completedPayload(runId, 100, 5), lease);
    const summary = buildCompletedRunSummary({
      simulation: first.simulation,
      runId,
      revision: first.revision,
      checksum: first.checksum,
      completedAt: "2026-10-22T12:00:00.000Z",
    });
    const forged = structuredClone(summary);
    forged.activeTime.activeTicks = 1;
    forged.activeTime.activeTimeSeconds = 1;
    await expect(repository.complete(forged, lease)).rejects.toThrow("facts");
    expect((await repository.history()).completedRuns).toHaveLength(0);
    await repository.complete(summary, lease);
    await repository.complete(summary, lease);
    const debrief = snapshotPayload(
      runId,
      first.revision + 1,
      first.simulation,
      { ...first.experience, debrief: { available: true, viewed: true } },
    );
    await repository.save(debrief, lease);
    // Idempotence references the immutable source, not the latest debrief revision.
    await repository.complete(summary, lease);
    const secondId = "22222222-2222-4222-8222-222222222222";
    const second = await repository.save(
      completedPayload(secondId, 200, 50),
      lease,
      { replace: true },
    );
    lease = {
      writerId: second.writerId,
      writerEpoch: second.writerEpoch,
      expiresAt: second.leaseExpiresAt,
    };
    await repository.complete(
      buildCompletedRunSummary({
        simulation: second.simulation,
        runId: secondId,
        revision: second.revision,
        checksum: second.checksum,
        completedAt: "2026-10-22T13:00:00.000Z",
      }),
      lease,
    );
    const history = await repository.history();
    expect(history.completedRuns).toHaveLength(2);
    expect(history.personalBests).toHaveLength(5);
    expect(
      history.personalBests.find(
        (best) => best.metric === "active_time_seconds",
      )?.runId,
    ).toBe(runId);
    expect(
      history.personalBests.find((best) => best.metric === "earned_revenue")
        ?.runId,
    ).toBe(secondId);
    await expect(
      repository.complete(
        { ...summary, completedAt: "2026-10-23T12:00:00.000Z" },
        lease,
      ),
    ).rejects.toThrow("immutable");
    advance(31 * 24 * 60 * 60 * 1000);
    await repository.maintenance();
    const exported = (await repository.exportRecovery()) as {
      completedSnapshots: (typeof first)[];
      completedRuns: unknown[];
      personalBests: unknown[];
      backups: unknown[];
    };
    expect(exported.backups).toHaveLength(0);
    expect(exported.completedSnapshots).toHaveLength(0);
    expect(exported.completedRuns).toHaveLength(2);
    expect(exported.personalBests).toHaveLength(5);
    repository.close();
  });
  it("sorts recursively, retains array order, rejects values JSON would silently erase", async () => {
    expect(canonicalJson({ z: [2, 1], a: { z: 2, a: 1 } })).toBe(
      '{"a":{"a":1,"z":2},"z":[2,1]}',
    );
    expect(() => canonicalJson({ omitted: undefined })).toThrow();
    expect(() => canonicalJson(Number.NaN)).toThrow();
    expect(await checksumPayload(payload())).toHaveLength(64);
    expect(await checksumPayload(payload())).not.toBe(
      await checksumPayload(payload(1)),
    );
  });
  it("persists all simulation and experience state and excludes save time from checksum", async () => {
    const { repository } = await fixture();
    const lease = await repository.acquireWriter("first");
    const input = payload();
    input.experience.seenMessageIds = ["a-message"];
    input.simulation.random.draws = 3;
    const saved = await repository.save(input, lease);
    const loaded = await repository.loadActive();
    expect(loaded).toEqual({ kind: "ready", snapshot: saved });
    expect(saved.checksum).toBe(await checksumPayload(input));
    repository.close();
  });
  it("rejects two writers, requires explicit epoch takeover and blocks stale saves/releases", async () => {
    const { repository } = await fixture();
    const first = await repository.acquireWriter("first");
    await repository.save(payload(), first);
    await expect(repository.acquireWriter("second")).rejects.toBeInstanceOf(
      WriterConflictError,
    );
    const second = await repository.acquireWriter("second", true);
    expect(second.writerEpoch).toBe(first.writerEpoch + 1);
    await expect(repository.save(payload(1), first)).rejects.toBeInstanceOf(
      WriterConflictError,
    );
    await repository.release(first);
    await repository.save(payload(1), second);
    repository.close();
  });
  it("renews at five seconds, tolerates a background delay, expires at sixty seconds", async () => {
    const { repository, advance } = await fixture();
    let lease = await repository.acquireWriter("first");
    advance(5_000);
    lease = await repository.heartbeat(lease);
    advance(45_000);
    lease = await repository.heartbeat(lease);
    advance(60_001);
    await expect(repository.save(payload(), lease)).rejects.toBeInstanceOf(
      WriterConflictError,
    );
    const next = await repository.acquireWriter("second");
    expect(next.writerEpoch).toBeGreaterThan(lease.writerEpoch);
    repository.close();
  });
  it("rejects revision ping-pong and restores a checksum-verified previous snapshot", async () => {
    const { repository, factory } = await fixture();
    const lease = await repository.acquireWriter("writer");
    await repository.save(payload(), lease);
    await repository.save(payload(1), lease);
    await expect(repository.save(payload(1), lease)).rejects.toBeInstanceOf(
      RevisionConflictError,
    );
    await corrupt(factory, (row) => {
      row.checksum = "0".repeat(64);
    });
    const loaded = await repository.loadActive();
    expect(loaded.kind).toBe("recovered");
    if (loaded.kind === "recovered") expect(loaded.snapshot.revision).toBe(0);
    repository.close();
  });
  it("preserves unknown versions without downgrading to an old backup", async () => {
    const { repository, factory } = await fixture();
    const lease = await repository.acquireWriter("writer");
    await repository.save(payload(), lease);
    await repository.save(payload(1), lease);
    await corrupt(factory, (row) => {
      row.snapshotVersion = 99;
    });
    expect(await repository.loadActive()).toEqual({ kind: "unsupported" });
    const exported = (await repository.exportRecovery()) as {
      snapshots: { snapshotVersion: number }[];
    };
    expect(exported.snapshots[0].snapshotVersion).toBe(99);
    repository.close();
  });
  it("reports corruption with no valid backup and retains data for export", async () => {
    const { repository, factory } = await fixture();
    const lease = await repository.acquireWriter("writer");
    await repository.save(payload(), lease);
    await corrupt(factory, (row) => {
      row.checksum = "corrupted";
    });
    expect(await repository.loadActive()).toEqual({ kind: "corrupt" });
    expect(await repository.exportRecovery()).toHaveProperty("runs");
    repository.close();
  });
  it("bounds recovery retention without deleting completed/active records", async () => {
    const { repository, advance } = await fixture();
    const lease = await repository.acquireWriter("writer");
    for (let revision = 0; revision < 9; revision++)
      await repository.save(payload(revision), lease);
    await repository.maintenance();
    expect(
      ((await repository.exportRecovery()) as { backups: unknown[] }).backups,
    ).toHaveLength(3);
    advance(31 * 24 * 60 * 60 * 1000);
    await repository.maintenance();
    expect(
      ((await repository.exportRecovery()) as { backups: unknown[] }).backups,
    ).toHaveLength(0);
    expect((await repository.loadActive()).kind).toBe("ready");
    repository.close();
  });
});

describe("run session lifecycle", () => {
  it("preserves an unsupported source byte-for-byte when explicitly starting a separate run", async () => {
    const { repository, factory } = await fixture();
    const lease = await repository.acquireWriter("writer");
    await repository.save(payload(), lease);
    await corrupt(factory, (row) => {
      row.snapshotVersion = 99;
      row.futureField = { retain: true };
    });
    await repository.release(lease);
    const before = ((await repository.exportRecovery()) as { runs: unknown[] })
      .runs[0];
    const session = await GameSession.open({
      repository,
      browserLifecycle: false,
    });
    expect(session.getSnapshot().recovery).toBe("unsupported");
    await session.reset(7);
    const after = (await repository.exportRecovery()) as {
      runs: { runId: string }[];
    };
    expect(after.runs.find((row) => row.runId === runId)).toEqual(before);
    expect(after.runs).toHaveLength(2);
    session.close();
  });
  it("starts a temporary playable session when IndexedDB is unavailable and makes the loss visible", async () => {
    vi.stubGlobal("indexedDB", undefined);
    const session = await GameSession.open({ browserLifecycle: false });
    expect(session.getSnapshot().status).toBe("error");
    expect(session.getSnapshot().writable).toBe(true);
    expect(session.getSnapshot().error).toContain("unavailable");
    session.setExperience(createFreshExperienceState(true));
    await session.flush();
    expect(session.getSnapshot().revision).toBe(-1);
    session.close();
    vi.unstubAllGlobals();
  });
  it("makes quota failures explicit while preserving dirty in-memory progress for retry", async () => {
    const { repository } = await fixture();
    const session = await GameSession.open({
      repository,
      browserLifecycle: false,
    });
    const save = vi
      .spyOn(repository, "save")
      .mockRejectedValueOnce(new DOMException("full", "QuotaExceededError"));
    session.setExperience(createFreshExperienceState(true));
    await session.flush();
    expect(session.getSnapshot().status).toBe("error");
    expect(session.getSnapshot().error).toContain("full");
    expect(session.getSnapshot().experience.onboardingStatus).toBe("completed");
    save.mockRestore();
    await session.flush();
    expect(session.getSnapshot().status).toBe("saved");
    session.close();
  });
  it("blocks concurrent reset and update while the replacement transaction is pending", async () => {
    const { repository } = await fixture();
    const session = await GameSession.open({
      repository,
      browserLifecycle: false,
    });
    const original = repository.save.bind(repository);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const save = vi
      .spyOn(repository, "save")
      .mockImplementationOnce(async (...args) => {
        await gate;
        return original(...args);
      });
    const resetting = session.reset(123);
    await Promise.resolve();
    await expect(session.reset(456)).rejects.toThrow("transition");
    expect(() =>
      session.setExperience(createFreshExperienceState(true)),
    ).toThrow("transition");
    release();
    await resetting;
    expect(session.getSnapshot().simulation.random.seed).toBe(123);
    save.mockRestore();
    session.close();
  });
  it("hydrates paused without catch-up; reset abandons and creates independent state", async () => {
    const { repository, factory } = await fixture();
    const lease = await repository.acquireWriter("writer");
    const original = payload();
    original.simulation.clock = { status: "running", activeTick: 50 };
    original.simulation.daysElapsed = 50;
    await repository.save(original, lease);
    await repository.release(lease);
    repository.close();
    const next = await GameRepository.open({ factory });
    const session = await GameSession.open({
      repository: next,
      browserLifecycle: false,
    });
    expect(session.getSnapshot().simulation.clock).toEqual({
      status: "paused",
      activeTick: 50,
    });
    const old = session.getSnapshot();
    await session.reset(83);
    const fresh = session.getSnapshot();
    expect(fresh.runId).not.toBe(old.runId);
    expect(fresh.simulation.clock.activeTick).toBe(0);
    expect(fresh.simulation.random.seed).toBe(83);
    expect(fresh.simulation).not.toBe(old.simulation);
    expect(
      (
        (await session.exportRecovery()) as {
          stored: { backups: { abandoned?: boolean }[] };
        }
      ).stored.backups.some((item) => item.abandoned),
    ).toBe(true);
    session.close();
  });
  it("does not permit readonly updates and takes over using the durable winner state", async () => {
    const factory = new IDBFactory();
    const firstRepository = await GameRepository.open({ factory });
    const secondRepository = await GameRepository.open({ factory });
    const first = await GameSession.open({
      repository: firstRepository,
      browserLifecycle: false,
    });
    const second = await GameSession.open({
      repository: secondRepository,
      browserLifecycle: false,
    });
    expect(second.getSnapshot().writable).toBe(false);
    expect(() => second.setExperience(createFreshExperienceState())).toThrow(
      WriterConflictError,
    );
    await second.takeover();
    expect(second.getSnapshot().writable).toBe(true);
    first.setExperience(createFreshExperienceState(true));
    await first.flush();
    expect(first.getSnapshot().status).toBe("readonly");
    first.close();
    second.close();
  });
});
