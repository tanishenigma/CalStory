"use client";

/**
 * CalorieCalculator — pure-client island for the public
 * `/tools/calorie-calculator` page.
 *
 * Owns its own form state, recomputes BMR / TDEE / target on
 * every input change, and renders the results panel with a
 * kcal/kJ toggle. No Firebase, no auth, no `useApp()` — must
 * render identically for signed-out and signed-in users.
 *
 * Math comes from `./bmr` (pure functions, unit-tested). Unit
 * conversion comes from `./units` (re-exports + kcal↔kJ).
 *
 * Visual tokens (colors, fonts, spacing) come from Tailwind v4
 * via the global `@theme` block in `app/globals.css` so the
 * widget matches the rest of the CalStory dark surface.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ACTIVITY_LABELS,
  ACTIVITY_MULTIPLIERS,
  AGE_MAX,
  AGE_MIN,
  BODY_FAT_MAX,
  BODY_FAT_MIN,
  FORMULA_LABELS,
  clampAge,
  clampBodyFat,
  computeBmr,
  tdeeFromBmr,
  calorieTarget,
  type ActivityKey,
  type CalorieTargetKey,
  type FormulaKey,
  type Sex,
} from "./bmr";
import { kgToLbs, lbsToKg, ftInToCm, cmToFtInParts } from "./units";
import styles from "./CalorieCalculator.module.css";

type UnitSystem = "us" | "metric";
type EnergyUnit = "kcal" | "kj";

/** Result row: a label, a value, and an optional colour band so
 *  cuts (red), maintenance (neutral), and bulks (green) read at
 *  a glance. */
type ResultRow = {
  key: CalorieTargetKey;
  label: string;
  sub: string;
  tone: "cut" | "maintain" | "bulk";
};

const RESULTS: ResultRow[] = [
  {
    key: "standardCut",
    label: "Standard cut",
    sub: "−500 kcal · ~1 lb/week",
    tone: "cut",
  },
  {
    key: "mildCut",
    label: "Mild cut",
    sub: "−250 kcal · ~0.5 lb/week",
    tone: "cut",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    sub: "TDEE · hold weight",
    tone: "maintain",
  },
  {
    key: "mildBulk",
    label: "Mild bulk",
    sub: "+250 kcal · ~0.5 lb/week",
    tone: "bulk",
  },
  {
    key: "standardBulk",
    label: "Standard bulk",
    sub: "+500 kcal · ~1 lb/week",
    tone: "bulk",
  },
];

/** Default starting inputs — a 25-year-old, 70 kg / 175 cm,
 *  moderately-active male. Picked so the page has interesting
 *  numbers visible on first paint without the visitor having to
 *  touch anything. */
const DEFAULTS = {
  age: 25,
  sex: "male" as Sex,
  weightKg: 70,
  heightCm: 175,
  bodyFatPct: 18,
  activity: "moderate" as ActivityKey,
  formula: "mifflin" as FormulaKey,
  units: "metric" as UnitSystem,
  energy: "kcal" as EnergyUnit,
};

export default function CalorieCalculator() {
  /* ── Form state ───────────────────────────────────────── */
  const [age, setAge] = useState<number>(DEFAULTS.age);
  const [sex, setSex] = useState<Sex>(DEFAULTS.sex);
  const [weightKg, setWeightKg] = useState<number>(DEFAULTS.weightKg);
  const [heightCm, setHeightCm] = useState<number>(DEFAULTS.heightCm);
  const [bodyFatPct, setBodyFatPct] = useState<number>(DEFAULTS.bodyFatPct);
  const [activity, setActivity] = useState<ActivityKey>(DEFAULTS.activity);
  const [formula, setFormula] = useState<FormulaKey>(DEFAULTS.formula);
  const [units, setUnits] = useState<UnitSystem>(DEFAULTS.units);
  const [energy, setEnergy] = useState<EnergyUnit>(DEFAULTS.energy);

  /* ── Derived display values (US height split) ─────────── */
  const { feet, inches } = useMemo(() => cmToFtInParts(heightCm), [heightCm]);
  const [feetIn, setFeetIn] = useState<number>(feet);
  const [inchesIn, setInchesIn] = useState<number>(inches);

  const [weightLbs, setWeightLbs] = useState<number>(
    Math.round(kgToLbs(weightKg) * 10) / 10,
  );

  /* ── Compute BMR / TDEE live ──────────────────────────── */
  const { bmr, tdee, targets, valid, message } = useMemo(() => {
    if (
      !Number.isFinite(age) ||
      !Number.isFinite(weightKg) ||
      !Number.isFinite(heightCm) ||
      age < AGE_MIN ||
      age > AGE_MAX ||
      weightKg <= 0 ||
      heightCm <= 0
    ) {
      return {
        bmr: 0,
        tdee: 0,
        targets: {} as Record<CalorieTargetKey, number>,
        valid: false,
        message:
          age < AGE_MIN || age > AGE_MAX
            ? `Age must be between ${AGE_MIN} and ${AGE_MAX}.`
            : "Enter your stats above to see your daily calorie targets.",
      };
    }
    const safeBodyFat =
      formula === "katch"
        ? clampBodyFat(Number.isFinite(bodyFatPct) ? bodyFatPct : 20)
        : 20;
    const safeAge = clampAge(age);
    const bmrValue = computeBmr({
      formula,
      sex,
      weightKg,
      heightCm,
      age: safeAge,
      bodyFatPct: safeBodyFat,
    });
    const tdeeValue = tdeeFromBmr(bmrValue, activity);
    const targetsValue: Record<CalorieTargetKey, number> = {
      maintenance: calorieTarget(tdeeValue, "maintenance"),
      mildCut: calorieTarget(tdeeValue, "mildCut"),
      standardCut: calorieTarget(tdeeValue, "standardCut"),
      mildBulk: calorieTarget(tdeeValue, "mildBulk"),
      standardBulk: calorieTarget(tdeeValue, "standardBulk"),
    };
    return {
      bmr: bmrValue,
      tdee: tdeeValue,
      targets: targetsValue,
      valid: true,
      message: "",
    };
  }, [age, sex, weightKg, heightCm, bodyFatPct, activity, formula]);

  /* ── Handlers: keep US / Metric state in sync ──────────── */
  const handleWeightKg = (v: number) => {
    setWeightKg(v);
    setWeightLbs(Math.round(kgToLbs(v) * 10) / 10);
  };
  const handleWeightLbs = (v: number) => {
    setWeightLbs(v);
    setWeightKg(Math.round(lbsToKg(v) * 10) / 10);
  };
  const handleHeightCm = (v: number) => {
    setHeightCm(v);
    const parts = cmToFtInParts(v);
    setFeetIn(parts.feet);
    setInchesIn(parts.inches);
  };
  const handleFt = (ft: number, in_: number) => {
    setFeetIn(ft);
    setInchesIn(in_);
    const cm = ftInToCm(ft, in_);
    setHeightCm(cm);
  };

  return (
    <section
      aria-label="Daily calorie calculator"
      className={`card ${styles.wrapper}`}>
      <div className={styles.grid}>
        {/* ───── Inputs (left column on desktop) ───── */}
        <div className={styles.inputs}>
          <header className={styles.header}>
            <h2 className="card-title">Daily calorie calculator</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your stats — your maintenance calories plus four cut / bulk
              targets update instantly.
            </p>
          </header>

          {/* Unit system toggle */}
          <FieldGroup label="Units" htmlFor="cc-units">
            <SegmentedToggle<UnitSystem>
              id="cc-units"
              value={units}
              onChange={setUnits}
              options={[
                { value: "us", label: "US (lbs, ft/in)" },
                { value: "metric", label: "Metric (kg, cm)" },
              ]}
            />
          </FieldGroup>

          {/* Sex + Age row */}
          <div className={styles.row2}>
            <FieldGroup label="Sex" htmlFor="cc-sex">
              <SegmentedToggle<Sex>
                id="cc-sex"
                value={sex}
                onChange={setSex}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />
            </FieldGroup>
            <FieldGroup label={`Age (${AGE_MIN}–${AGE_MAX})`} htmlFor="cc-age">
              <AgeSelect
                id="cc-age"
                value={age}
                min={AGE_MIN}
                max={AGE_MAX}
                onChange={(v) => setAge(clampAge(v))}
              />
            </FieldGroup>
          </div>

          {/* Height + Weight */}
          <div className={styles.row2}>
            <FieldGroup label="Height" htmlFor="cc-height">
              {units === "metric" ? (
                <NumberInput
                  id="cc-height"
                  value={heightCm}
                  min={100}
                  max={230}
                  step={1}
                  suffix="cm"
                  onChange={handleHeightCm}
                />
              ) : (
                <div className={styles.impHeight}>
                  <NumberInput
                    id="cc-ft"
                    aria-label="Feet"
                    value={feetIn}
                    min={3}
                    max={8}
                    step={1}
                    suffix="ft"
                    onChange={(v) => handleFt(v, inchesIn)}
                  />
                  <NumberInput
                    id="cc-in"
                    aria-label="Inches"
                    value={inchesIn}
                    min={0}
                    max={11.9}
                    step={0.5}
                    suffix="in"
                    onChange={(v) => handleFt(feetIn, v)}
                  />
                </div>
              )}
            </FieldGroup>
            <FieldGroup label="Weight" htmlFor="cc-weight">
              {units === "metric" ? (
                <NumberInput
                  id="cc-weight"
                  value={weightKg}
                  min={30}
                  max={250}
                  step={0.1}
                  suffix="kg"
                  onChange={handleWeightKg}
                />
              ) : (
                <NumberInput
                  id="cc-weight"
                  value={weightLbs}
                  min={66}
                  max={550}
                  step={0.1}
                  suffix="lbs"
                  onChange={handleWeightLbs}
                />
              )}
            </FieldGroup>
          </div>

          {/* Activity */}
          <FieldGroup label="Activity level" htmlFor="cc-activity">
            <select
              id="cc-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityKey)}
              className={styles.select}>
              {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label} — {v.sub}
                </option>
              ))}
            </select>
            <p className={styles.helper}>
              Multiplier: ×{ACTIVITY_MULTIPLIERS[activity].toFixed(3)}
            </p>
          </FieldGroup>

          {/* Formula + (conditional) body-fat */}
          <FieldGroup label="BMR formula" htmlFor="cc-formula">
            <SegmentedToggle<FormulaKey>
              id="cc-formula"
              value={formula}
              onChange={setFormula}
              options={[
                { value: "mifflin", label: FORMULA_LABELS.mifflin },
                { value: "harris", label: FORMULA_LABELS.harris },
                { value: "katch", label: FORMULA_LABELS.katch },
              ]}
            />
            {formula === "katch" && (
              <div className={styles.bodyFatRow}>
                <label
                  htmlFor="cc-bf"
                  className="text-xs font-medium text-muted-foreground">
                  Body-fat %
                </label>
                <div className={styles.bodyFatInputWrap}>
                  <NumberInput
                    id="cc-bf"
                    value={bodyFatPct}
                    min={BODY_FAT_MIN}
                    max={BODY_FAT_MAX}
                    step={0.5}
                    suffix="%"
                    onChange={(v) => setBodyFatPct(clampBodyFat(v))}
                  />
                </div>
              </div>
            )}
            <p className={styles.helper}>
              {formula === "mifflin" &&
                "Mifflin-St Jeor — modern default, ±10% for most adults."}
              {formula === "harris" &&
                "Revised Harris-Benedict — legacy clinical default; tends to run ~5% high."}
              {formula === "katch" &&
                "Katch-McArdle — most accurate when body-fat % is measured."}
            </p>
          </FieldGroup>

          {/* Energy unit toggle */}
          <FieldGroup label="Results unit" htmlFor="cc-energy">
            <SegmentedToggle<EnergyUnit>
              id="cc-energy"
              value={energy}
              onChange={setEnergy}
              options={[
                { value: "kcal", label: "Calories (kcal)" },
                { value: "kj", label: "Kilojoules (kJ)" },
              ]}
            />
          </FieldGroup>
        </div>

        {/* ───── Results (right column on desktop) ───── */}
        <aside className={styles.results} aria-live="polite">
          <div className={styles.resultsInner}>
            <div className={styles.resultsHead}>
              <span className="text-xs font-mono tracking-widest uppercase text-primary/70">
                Your results
              </span>
              <p className="text-sm text-muted-foreground mt-1">
                {valid
                  ? `Based on ${FORMULA_LABELS[formula]} × ${ACTIVITY_LABELS[activity].label.toLowerCase()} activity.`
                  : message}
              </p>
            </div>

            {/* BMR + TDEE summary */}
            <div className={styles.summaryRow}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>BMR</div>
                <div className={styles.summaryValue}>
                  {valid ? formatEnergy(bmr, energy) : "—"}
                </div>
                <div className={styles.summarySub}>at rest</div>
              </div>
              <div className={`${styles.summaryCard} ${styles.summaryAccent}`}>
                <div className={styles.summaryLabel}>TDEE</div>
                <div className={styles.summaryValue}>
                  {valid ? formatEnergy(tdee, energy) : "—"}
                </div>
                <div className={styles.summarySub}>maintenance</div>
              </div>
            </div>

            {/* Five target rows */}
            <ul className={styles.targetList}>
              {RESULTS.map((row) => (
                <li key={row.key} className={styles.targetRow}>
                  <div>
                    <div
                      className={`${styles.targetLabel} ${styles[`tone_${row.tone}`]}`}>
                      {row.label}
                    </div>
                    <div className={styles.targetSub}>{row.sub}</div>
                  </div>
                  <div
                    className={`${styles.targetValue} ${styles[`tone_${row.tone}`]}`}>
                    {valid ? formatEnergy(targets[row.key], energy) : "—"}
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA — subtle footer link */}
            <div className={styles.ctaSubtle}>
              <span className="text-xs text-muted-foreground">
                Want CalStory to track this automatically and adjust as your
                weight changes?
              </span>
              <Link href="/dashboard" className={styles.ctaLink}>
                Try CalStory free →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Local sub-components — keep them in this file because they
 * are not reused elsewhere and shipping them as separate
 * components adds import noise without any payoff.
 * ───────────────────────────────────────────────────────────── */

/** A labeled form field group. */
function FieldGroup({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor} className={styles.fieldLabel}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Custom styled select dropdown for age (all ages from 15-80). */
function AgeSelect({
  id,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const ages = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className={styles.ageSelect}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        className={styles.ageSelectEl}>
        {ages.map((age) => (
          <option key={age} value={age}>
            {age}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Numeric input with an optional unit suffix. */
function NumberInput({
  id,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
  ...rest
}: {
  id: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
  "aria-label"?: string;
}) {
  return (
    <div className={styles.numberInput}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number.parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? v : Number.NaN);
        }}
        className={styles.numberInputEl}
        aria-label={rest["aria-label"]}
      />
      {suffix && (
        <span aria-hidden="true" className={styles.numberInputSuffix}>
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Two / three / four-way button-group toggle (radio-style).
 *  Keyboard-navigable via the native button + arrow pattern
 *  would be a nice-to-have, but the native <select> on the
 *  activity row already covers keyboard users for the most
 *  complex control. These toggles are short (≤4 options) so the
 *  Tab + click pattern is fine. */
function SegmentedToggle<T extends string>({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <div role="radiogroup" id={id} className={styles.segmented}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            type="button"
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`${styles.segmentedBtn} ${active ? styles.segmentedBtnActive : ""}`}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────── */

/** Format a kcal number for display in the user's chosen energy
 *  unit. kcal → integer; kJ → kcal × 4.184, rounded. */
function formatEnergy(kcal: number, unit: EnergyUnit): string {
  if (!Number.isFinite(kcal)) return "—";
  if (unit === "kj") {
    return `${Math.round(kcal * 4.184).toLocaleString()} kJ`;
  }
  return `${Math.round(kcal).toLocaleString()} kcal`;
}

/* Re-export type aliases so page.tsx can import the public type
 * surface from one place if it ever needs to. (Keeps the import
 * surface for downstream consumers narrow — they import
 * `CalorieCalculator` only.) */
export type { Sex, ActivityKey, FormulaKey, UnitSystem, EnergyUnit };
