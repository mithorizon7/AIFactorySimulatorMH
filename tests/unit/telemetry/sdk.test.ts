import { describe, expect, it, vi } from "vitest";
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
