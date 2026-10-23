import { IDBFactory } from "fake-indexeddb";
import { expect, it } from "vitest";
import {
  GameRepository,
  snapshotPayload,
} from "../../client/src/lib/persistence/repository";
import { createFreshExperienceState } from "../../shared/experience/schemas";
import { buildCompletedRunSummary } from "../../shared/game/completed-summary";
import { strategy } from "../unit/game/strategy-policies";

it("builds and durably records factual completion after a public-command strategy experiences fractional capacity shortage", async () => {
  const agent = strategy(42, "service-capacity-stress", {
    requireShortfall: true,
  });
  const simulation = agent.finish();
  expect(simulation.clock.status).toBe("completed");
  expect(simulation.facts.peakCapacityShortfallRatio).toBeGreaterThan(0);
  expect(simulation.facts.peakCapacityShortfallRatio).toBeLessThan(1);
  const rounded = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
  expect(simulation.facts.capacityShortfallRatioSum).toBe(
    rounded(simulation.facts.capacityShortfallRatioSum),
  );
  expect(simulation.facts.peakCapacityShortfallRatio).toBe(
    rounded(simulation.facts.peakCapacityShortfallRatio),
  );

  const repository = await GameRepository.open({ factory: new IDBFactory() });
  try {
    const lease = await repository.acquireWriter("fractional-capacity-test");
    const saved = await repository.save(
      snapshotPayload(
        crypto.randomUUID(),
        0,
        simulation,
        createFreshExperienceState(true),
      ),
      lease,
    );
    const summary = buildCompletedRunSummary({
      simulation: saved.simulation,
      runId: saved.runId,
      revision: saved.revision,
      checksum: saved.checksum,
      completedAt: "2026-10-23T12:00:00.000Z",
    });
    expect(summary.capacity.peakShortfallRatio).toBe(
      simulation.facts.peakCapacityShortfallRatio,
    );
    expect(summary.capacity.meanShortfallRatio).toBe(
      rounded(
        simulation.facts.capacityShortfallRatioSum /
          simulation.clock.activeTick,
      ),
    );
    await repository.complete(summary, lease);
    const history = await repository.history();
    expect(history.completedRuns).toEqual([summary]);
    expect(history.personalBests).toHaveLength(5);
    expect(
      history.personalBests.find(
        (best) => best.metric === "mean_capacity_shortfall_ratio",
      )?.value,
    ).toBe(summary.capacity.meanShortfallRatio);
  } finally {
    repository.close();
  }
}, 30_000);
