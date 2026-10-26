import { describe, expect, it } from "vitest";
import {
  clientTimeIsBounded,
  telemetryBatchSchema,
  telemetryEventSchema,
} from "../../../shared/telemetry/contracts";

const event = {
  schemaVersion: 1,
  eventId: "11111111-1111-4111-8111-111111111111",
  runId: "22222222-2222-4222-8222-222222222222",
  buildSha: "a".repeat(40),
  rulesetVersion: "release-b.1",
  occurredAt: "2026-10-23T07:00:00.000Z",
  type: "run_started",
  properties: {},
};
describe("closed product telemetry boundary", () => {
  it("accepts only versioned allowlisted events and payloads", () => {
    expect(telemetryEventSchema.parse(event)).toEqual(event);
    for (const change of [
      { type: "custom" },
      { schemaVersion: 2 },
      { buildSha: "short" },
      { email: "private@example.invalid" },
      { properties: { snapshot: {} } },
      {
        type: "assessment_completed",
        properties: {
          phase: "post",
          correct: 4,
          questionCount: 5,
          assessmentVersion: "pilot-v1",
          answers: ["A"],
        },
      },
    ])
      expect(
        telemetryEventSchema.safeParse({ ...event, ...change }).success,
      ).toBe(false);
    expect(
      telemetryEventSchema.safeParse({
        ...event,
        type: "assessment_completed",
        properties: {
          phase: "post",
          correct: 4,
          questionCount: 5,
          assessmentVersion: "pilot-v1",
        },
      }).success,
    ).toBe(true);
  });
  it("bounds batches without silently stripping private properties", () => {
    expect(telemetryBatchSchema.safeParse({ events: [event] }).success).toBe(
      true,
    );
    expect(telemetryBatchSchema.safeParse({ events: [] }).success).toBe(false);
    expect(
      telemetryBatchSchema.safeParse({ events: Array(21).fill(event) }).success,
    ).toBe(false);
    expect(
      telemetryBatchSchema.safeParse({ events: [event], ip: "private" })
        .success,
    ).toBe(false);
  });
  it("uses inclusive server-authoritative occurrence bounds", () => {
    const received = Date.parse(event.occurredAt);
    for (const offset of [-86400000, 0, 300000])
      expect(
        clientTimeIsBounded(
          new Date(received + offset).toISOString(),
          received,
        ),
      ).toBe(true);
    for (const offset of [-86400001, 300001])
      expect(
        clientTimeIsBounded(
          new Date(received + offset).toISOString(),
          received,
        ),
      ).toBe(false);
    expect(clientTimeIsBounded("invalid", received)).toBe(false);
  });
  it("rejects oversized batches before accumulating per-event issues", () => {
    const result = telemetryBatchSchema.safeParse({
      events: Array.from({ length: 21 }, () => ({ type: "unknown" })),
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("Oversized batch was accepted");
    expect(result.error.issues).toEqual([
      expect.objectContaining({
        code: "too_big",
        path: ["events"],
        maximum: 20,
      }),
    ]);
  });
});
