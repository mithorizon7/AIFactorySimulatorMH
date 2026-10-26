import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  OutboxRecord,
  TelemetryEvent,
  TelemetryIntent,
} from "../../../shared/telemetry/contracts";
import {
  ANALYTICS_CONSENT_KEY,
  createTelemetrySdk,
  TELEMETRY_EVENTS_ENDPOINT,
  TELEMETRY_VERSION_ENDPOINT,
  type TelemetryOutboxLike,
  type TelemetryStorage,
} from "../../../client/src/lib/telemetry/sdk";

const run = {
  runId: "22222222-2222-4222-8222-222222222222",
  rulesetVersion: "release-b.1" as const,
};
const eventId = "11111111-1111-4111-8111-111111111111";
const buildSha = "a".repeat(40);
beforeEach(() => vi.stubEnv("VITE_APP_BUILD_SHA", buildSha));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function storage(initial: Record<string, string> = {}): TelemetryStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function memoryOutbox() {
  let records: OutboxRecord[] = [];
  const outbox: TelemetryOutboxLike = {
    enqueue: vi.fn(async (event: TelemetryEvent) => {
      records.push({ event, queuedAt: 0, attempts: 0, nextAttemptAt: 0 });
      return true;
    }),
    due: vi.fn(async () => records),
    markDelivered: vi.fn(async (eventIds: readonly string[]) => {
      records = records.filter(
        (record) => !eventIds.includes(record.event.eventId),
      );
    }),
    recordFailure: vi.fn(async () => {}),
    clear: vi.fn(async () => {
      records = [];
    }),
    size: vi.fn(async () => records.length),
    close: vi.fn(),
  };
  return outbox;
}

describe("optional telemetry SDK", () => {
  it("retains the global receiver when using native fetch by default", async () => {
    const receivers: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      function (this: unknown, input: RequestInfo | URL, init?: RequestInit) {
        receivers.push(this);
        return Promise.resolve({
          ok: true,
          status: input === TELEMETRY_VERSION_ENDPOINT ? 200 : 202,
          json: async () =>
            input === TELEMETRY_VERSION_ENDPOINT
              ? { data: { buildSha, telemetry: "ready" } }
              : {
                  data: {
                    acceptedEventIds: (
                      JSON.parse(String(init?.body)) as {
                        events: TelemetryEvent[];
                      }
                    ).events.map((event) => event.eventId),
                  },
                },
        });
      },
    );
    const outbox = memoryOutbox();
    const sdk = createTelemetrySdk({
      storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
      outboxFactory: async () => outbox,
      clearExistingOutbox: async () => {},
    });
    await sdk.capture(run, { type: "run_started", properties: {} });
    await sdk.flush();
    expect(outbox.enqueue).toHaveBeenCalledOnce();
    expect(receivers.length).toBeGreaterThan(0);
    expect(receivers.every((receiver) => receiver === globalThis)).toBe(true);
    await sdk.close();
  });

  it("does not send stale due records after revocation and re-opt-in", async () => {
    const outbox = memoryOutbox();
    const record: OutboxRecord = {
      event: {
        schemaVersion: 1,
        eventId,
        ...run,
        buildSha,
        occurredAt: "2026-10-23T12:00:00.000Z",
        type: "run_started",
        properties: {},
      },
      queuedAt: 0,
      attempts: 0,
      nextAttemptAt: 0,
    };
    let release!: (records: OutboxRecord[]) => void;
    let started!: () => void;
    const dueStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    vi.mocked(outbox.due).mockImplementation(() => {
      started();
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    const network = vi.fn();
    const sdk = createTelemetrySdk({
      storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
      outboxFactory: async () => outbox,
      clearExistingOutbox: async () => {},
      network,
    });
    const flush = sdk.flush();
    await dueStarted;
    await sdk.setConsent("no");
    await sdk.setConsent("yes");
    release([record]);
    await flush;
    expect(network).not.toHaveBeenCalled();
    await sdk.close();
  });

  it("keeps a failed opt-out latched off despite a stale persisted yes", async () => {
    const outbox = memoryOutbox();
    const sdk = createTelemetrySdk({
      storage: {
        getItem: () => "yes",
        setItem: () => {
          throw new Error("write denied");
        },
        removeItem: () => {},
      },
      outboxFactory: async () => outbox,
      clearExistingOutbox: async () => {},
      versionFetcher: async () => buildSha,
    });
    expect(await sdk.setConsent("no")).toMatchObject({
      enabled: false,
      persistenceError: true,
    });
    await sdk.capture(run, { type: "run_started", properties: {} });
    expect(outbox.enqueue).not.toHaveBeenCalled();
    await sdk.close();
  });

  for (const revoke of ["local", "storage-event"] as const) {
    it(`does not resurrect a pending capture after ${revoke} revocation and a new opt-in`, async () => {
      const persisted = storage({ [ANALYTICS_CONSENT_KEY]: "yes" });
      const outbox = memoryOutbox();
      let release!: (sha: string) => void;
      let started!: () => void;
      const metadataStarted = new Promise<void>((resolve) => {
        started = resolve;
      });
      const sdk = createTelemetrySdk({
        storage: persisted,
        outboxFactory: async () => outbox,
        clearExistingOutbox: async () => {},
        versionFetcher: () => {
          started();
          return new Promise((resolve) => {
            release = resolve;
          });
        },
      });
      const capture = sdk.capture(run, { type: "run_started", properties: {} });
      await metadataStarted;
      if (revoke === "local") {
        await sdk.setConsent("no");
        await sdk.setConsent("yes");
      } else {
        // The latest storage value is already yes when the older no event
        // arrives; the event value must still revoke the earlier operation.
        await sdk.handleStorageChange({
          key: ANALYTICS_CONSENT_KEY,
          newValue: "no",
        });
        await sdk.handleStorageChange({
          key: ANALYTICS_CONSENT_KEY,
          newValue: "yes",
        });
      }
      release(buildSha);
      await capture;
      expect(sdk.preference().enabled).toBe(true);
      expect(outbox.enqueue).not.toHaveBeenCalled();
      await sdk.close();
    });
  }

  for (const stop of ["timeout", "close"] as const) {
    it(`cancels a stalled JSON body on ${stop}`, async () => {
      vi.useFakeTimers();
      let started!: () => void;
      const bodyStarted = new Promise<void>((resolve) => {
        started = resolve;
      });
      let signal: AbortSignal | null | undefined;
      const outboxFactory = vi.fn(async () => memoryOutbox());
      const sdk = createTelemetrySdk({
        storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
        outboxFactory,
        clearExistingOutbox: async () => {},
        network: async (_input, init) => {
          signal = init?.signal;
          return {
            ok: true,
            status: 200,
            json: () =>
              new Promise((_resolve, reject) => {
                signal?.addEventListener(
                  "abort",
                  () => reject(new Error("aborted body")),
                  { once: true },
                );
                started();
              }),
          };
        },
      });
      const capture = sdk.capture(run, { type: "run_started", properties: {} });
      await bodyStarted;
      if (stop === "close") await sdk.close();
      else await vi.advanceTimersByTimeAsync(10_000);
      await capture;
      expect(signal?.aborted).toBe(true);
      expect(outboxFactory).not.toHaveBeenCalled();
      await sdk.close();
      expect(vi.getTimerCount()).toBe(0);
    });
  }

  it("backs off a malformed JSON acknowledgement rather than stranding or hot-looping the queue", async () => {
    const outbox = memoryOutbox();
    const sdk = createTelemetrySdk({
      storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
      outboxFactory: async () => outbox,
      clearExistingOutbox: async () => {},
      versionFetcher: async () => buildSha,
      randomUuid: () => eventId,
      network: async () => ({
        ok: true,
        status: 202,
        json: async () => {
          throw new Error("malformed JSON");
        },
      }),
    });
    await sdk.capture(run, { type: "run_started", properties: {} });
    await sdk.flush();
    expect(outbox.recordFailure).toHaveBeenCalledWith([eventId]);
    expect(outbox.markDelivered).not.toHaveBeenCalled();
    await sdk.close();
  });

  it("does not queue or transmit events when the served backend has not activated telemetry", async () => {
    const outboxFactory = vi.fn(async () => memoryOutbox());
    const network = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: { buildSha, telemetry: "not_configured" } }),
    }));
    const sdk = createTelemetrySdk({
      storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
      outboxFactory,
      clearExistingOutbox: async () => {},
      network,
    });
    await sdk.capture(run, { type: "run_started", properties: {} });
    expect(outboxFactory).not.toHaveBeenCalled();
    expect(network).toHaveBeenCalledOnce();
    expect(network.mock.calls[0]?.[0]).toBe(TELEMETRY_VERSION_ENDPOINT);
    await sdk.close();
  });

  for (const stop of ["timeout", "close"] as const) {
    it(`cancels an in-flight metadata request on ${stop} without queuing an event`, async () => {
      vi.useFakeTimers();
      let started!: () => void;
      const requestStarted = new Promise<void>((resolve) => {
        started = resolve;
      });
      let signal: AbortSignal | null | undefined;
      const outboxFactory = vi.fn(async () => memoryOutbox());
      const sdk = createTelemetrySdk({
        storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
        outboxFactory,
        clearExistingOutbox: async () => {},
        network: async (_input, init) => {
          signal = init?.signal;
          started();
          return new Promise((_resolve, reject) => {
            signal?.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              {
                once: true,
              },
            );
          });
        },
      });
      const capture = sdk.capture(run, { type: "run_started", properties: {} });
      await requestStarted;
      if (stop === "close") await sdk.close();
      else await vi.advanceTimersByTimeAsync(10_000);
      await capture;
      expect(signal?.aborted).toBe(true);
      expect(outboxFactory).not.toHaveBeenCalled();
      await sdk.close();
      expect(vi.getTimerCount()).toBe(0);
    });
  }

  it("does not label an old executing bundle with a newer served SHA", async () => {
    const outbox = memoryOutbox();
    const sdk = createTelemetrySdk({
      executingBuildSha: "b".repeat(40),
      storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
      outboxFactory: async () => outbox,
      clearExistingOutbox: async () => {},
      versionFetcher: async () => buildSha,
    });
    await sdk.capture(run, { type: "run_started", properties: {} });
    expect(outbox.enqueue).not.toHaveBeenCalled();
    await sdk.close();
  });
  it("is off by default and does not initialize analytics storage or network activity", async () => {
    const outboxFactory = vi.fn(async () => memoryOutbox());
    const versionFetcher = vi.fn(async () => buildSha);
    const clearExistingOutbox = vi.fn(async () => {});
    const sdk = createTelemetrySdk({
      storage: storage(),
      outboxFactory,
      versionFetcher,
      clearExistingOutbox,
    });

    await sdk.capture(run, { type: "run_started", properties: {} });
    await sdk.flush();

    expect(sdk.preference()).toEqual({
      consent: "no",
      globalPrivacyControl: false,
      enabled: false,
    });
    expect(versionFetcher).not.toHaveBeenCalled();
    expect(outboxFactory).not.toHaveBeenCalled();
    expect(clearExistingOutbox).toHaveBeenCalled();
  });

  it("fetches a valid served SHA before enqueueing and sends only same-origin credential-free events", async () => {
    const outbox = memoryOutbox();
    const network = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (input === TELEMETRY_VERSION_ENDPOINT)
          return {
            ok: true,
            status: 200,
            json: async () => ({ data: { buildSha } }),
          };
        const body = JSON.parse(String(init?.body)) as {
          events: TelemetryEvent[];
        };
        return {
          ok: true,
          status: 202,
          json: async () => ({
            data: {
              acceptedEventIds: body.events.map((event) => event.eventId),
            },
          }),
        };
      },
    );
    const sdk = createTelemetrySdk({
      storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
      outboxFactory: async () => outbox,
      clearExistingOutbox: async () => {},
      network,
      clock: () => Date.parse("2026-10-23T12:00:00.000Z"),
      randomUuid: () => eventId,
    });

    await sdk.capture(run, { type: "run_started", properties: {} });
    await sdk.flush();

    expect(network.mock.calls[0]).toEqual([
      TELEMETRY_VERSION_ENDPOINT,
      expect.objectContaining({
        method: "GET",
        mode: "same-origin",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
      }),
    ]);
    expect(network.mock.calls[1]?.[0]).toBe(TELEMETRY_EVENTS_ENDPOINT);
    expect(network.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        mode: "same-origin",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
      }),
    );
    expect(outbox.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId,
        runId: run.runId,
        buildSha,
        type: "run_started",
        properties: {},
      }),
    );
    expect(outbox.markDelivered).toHaveBeenCalledWith([eventId]);
  });

  it("has no path for snapshots, command payloads, or arbitrary event properties", async () => {
    const outbox = memoryOutbox();
    const versionFetcher = vi.fn(async () => buildSha);
    const sdk = createTelemetrySdk({
      storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
      outboxFactory: async () => outbox,
      clearExistingOutbox: async () => {},
      versionFetcher,
      randomUuid: () => eventId,
    });

    await sdk.capture(run, {
      type: "run_started",
      properties: { snapshot: { commands: [{ payload: "private" }] } },
    } as unknown as TelemetryIntent);

    expect(versionFetcher).toHaveBeenCalledOnce();
    expect(outbox.enqueue).not.toHaveBeenCalled();
  });

  it("reconciles GPC at startup and purges an existing v2 queue without emitting events", async () => {
    const clearExistingOutbox = vi.fn(async () => {});
    const versionFetcher = vi.fn(async () => buildSha);
    const sdk = createTelemetrySdk({
      storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
      globalPrivacyControl: () => true,
      clearExistingOutbox,
      versionFetcher,
    });

    await sdk.reconcilePrivacy();
    await sdk.capture(run, { type: "run_started", properties: {} });

    expect(sdk.preference()).toEqual({
      consent: "yes",
      globalPrivacyControl: true,
      enabled: false,
    });
    expect(clearExistingOutbox).toHaveBeenCalled();
    expect(versionFetcher).not.toHaveBeenCalled();
  });

  it("fails closed and purges when an opt-in cannot be persisted", async () => {
    const clearExistingOutbox = vi.fn(async () => {});
    const unavailableStorage: TelemetryStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("storage unavailable");
      },
      removeItem: () => {},
    };
    const sdk = createTelemetrySdk({
      storage: unavailableStorage,
      clearExistingOutbox,
    });

    await sdk.setConsent("yes");

    expect(sdk.preference().enabled).toBe(false);
    expect(clearExistingOutbox).toHaveBeenCalled();
  });

  it("keeps failed or malformed acknowledgements in the retry path", async () => {
    const outbox = memoryOutbox();
    const sdk = createTelemetrySdk({
      storage: storage({ [ANALYTICS_CONSENT_KEY]: "yes" }),
      outboxFactory: async () => outbox,
      clearExistingOutbox: async () => {},
      versionFetcher: async () => buildSha,
      randomUuid: () => eventId,
      network: async () => ({
        ok: true,
        status: 202,
        json: async () => ({ data: { acceptedEventIds: [] } }),
      }),
    });

    await sdk.capture(run, { type: "run_started", properties: {} });
    await sdk.flush();

    expect(outbox.recordFailure).toHaveBeenCalledWith([eventId]);
    expect(outbox.markDelivered).not.toHaveBeenCalled();
  });
});
