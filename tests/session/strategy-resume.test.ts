import { IDBFactory } from "fake-indexeddb";
import { expect, it } from "vitest";
import { GameRepository } from "../../client/src/lib/persistence/repository";
import { GameSession } from "../../client/src/lib/persistence/session";
import { buildCompletedRunSummary } from "../../shared/game/completed-summary";
import { strategy } from "../unit/game/strategy-policies";

it("pause/save/close/reopen/resume completes with exactly the uninterrupted strategy state and durable facts", async () => {
  const factory = new IDBFactory();
  const repository = await GameRepository.open({ factory });
  const session = await GameSession.open({
    repository,
    seed: 42,
    writerId: "strategy-tab",
    browserLifecycle: false,
  });
  const agent = strategy(42, "revenue-first");
  let prefix = agent.initial;
  while (prefix.clock.activeTick < 80) prefix = agent.step(prefix);
  prefix = agent.command(prefix, "PAUSE_RUN");
  session.update(prefix);
  const experience = structuredClone(session.getSnapshot().experience);
  experience.lastActiveTab = "training";
  experience.seenMessageIds = ["strategy-roundtrip-marker"];
  session.setExperience(experience);
  await session.flush();
  const beforeClose = session.getSnapshot();
  const originalRunId = beforeClose.runId;
  session.close();

  const reopenedRepository = await GameRepository.open({ factory });
  const resumed = await GameSession.open({
    repository: reopenedRepository,
    writerId: "strategy-tab",
    browserLifecycle: false,
  });
  try {
    const loaded = resumed.getSnapshot();
    expect(loaded.writable).toBe(true);
    expect(loaded.runId).toBe(originalRunId);
    expect(loaded.simulation).toEqual(prefix);
    expect(loaded.simulation.clock).toEqual({
      status: "paused",
      activeTick: 80,
    });
    expect(loaded.experience).toEqual(experience);
    const afterResume = agent.command(loaded.simulation, "RESUME_RUN");
    const completed = agent.finish(afterResume);
    expect(completed.clock.status).toBe("completed");
    resumed.update(completed);
    await resumed.flush();
    const saved = resumed.getSnapshot();
    await resumed.complete(
      buildCompletedRunSummary({
        simulation: saved.simulation,
        runId: saved.runId,
        revision: saved.revision,
        checksum: saved.checksum!,
        completedAt: "2026-10-22T12:00:00.000Z",
      }),
    );
    expect((await resumed.history()).completedRuns).toHaveLength(1);
    expect((await resumed.history()).personalBests).toHaveLength(5);

    const control = strategy(42, "revenue-first");
    let uninterrupted = control.initial;
    while (uninterrupted.clock.activeTick < 80)
      uninterrupted = control.step(uninterrupted);
    uninterrupted = control.command(uninterrupted, "PAUSE_RUN");
    uninterrupted = control.command(uninterrupted, "RESUME_RUN");
    expect(completed).toEqual(control.finish(uninterrupted));
  } finally {
    resumed.close();
  }
}, 30_000);
