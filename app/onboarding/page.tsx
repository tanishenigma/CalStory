"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { useToast } from "@/app/components/ToastContainer";
import { calcTDEE } from "@/app/lib/tdee";
import { GOALS } from "@/app/lib/constants";
import { lbsToKg, ftInToCm } from "@/app/lib/units";
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
  label: string;
  desc: string;
}

const INTENSITIES: IntensityOption[] = [
  {
    key: "slow",
    emoji: "🐢",
    label: "Slow",
    desc: "±150 kcal — sustainable, easy to stick to",
  },
  {
    key: "moderate",
    emoji: "🚶",
    label: "Moderate",
    desc: "±300 kcal — balanced, recommended for most",
  },
  {
    key: "aggressive",
    emoji: "🔥",
    label: "Aggressive",
    desc: "±500 kcal — fast results, high discipline required",
  },
];

interface FormState {
  name: string;
  age: string;
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

  useEffect(() => {
    if (!loading && !user) router.replace("/");
    if (!loading && user && state.profile) router.replace("/dashboard");
  }, [state.profile, user, loading, router]);

  const [step, setStep] = useState(1);
  const [name, setName] = useState<FormState["name"]>("");
  const [age, setAge] = useState<FormState["age"]>("");
  const [gender, setGender] = useState<FormState["gender"]>("male");
  const [weight, setWeight] = useState<FormState["weight"]>("");
  const [height, setHeight] = useState<FormState["height"]>("");
  const [steps, setSteps] = useState<FormState["steps"]>("7500");
  const [workoutsPerWeek, setWorkoutsPerWeek] =
    useState<FormState["workoutsPerWeek"]>("3");
  const [goal, setGoal] = useState<FormState["goal"]>("");
  const [intensity, setIntensity] =
    useState<FormState["intensity"]>("moderate");

  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("metric");
  const [feet, setFeet] = useState<string>("");
  const [inches, setInches] = useState<string>("");

  function preview() {
    const wKg = weightUnit === "lbs" ? lbsToKg(Number(weight)) : Number(weight);
    const hCm =
      heightUnit === "imperial"
        ? ftInToCm(Number(feet), Number(inches))
        : Number(height);
    if (!wKg || !hCm || !age || !steps) return null;
    return calcTDEE({
      gender,
      weight: wKg,
      height: hCm,
      age: +age,
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
      if (!age || !wKg || !hCm) {
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
    const calc = calcTDEE({
      gender,
      weight: wKg,
      height: hCm,
      age: +age,
      steps: Number(steps),
      workoutsPerWeek: Number(workoutsPerWeek),
      goal: goal as GoalKey,
      intensity,
    });
    await setProfile({
      name,
      age: +age,
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
    });
    toast(`Welcome, ${name}! 🎉`);
    router.push("/dashboard");
  }

  const pv = step === 5 ? preview() : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "32px 20px",
        backgroundColor: "#F7F6F3",
      }}>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #E8E7E4",
          borderRadius: "24px",
          padding: "40px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 12px 48px rgba(0,0,0,0.09)",
        }}>
        {/* Progress bars */}
        <div className="flex gap-1.5 mb-9">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex-1 h-[3px] rounded transition-colors duration-300 ${ i <= step ? "bg-[#1A1916] dark:bg-[#f7f6f3]" : "bg-[#E8E7E4]"
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Name */}
        {step === 1 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-[#1A1916] dark:text-[#f7f6f3]">
              Hey there 👋
            </div>
            <div className="text-sm text-[#9B9895] mb-7 leading-relaxed">
              Let's personalise your experience. What should we call you?
            </div>
            <div className="mb-6">
              <label
                className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-1.5"
                htmlFor="ob-name">
                Your Name
              </label>
              <input
                id="ob-name"
                className="w-full px-3.5 py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg text-sm bg-[#F7F6F3] dark:bg-[#0f0f0e] focus:bg-white dark:focus:bg-[#1a1916] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] outline-none transition-all"
                placeholder="e.g. david"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && next()}
              />
            </div>
            <button
              onClick={next}
              className="w-full py-3.5 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer">
              Continue
            </button>
          </BlurFade>
        )}

        {/* Step 2 — Body Stats */}
        {step === 2 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-[#1A1916] dark:text-[#f7f6f3]">
              Body Stats
            </div>
            <div className="text-sm text-[#9B9895] mb-7 leading-relaxed">
              Used to calculate your TDEE using the Mifflin–St Jeor formula.
            </div>

            {/* Unit Preference Toggles */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-1.5">
                  Weight Unit
                </label>
                <div className="flex border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setWeightUnit("kg");
                      if (weight)
                        setWeight(
                          Math.round((Number(weight) / 2.20462) * 10) / 10 + "",
                        );
                    }}
                    className={`flex-1 py-2 text-xs font-semibold border-0 transition-colors cursor-pointer ${ weightUnit === "kg"
                        ? "bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                        : "bg-white dark:bg-[#1a1916] text-[#9B9895]"
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
                    className={`flex-1 py-2 text-xs font-semibold border-0 transition-colors cursor-pointer ${ weightUnit === "lbs"
                        ? "bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                        : "bg-white dark:bg-[#1a1916] text-[#9B9895]"
                    }`}>
                    lbs
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-1.5">
                  Height Unit
                </label>
                <div className="flex border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setHeightUnit("metric");
                      setHeight("");
                      setFeet("");
                      setInches("");
                    }}
                    className={`flex-1 py-2 text-xs font-semibold border-0 transition-colors cursor-pointer ${ heightUnit === "metric"
                        ? "bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                        : "bg-white dark:bg-[#1a1916] text-[#9B9895]"
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
                    className={`flex-1 py-2 text-xs font-semibold border-0 transition-colors cursor-pointer ${ heightUnit === "imperial"
                        ? "bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                        : "bg-white dark:bg-[#1a1916] text-[#9B9895]"
                    }`}>
                    ft/in
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label
                  className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-1.5"
                  htmlFor="ob-age">
                  Age
                </label>
                <input
                  id="ob-age"
                  type="number"
                  min="12"
                  max="99"
                  placeholder="21"
                  className="w-full px-3.5 py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg text-sm bg-[#F7F6F3] dark:bg-[#0f0f0e] focus:bg-white dark:focus:bg-[#1a1916] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] outline-none transition-all"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label
                  className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-1.5"
                  htmlFor="ob-gender">
                  Gender
                </label>
                <div className="relative">
                  <select
                    id="ob-gender"
                    className="w-full px-3.5 py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg text-sm bg-[#F7F6F3] dark:bg-[#0f0f0e] focus:bg-white dark:focus:bg-[#1a1916] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] outline-none transition-all appearance-none cursor-pointer"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#9B9895]">
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
                  className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-1.5"
                  htmlFor="ob-wt">
                  Weight ({weightUnit})
                </label>
                <input
                  id="ob-wt"
                  type="number"
                  min="30"
                  max="700"
                  placeholder={weightUnit === "kg" ? "70" : "154"}
                  className="w-full px-3.5 py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg text-sm bg-[#F7F6F3] dark:bg-[#0f0f0e] focus:bg-white dark:focus:bg-[#1a1916] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] outline-none transition-all"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div>
                {heightUnit === "metric" ? (
                  <>
                    <label
                      className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-1.5"
                      htmlFor="ob-ht">
                      Height (cm)
                    </label>
                    <input
                      id="ob-ht"
                      type="number"
                      min="100"
                      max="250"
                      placeholder="175"
                      className="w-full px-3.5 py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg text-sm bg-[#F7F6F3] dark:bg-[#0f0f0e] focus:bg-white dark:focus:bg-[#1a1916] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] outline-none transition-all"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-1.5">
                      Height (ft/in)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        min="3"
                        max="8"
                        placeholder="5"
                        className="w-full px-3.5 py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg text-sm bg-[#F7F6F3] dark:bg-[#0f0f0e] focus:bg-white dark:focus:bg-[#1a1916] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] outline-none transition-all"
                        value={feet}
                        onChange={(e) => setFeet(e.target.value)}
                        aria-label="Feet"
                      />
                      <input
                        type="number"
                        min="0"
                        max="11"
                        placeholder="9"
                        className="w-full px-3.5 py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg text-sm bg-[#F7F6F3] dark:bg-[#0f0f0e] focus:bg-white dark:focus:bg-[#1a1916] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] outline-none transition-all"
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
              className="w-full py-3.5 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mb-2.5">
              Continue
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] text-[#9B9895] rounded-xl text-sm font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}

        {/* Step 3 — Steps + Workouts */}
        {step === 3 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-[#1A1916] dark:text-[#f7f6f3]">
              Activity
            </div>
            <div className="text-sm text-[#9B9895] mb-7 leading-relaxed">
              Steps and workouts give a more accurate TDEE than a simple
              activity dropdown.
            </div>

            <div className="mb-5">
              <label
                className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-1.5"
                htmlFor="ob-steps">
                Average Daily Steps
              </label>
              <input
                id="ob-steps"
                type="number"
                min={0}
                max={30000}
                placeholder="7500"
                className="w-full px-3.5 py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg text-sm bg-[#F7F6F3] dark:bg-[#0f0f0e] focus:bg-white dark:focus:bg-[#1a1916] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] outline-none transition-all"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#9B9895] mb-3">
                Workouts per Week
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => setWorkoutsPerWeek(String(n))}
                    className={`py-3 rounded-xl border-2 text-center text-sm font-bold transition-all cursor-pointer ${ workoutsPerWeek === String(n) ? "border-[#1A1916] dark:border-[#f7f6f3] bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                        : "border-[#E8E7E4] dark:border-[#3a3a3a] hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-[#f7f6f3] bg-white dark:bg-[#1a1916] text-[#1A1916] dark:text-[#f7f6f3]"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={next}
              className="w-full py-3.5 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mt-2 mb-2.5">
              Continue
            </button>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] text-[#9B9895] rounded-xl text-sm font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}

        {/* Step 4 — Goal */}
        {step === 4 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-[#1A1916] dark:text-[#f7f6f3]">
              Your Goal
            </div>
            <div className="text-sm text-[#9B9895] mb-6 leading-relaxed">
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
                    className={`p-4 rounded-2xl text-center border-2 transition-all cursor-pointer ${ goal === g.key ? "border-[#1A1916] dark:border-[#f7f6f3] bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                        : "border-[#E8E7E4] dark:border-[#3a3a3a] hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-[#f7f6f3] bg-white dark:bg-[#1a1916] text-[#1A1916] dark:text-[#f7f6f3]"
                    }`}>
                    <div className="text-[28px] mb-1.5">{g.emoji}</div>
                    <div className="text-[13px] font-bold">{g.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${ goal === g.key ? "text-white dark:text-[#1a1916]/60" : "text-[#9B9895]"
                      }`}>
                      {g.sub}
                    </div>
                  </button>
                ),
              )}
            </div>
            <button
              onClick={next}
              className="w-full py-3.5 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mb-2.5">
              Continue
            </button>
            <button
              onClick={() => setStep(3)}
              className="w-full py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] text-[#9B9895] rounded-xl text-sm font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}

        {/* Step 5 — Intensity + TDEE Preview */}
        {step === 5 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-[#1A1916] dark:text-[#f7f6f3]">
              {goal === "maintain"
                ? "⚖️ Maintenance"
                : goal === "cut"
                  ? "🔥 Cut Intensity"
                  : "💪 Bulk Intensity"}
            </div>
            <div className="text-sm text-[#9B9895] mb-6 leading-relaxed">
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
                    className={`w-full flex items-center gap-3 p-4 rounded-xl mb-2 border-2 text-left transition-all cursor-pointer ${ intensity === i.key ? "border-[#1A1916] dark:border-[#f7f6f3] bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                        : "border-[#E8E7E4] dark:border-[#3a3a3a] hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-[#f7f6f3] bg-white dark:bg-[#1a1916] text-[#1A1916] dark:text-[#f7f6f3]"
                    }`}>
                    <div
                      className={`w-[42px] h-[42px] rounded-full flex-shrink-0 flex items-center justify-center text-lg ${ intensity === i.key ? "bg-white dark:bg-[#1a1916] text-[#1A1916] dark:text-[#f7f6f3]"
                          : "bg-[#F7F6F3] dark:bg-[#0f0f0e] text-[#9B9895]"
                      }`}>
                      {i.emoji}
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">{i.label}</div>
                      <div
                        className={`text-[11px] mt-0.5 ${ intensity === i.key ? "text-white dark:text-[#1a1916]/65"
                            : "text-[#9B9895]"
                        }`}>
                        {i.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* TDEE Preview */}
            {pv && (
              <div className="grid grid-cols-2 gap-2.5 p-5 bg-[#F7F6F3] dark:bg-[#0f0f0e] rounded-[14px] mb-6">
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
                    <div className="text-[11px] text-[#9B9895] mt-0.5 font-semibold uppercase tracking-wider">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={finish}
              className="w-full py-3.5 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mb-2.5">
              Let's go 🚀
            </button>
            <button
              onClick={() => setStep(4)}
              className="w-full py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] text-[#9B9895] rounded-xl text-sm font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
