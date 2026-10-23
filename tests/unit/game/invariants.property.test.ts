import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { advanceGameOneTick } from "@shared/game/engine";
import type { GameCommand } from "@shared/game/schemas/commands";
import { deepFreeze, expectCoreInvariants, fresh, issue } from "./helpers";

const arbitraryCommand = fc.constantFrom<
  Exclude<
    GameCommand["type"],
    | "START_TRAINING"
    | "SET_MONTHLY_FEE"
    | "START_RUN"
    | "PAUSE_RUN"
    | "RESUME_RUN"
  >
>(
  "INVEST_COMPUTE",
  "INVEST_ELECTRICITY",
  "INVEST_HARDWARE",
  "INVEST_REGULATION",
  "INVEST_DATA_QUALITY",
  "INVEST_DATA_QUANTITY",
  "INVEST_DATA_FORMATS",
  "INVEST_ALGORITHM_ARCHITECTURE",
  "HIRE_RESEARCH_ENGINEER",
  "BUILD_API_PLATFORM",
  "BUILD_CHATBOT_PLATFORM",
  "TOGGLE_API_SERVICE",
  "TOGGLE_CHATBOT_SERVICE",
  "UPGRADE_DEVELOPER_TOOLS",
  "UPGRADE_CHATBOT",
  "RUN_MARKETING_CAMPAIGN",
);

describe("state-machine properties", () => {
  it("preserves schema, immutability, ledgers, and numeric invariants for arbitrary sequences", () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(arbitraryCommand, fc.constant("TICK" as const)), {
          minLength: 1,
          maxLength: 100,
        }),
        (operations) => {
          let state = issue(fresh(123), "START_RUN", {}).result.state;
          for (const operation of operations) {
            const previous = state;
            const before = structuredClone(previous);
            deepFreeze(previous);
            const next =
              operation === "TICK"
                ? advanceGameOneTick(previous).state
                : issue(previous, operation, {}).result.state;
            expect(previous).toEqual(before);
            if (operation === "TICK") expect(next).not.toBe(previous);
            state = next;
            expectCoreInvariants(state);
            expect(JSON.stringify(state)).not.toContain("NaN");
            expect(JSON.stringify(state)).not.toContain("Infinity");
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
