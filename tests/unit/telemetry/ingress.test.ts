import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type {
  MigrationAttestation,
  TelemetryEvent,
  TelemetrySink,
} from "../../../shared/telemetry/contracts";
import {
  installTelemetryIngress,
  TELEMETRY_EVENTS_PATH,
} from "../../../server/telemetry/ingress";
import { TelemetryUnavailableError } from "../../../server/telemetry/sink";

const origin = "https://factory.example.test";

function event(number: number, occurredAt: number): TelemetryEvent {
  return {
    schemaVersion: 1,
    eventId: `00000000-0000-4000-8000-${number.toString(16).padStart(12, "0")}`,
    runId: "22222222-2222-4222-8222-222222222222",
    buildSha: "a".repeat(40),
    rulesetVersion: "release-b.1",
    occurredAt: new Date(occurredAt).toISOString(),
    type: "run_started",
    properties: {},
  };
}

function sink(overrides: Partial<TelemetrySink> = {}): TelemetrySink {
  const attestation: MigrationAttestation = {
    state: "verified",
    version: "c001-telemetry-research",
    checksum: "a".repeat(64),
  };
  return {
    status: () => "ready",
    migrationVersion: () => attestation.version,
    migrationAttestation: () => attestation,
    accept: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    ...overrides,
  };
}

function application(
  telemetrySink: TelemetrySink,
  options: Omit<
    Parameters<typeof installTelemetryIngress>[1],
    "sink" | "origins"
  > = {},
) {
  const app = express();
  installTelemetryIngress(app, {
    sink: telemetrySink,
    origins: [origin],
    ...options,
  });
  return app;
}

function telemetryPost(app: express.Express, payload: unknown) {
  return request(app)
    .post(TELEMETRY_EVENTS_PATH)
    .set("Origin", origin)
    .set("Sec-Fetch-Site", "same-origin")
    .set("Content-Type", "application/json")
    .send(payload);
}

describe("optional telemetry ingress", () => {
  it("accepts an allowlisted same-origin batch and returns only event IDs", async () => {
    const now = Date.parse("2026-10-23T12:00:00.000Z");
    const telemetrySink = sink();
    const response = await telemetryPost(
      application(telemetrySink, { clock: () => now }),
      {
        events: [event(1, now)],
      },
    );

    expect(response.status).toBe(202);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toEqual({
      data: { acceptedEventIds: [event(1, now).eventId] },
    });
    expect(telemetrySink.accept).toHaveBeenCalledWith(
      [event(1, now)],
      new Date(now),
    );
  });

  it("drops Global Privacy Control before parsing or calling the sink", async () => {
    const telemetrySink = sink();
    const response = await request(application(telemetrySink))
      .post(TELEMETRY_EVENTS_PATH)
      .set("Sec-GPC", "1")
      .set("Content-Type", "application/json")
      .send('{"untrusted":"body"}');

    expect(response.status).toBe(204);
    expect(telemetrySink.accept).not.toHaveBeenCalled();
  });

  it("requires explicit same-origin browser metadata and a closed event schema", async () => {
    const now = Date.parse("2026-10-23T12:00:00.000Z");
    const telemetrySink = sink();
    const app = application(telemetrySink, { clock: () => now });
    const forbiddenOrigin = await request(app)
      .post(TELEMETRY_EVENTS_PATH)
      .set("Origin", "https://attacker.example.test")
      .set("Sec-Fetch-Site", "cross-site")
      .send({ events: [event(1, now)] });
    const invalidPayload = await telemetryPost(app, {
      events: [{ ...event(2, now), properties: { snapshot: {} } }],
    });

    expect(forbiddenOrigin.status).toBe(403);
    expect(forbiddenOrigin.body.error.code).toBe("TELEMETRY_ORIGIN_FORBIDDEN");
    expect(invalidPayload.status).toBe(400);
    expect(invalidPayload.body.error.code).toBe("INVALID_TELEMETRY_EVENT");
    expect(telemetrySink.accept).not.toHaveBeenCalled();
  });

  it("rejects duplicate IDs before an idempotent database write", async () => {
    const now = Date.parse("2026-10-23T12:00:00.000Z");
    const telemetrySink = sink();
    const duplicate = event(1, now);
    const response = await telemetryPost(
      application(telemetrySink, { clock: () => now }),
      { events: [duplicate, duplicate] },
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("DUPLICATE_TELEMETRY_EVENT");
    expect(telemetrySink.accept).not.toHaveBeenCalled();
  });

  it("keeps a configured 60-second rate window instead of silently shrinking it", async () => {
    let now = Date.parse("2026-10-23T12:00:00.000Z");
    const telemetrySink = sink();
    const app = application(telemetrySink, {
      clock: () => now,
      maxRequestsPerWindow: 1,
      windowMs: 60_000,
    });
    expect((await telemetryPost(app, { events: [event(1, now)] })).status).toBe(
      202,
    );

    now += 10_001;
    const tooSoon = await telemetryPost(app, { events: [event(2, now)] });
    expect(tooSoon.status).toBe(429);
    expect(tooSoon.headers["retry-after"]).toBe("60");

    now += 49_999;
    expect((await telemetryPost(app, { events: [event(3, now)] })).status).toBe(
      202,
    );
  });

  it("caps optional events to a bounded per-process day and labels that limit honestly", async () => {
    const now = Date.parse("2026-10-23T12:00:00.000Z");
    const telemetrySink = sink();
    const app = application(telemetrySink, {
      clock: () => now,
      dailyEventCap: 1,
    });
    expect((await telemetryPost(app, { events: [event(1, now)] })).status).toBe(
      202,
    );
    const capped = await telemetryPost(app, { events: [event(2, now)] });

    expect(capped.status).toBe(429);
    expect(capped.headers["retry-after"]).toBe("86400");
    expect(capped.body.error.code).toBe("TELEMETRY_DAILY_CAP_REACHED");
  });

  it("does not turn an optional sink outage into a core failure and honors a 60-second alert cooldown", async () => {
    let now = Date.parse("2026-10-23T12:00:00.000Z");
    const onTelemetryDegraded = vi.fn();
    const telemetrySink = sink({
      status: () => "degraded",
      accept: vi.fn(async () => {
        throw new TelemetryUnavailableError();
      }),
    });
    const app = application(telemetrySink, {
      clock: () => now,
      alertCooldownMs: 60_000,
      onTelemetryDegraded,
    });

    expect((await telemetryPost(app, { events: [event(1, now)] })).status).toBe(
      503,
    );
    now += 10_001;
    expect((await telemetryPost(app, { events: [event(2, now)] })).status).toBe(
      503,
    );
    expect(onTelemetryDegraded).toHaveBeenCalledTimes(1);

    now += 49_999;
    expect((await telemetryPost(app, { events: [event(3, now)] })).status).toBe(
      503,
    );
    expect(onTelemetryDegraded).toHaveBeenCalledTimes(2);
  });
});
