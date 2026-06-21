// filepath: app/lib/bulkMacros.test.ts
import { describe, it, expect } from "vitest";
import { calculateBulkMacros } from "./bulkMacros";

describe("Bulk Macro Calculator", () => {
  // --- PROTEIN TESTS ---
  describe("Protein Allocation", () => {
    it("should set protein to 2.2g/kg by default", () => {
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0.09,
      });
      expect(result.protein).toBe(174); // 79 * 2.2 = 173.8 → 174
    });

    it("should never drop protein below 2g/kg", () => {
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0.09,
        proteinPerKg: 1.5,
      });
      // floor is 2g/kg → 79 * 2 = 158
      expect(result.protein).toBeGreaterThanOrEqual(158);
    });

    it("should scale protein correctly for heavier user", () => {
      const result = calculateBulkMacros({
        weight: 100,
        tdee: 3800,
        surplus: 0.09,
      });
      expect(result.protein).toBe(220); // 100 * 2.2
    });

    it("should scale protein correctly for lighter user", () => {
      const result = calculateBulkMacros({
        weight: 60,
        tdee: 2500,
        surplus: 0.09,
      });
      expect(result.protein).toBe(132); // 60 * 2.2
    });
  });

  // --- FAT TESTS ---
  describe("Fat Allocation", () => {
    it("should set fat to 1g/kg of bodyweight", () => {
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0.09,
      });
      expect(result.fat).toBe(79);
    });

    it("should not drop fat below 0.8g/kg", () => {
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0.09,
        fatPerKg: 0.5,
      });
      // floor is 0.8g/kg → 79 * 0.8 = 63.2 → 63
      expect(result.fat).toBeGreaterThanOrEqual(63);
    });
  });

  // --- CARB TESTS ---
  describe("Carb Allocation (remainder)", () => {
    it("should allocate remaining calories to carbs", () => {
      // totalCals = 3168 * 1.09 = 3453
      // protein cals = 174 * 4 = 696
      // fat cals = 79 * 9 = 711
      // carb cals = 3453 - 696 - 711 = 2046 → 2046/4 = 511g
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0.09,
      });
      expect(result.carbs).toBe(511);
    });

    it("should never set carbs as primary macro over protein", () => {
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0.19,
      });
      const proteinCals = result.protein * 4;
      // protein floor respected
      expect(proteinCals).toBeGreaterThanOrEqual(79 * 2 * 4);
    });

    it("carbs should never go negative", () => {
      const result = calculateBulkMacros({
        weight: 150,
        tdee: 2000,
        surplus: 0.05,
      });
      expect(result.carbs).toBeGreaterThanOrEqual(0);
    });
  });

  // --- SURPLUS TESTS ---
  describe("Surplus / Calorie Target", () => {
    it("should default to mild bulk (+9%) if no surplus specified", () => {
      const result = calculateBulkMacros({ weight: 79, tdee: 3168 });
      expect(result.totalCalories).toBe(Math.round(3168 * 1.09));
    });

    it("should warn if surplus exceeds 10%", () => {
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0.19,
      });
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("fat gain risk");
    });

    it("should flag extreme bulk (+37%) as aggressive", () => {
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0.37,
      });
      expect(
        result.warnings.some((w) => w.toLowerCase().includes("aggressive")),
      ).toBe(true);
    });

    it("should correctly calculate total calories at each tier", () => {
      expect(
        calculateBulkMacros({ weight: 79, tdee: 3168, surplus: 0.09 })
          .totalCalories,
      ).toBe(3453);
      expect(
        calculateBulkMacros({ weight: 79, tdee: 3168, surplus: 0.19 })
          .totalCalories,
      ).toBe(3770);
      expect(
        calculateBulkMacros({ weight: 79, tdee: 3168, surplus: 0.37 })
          .totalCalories,
      ).toBe(4340);
    });
  });

  // --- MACRO SUM INTEGRITY ---
  describe("Macro Sum Integrity", () => {
    it("protein + carbs + fat calories should equal total calories (±5 rounding)", () => {
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0.09,
      });
      const sum = result.protein * 4 + result.carbs * 4 + result.fat * 9;
      expect(Math.abs(sum - result.totalCalories)).toBeLessThanOrEqual(5);
    });

    it("should hold macro integrity at all surplus tiers", () => {
      [0.09, 0.19, 0.37].forEach((surplus) => {
        const result = calculateBulkMacros({ weight: 79, tdee: 3168, surplus });
        const sum = result.protein * 4 + result.carbs * 4 + result.fat * 9;
        expect(Math.abs(sum - result.totalCalories)).toBeLessThanOrEqual(5);
      });
    });
  });

  // --- EDGE CASES ---
  describe("Edge Cases", () => {
    it("should handle very low TDEE gracefully", () => {
      const result = calculateBulkMacros({
        weight: 50,
        tdee: 1500,
        surplus: 0.09,
      });
      expect(result.carbs).toBeGreaterThanOrEqual(0);
      expect(result.protein).toBeGreaterThanOrEqual(100); // 50 * 2g/kg
    });

    it("should handle zero surplus (maintenance) without crashing", () => {
      const result = calculateBulkMacros({
        weight: 79,
        tdee: 3168,
        surplus: 0,
      });
      expect(result.totalCalories).toBe(3168);
    });

    it("should throw if weight is 0 or negative", () => {
      expect(() =>
        calculateBulkMacros({ weight: 0, tdee: 3168, surplus: 0.09 }),
      ).toThrow();
      expect(() =>
        calculateBulkMacros({ weight: -10, tdee: 3168, surplus: 0.09 }),
      ).toThrow();
    });

    it("should throw if TDEE is 0 or negative", () => {
      expect(() =>
        calculateBulkMacros({ weight: 79, tdee: 0, surplus: 0.09 }),
      ).toThrow();
    });
  });
});
