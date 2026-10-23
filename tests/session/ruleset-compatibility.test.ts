import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { createFreshGameState } from "../../shared/game/factory";
import { applyExperienceCommand, createFreshExperienceState } from "../../shared/experience/schemas";
import { GameRepository, checksumPayload, snapshotPayload } from "../../client/src/lib/persistence/repository";

describe("versioned Release A and B persistence", () => {
  it.each(["release-a.1", "release-b.1"] as const)("preserves %s state and checksum on reload", async (ruleset) => {
    const factory = new IDBFactory();
    const repository = await GameRepository.open({ factory });
    const state = createFreshGameState({ ruleset, seed: 42 });
    const payload = snapshotPayload("11111111-1111-4111-8111-111111111111", 0, state, createFreshExperienceState());
    expect(payload.rulesetVersion).toBe(ruleset);
    const checksum = await checksumPayload(payload);
    expect(await checksumPayload(structuredClone(payload))).toBe(checksum);
    const lease = await repository.acquireWriter("compatibility-test");
    await repository.save(payload, lease);
    repository.close();
    const reopened = await GameRepository.open({ factory });
    const loaded = await reopened.loadActive();
    expect(loaded.kind).toBe("ready");
    if (loaded.kind === "ready" || loaded.kind === "recovered") {
      expect(loaded.snapshot.simulation).toEqual(state);
      expect(loaded.snapshot.checksum).toBe(checksum);
    }
    reopened.close();
  });

  it("rejects disagreement between snapshot header and simulation version", async () => {
    const payload = snapshotPayload("11111111-1111-4111-8111-111111111111", 0,
      createFreshGameState({ ruleset: "release-a.1", seed: 1 }), createFreshExperienceState());
    await expect(checksumPayload({ ...payload, rulesetVersion: "release-b.1" })).rejects.toThrow(/ruleset must match/);
  });

  it("dismisses the welcome without completing practice and retains legacy tabs", () => {
    const initial = createFreshExperienceState();
    const dismissed = applyExperienceCommand(initial, { experienceSchemaVersion: 1, type: "DISMISS_WELCOME", payload: {} });
    expect(initial.tutorial.hasShownWelcome).toBe(false);
    expect(dismissed.tutorial.hasShownWelcome).toBe(true);
    expect(dismissed.onboardingStatus).toBe("active");
    for (const tab of ["journey", "progression", "breakthroughs"] as const) {
      expect(applyExperienceCommand(dismissed, { experienceSchemaVersion: 1, type: "SET_ACTIVE_TAB", payload: { tab } }).lastActiveTab).toBe(tab);
    }
  });
});
