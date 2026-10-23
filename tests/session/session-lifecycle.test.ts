import { afterEach, describe, expect, it, vi } from "vitest";
import { GameSession } from "../../client/src/lib/persistence/session";
import {
  GameRepository,
  WriterConflictError,
  type LoadResult,
  type SnapshotPayload,
} from "../../client/src/lib/persistence/repository";
import { createFreshGameState } from "../../shared/game/factory";
import { createFreshExperienceState } from "../../shared/experience/schemas";
import { RULESET_VERSION } from "../../shared/version";

const sessions: GameSession[] = [];
afterEach(async () => {
  sessions.splice(0).forEach((session) => session.close());
  await Promise.resolve();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function repository(loaded: LoadResult = { kind: "empty" }) {
  let revision = 0;
  const adapter = {
    acquireWriter: vi.fn(async () => ({
      writerId: "test-writer",
      writerEpoch: 1,
      expiresAt: 60_000,
    })),
    loadActive: vi.fn(async () => loaded),
    save: vi.fn(async (payload: SnapshotPayload) => ({
      ...structuredClone(payload),
      checksum: String(++revision).padStart(64, "0"),
      createdAt: new Date().toISOString(),
      savedAt: new Date().toISOString(),
      abandonedAt: null,
      writerId: "test-writer",
      writerEpoch: 1,
      leaseExpiresAt: Date.now() + 60_000,
    })),
    heartbeat: vi.fn(async (lease) => ({
      ...lease,
      expiresAt: Date.now() + 60_000,
    })),
    release: vi.fn(async () => {}),
    maintenance: vi.fn(async () => {}),
    history: vi.fn(async () => ({ completedRuns: [], personalBests: [] })),
    exportRecovery: vi.fn(async () => ({ snapshots: ["retained"] })),
    close: vi.fn(),
  };
  return { adapter, value: adapter as unknown as GameRepository };
}

function browser() {
  const window = new EventTarget();
  const document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
  });
  const channels: FakeChannel[] = [];
  class FakeChannel {
    onmessage: ((event: { data: unknown }) => void) | null = null;
    postMessage = vi.fn();
    close = vi.fn();
    constructor(public name: string) {
      channels.push(this);
    }
    deliver(data: unknown) {
      this.onmessage?.({ data });
    }
  }
  vi.stubGlobal("window", window);
  vi.stubGlobal("document", document);
  vi.stubGlobal("BroadcastChannel", FakeChannel);
  return { window, document, channels };
}

async function open(value: GameRepository, lifecycle = false) {
  const session = await GameSession.open({
    repository: value,
    writerId: "test-writer",
    browserLifecycle: lifecycle,
  });
  sessions.push(session);
  return session;
}

describe("session durability and browser lifecycle failures", () => {
  it("persists typed commands and active ticks without advancing an idle clock", async () => {
    const { value, adapter } = repository();
    const session = await open(value);
    const idle = session.getSnapshot().simulation;
    session.tick();
    expect(session.getSnapshot().simulation.clock.activeTick).toBe(0);
    session.apply({
      id: crypto.randomUUID(),
      tick: 0,
      commandSchemaVersion: 1,
      type: "START_RUN",
      payload: {},
    });
    session.tick();
    expect(session.getSnapshot().simulation.clock.activeTick).toBe(1);
    expect(idle.clock.activeTick).toBe(0);
    await session.flush();
    expect(adapter.save.mock.calls.at(-1)![0].simulation.clock.activeTick).toBe(
      1,
    );
    expect(await session.history()).toEqual({
      completedRuns: [],
      personalBests: [],
    });
  });

  it("notifies subscribers, coalesces command saves, and stops notifications after unsubscribe", async () => {
    vi.useFakeTimers();
    const { value, adapter } = repository();
    const session = await open(value);
    adapter.save.mockClear();
    const listener = vi.fn();
    const unsubscribe = session.subscribe(listener);
    session.setExperience(createFreshExperienceState(true));
    await vi.advanceTimersByTimeAsync(100);
    const experience = structuredClone(session.getSnapshot().experience);
    experience.lastActiveTab = "training";
    session.setExperience(experience);
    await vi.advanceTimersByTimeAsync(499);
    expect(adapter.save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await session.flush();
    expect(adapter.save).toHaveBeenCalledTimes(1);
    expect(adapter.save.mock.calls[0][0].experience.lastActiveTab).toBe(
      "training",
    );
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    const count = listener.mock.calls.length;
    session.setExperience(createFreshExperienceState());
    await session.flush();
    expect(listener).toHaveBeenCalledTimes(count);
  });

  it("retains a change arriving during a save and writes it at the next revision", async () => {
    const { value, adapter } = repository();
    const session = await open(value);
    const realSave = adapter.save.getMockImplementation()!;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    adapter.save.mockImplementationOnce(async (payload) => {
      await gate;
      return realSave(payload);
    });
    session.setExperience(createFreshExperienceState(true));
    const saving = session.flush();
    await Promise.resolve();
    const later = structuredClone(session.getSnapshot().experience);
    later.lastActiveTab = "economy";
    session.setExperience(later);
    release();
    await saving;
    await session.flush();
    const calls = adapter.save.mock.calls;
    expect(calls.at(-1)![0].experience.lastActiveTab).toBe("economy");
    expect(calls.at(-1)![0].revision).toBe(calls.at(-2)![0].revision + 1);
  });

  it("surfaces quota loss immediately and retries dirty data at periodic maintenance", async () => {
    vi.useFakeTimers();
    browser();
    const { value, adapter } = repository();
    const session = await open(value, true);
    adapter.save.mockRejectedValueOnce(
      new DOMException("quota", "QuotaExceededError"),
    );
    session.setExperience(createFreshExperienceState(true));
    await vi.advanceTimersByTimeAsync(500);
    expect(session.getSnapshot().status).toBe("error");
    expect(session.getSnapshot().error).toContain("storage is full");
    expect(session.getSnapshot().experience.onboardingStatus).toBe("completed");
    await vi.advanceTimersByTimeAsync(14_500);
    expect(session.getSnapshot().status).toBe("saved");
    expect(adapter.maintenance).not.toHaveBeenCalled();
    expect(adapter.save.mock.calls.at(-1)![0].experience.onboardingStatus).toBe(
      "completed",
    );
    await vi.advanceTimersByTimeAsync(15 * 60_000 - 15_000);
    expect(adapter.maintenance).toHaveBeenCalledTimes(1);
  });

  it("heartbeats only visible writers and renews immediately on focus and visibility restoration", async () => {
    vi.useFakeTimers();
    const { window, document } = browser();
    const { value, adapter } = repository();
    await open(value, true);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(adapter.heartbeat).toHaveBeenCalledTimes(1);
    document.visibilityState = "hidden";
    await vi.advanceTimersByTimeAsync(5_000);
    expect(adapter.heartbeat).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event("focus"));
    await Promise.resolve();
    expect(adapter.heartbeat).toHaveBeenCalledTimes(1);
    document.visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    window.dispatchEvent(new Event("focus"));
    await Promise.resolve();
    expect(adapter.heartbeat).toHaveBeenCalledTimes(3);
  });

  it("ignores stale/self notifications and freezes a writer on a newer external takeover", async () => {
    vi.useFakeTimers();
    const { channels } = browser();
    const { value, adapter } = repository();
    const session = await open(value, true);
    const channel = channels[0];
    channel.deliver({ type: "takeover", writerId: "other", writerEpoch: 1 });
    channel.deliver({
      type: "takeover",
      writerId: "test-writer",
      writerEpoch: 10,
    });
    channel.deliver({ type: "saved", writerId: "other", writerEpoch: 10 });
    expect(session.getSnapshot().writable).toBe(true);
    channel.deliver({ type: "takeover", writerId: "other", writerEpoch: 2 });
    expect(session.getSnapshot().status).toBe("readonly");
    expect(() => session.setExperience(createFreshExperienceState())).toThrow(
      WriterConflictError,
    );
    await vi.advanceTimersByTimeAsync(5_000);
    expect(adapter.heartbeat).not.toHaveBeenCalled();
  });

  it("surfaces lease loss and never retries heartbeat as an unauthorized writer", async () => {
    vi.useFakeTimers();
    browser();
    const { value, adapter } = repository();
    const session = await open(value, true);
    adapter.heartbeat.mockRejectedValueOnce(new WriterConflictError());
    await vi.advanceTimersByTimeAsync(5_000);
    expect(session.getSnapshot().writable).toBe(false);
    expect(session.getSnapshot().status).toBe("readonly");
    await vi.advanceTimersByTimeAsync(5_000);
    expect(adapter.heartbeat).toHaveBeenCalledTimes(1);
  });

  it.each(["unsupported", "corrupt"] as const)(
    "preserves %s records and exports recovery without overwriting",
    async (kind) => {
      const { value, adapter } = repository({ kind });
      const session = await open(value);
      expect(session.getSnapshot().recovery).toBe(kind);
      expect(session.getSnapshot().writable).toBe(false);
      await session.flush();
      await session.takeover();
      expect(adapter.save).not.toHaveBeenCalled();
      expect(await session.exportRecovery()).toMatchObject({
        stored: { snapshots: ["retained"] },
      });
    },
  );

  it("records explicit recovered-save semantics while keeping the recovery notice visible", async () => {
    const simulation = createFreshGameState({
      ruleset: RULESET_VERSION,
      seed: 99,
    });
    const { value, adapter } = repository({
      kind: "recovered",
      snapshot: {
        runId: crypto.randomUUID(),
        status: "paused",
        revision: 4,
        rulesetVersion: RULESET_VERSION,
        snapshotVersion: 1,
        commandSchemaVersion: 1,
        simulation,
        experience: createFreshExperienceState(),
        checksum: "a".repeat(64),
        createdAt: "2026-10-22T12:00:00.000Z",
        savedAt: "2026-10-22T12:00:00.000Z",
        abandonedAt: null,
        writerId: "test-writer",
        writerEpoch: 1,
        leaseExpiresAt: 60_000,
      },
    });
    const session = await open(value);
    expect(adapter.save.mock.calls[0]).toHaveLength(3);
    expect(adapter.save.mock.calls[0][2]).toEqual({ recovered: true });
    expect(session.getSnapshot().revision).toBe(5);
    expect(session.getSnapshot().status).toBe("recovered");
    expect(session.getSnapshot().error).toContain("damaged");
  });

  it("removes browser subscriptions and timers when closed", async () => {
    vi.useFakeTimers();
    const { window, document, channels } = browser();
    const { value, adapter } = repository();
    const session = await open(value, true);
    session.close();
    sessions.splice(sessions.indexOf(session), 1);
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(adapter.heartbeat).not.toHaveBeenCalled();
    expect(adapter.maintenance).not.toHaveBeenCalled();
    expect(channels[0].close).toHaveBeenCalledOnce();
    expect(adapter.release).toHaveBeenCalledOnce();
    expect(adapter.close).toHaveBeenCalledOnce();
    expect(() => session.tick()).toThrow("closed");
  });

  it("flushes on ordinary pagehide and releases the lease only after durability succeeds", async () => {
    vi.useFakeTimers();
    const { window } = browser();
    const { value, adapter } = repository();
    const session = await open(value, true);
    session.setExperience(createFreshExperienceState(true));
    window.dispatchEvent(
      Object.assign(new Event("pagehide"), { persisted: false }),
    );
    await session.flush();
    await Promise.resolve();
    expect(adapter.release).toHaveBeenCalledOnce();
    const releaseOrder = adapter.release.mock.invocationCallOrder[0];
    expect(adapter.save.mock.invocationCallOrder.at(-1)).toBeLessThan(
      releaseOrder,
    );
  });

  it("keeps the lease for BFCache pagehide and reacquires a paused durable state on pageshow", async () => {
    vi.useFakeTimers();
    const { window } = browser();
    const { value, adapter } = repository();
    const session = await open(value, true);
    const durable = adapter.save.mock.results[0].value;
    const snapshot = await durable;
    snapshot.simulation.clock.status = "running";
    adapter.loadActive.mockResolvedValue({ kind: "ready", snapshot });
    window.dispatchEvent(
      Object.assign(new Event("pagehide"), { persisted: true }),
    );
    await session.flush();
    await Promise.resolve();
    expect(adapter.release).not.toHaveBeenCalled();
    window.dispatchEvent(
      Object.assign(new Event("pageshow"), { persisted: true }),
    );
    await vi.advanceTimersByTimeAsync(0);
    await session.flush();
    expect(adapter.acquireWriter).toHaveBeenCalledTimes(2);
    expect(session.getSnapshot().simulation.clock.status).toBe("paused");
    expect(session.getSnapshot().writable).toBe(true);
  });

  it("does not steal a valid new writer when restoring a frozen document", async () => {
    vi.useFakeTimers();
    const { window } = browser();
    const { value, adapter } = repository();
    const session = await open(value, true);
    adapter.acquireWriter.mockRejectedValueOnce(new WriterConflictError());
    window.dispatchEvent(
      Object.assign(new Event("pageshow"), { persisted: true }),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(session.getSnapshot().writable).toBe(false);
    expect(session.getSnapshot().status).toBe("readonly");
  });

  it("reserves a different writer identity for a duplicated tab and releases its lock on close", async () => {
    browser();
    const { value, adapter } = repository();
    const storage = new Map<string, string>();
    storage.set("ai-factory:writer-id", "duplicated-writer");
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    let requests = 0;
    const released = vi.fn();
    const request = vi.fn(async (_name, _options, callback) => {
      requests += 1;
      await callback(requests === 1 ? null : {});
      released();
    });
    vi.stubGlobal("navigator", { locks: { request } });
    const session = await GameSession.open({ repository: value });
    sessions.push(session);
    expect(request).toHaveBeenCalledTimes(2);
    const writer = adapter.acquireWriter.mock.calls[0][0];
    expect(writer).not.toBe("duplicated-writer");
    expect(storage.get("ai-factory:writer-id")).toBe(writer);
    expect(released).toHaveBeenCalledTimes(1);
    session.close();
    sessions.splice(sessions.indexOf(session), 1);
    await Promise.resolve();
    await Promise.resolve();
    expect(released).toHaveBeenCalledTimes(2);
  });
});
