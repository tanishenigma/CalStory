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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/lib/utils";
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

/** Map a Firestore / network error to a message a user can act on.
 *  We deliberately avoid leaking Firebase codes verbatim — users
 *  don't care, they want to know what to try next. */
function describeFirestoreError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  if (code === "permission-denied" || code === "firestore/permission-denied") {
    return "You don't have access to save this profile. Please sign in again and retry.";
  }
  if (
    code === "unavailable" ||
    code === "firestore/unavailable" ||
    code === "network-request-failed"
  ) {
    return "Network error — please check your connection and try again.";
  }
  if (code === "quota-exceeded" || code === "resource-exhausted") {
    return "CalStory is temporarily busy. Please try again in a moment.";
  }
  if (code === "deadline-exceeded" || code === "timed-out") {
    return "The request took too long. Please try again.";
  }
  return "We couldn't save your profile. Please try again in a moment.";
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
  const { state, setProfile, logWeight } = useApp();
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

  // Target weight is what the user is working toward. Pre-filled
  // with the ±10% heuristic from current weight so a user can just
  // accept the default; the field is editable (and skippable). The
  // value follows the active display unit and gets converted to kg
  // on save, matching every other weight input in the app.
  const [targetWeight, setTargetWeight] = useState<string>("");

  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("metric");
  const [feet, setFeet] = useState<string>("");
  const [inches, setInches] = useState<string>("");

  // ── Inline form errors ───────────────────────────────────────
  // Per-field error messages rendered directly under each input.
  // Keys are field names; absence of a key means "no error".
  //
  // `submitError` is a banner-level error for failures that
  // aren't tied to a single field (e.g. Firestore refused to save
  // the profile, network is down). It sits above the action
  // buttons so the user can read it before retrying.
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  /** Set a single field error. Pass an empty string to clear. */
  function setFieldError(field: string, message: string) {
    setErrors((prev) => {
      if (!message) {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  }

  /** Clear every error for the current step. Called on `next()` so
   *  the user gets a clean slate when advancing forward. */
  function clearErrorsForStep() {
    setErrors({});
    setSubmitError(null);
  }

  // Auto-fill the target weight with the heuristic default (±10%
  // from the user's current weight in the active display unit).
  // Recomputes when the current weight or goal direction changes —
  // so the user always sees a sensible default when they land on
  // the target-weight step. Already-edited values are preserved.
  useEffect(() => {
    const w = weightUnit === "lbs" ? lbsToKg(Number(weight)) : Number(weight);
    if (!w || w <= 0) return;
    const targetKg = goal === "cut" ? w * 0.9 : goal === "bulk" ? w * 1.1 : w;
    const display =
      weightUnit === "lbs"
        ? Math.round(targetKg * 2.20462 * 10) / 10
        : Math.round(targetKg * 10) / 10;
    setTargetWeight(String(display));
  }, [weight, goal, weightUnit]);

  // Show a spinner while auth or profile is still resolving, so we don't
  // briefly flash the form for users who are about to be redirected away.
  // Must come *after* all useState calls to satisfy the rules of hooks.
  if (loading || (user && state.profile === undefined)) {
    return <Spinner compact />;
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
    clearErrorsForStep();
    if (step === 1) {
      if (!name.trim()) {
        setFieldError("name", "Please enter your name to continue.");
        toast("Enter your name", "⚠️");
        return;
      }
      setStep((s) => Math.min(s + 1, 6));
      return;
    }
    if (step === 2) {
      let hasError = false;
      if (dobToAge(dob) === null) {
        setFieldError(
          "dob",
          "Please enter a valid date of birth (you need to be at least 13).",
        );
        hasError = true;
      }
      const wKg =
        weightUnit === "lbs" ? lbsToKg(Number(weight)) : Number(weight);
      if (!weight || Number.isNaN(wKg) || wKg < 30 || wKg > 635) {
        setFieldError(
          "weight",
          weightUnit === "lbs"
            ? "Enter a weight between 66 and 1400 lbs."
            : "Enter a weight between 30 and 635 kg.",
        );
        hasError = true;
      }
      const hCm =
        heightUnit === "imperial"
          ? ftInToCm(Number(feet), Number(inches))
          : Number(height);
      if (heightUnit === "metric") {
        if (!height || Number.isNaN(hCm) || hCm < 100 || hCm > 250) {
          setFieldError("height", "Enter a height between 100 and 250 cm.");
          hasError = true;
        }
      } else {
        const f = Number(feet);
        const i = Number(inches);
        if (
          !feet ||
          !inches ||
          Number.isNaN(f) ||
          Number.isNaN(i) ||
          f < 3 ||
          f > 8 ||
          i < 0 ||
          i > 11
        ) {
          setFieldError(
            "height",
            "Enter a height between 3 ft 0 in and 8 ft 11 in.",
          );
          hasError = true;
        }
      }
      if (hasError) return;
      setStep((s) => Math.min(s + 1, 6));
      return;
    }
    if (step === 3) {
      const s = Number(steps);
      if (!steps || Number.isNaN(s) || s < 0 || s > 50000) {
        setFieldError("steps", "Enter a step count between 0 and 50,000.");
        toast("Enter your average daily steps", "⚠️");
        return;
      }
      setStep((s) => Math.min(s + 1, 6));
      return;
    }
    if (step === 4) {
      if (!goal) {
        setFieldError("goal", "Pick a goal direction to continue.");
        toast("Pick your goal", "⚠️");
        return;
      }
      setStep((s) => Math.min(s + 1, 6));
      return;
    }
    if (step === 5 && goal !== "maintain") {
      // Target weight is pre-filled with a heuristic value, so the
      // only failure mode is someone manually clearing the field. In
      // that case we silently treat it as "no target" rather than
      // blocking the user — the Progress page falls back to the
      // heuristic, so the experience is still good.
      if (!targetWeight || Number.isNaN(Number(targetWeight))) {
        setTargetWeight("");
      }
    }
    setStep((s) => Math.min(s + 1, 6));
  }

  async function finish() {
    if (submitting) return;
    clearErrorsForStep();

    const wKg = weightUnit === "lbs" ? lbsToKg(Number(weight)) : Number(weight);
    const hCm =
      heightUnit === "imperial"
        ? ftInToCm(Number(feet), Number(inches))
        : Number(height);
    const ageNum = dobToAge(dob) ?? 0;
    const targetKg =
      !targetWeight || Number.isNaN(Number(targetWeight))
        ? undefined
        : weightUnit === "lbs"
          ? lbsToKg(Number(targetWeight))
          : Number(targetWeight);

    // Re-validate the full set before writing. Anything we missed
    // during `next()` (e.g. someone JS-stepped forward) lands here.
    const hasHardError =
      !name.trim() ||
      ageNum <= 0 ||
      !wKg ||
      wKg < 30 ||
      wKg > 230 ||
      !hCm ||
      hCm < 100 ||
      hCm > 250 ||
      !goal;
    if (hasHardError) {
      setSubmitError(
        "Some fields look off. Please go back and double-check before submitting.",
      );
      toast("Check the form for errors", "⚠️");
      return;
    }

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

    setSubmitting(true);
    try {
      await setProfile({
        name,
        age: ageNum,
        dob,
        gender,
        weight: wKg,
        height: hCm,
        targetWeight: targetKg,
        steps: Number(steps),
        workoutsPerWeek: Number(workoutsPerWeek),
        goal: goal as GoalKey,
        intensity,
        ...calc,
        weightUnit,
        heightUnit,
        onboardedAt: Date.now(),
      });
      // Seed the very first weigh-in so the Progress page chart has
      // data immediately (instead of an empty "Log a weight to start
      // tracking" state). `logWeight` mirrors the new weight onto
      // `profile.weight`, but we already set it above — the mirror
      // is idempotent here.
      //
      // logWeight failure is non-fatal: profile is saved and the
      // user is fully onboarded. We surface it as a non-blocking
      // warning rather than aborting the redirect.
      try {
        await logWeight(wKg, weightUnit);
      } catch (logErr) {
        console.warn(
          "[onboarding] profile saved but initial weigh-in failed:",
          logErr,
        );
        toast(
          "Account created, but we couldn't seed your first weigh-in. You can log one from the Progress page.",
          "⚠️",
        );
      }
      toast(`Welcome, ${name}! 🎉`);
      router.push("/dashboard");
    } catch (err) {
      const msg = describeFirestoreError(err);
      console.error("[onboarding] finish failed:", err);
      setSubmitError(msg);
      toast("We couldn't save your profile", "❌");
      setSubmitting(false);
    }
  }

  const pv = step === 6 ? preview() : null;

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
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
                aria-invalid={Boolean(errors.name) || undefined}
                aria-describedby={errors.name ? "ob-name-error" : undefined}
                className={`w-full px-3.5 py-3 text-foreground bg-background border rounded-lg text-sm focus:outline-none transition-all ${
                  errors.name
                    ? "border-destructive focus:border-destructive"
                    : "border-border focus:border-foreground/50"
                }`}
                placeholder="e.g. david"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setFieldError("name", "");
                }}
                onKeyDown={(e) => e.key === "Enter" && next()}
              />
              {errors.name && (
                <p
                  id="ob-name-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive flex items-start gap-1.5">
                  <span aria-hidden>⚠</span>
                  <span>{errors.name}</span>
                </p>
              )}
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
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    if (errors.dob) setFieldError("dob", "");
                  }}
                  className={cn(
                    "w-full px-3.5 py-3 border rounded-lg text-sm bg-background outline-none transition-all font-mono",
                    errors.dob
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:bg-card focus:border-border",
                  )}
                />
                {errors.dob ? (
                  <p
                    role="alert"
                    className="mt-1.5 text-[11px] font-medium text-destructive flex items-start gap-1.5">
                    <span aria-hidden>⚠</span>
                    <span>{errors.dob}</span>
                  </p>
                ) : dob && dobToAge(dob) !== null ? (
                  <div className="mt-1.5 text-[11px] text-muted-foreground font-medium">
                    Age: {dobToAge(dob)} yrs
                  </div>
                ) : null}
              </div>
              <div>
                <label
                  className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5"
                  htmlFor="ob-gender">
                  Gender
                </label>
                <Select
                  value={gender}
                  onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger
                    id="ob-gender"
                    className={cn(
                      "w-full px-3.5 py-5 text-sm bg-background outline-none transition-all rounded-lg border-border font-mono cursor-pointer",
                      "focus:outline-none focus:bg-card focus:border-border transition-all items-center",
                    )}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[60] min-w-[var(--radix-select-trigger-width)] p-1">
                    {" "}
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
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
                  aria-invalid={Boolean(errors.weight) || undefined}
                  placeholder={weightUnit === "kg" ? "70" : "154"}
                  className={`w-full px-3.5 py-3 border rounded-lg text-sm bg-background focus:outline-none transition-all ${
                    errors.weight
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:bg-card focus:border-border"
                  }`}
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    if (errors.weight) setFieldError("weight", "");
                  }}
                />
                {errors.weight && (
                  <p
                    role="alert"
                    className="mt-1.5 text-[11px] font-medium text-destructive flex items-start gap-1.5">
                    <span aria-hidden>⚠</span>
                    <span>{errors.weight}</span>
                  </p>
                )}
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
                      aria-invalid={Boolean(errors.height) || undefined}
                      placeholder="175"
                      className={`w-full px-3.5 py-3 border rounded-lg text-sm bg-background focus:outline-none transition-all ${
                        errors.height
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:bg-card focus:border-border"
                      }`}
                      value={height}
                      onChange={(e) => {
                        setHeight(e.target.value);
                        if (errors.height) setFieldError("height", "");
                      }}
                    />
                    {errors.height && (
                      <p
                        role="alert"
                        className="mt-1.5 text-[11px] font-medium text-destructive flex items-start gap-1.5">
                        <span aria-hidden>⚠</span>
                        <span>{errors.height}</span>
                      </p>
                    )}
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
                        aria-invalid={Boolean(errors.height) || undefined}
                        placeholder="5"
                        className={`w-full px-3.5 py-3 border rounded-lg text-sm bg-background focus:outline-none transition-all ${
                          errors.height
                            ? "border-destructive focus:border-destructive"
                            : "border-border focus:bg-card focus:border-border"
                        }`}
                        value={feet}
                        onChange={(e) => {
                          setFeet(e.target.value);
                          if (errors.height) setFieldError("height", "");
                        }}
                        aria-label="Feet"
                      />
                      <input
                        type="number"
                        min="0"
                        max="11"
                        aria-invalid={Boolean(errors.height) || undefined}
                        placeholder="9"
                        className={`w-full px-3.5 py-3 border rounded-lg text-sm bg-background focus:outline-none transition-all ${
                          errors.height
                            ? "border-destructive focus:border-destructive"
                            : "border-border focus:bg-card focus:border-border"
                        }`}
                        value={inches}
                        onChange={(e) => {
                          setInches(e.target.value);
                          if (errors.height) setFieldError("height", "");
                        }}
                        aria-label="Inches"
                      />
                    </div>
                    {errors.height && (
                      <p
                        role="alert"
                        className="mt-1.5 text-[11px] font-medium text-destructive flex items-start gap-1.5">
                        <span aria-hidden>⚠</span>
                        <span>{errors.height}</span>
                      </p>
                    )}
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
                aria-invalid={Boolean(errors.steps) || undefined}
                placeholder="7500"
                className={`w-full px-3.5 py-3 rounded-lg text-sm outline-none transition-all border bg-background text-foreground ${
                  errors.steps
                    ? "border-destructive focus:border-destructive"
                    : "border-border focus:bg-background/50 focus:border-foreground/50"
                }`}
                value={steps}
                onChange={(e) => {
                  setSteps(e.target.value);
                  if (errors.steps) setFieldError("steps", "");
                }}
                autoFocus
              />
              {errors.steps && (
                <p
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive flex items-start gap-1.5">
                  <span aria-hidden>⚠</span>
                  <span>{errors.steps}</span>
                </p>
              )}
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
            {errors.goal && (
              <p
                role="alert"
                className="mb-3 text-[11px] font-medium text-destructive flex items-start gap-1.5">
                <span aria-hidden>⚠</span>
                <span>{errors.goal}</span>
              </p>
            )}
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

        {/* Step 5 — Target Weight (skipped for "maintain") */}
        {step === 5 && goal !== "maintain" && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-foreground">
              🎯 Target Weight
            </div>
            <div className="text-sm text-muted-foreground mb-7 leading-relaxed">
              Where do you want to land? We&apos;ve pre-filled a sensible
              default based on your goal — edit it or leave it as is.
            </div>

            <div className="mb-6">
              <label
                className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5"
                htmlFor="ob-target">
                Target Weight ({weightUnit})
              </label>
              <input
                id="ob-target"
                type="number"
                step="0.1"
                min="30"
                max="700"
                placeholder={weightUnit === "kg" ? "63" : "139"}
                className="w-full px-3.5 py-3 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                autoFocus
              />
              <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                Shown on the Progress page so you can see the gap to your goal.
              </div>
            </div>

            <button
              onClick={next}
              className="w-full py-3.5 bg-foreground text-background border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mb-2.5">
              Continue
            </button>
            <button
              onClick={() => setStep(4)}
              className="w-full py-3 border border-border text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}

        {/* Maintain skips Step 5 entirely — intensity is fixed at
            TDEE exactly, so the only useful work left is the preview. */}
        {step === 5 && goal === "maintain" && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-foreground">
              ⚖️ Maintenance
            </div>
            <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
              You&apos;re maintaining — your calorie target matches your TDEE
              exactly.
            </div>

            {/* TDEE Preview */}
            {preview() && (
              <div className="grid grid-cols-2 gap-2.5 p-5 bg-background rounded-[14px] mb-6">
                {(
                  [
                    ["Calorie Target", `${preview()!.calTarget} kcal`],
                    ["Protein", `${preview()!.protein}g`],
                    ["Carbs", `${preview()!.carbs}g`],
                    ["Fat", `${preview()!.fat}g`],
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
              Let&apos;s go 🚀
            </button>
            <button
              onClick={() => setStep(4)}
              className="w-full py-3 border border-border text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted active:scale-[0.99] transition-all cursor-pointer">
              Back
            </button>
          </BlurFade>
        )}

        {/* Step 6 — Intensity + TDEE Preview */}
        {step === 6 && (
          <BlurFade>
            <div className="text-[26px] font-bold mb-1.5 text-foreground">
              {goal === "cut" ? "🔥 Cut Intensity" : "💪 Bulk Intensity"}
            </div>
            <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
              How fast do you want to progress? Pick your intensity.
            </div>

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
                      {getIntensityLabel(i.key, goal as GoalKey).label}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        intensity === i.key
                          ? "text-background/60"
                          : "text-muted-foreground"
                      }`}>
                      {getIntensityLabel(i.key, goal as GoalKey).desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

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

            {/* Banner-level submit error (Firestore refused, network
                down, etc.). Stays at the top of the action area so
                the user sees it before tapping "Let's go" again. */}
            {submitError && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2">
                <span
                  aria-hidden
                  className="text-destructive text-base leading-none">
                  ⚠
                </span>
                <div className="flex-1 text-[12px] text-destructive leading-relaxed">
                  {submitError}
                </div>
              </div>
            )}

            <button
              onClick={finish}
              disabled={submitting}
              className="w-full py-3.5 bg-foreground text-background border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mb-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? "Saving…" : "Let's go 🚀"}
            </button>
            {submitError && !submitting && (
              <button
                onClick={finish}
                className="w-full py-2 text-destructive text-xs font-semibold hover:underline mb-1.5">
                Retry
              </button>
            )}
            <button
              onClick={() => setStep(5)}
              disabled={submitting}
              className="w-full py-3 border border-border text-muted-foreground rounded-xl text-sm font-semibold hover:bg-muted active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              Back
            </button>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
