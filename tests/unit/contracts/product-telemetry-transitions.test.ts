import { expect, it } from "vitest";
import {
  observedProductTransitions,
  type ProductTelemetryFrame,
} from "../../../client/src/lib/productTelemetryTransitions";
const frame: ProductTelemetryFrame = {
  runId: "11111111-1111-4111-8111-111111111111",
  rulesetVersion: "release-b.1",
  writable: true,
  activeTick: 0,
  status: "paused",
  era: "GNT-2",
  nonTrainingSpend: 0,
  emergencyInterventions: 0,
  debriefViewed: false,
};
it("does not manufacture history on hydration, run replacement or a read-only tab", () => {
  const resumed = {
    ...frame,
    activeTick: 600,
    nonTrainingSpend: 100,
    era: "GNT-3" as const,
  };
  expect(observedProductTransitions(null, resumed)).toEqual([]);
  expect(
    observedProductTransitions(frame, { ...resumed, runId: "different" }),
  ).toEqual([]);
  expect(
    observedProductTransitions({ ...frame, writable: false }, resumed),
  ).toEqual([]);
  expect(
    observedProductTransitions(frame, { ...resumed, writable: false }),
  ).toEqual([]);
  expect(observedProductTransitions(resumed, resumed)).toEqual([]);
});
it("reports only bounded factual transitions with closed primitive properties", () => {
  expect(
    observedProductTransitions(frame, { ...frame, status: "running" }),
  ).toEqual([{ type: "run_started", properties: {} }]);
  expect(
    observedProductTransitions(
      { ...frame, activeTick: 30 },
      { ...frame, activeTick: 30, status: "running" },
    ),
  ).toEqual([]);
  expect(
    observedProductTransitions(frame, {
      ...frame,
      nonTrainingSpend: 100,
      activeTick: 3,
    }),
  ).toEqual([{ type: "first_investment", properties: { activeTick: 3 } }]);
  expect(
    observedProductTransitions(
      { ...frame, era: "GNT-6", status: "running" },
      {
        ...frame,
        era: "GNT-7",
        status: "completed",
        activeTick: 1560,
        emergencyInterventions: 1,
      },
    ),
  ).toEqual([
    {
      type: "training_completed",
      properties: { era: "GNT-7", activeTick: 1560 },
    },
    { type: "era_reached", properties: { era: "GNT-7" } },
    {
      type: "run_completed",
      properties: { activeTick: 1560, emergencyInterventions: 1 },
    },
  ]);
  expect(
    observedProductTransitions(frame, { ...frame, debriefViewed: true }),
  ).toEqual([{ type: "debrief_viewed", properties: {} }]);
});
