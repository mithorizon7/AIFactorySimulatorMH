import { describe, expect, it } from "vitest";
import { Era } from "@shared/game/domain/era";
import { createFreshGameState } from "@shared/game/factory";
import { RULESET_VERSION } from "@shared/version";
import {
  CONTENT_REVIEW_DATE,
  SIMULATION_DISCLAIMER,
  breakthroughLearning,
  breakthroughLearningSchema,
  eraLearning,
  eraLearningSchema,
  learningClaimSchema,
  learningSources,
  resourceLearning,
  sourceTitle,
} from "@/lib/learningContent";
import {
  enablingInputs,
  eraEducationalContent,
  resourceDefinitions,
  synergyEffects,
} from "@/lib/educationalContent";
import {
  narrative,
  narrativeLearning,
  tutorialContent,
  tutorialLearning,
} from "@/lib/narrativeContent";

const claims = [
  ...Object.values(eraLearning).map((entry) => entry.lesson),
  ...Object.values(breakthroughLearning).map((entry) => entry.lesson),
  ...Object.values(resourceLearning),
  ...Object.values(enablingInputs).map((entry) => entry.lesson),
  ...Object.values(synergyEffects).map((entry) => entry.lesson),
  ...Object.values(narrativeLearning),
  ...Object.values(tutorialLearning),
];

describe("reviewed learning content", () => {
  it("runtime-validates every claim, with unique IDs and registered primary sources", () => {
    const sourceUrls = new Set(
      Object.values(learningSources).map((source) => source.url),
    );
    expect(new Set(claims.map((claim) => claim.id)).size).toBe(claims.length);
    for (const claim of claims) {
      expect(learningClaimSchema.parse(claim)).toEqual(claim);
      expect(claim.reviewedAt).toBe(CONTENT_REVIEW_DATE);
      expect(claim.uncertaintyLabel.length).toBeGreaterThan(10);
      for (const url of claim.sourceUrls) {
        expect(
          sourceUrls.has(
            url as (typeof learningSources)[keyof typeof learningSources]["url"],
          ),
        ).toBe(true);
        expect(sourceTitle(url)).not.toBe("Primary source");
      }
    }
  });

  it("rejects unsupported metadata, review dates, and invented mechanic links", () => {
    const claim = resourceLearning.compute;
    expect(() =>
      learningClaimSchema.parse({ ...claim, extra: true }),
    ).toThrow();
    expect(() =>
      learningClaimSchema.parse({ ...claim, reviewedAt: "2025-01-01" }),
    ).toThrow();
    expect(() =>
      learningClaimSchema.parse({ ...claim, linkedMechanics: ["MAKE_AGI"] }),
    ).toThrow();
    expect(() =>
      learningClaimSchema.parse({ ...claim, linkedMechanics: [] }),
    ).toThrow();
    expect(() =>
      learningClaimSchema.parse({ ...claim, uncertaintyLabel: "" }),
    ).toThrow();
    expect(() =>
      learningClaimSchema.parse({
        ...claim,
        sourceUrls: ["http://example.com"],
      }),
    ).toThrow();
  });

  it.each(["historical", "current"])(
    "requires a source for %s claims",
    (claimType) => {
      expect(() =>
        learningClaimSchema.parse({
          ...resourceLearning.compute,
          claimType,
          sourceUrls: [],
        }),
      ).toThrow(/primary source/);
    },
  );

  it("covers all eras with distinct strategic questions and explicitly speculative later eras", () => {
    expect(Object.keys(eraLearning).sort()).toEqual(Object.values(Era).sort());
    expect(
      new Set(Object.values(eraLearning).map((entry) => entry.tension)).size,
    ).toBe(6);
    expect(
      new Set(Object.values(eraLearning).map((entry) => entry.reflection)).size,
    ).toBe(6);
    for (const entry of Object.values(eraLearning)) {
      expect(eraLearningSchema.parse(entry)).toEqual(entry);
      expect(entry.reflection.endsWith("?")).toBe(true);
    }
    for (const era of [Era.GNT5, Era.GNT6, Era.GNT7]) {
      expect(eraLearning[era].lesson.claimType).toBe("speculative");
      expect(eraLearning[era].lesson.uncertaintyLabel).toMatch(
        /not a forecast/,
      );
      expect(() =>
        eraLearningSchema.parse({
          ...eraLearning[era],
          lesson: { ...eraLearning[era].lesson, claimType: "simulation" },
        }),
      ).toThrow(/must be labeled speculative/);
    }
    expect(eraLearning[Era.GNT2].tension).toMatch(/seed capital/);
    expect(eraLearning[Era.GNT3].tension).toMatch(/Monetization/);
    expect(eraLearning[Era.GNT4].tension).toMatch(/overload.*churn/);
    expect(eraLearning[Era.GNT5].tension).toMatch(/data and algorithms/);
    expect(eraLearning[Era.GNT6].tension).toMatch(
      /governance, redundancy, and recovery/,
    );
  });

  it("covers every current breakthrough without treating future scenarios as demonstrated facts", () => {
    const state = createFreshGameState({ ruleset: RULESET_VERSION, seed: 1 });
    expect(Object.keys(breakthroughLearning)).toHaveLength(
      state.breakthroughs.length,
    );
    for (const item of state.breakthroughs) {
      const entry = breakthroughLearning[item.id];
      expect(entry.id).toBe(item.id);
      expect(entry.title).toBe(item.name);
      expect(breakthroughLearningSchema.parse(entry)).toEqual(entry);
      if ([Era.GNT5, Era.GNT6, Era.GNT7].includes(item.era)) {
        expect(entry.lesson.claimType).toBe("speculative");
      }
    }
  });

  it("retains legacy tooltip shape with reviewed lesson data", () => {
    const entries = [
      ...Object.values(resourceDefinitions),
      ...Object.values(enablingInputs),
      ...Object.values(eraEducationalContent),
      ...Object.values(synergyEffects),
    ];
    for (const entry of entries) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.description).toBe(entry.lesson.text);
      expect(learningClaimSchema.parse(entry.lesson)).toEqual(entry.lesson);
    }
  });

  it("labels legacy Spark guidance as simulation-only and removes false historical authority", () => {
    expect(Object.keys(narrativeLearning)).toEqual(Object.keys(narrative));
    for (const claim of Object.values(narrativeLearning)) {
      expect(claim.claimType).toBe("simulation");
      expect(claim.sourceUrls).toEqual([]);
      expect(claim.uncertaintyLabel).toMatch(/not real-world evidence/);
    }
    const copy = JSON.stringify({ narrative, tutorialContent });
    expect(copy).not.toMatch(
      /\$100M|\$100 million|world's first AGI|like an IQ|human-level performance across ALL|established 'scaling laws'/,
    );
    expect(SIMULATION_DISCLAIMER).toMatch(/not a forecast/);
    expect(SIMULATION_DISCLAIMER).toMatch(/synthetic game measure/);
    expect(SIMULATION_DISCLAIMER).toMatch(
      /GNT-5 through GNT-7 are speculative/,
    );
  });
});
