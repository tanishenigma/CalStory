/**
 * Reference-value tests for the Calorie Calculator's pure-math
 * core (`bmr.ts`). Vitest is configured to scan both
 * `app/lib/**` and `app/tools/**` — see `vitest.config.ts`.
 */

import { describe, it, expect } from "vitest";
import {
  mifflinStJeor,
  revisedHarrisBenedict,
  katchMcArdle,
  tdeeFromBmr,
  calorieTarget,
  kcalToKj,
  kjToKcal,
  computeBmr,
  clampAge,
  clampBodyFat,
  ACTIVITY_MULTIPLIERS,
  CALORIE_TARGETS,
} from "./bmr";

describe("Mifflin-St Jeor", () => {
  it("matches published value for 30y male, 80kg, 180cm", () => {
    // 10·80 + 6.25·180 − 5·30 + 5 = 800 + 1125 − 150 + 5 = 1780
    expect(
      mifflinStJeor({ sex: "male", weightKg: 80, heightCm: 180, age: 30 }),
    ).toBeCloseTo(1780, 0);
  });

  it("matches published value for 30y female, 65kg, 165cm", () => {
    // 10·65 + 6.25·165 − 5·30 − 161 = 650 + 1031.25 − 150 − 161 = 1370.25
    expect(
      mifflinStJeor({ sex: "female", weightKg: 65, heightCm: 165, age: 30 }),
    ).toBeCloseTo(1370.25, 1);
  });
});

describe("Revised Harris-Benedict", () => {
  it("matches published value for 30y male, 80kg, 180cm", () => {
    // 88.362 + 13.397·80 + 4.799·180 − 5.677·30
    // = 88.362 + 1071.76 + 863.82 − 170.31 = 1853.632
    expect(
      revisedHarrisBenedict({
        sex: "male",
        weightKg: 80,
        heightCm: 180,
        age: 30,
      }),
    ).toBeCloseTo(1853.63, 1);
  });

  it("matches published value for 30y female, 65kg, 165cm", () => {
    // 447.593 + 9.247·65 + 3.098·165 − 4.33·30
    // = 447.593 + 601.055 + 511.17 − 129.9 = 1429.918
    expect(
      revisedHarrisBenedict({
        sex: "female",
        weightKg: 65,
        heightCm: 165,
        age: 30,
      }),
    ).toBeCloseTo(1429.92, 1);
  });
});

describe("Katch-McArdle", () => {
  it("matches published value for 80kg @ 15% body fat", () => {
    // 370 + 21.6 · (80 · 0.85) = 370 + 21.6 · 68 = 370 + 1468.8 = 1838.8
    expect(katchMcArdle({ weightKg: 80, bodyFatPct: 15 })).toBeCloseTo(
      1838.8,
      1,
    );
  });

  it("is zero-fat-mass-tolerant (pure lean mass)", () => {
    // 370 + 21.6 · 0 = 370
    expect(katchMcArdle({ weightKg: 80, bodyFatPct: 100 })).toBeCloseTo(370, 1);
  });
});

describe("TDEE multiplier", () => {
  it("applies the right factor per activity level", () => {
    const bmr = 1780;
    expect(tdeeFromBmr(bmr, "sedentary")).toBe(
      Math.round(bmr * ACTIVITY_MULTIPLIERS.sedentary),
    );
    expect(tdeeFromBmr(bmr, "moderate")).toBe(
      Math.round(bmr * ACTIVITY_MULTIPLIERS.moderate),
    );
    expect(tdeeFromBmr(bmr, "very")).toBe(
      Math.round(bmr * ACTIVITY_MULTIPLIERS.very),
    );
  });
});

describe("Calorie targets", () => {
  it("returns the maintenance number unchanged", () => {
    expect(calorieTarget(2200, "maintenance")).toBe(2200);
  });

  it("subtracts 250 / 500 for cuts and adds the same for bulks", () => {
    expect(calorieTarget(2200, "mildCut")).toBe(2200 - 250);
    expect(calorieTarget(2200, "standardCut")).toBe(2200 - 500);
    expect(calorieTarget(2200, "mildBulk")).toBe(2200 + 250);
    expect(calorieTarget(2200, "standardBulk")).toBe(2200 + 500);
  });

  it("clamps to zero (never returns a negative calorie budget)", () => {
    expect(calorieTarget(200, "standardCut")).toBe(0);
  });

  it("exports the expected cut/bulk bands (250 / 500)", () => {
    // Pin the literal band so a future tuning doesn't silently
    // shift the on-page numbers away from the published prompt.
    expect(CALORIE_TARGETS.mildCut).toBe(-250);
    expect(CALORIE_TARGETS.standardCut).toBe(-500);
    expect(CALORIE_TARGETS.mildBulk).toBe(250);
    expect(CALORIE_TARGETS.standardBulk).toBe(500);
  });
});

describe("kcal ↔ kJ", () => {
  it("round-trips losslessly", () => {
    for (const v of [0, 100, 500, 1500, 2000, 3500]) {
      expect(kjToKcal(kcalToKj(v))).toBeCloseTo(v, -1); // ±10 kcal
    }
  });

  it("matches the canonical 1 kcal = 4.184 kJ conversion", () => {
    expect(kcalToKj(1)).toBe(4);
    expect(kcalToKj(1000)).toBe(4184);
  });
});

describe("computeBmr dispatcher", () => {
  const base = {
    sex: "male" as const,
    weightKg: 80,
    heightCm: 180,
    age: 30,
  };

  it("dispatches Mifflin-St Jeor", () => {
    expect(computeBmr({ ...base, formula: "mifflin" })).toBe(1780);
  });

  it("dispatches Revised Harris-Benedict", () => {
    expect(computeBmr({ ...base, formula: "harris" })).toBe(1854);
  });

  it("dispatches Katch-McArdle with body-fat clamped", () => {
    expect(computeBmr({ ...base, formula: "katch", bodyFatPct: 15 })).toBe(
      1839,
    );
  });
});

describe("Input clamps", () => {
  it("clamps age to [15, 80]", () => {
    expect(clampAge(10)).toBe(15);
    expect(clampAge(40)).toBe(40);
    expect(clampAge(120)).toBe(80);
    expect(clampAge(Number.NaN)).toBe(15);
  });

  it("clamps body-fat to [5, 50]", () => {
    expect(clampBodyFat(0)).toBe(5);
    expect(clampBodyFat(20)).toBe(20);
    expect(clampBodyFat(80)).toBe(50);
  });
});
