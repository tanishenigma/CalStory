"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { Spinner } from "@/app/hooks/useAuthGuard";
import { useToast } from "@/app/components/ToastContainer";
import { calcTDEE } from "@/app/lib/tdee";
import { GOALS } from "@/app/lib/constants";
import { lbsToKg, ftInToCm } from "@/app/lib/units";
import { dobToAge, maxDobIso, minDobIso } from "@/app/lib/age";
import BlurFade from "@/app/components/animations/BlurFade";
import type {
  Gender,
  GoalKey,
  IntensityKey,
  WeightUnit,
  HeightUnit,
} from "@/app/types";

interface IntensityOption {
  key: IntensityKey;
  emoji: string;
  pct: string;
}

const INTENSITIES: IntensityOption[] = [
  { key: "mildCut", emoji: "🐢", pct: "9%" },
  { key: "weightloss", emoji: "🐇", pct: "19%" },
  { key: "extremeCut", emoji: "🐅", pct: "37%" },
];

function getIntensityLabel(
  key: string,
  goal: GoalKey | "",
): { label: string; desc: string } {
  if (goal === "bulk") {
    const map: Record<string, { label: string; desc: string }> = {
      mildCut: { label: "Mild Bulk", desc: "105% of TDEE — slow, clean gains" },
      weightloss: {
        label: "Weight Gain",
        desc: "110% of TDEE — steady muscle building",
      },
      extremeCut: {
        label: "Extreme Bulk",
        desc: "115% of TDEE — aggressive bulk",
      },
    };
    return map[key] ?? { label: key, desc: "" };
  }
  const map: Record<string, { label: string; desc: string }> = {
    mildCut: {
      label: "Mild Cut",
      desc: "91% of TDEE — gentle deficit, very sustainable",
    },
    weightloss: {
      label: "Weight Loss",
      desc: "81% of TDEE — standard deficit, balanced approach",
    },
    extremeCut: {
      label: "Extreme Cut",
      desc: "63% of TDEE — aggressive deficit, rapid results",
    },
  };
  return map[key] ?? { label: key, desc: "" };
}

interface FormState {
  name: string;
  dob: string;
  gender: Gender;
  weight: string;
  height: string;
  steps: string;
  workoutsPerWeek: string;
  goal: GoalKey | "";
  intensity: IntensityKey;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { state, setProfile } = useApp();
  const { user, loading } = useAuthStore();
  const toast = useToast();

  // Onboarding's own auth guard.
  //
  //   - signed-out users → /
  //   - signed-in users with a *complete* profile (onboardedAt set) → /dashboard
  //   - signed-in users with no profile OR an incomplete profile → stay on form
  //
  // The previous version of this effect redirected *every* signed-in user
  // straight to /dashboard, which produced a /dashboard ↔ /onboarding loop
  // for new users: the dashboard's `useAuthGuard` saw `profile === null`
  // and bounced them back here, while this page bounced them right back
  // again before they could ever fill in the form.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (state.profile && state.profile.onboardedAt) {
      router.replace("/dashboard");
    }
  }, [user, loading, state.profile, router]);

  const [step, setStep] = useState(1);
  const [name, setName] = useState<FormState["name"]>("");
  const [dob, setDob] = useState<FormState["dob"]>("");
  const [gender, setGender] = useState<FormState["gender"]>("male");
  const [weight, setWeight] = useState<FormState["weight"]>("");
  const [height, setHeight] = useState<FormState["height"]>("");
  const [steps, setSteps] = useState<FormState["steps"]>("7500");
  const [workoutsPerWeek, setWorkoutsPerWeek] =
    useState<FormState["workoutsPerWeek"]>("3");
  const [goal, setGoal] = useState<FormState["goal"]>("");
  const [intensity, setIntensity] =
    useState<FormState["intensity"]>("weightloss");

  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("metric");
  const [feet, setFeet] = useState<string>("");
  const [inches, setInches] = useState<string>("");

  // Show a spinner while auth or profile is still resolving, so we don't
  // briefly flash the form for users who are about to be redirected away.
  // Must come *after* all useState calls to satisfy the rules of hooks.
  if (loading || (user && state.profile === undefined)) {
    return <Spinner />;
  }

  function preview() {
    const wKg = weightUnit === "lbs" ? lbsToKg(Number(weight)) : Number(weight);
    const hCm =
      heightUnit === "imperial"
        ? ftInToCm(Number(feet), Number(inches))
        : Number(height);
    const ageNum = dobToAge(dob);
    if (!wKg || !hCm || ageNum === null || !steps) return null;
    return calcTDEE({
      gender,
      weight: wKg,
      height: hCm,
      age: ageNum,
      steps: Number(steps),
      workoutsPerWeek: Number(workoutsPerWeek),
      goal: (goal || "maintain") as GoalKey,
      intensity,
    });
  }

  function next() {
    if (step === 1 && !name.trim()) {
      toast("Enter your name", "⚠️");
      return;
    }
    if (step === 2) {
      const wKg =
        weightUnit === "lbs" ? lbsToKg(Number(weight)) : Number(weight);
      const hCm =
        heightUnit === "imperial"
          ? ftInToCm(Number(feet), Number(inches))
          : Number(height);
      if (dobToAge(dob) == null || !wKg || !hCm) {
        toast("Fill all fields correctly", "⚠️");
        return;
      }
    }
    if (step === 3 && !steps) {
      toast("Enter your average daily steps", "⚠️");
      return;
    }
    if (step === 4 && !goal) {
      toast("Pick your goal", "⚠️");
      return;
    }
    setStep((s) => Math.min(s + 1, 5));
  }

  async function finish() {
    const wKg = weightUnit === "lbs" ? lbsToKg(Number(weight)) : Number(weight);
    const hCm =
      heightUnit === "imperial"
        ? ftInToCm(Number(feet), Number(inches))
        : Number(height);
    const ageNum = dobToAge(dob) ?? 0;
    const calc = calcTDEE({
      gender,
      weight: wKg,
      height: hCm,
      age: ageNum,
      steps: Number(steps),
      workoutsPerWeek: Number(workoutsPerWeek),
      goal: goal as GoalKey,
      intensity,
    });
    await setProfile({
      name,
      age: ageNum,
      dob,
      gender,
      weight: wKg,
      height: hCm,
      steps: Number(steps),
      workoutsPerWeek: Number(workoutsPerWeek),
      goal: goal as GoalKey,
      intensity,
      ...calc,
      weightUnit,
      heightUnit,
      onboardedAt: Date.now(),
    });
    toast(`Welcome, ${name}! 🎉`);
    router.push("/dashboard");
  }

  const pv = step === 5 ? preview() : null;

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 bg-background"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        backgroundColor: "var(--background)",
      }}>
      <div
        className="p-6 sm:p-8 lg:p-10"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 12px 48px oklch(0 0 0 / 0.15)",
        }}>
        {/* Progress bars */}
        <div className="flex gap-1.5 mb-9">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex-1 h-[3px] rounded transition-colors duration-300 ${
                i <= step ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Name */}
        {step === 1 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-foreground">
              Hey there 👋
            </div>
            <div className="text-sm text-muted-foreground mb-7 leading-relaxed">
              Let's personalise your experience. What should we call you?
            </div>
            <div className="mb-6">
              <label
                className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5"
                htmlFor="ob-name">
                Your Name
              </label>
              <input
                id="ob-name"
                className="w-full px-3.5 py-3 text-foreground bg-background border border-border rounded-lg text-sm focus:border-foreground/50 outline-none transition-all"
                placeholder="e.g. david"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && next()}
              />
            </div>
            <button
              onClick={next}
              className="w-full py-3.5 bg-foreground text-background border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer">
              Continue
            </button>
          </BlurFade>
        )}

        {/* Step 2 — Body Stats */}
        {step === 2 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-foreground">
              Body Stats
            </div>
            <div className="text-sm text-muted-foreground mb-7 leading-relaxed">
              Used to calculate your TDEE using the Mifflin–St Jeor formula.
            </div>

            {/* Unit Preference Toggles */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5">
                  Weight Unit
                </label>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setWeightUnit("kg");
                      if (weight)
                        setWeight(
                          Math.round((Number(weight) / 2.20462) * 10) / 10 + "",
                        );
                    }}
                    className={`flex-1 py-2 text-xs font-semibold border-0 transition-colors cursor-pointer ${
                      weightUnit === "kg"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}>
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeightUnit("lbs");
                      if (weight)
                        setWeight(
                          Math.round(Number(weight) * 2.20462 * 10) / 10 + "",
                        );
                    }}
                    className={`flex-1 py-2 text-xs font-semibold border-0 transition-colors cursor-pointer ${
                      weightUnit === "lbs"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}>
                    lbs
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5">
                  Height Unit
                </label>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setHeightUnit("metric");
                      setHeight("");
                      setFeet("");
                      setInches("");
                    }}
                    className={`flex-1 py-2 text-xs font-semibold border-0 transition-colors cursor-pointer ${
                      heightUnit === "metric"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}>
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeightUnit("imperial");
                      setHeight("");
                      setFeet("");
                      setInches("");
                    }}
                    className={`flex-1 py-2 text-xs font-semibold border-0 transition-colors cursor-pointer ${
                      heightUnit === "imperial"
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}>
                    ft/in
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label
                  className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5"
                  htmlFor="ob-dob">
                  Date of Birth
                </label>
                <input
                  id="ob-dob"
                  type="date"
                  min={minDobIso()}
                  max={maxDobIso()}
                  className="w-full px-3.5 py-3 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  autoFocus
                />
                {dob && dobToAge(dob) != null && (
                  <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                    Age: {dobToAge(dob)} yrs
                  </div>
                )}
              </div>
              <div>
                <label
                  className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5"
                  htmlFor="ob-gender">
                  Gender
                </label>
                <div className="relative">
                  <select
                    id="ob-gender"
                    className="w-full px-3.5 py-3 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all appearance-none cursor-pointer"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label
                  className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5"
                  htmlFor="ob-wt">
                  Weight ({weightUnit})
                </label>
                <input
                  id="ob-wt"
                  type="number"
                  min="30"
                  max="700"
                  placeholder={weightUnit === "kg" ? "70" : "154"}
                  className="w-full px-3.5 py-3 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div>
                {heightUnit === "metric" ? (
                  <>
                    <label
                      className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5"
                      htmlFor="ob-ht">
                      Height (cm)
                    </label>
                    <input
                      id="ob-ht"
                      type="number"
                      min="100"
                      max="250"
                      placeholder="175"
                      className="w-full px-3.5 py-3 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5">
                      Height (ft/in)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        min="3"
                        max="8"
                        placeholder="5"
                        className="w-full px-3.5 py-3 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all"
                        value={feet}
                        onChange={(e) => setFeet(e.target.value)}
                        aria-label="Feet"
                      />
                      <input
                        type="number"
                        min="0"
                        max="11"
                        placeholder="9"
                        className="w-full px-3.5 py-3 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all"
                        value={inches}
                        onChange={(e) => setInches(e.target.value)}
                        aria-label="Inches"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={next}
              className="w-full py-3.5 bg-foreground text-background border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mb-2.5">
              Continue
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 border border-border text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}

        {/* Step 3 — Steps + Workouts */}
        {step === 3 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-foreground">
              Activity
            </div>
            <div className="text-sm text-muted-foreground mb-7 leading-relaxed">
              Steps and workouts give a more accurate TDEE than a simple
              activity dropdown.
            </div>

            <div className="mb-5">
              <label
                className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5"
                htmlFor="ob-steps">
                Average Daily Steps
              </label>
              <input
                id="ob-steps"
                type="number"
                min={0}
                max={50000}
                placeholder="7500"
                className="w-full px-3.5 py-3 rounded-lg text-sm outline-none transition-all border border-border bg-background text-foreground focus:bg-background/50 focus:border-foreground/50"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-3">
                Workouts per Week
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => setWorkoutsPerWeek(String(n))}
                    className={`py-3 rounded-full border-2 text-center text-sm font-bold transition-all cursor-pointer duration-300  ${
                      workoutsPerWeek === String(n)
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground border-border hover:border-foreground/50"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={next}
              className="w-full py-3.5 bg-foreground text-background border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mt-2 mb-2.5">
              Continue
            </button>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 border border-border text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}

        {/* Step 4 — Goal */}
        {step === 4 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-foreground">
              Your Goal
            </div>
            <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
              We'll adjust your calorie target accordingly.
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {GOALS.map(
                (g: {
                  key: GoalKey;
                  emoji: string;
                  label: string;
                  sub: string;
                }) => (
                  <button
                    key={g.key}
                    onClick={() => setGoal(g.key)}
                    className={`p-4 rounded-2xl text-center border-2 transition-all cursor-pointer ${
                      goal === g.key
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/50"
                    }`}>
                    <div className="text-[28px] mb-1.5">{g.emoji}</div>
                    <div className="text-[13px] font-bold">{g.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        goal === g.key
                          ? "text-background/60"
                          : "text-muted-foreground"
                      }`}>
                      {g.sub}
                    </div>
                  </button>
                ),
              )}
            </div>
            <button
              onClick={next}
              className="w-full py-3.5 bg-foreground text-background border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mb-2.5">
              Continue
            </button>
            <button
              onClick={() => setStep(3)}
              className="w-full py-3 border border-border text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}

        {/* Step 5 — Intensity + TDEE Preview */}
        {step === 5 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-foreground">
              {goal === "maintain"
                ? "⚖️ Maintenance"
                : goal === "cut"
                  ? "🔥 Cut Intensity"
                  : "💪 Bulk Intensity"}
            </div>
            <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {goal === "maintain"
                ? "You're maintaining — your calorie target matches your TDEE exactly."
                : "How fast do you want to progress? Pick your intensity."}
            </div>

            {goal !== "maintain" && (
              <div className="mb-6">
                {INTENSITIES.map((i) => (
                  <button
                    key={i.key}
                    onClick={() => setIntensity(i.key)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl mb-2 border-2 text-left transition-all cursor-pointer duration-300 ease-in-out ${
                      intensity === i.key
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/50"
                    }`}>
                    <div
                      className={`w-[42px] h-[42px] rounded-full flex-shrink-0 flex items-center justify-center text-lg ${
                        intensity === i.key ? "bg-background/20" : "bg-muted"
                      }`}>
                      {i.emoji}
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">
                        {getIntensityLabel(i.key, goal).label}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          intensity === i.key
                            ? "text-background/60"
                            : "text-muted-foreground"
                        }`}>
                        {getIntensityLabel(i.key, goal).desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* TDEE Preview */}
            {pv && (
              <div className="grid grid-cols-2 gap-2.5 p-5 bg-background rounded-[14px] mb-6">
                {(
                  [
                    ["Calorie Target", `${pv.calTarget} kcal`],
                    ["Protein", `${pv.protein}g`],
                    ["Carbs", `${pv.carbs}g`],
                    ["Fat", `${pv.fat}g`],
                  ] as [string, string][]
                ).map(([l, v]) => (
                  <div key={l} className="text-center">
                    <div className="font-mono text-xl font-medium">{v}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 font-semibold uppercase tracking-wider">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={finish}
              className="w-full py-3.5 bg-foreground text-background border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mb-2.5">
              Let's go 🚀
            </button>
            <button
              onClick={() => setStep(4)}
              className="w-full py-3 border border-border text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
