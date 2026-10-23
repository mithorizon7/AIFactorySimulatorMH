import { applyGameCommand, advanceGameOneTick } from "@shared/game/engine";
import { createFreshGameState } from "@shared/game/factory";
import {
  createFreshExperienceState,
  experienceStateSchema,
  type ExperienceStateV1,
} from "@shared/experience/schemas";
import type { GameCommand } from "@shared/game/schemas/commands";
import type { EngineResult, GameStateV2 } from "@shared/game/schemas/state";
import type { CompletedRunSummaryV1 } from "@shared/game/schemas/completedRuns";
import { RULESET_VERSION } from "@shared/version";
import {
  GameRepository,
  WriterConflictError,
  RevisionConflictError,
  snapshotPayload,
  type WriterLease,
} from "./repository";

export interface SessionSnapshot {
  simulation: GameStateV2;
  experience: ExperienceStateV1;
  runId: string;
  revision: number;
  checksum?: string;
  status: "ready" | "readonly" | "saving" | "saved" | "error" | "recovered";
  writable: boolean;
  error?: string;
  recovery?: "corrupt" | "unsupported" | "recovered";
}
export interface SessionOptions {
  repository?: GameRepository;
  seed?: number;
  onboardingComplete?: boolean;
  name?: string;
  writerId?: string;
  now?: () => number;
  browserLifecycle?: boolean;
}
const errorMessage = (error: unknown) =>
  error instanceof DOMException && error.name === "QuotaExceededError"
    ? "Browser storage is full. Export your recovery data and free storage; your current run remains in memory."
    : error instanceof Error
      ? error.message
      : "The run could not be saved. Your current progress remains in memory.";

/** Owns lifecycle/durability; simulation transitions remain pure and clock driven. */
export class GameSession {
  private state: SessionSnapshot;
  private repository?: GameRepository;
  private lease?: WriterLease;
  private writerId: string;
  private dirty = false;
  private changeSequence = 0;
  private queue: Promise<void> = Promise.resolve();
  private debounce?: ReturnType<typeof setTimeout>;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private maintenanceTimer?: ReturnType<typeof setInterval>;
  private dirtySaveTimer?: ReturnType<typeof setInterval>;
  private listeners = new Set<() => void>();
  private channel?: BroadcastChannel;
  private closed = false;
  private recovered = false;
  private lifecycle = false;
  private lifecycleBusy = false;
  private unsupportedDatabase = false;
  private releaseIdentityLock?: () => void;
  private constructor(private options: SessionOptions) {
    this.writerId = options.writerId ?? crypto.randomUUID();
    this.state = {
      simulation: createFreshGameState({
        ruleset: RULESET_VERSION,
        seed: options.seed ?? 42,
      }),
      experience: createFreshExperienceState(options.onboardingComplete),
      runId: crypto.randomUUID(),
      revision: -1,
      status: "ready",
      writable: true,
    };
  }
  static async open(options: SessionOptions = {}): Promise<GameSession> {
    const session = new GameSession(options);
    try {
      await session.initializeWriterIdentity();
      session.repository =
        options.repository ??
        (await GameRepository.open({ name: options.name, now: options.now }));
      try {
        session.lease = await session.repository.acquireWriter(
          session.writerId,
        );
      } catch (error) {
        if (!(error instanceof WriterConflictError)) throw error;
        session.state = {
          ...session.state,
          writable: false,
          status: "readonly",
          error: error.message,
        };
      }
      const ownershipError =
        session.state.status === "readonly" ? session.state.error : undefined;
      await session.hydrate();
      if (ownershipError)
        session.state = {
          ...session.state,
          writable: false,
          status: "readonly",
          error: ownershipError,
        };
      if (
        session.state.recovery === "unsupported" ||
        session.state.recovery === "corrupt"
      )
        session.state.writable = false;
      if (session.state.writable) {
        session.dirty = true;
        await session.flush();
      }
    } catch (error) {
      session.unsupportedDatabase =
        error instanceof Error && error.name === "VersionError";
      session.state = {
        ...session.state,
        status: "error",
        ...(session.unsupportedDatabase
          ? { writable: false, recovery: "unsupported" as const }
          : {}),
        error: session.unsupportedDatabase
          ? "This browser database was created by a newer application version. Export the original records for recovery; use the newer application to resume."
          : errorMessage(error),
      };
    }
    session.installLifecycle();
    return session;
  }
  private async hydrate() {
    const loaded = await this.repository!.loadActive();
    if (loaded.kind === "ready" || loaded.kind === "recovered") {
      const { simulation, experience, runId, revision, checksum } =
        loaded.snapshot;
      // Resume always asks for explicit play, never wall-clock catch-up.
      const paused = structuredClone(simulation);
      if (paused.clock.status === "running") paused.clock.status = "paused";
      this.recovered = loaded.kind === "recovered";
      this.state = {
        simulation: paused,
        experience,
        runId,
        revision,
        checksum,
        writable: true,
        status: this.recovered ? "recovered" : "ready",
        ...(this.recovered
          ? {
              recovery: "recovered" as const,
              error:
                "The latest save was damaged. An earlier checked recovery snapshot was restored.",
            }
          : {}),
      };
    } else if (loaded.kind !== "empty") {
      this.state = {
        ...this.state,
        status: "error",
        writable: false,
        recovery: loaded.kind,
        error:
          loaded.kind === "unsupported"
            ? "This save belongs to an unsupported version. Export it before starting a separate run."
            : "No valid save could be recovered. Export recovery data before starting a separate run.",
      };
    }
  }
  getSnapshot = (): SessionSnapshot => this.state;
  isTransitioning = (): boolean => this.lifecycleBusy;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
  private assertWritable() {
    if (this.closed) throw new Error("Session is closed");
    if (this.lifecycleBusy)
      throw new Error("Run lifecycle transition in progress");
    if (!this.state.writable) throw new WriterConflictError();
  }
  update(
    simulation: GameStateV2,
    experience: ExperienceStateV1 = this.state.experience,
  ) {
    this.assertWritable();
    this.state = {
      ...this.state,
      simulation,
      experience: experienceStateSchema.parse(experience),
      status: this.repository && this.lease ? "saving" : "error",
    };
    this.dirty = true;
    this.changeSequence += 1;
    this.emit();
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      void this.flush();
    }, 500);
  }
  apply(command: GameCommand): EngineResult {
    this.assertWritable();
    const result = applyGameCommand(this.state.simulation, command);
    this.update(result.state);
    return result;
  }
  tick(): EngineResult {
    if (this.lifecycleBusy)
      return { state: this.state.simulation, effects: [] };
    this.assertWritable();
    const result = advanceGameOneTick(this.state.simulation);
    if (result.state !== this.state.simulation) this.update(result.state);
    return result;
  }
  setExperience(experience: ExperienceStateV1) {
    this.update(this.state.simulation, experience);
  }
  flush(): Promise<void> {
    const operation = async () => {
      if (
        !this.dirty ||
        !this.repository ||
        !this.lease ||
        !this.state.writable ||
        this.closed
      )
        return;
      const sequence = this.changeSequence;
      const payload = snapshotPayload(
        this.state.runId,
        this.state.revision + 1,
        this.state.simulation,
        this.state.experience,
      );
      this.state = { ...this.state, status: "saving" };
      this.emit();
      try {
        // An expired writer must reacquire through the epoch guard, never reuse its old token.
        const saved = await this.repository.save(payload, this.lease, {
          recovered: this.recovered,
        });
        this.recovered = false;
        this.dirty = sequence !== this.changeSequence;
        this.state = {
          ...this.state,
          revision: saved.revision,
          checksum: saved.checksum,
          status: this.state.recovery === "recovered" ? "recovered" : "saved",
          error:
            this.state.recovery === "recovered" ? this.state.error : undefined,
        };
        this.emit();
        this.channel?.postMessage({
          type: "saved",
          writerId: this.writerId,
          writerEpoch: this.lease.writerEpoch,
        });
      } catch (error) {
        this.fail(error);
      }
    };
    this.queue = this.queue.then(operation, operation);
    return this.queue;
  }
  private fail(error: unknown) {
    const conflict =
      error instanceof WriterConflictError ||
      error instanceof RevisionConflictError;
    this.state = {
      ...this.state,
      status: conflict ? "readonly" : "error",
      writable: conflict ? false : this.state.writable,
      error: errorMessage(error),
    };
    this.emit();
  }
  async takeover() {
    if (this.lifecycleBusy)
      throw new Error("Run lifecycle transition in progress");
    this.lifecycleBusy = true;
    try {
      if (!this.repository) throw new Error("Browser storage is unavailable");
      await this.flush();
      this.lease = await this.repository.acquireWriter(this.writerId, true);
      await this.hydrate();
      if (
        this.state.recovery === "unsupported" ||
        this.state.recovery === "corrupt"
      ) {
        this.emit();
        return;
      }
      this.state = { ...this.state, writable: true, status: "ready" };
      this.channel?.postMessage({
        type: "takeover",
        writerId: this.writerId,
        writerEpoch: this.lease.writerEpoch,
      });
      this.dirty = true;
      await this.flush();
    } finally {
      this.lifecycleBusy = false;
    }
  }
  /** Caller confirms abandonment first. A fresh graph and run ID are mandatory. */
  async reset(seed = 42) {
    if (this.lifecycleBusy)
      throw new Error("Run lifecycle transition in progress");
    this.lifecycleBusy = true;
    try {
      if (!this.repository || !this.lease) {
        if (!this.state.writable) throw new WriterConflictError();
        this.state = {
          simulation: createFreshGameState({ ruleset: RULESET_VERSION, seed }),
          experience: createFreshExperienceState(
            this.state.experience.onboardingStatus !== "active",
          ),
          runId: crypto.randomUUID(),
          revision: -1,
          writable: true,
          status: "error",
          error: "Storage unavailable: the new run is temporary.",
        };
        this.emit();
        return;
      }
      if (this.state.status === "readonly") throw new WriterConflictError();
      await this.flush();
      const simulation = createFreshGameState({
        ruleset: RULESET_VERSION,
        seed,
      });
      const experience = createFreshExperienceState(
        this.state.experience.onboardingStatus !== "active",
      );
      const runId = crypto.randomUUID();
      const saved = await this.repository.save(
        snapshotPayload(runId, 0, simulation, experience),
        this.lease,
        { replace: true },
      );
      this.lease = {
        writerId: saved.writerId,
        writerEpoch: saved.writerEpoch,
        expiresAt: saved.leaseExpiresAt,
      };
      this.channel?.postMessage({
        type: "takeover",
        writerId: this.writerId,
        writerEpoch: saved.writerEpoch,
      });
      this.recovered = false;
      this.dirty = false;
      this.state = {
        simulation,
        experience,
        runId,
        revision: 0,
        checksum: saved.checksum,
        writable: true,
        status: "saved",
      };
      this.emit();
    } finally {
      this.lifecycleBusy = false;
    }
  }
  async complete(summary: CompletedRunSummaryV1) {
    await this.flush();
    if (!this.repository || !this.lease)
      throw new Error(
        "Completion remains temporary until storage is available",
      );
    await this.repository.complete(summary, this.lease);
  }
  async history() {
    return (
      this.repository?.history() ?? { completedRuns: [], personalBests: [] }
    );
  }
  async exportRecovery(): Promise<unknown> {
    return {
      inMemory: this.state,
      stored: this.unsupportedDatabase
        ? await GameRepository.exportUnsupportedDatabase({
            name: this.options.name,
          })
        : await this.repository?.exportRecovery(),
      legacyDatabase: await GameRepository.exportLegacyDatabase(),
    };
  }
  private heartbeat = async () => {
    if (
      !this.lease ||
      !this.repository ||
      !this.state.writable ||
      (this.lifecycle && document.visibilityState !== "visible")
    )
      return;
    try {
      this.lease = await this.repository.heartbeat(this.lease);
    } catch (error) {
      this.fail(error);
    }
  };
  private restore = () => {
    void this.heartbeat();
  };
  private pagehide = (event: PageTransitionEvent) => {
    void this.flush()
      .then(async () => {
        if (!event.persisted && this.repository && this.lease)
          await this.repository.release(this.lease);
      })
      .catch(() => {});
  };
  private pageshow = (event: PageTransitionEvent) => {
    if (!event.persisted || !this.repository || this.lifecycleBusy) return;
    this.lifecycleBusy = true;
    void (async () => {
      try {
        // A frozen document may have lost its lease; reacquire without stealing
        // from another valid writer, then hydrate/explicitly pause before play.
        await this.queue;
        this.lease = await this.repository!.acquireWriter(this.writerId);
        await this.hydrate();
        if (
          this.state.recovery === "corrupt" ||
          this.state.recovery === "unsupported"
        ) {
          this.emit();
          return;
        }
        this.state = { ...this.state, writable: true };
        this.dirty = true;
        await this.flush();
      } catch (error) {
        this.fail(error);
      } finally {
        this.lifecycleBusy = false;
      }
    })();
  };
  private async initializeWriterIdentity() {
    if (
      this.options.writerId ||
      this.options.browserLifecycle === false ||
      typeof window === "undefined"
    )
      return;
    if (!navigator.locks) return;
    const key = `${this.options.name ?? "ai-factory"}:writer-id`;
    let candidate: string;
    try {
      candidate = sessionStorage.getItem(key) ?? this.writerId;
    } catch {
      return;
    }
    const reserve = (id: string) =>
      new Promise<boolean>((resolve) => {
        void navigator.locks
          .request(`${key}:${id}`, { ifAvailable: true }, async (lock) => {
            if (!lock) {
              resolve(false);
              return;
            }
            await new Promise<void>((release) => {
              this.releaseIdentityLock = release;
              resolve(true);
            });
          })
          .catch(() => resolve(false));
      });
    if (!(await reserve(candidate))) {
      candidate = crypto.randomUUID();
      if (!(await reserve(candidate))) return;
    }
    this.writerId = candidate;
    try {
      sessionStorage.setItem(key, candidate);
    } catch {
      /* The held lock still prevents simultaneous reuse. */
    }
  }
  private installLifecycle() {
    this.lifecycle =
      this.options.browserLifecycle !== false && typeof window !== "undefined";
    if (!this.lifecycle) return;
    window.addEventListener("focus", this.restore);
    document.addEventListener("visibilitychange", this.restore);
    window.addEventListener("pagehide", this.pagehide);
    window.addEventListener("pageshow", this.pageshow);
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel("ai-factory");
      this.channel.onmessage = (event) => {
        if (
          event.data?.type === "takeover" &&
          event.data.writerId !== this.writerId &&
          event.data.writerEpoch > (this.lease?.writerEpoch ?? 0)
        )
          this.fail(new WriterConflictError());
      };
    }
    this.heartbeatTimer = setInterval(() => {
      void this.heartbeat();
    }, 5_000);
    this.dirtySaveTimer = setInterval(() => {
      void this.flush();
    }, 15_000);
    this.maintenanceTimer = setInterval(() => {
      void this.repository?.maintenance().catch((error) => this.fail(error));
    }, 15 * 60_000);
  }
  close() {
    // Callers should await flush before closing; pagehide is explicitly best effort.
    if (this.debounce) clearTimeout(this.debounce);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.maintenanceTimer) clearInterval(this.maintenanceTimer);
    if (this.dirtySaveTimer) clearInterval(this.dirtySaveTimer);
    if (this.lifecycle) {
      window.removeEventListener("focus", this.restore);
      document.removeEventListener("visibilitychange", this.restore);
      window.removeEventListener("pagehide", this.pagehide);
      window.removeEventListener("pageshow", this.pageshow);
    }
    this.channel?.close();
    this.releaseIdentityLock?.();
    this.closed = true;
    if (this.repository && this.lease) {
      const repository = this.repository;
      void repository.release(this.lease).finally(() => repository.close());
    } else this.repository?.close();
    this.listeners.clear();
  }
}
