"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { useApp } from "@/app/context/AppContext";
import { useToast } from "@/app/components/ToastContainer";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { signOut } from "@/app/lib/auth";
import { calcTDEE } from "@/app/lib/tdee";
import { GOALS } from "@/app/lib/constants";
import { kgToLbs, lbsToKg } from "@/app/lib/units";
import BlurFade from "@/app/components/animations/BlurFade";
import { Card } from "@/app/components/ui/card";
import {
  usePrefsStore,
  resolveTheme,
  type NavbarStyle,
  type Theme,
} from "@/app/store/prefsStore";
import { animateThemeTransition } from "@/app/components/ThemeToggle";
import {
  LayoutPanelLeft,
  PanelLeft,
  ChevronRight,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import type {
  GoalKey,
  IntensityKey,
  WeightUnit,
  HeightUnit,
} from "@/app/types";

type Tab = "profile" | "goals" | "appearance" | "units";

interface IntensityOption {
  key: IntensityKey;
  label: string;
  desc: string;
}

const INTENSITIES: IntensityOption[] = [
  {
    key: "slow",
    label: "Slow",
    desc: "±150 kcal — sustainable, minimal muscle loss",
  },
  {
    key: "moderate",
    label: "Moderate",
    desc: "±300 kcal — the classic balanced approach",
  },
  {
    key: "aggressive",
    label: "Aggressive",
    desc: "±500 kcal — fast results, higher discipline needed",
  },
];

function SettingsPageContent() {
  const { profile, isLoading } = useAuthGuard();
  const { state, setProfile } = useApp();
  const { user } = useAuthStore();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as Tab | null) ?? "profile";
  const [tab, setTab] = useState<Tab>(
    ["profile", "goals", "appearance", "units"].includes(initialTab)
      ? initialTab
      : "profile",
  );
  const [saving, setSaving] = useState<boolean>(false);

  const [goal, setGoal] = useState<GoalKey>(state.profile?.goal || "maintain");
  const [intensity, setIntensity] = useState<IntensityKey>(
    state.profile?.intensity || "moderate",
  );
  const [steps, setSteps] = useState<number>(state.profile?.steps ?? 7500);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<number>(
    state.profile?.workoutsPerWeek ?? 3,
  );

  const initialWeightDisplay =
    state.profile?.weightUnit === "lbs"
      ? kgToLbs(state.profile?.weight ?? 0)
      : (state.profile?.weight ?? 0);
  const [weightInput, setWeightInput] = useState<string>(
    String(initialWeightDisplay),
  );

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    state.profile?.weightUnit || "kg",
  );
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(
    state.profile?.heightUnit || "metric",
  );

  const navbarStyle = usePrefsStore((s) => s.navbarStyle);
  const setNavbarStyle = usePrefsStore((s) => s.setNavbarStyle);
  const theme = usePrefsStore((s) => s.theme);
  const setTheme = usePrefsStore((s) => s.setTheme);

  if (isLoading || !profile) return <Spinner />;

  async function saveGoal() {
    setSaving(true);
    const weightKg =
      weightUnit === "lbs" ? lbsToKg(Number(weightInput)) : Number(weightInput);
    const base = {
      ...state.profile!,
      goal,
      intensity,
      weight: weightKg,
      steps,
      workoutsPerWeek,
    };
    const calc = calcTDEE(base);
    await setProfile({
      ...base,
      tdee: calc.tdee,
      calTarget: calc.calTarget,
      protein: calc.protein,
      carbs: calc.carbs,
      fat: calc.fat,
    });
    setSaving(false);
    toast("Goals updated ✓");
  }

  async function saveUnits() {
    setSaving(true);
    await setProfile({ ...state.profile!, weightUnit, heightUnit });
    setSaving(false);
    toast("Units saved ✓");
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "goals", label: "Goals" },
    { key: "appearance", label: "Appearance" },
    { key: "units", label: "Units" },
  ];

  const previewCalc = calcTDEE({
    ...state.profile!,
    goal,
    intensity,
    weight:
      weightUnit === "lbs" ? lbsToKg(Number(weightInput)) : Number(weightInput),
    steps,
    workoutsPerWeek,
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="pt-2">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-sm text-[#9B9895]">
          Manage your profile, goals and preferences
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-[#F0EFEC] dark:bg-[#2a2a2a] rounded-xl overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              tab === t.key
                ? "bg-card text-[#1A1916] dark:text-[#f7f6f3] shadow-sm"
                : "text-[#9B9895] hover:text-[#1A1916] dark:text-[#f7f6f3] dark:hover:text-white"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === "profile" && (
        <BlurFade>
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-8">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="w-16 h-16 rounded-full border border-transparent"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#1A1916] dark:bg-[#f7f6f3] flex items-center justify-center text-white dark:text-[#1A1916] text-2xl font-bold">
                  {(state.profile?.name || "U")[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-bold text-lg">
                  {state.profile?.name
                    ? state.profile.name.charAt(0).toUpperCase() +
                      state.profile.name.slice(1)
                    : "User"}
                </div>
                <div className="text-sm text-[#9B9895]">
                  {user?.email || "Guest"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
              {[
                { label: "Age", val: `${state.profile?.age} yrs` },
                {
                  label: "Weight",
                  val:
                    state.profile?.weightUnit === "lbs"
                      ? `${kgToLbs(state.profile?.weight ?? 0)} lbs`
                      : `${state.profile?.weight} kg`,
                },
                { label: "TDEE", val: `${state.profile?.tdee} kcal` },
                { label: "Target", val: `${state.profile?.calTarget} kcal` },
                { label: "Protein", val: `${state.profile?.protein}g` },
                {
                  label: "Goal",
                  val: `${state.profile?.goal} (${state.profile?.intensity || "moderate"})`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-background rounded-xl p-3 sm:p-4 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] mb-1">
                    {item.label}
                  </div>
                  <div className="font-mono text-xs sm:text-base font-medium truncate">
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            {user && (
              <button
                onClick={handleSignOut}
                className="w-full py-3.5 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                Sign out
              </button>
            )}
          </Card>
        </BlurFade>
      )}

      {/* ── Goals tab ── */}
      {tab === "goals" && (
        <BlurFade>
          <Card className="p-6">
            <div className="text-sm font-bold mb-1">Steps per Day</div>
            <p className="text-xs text-[#9B9895] mb-4 leading-relaxed">
              Average daily step count (from a fitness tracker or phone).
            </p>
            <div className="relative mb-8">
              <input
                type="number"
                min={0}
                max={30000}
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="w-full px-3.5 py-3 pr-14 border border-transparent rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-[#9B9895]">
                steps
              </span>
            </div>

            <div className="text-sm font-bold mb-1">Workouts per Week</div>
            <p className="text-xs text-[#9B9895] mb-4 leading-relaxed">
              Resistance or cardio sessions per week on average.
            </p>
            <div className="grid grid-cols-5 gap-2 mb-8">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => setWorkoutsPerWeek(n)}
                  className={`py-3 rounded-xl border text-center text-sm font-bold transition-all ${
                    workoutsPerWeek === n
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground text-foreground"
                  }`}>
                  {n}
                </button>
              ))}
            </div>

            <div className="text-sm font-bold mb-1">Weight</div>
            <p className="text-xs text-[#9B9895] mb-4 leading-relaxed">
              Always stored in kg. Edit in {weightUnit}.
            </p>
            <div className="relative mb-8">
              <input
                type="number"
                step="0.1"
                min={weightUnit === "lbs" ? 66 : 30}
                max={weightUnit === "lbs" ? 500 : 230}
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full px-3.5 py-3 pr-14 border border-transparent rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-[#9B9895]">
                {weightUnit}
              </span>
            </div>

            <div className="text-sm font-bold mb-4">Goal Direction</div>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGoal(g.key as GoalKey)}
                  className={`p-5 rounded-xl border text-center transition-all ${
                    goal === g.key
                      ? "border-[#1A1916] dark:border-[#f7f6f3] bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                      : "border-transparent hover:border-[#1A1916] dark:border-[#f7f6f3] dark:hover:border-[#f7f6f3]"
                  }`}>
                  <div className="text-3xl mb-2">{g.emoji}</div>
                  <div className="text-sm font-bold">{g.label}</div>
                  <div
                    className={`text-xs mt-1 ${goal === g.key ? "text-white dark:text-[#1a1916]/60" : "text-[#9B9895]"}`}>
                    {g.sub}
                  </div>
                </button>
              ))}
            </div>

            {goal !== "maintain" && (
              <>
                <div className="text-sm font-bold mb-4">Intensity</div>
                <div className="flex flex-col gap-3 mb-8">
                  {INTENSITIES.map((i) => (
                    <button
                      key={i.key}
                      onClick={() => setIntensity(i.key)}
                      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        intensity === i.key
                          ? "border-[#1A1916] dark:border-[#f7f6f3] bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                          : "border-transparent hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-[#f7f6f3]"
                      }`}>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          intensity === i.key
                            ? "bg-card text-[#1A1916] dark:text-[#f7f6f3]"
                            : "bg-background"
                        }`}>
                        {goal === "cut" ? "-" : "+"}
                        {i.key === "slow"
                          ? "150"
                          : i.key === "moderate"
                            ? "300"
                            : "500"}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{i.label}</div>
                        <div
                          className={`text-xs mt-0.5 ${intensity === i.key ? "text-white dark:text-[#1a1916]/70" : "text-[#9B9895]"}`}>
                          {i.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="bg-background rounded-xl p-5 mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#9B9895] mb-2">
                Estimated Target
              </div>
              <div className="font-mono text-3xl font-medium">
                {previewCalc.calTarget} kcal
              </div>
              <div className="text-[11px] text-[#9B9895] mt-2 font-medium">
                P {previewCalc.protein}g · C {previewCalc.carbs}g · F{" "}
                {previewCalc.fat}g
              </div>
              <div className="text-[11px] text-[#9B9895] mt-1 font-medium">
                TDEE {previewCalc.tdee} kcal
              </div>
            </div>

            <button
              onClick={saveGoal}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] font-bold text-sm hover:opacity-85 transition-opacity disabled:opacity-60">
              {saving ? "Saving…" : "Save Goals"}
            </button>
          </Card>
        </BlurFade>
      )}

      {/* ── Units tab ── */}
      {tab === "units" && (
        <BlurFade>
          <Card className="p-6">
            <div className="text-sm font-bold mb-4">Weight Unit</div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {(
                [
                  { key: "kg", label: "Kilograms", sub: "kg" },
                  { key: "lbs", label: "Pounds", sub: "lbs" },
                ] as { key: WeightUnit; label: string; sub: string }[]
              ).map((u) => (
                <button
                  key={u.key}
                  onClick={() => setWeightUnit(u.key)}
                  className={`p-5 rounded-xl border text-center transition-all ${
                    weightUnit === u.key
                      ? "border-[#1A1916] dark:border-[#f7f6f3] bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                      : "border-transparent hover:border-[#1A1916] dark:border-[#f7f6f3] dark:hover:border-[#f7f6f3]"
                  }`}>
                  <div className="font-mono text-3xl font-medium mb-1">
                    {u.sub}
                  </div>
                  <div className="text-sm font-semibold">{u.label}</div>
                </button>
              ))}
            </div>

            <div className="text-sm font-bold mb-4">Height Unit</div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {(
                [
                  { key: "metric", label: "Centimetres", sub: "cm" },
                  { key: "imperial", label: "Feet & Inches", sub: "ft/in" },
                ] as { key: HeightUnit; label: string; sub: string }[]
              ).map((u) => (
                <button
                  key={u.key}
                  onClick={() => setHeightUnit(u.key)}
                  className={`p-5 rounded-xl border text-center transition-all ${
                    heightUnit === u.key
                      ? "border-[#1A1916] dark:border-[#f7f6f3] bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                      : "border-transparent hover:border-[#1A1916] dark:border-[#f7f6f3] dark:hover:border-[#f7f6f3]"
                  }`}>
                  <div className="font-mono text-3xl font-medium mb-1">
                    {u.sub}
                  </div>
                  <div className="text-sm font-semibold">{u.label}</div>
                </button>
              ))}
            </div>

            <button
              onClick={saveUnits}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] font-bold text-sm hover:opacity-85 transition-opacity disabled:opacity-60">
              {saving ? "Saving…" : "Save Units"}
            </button>
          </Card>
        </BlurFade>
      )}

      {/* ── Appearance tab ── */}
      {tab === "appearance" && (
        <BlurFade>
          <Card className="p-6 flex flex-col gap-8">
            <div>
              <div className="text-sm font-bold mb-1">Theme</div>
              <p className="text-xs text-[#9B9895] leading-relaxed mb-5">
                Choose between light mode, dark mode, or follow your system
                preference.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "light" as const, title: "Light", Icon: Sun },
                  { key: "dark" as const, title: "Dark", Icon: Moon },
                  { key: "system" as const, title: "System", Icon: Monitor },
                ].map((opt) => {
                  const active = theme === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        const ox = rect.left + rect.width / 2;
                        const oy = rect.top + rect.height / 2;
                        animateThemeTransition(
                          () => {
                            setTheme(opt.key);
                            // Apply class immediately inside the transition
                            const next = resolveTheme(opt.key);
                            if (next === "dark") {
                              document.documentElement.classList.add("dark");
                            } else {
                              document.documentElement.classList.remove("dark");
                            }
                          },
                          ox,
                          oy,
                          450,
                        );
                      }}
                      className={[
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        active
                          ? "border-[#1A1916] dark:border-[#f7f6f3] bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                          : "border-transparent hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-white/10",
                      ].join(" ")}>
                      <opt.Icon
                        size={20}
                        className={
                          active
                            ? "text-white dark:text-[#1a1916]"
                            : "text-[#1A1916] dark:text-[#f7f6f3]"
                        }
                      />
                      <span className="font-bold text-sm">{opt.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-sm font-bold mb-1">Navigation</div>
              <p className="text-xs text-[#9B9895] leading-relaxed mb-5">
                Pick how the side navigation looks on desktop. The mobile bottom
                bar is always shown.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: "floating" as const,
                    title: "Floating sidebar",
                    sub: "Wider panel with labels",
                    Icon: LayoutPanelLeft,
                  },
                  {
                    key: "pill" as const,
                    title: "Compact pill",
                    sub: "Narrow vertical pill, icons only",
                    Icon: PanelLeft,
                  },
                ].map((opt) => {
                  const active = navbarStyle === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setNavbarStyle(opt.key as NavbarStyle)}
                      className={[
                        "flex flex-col gap-3 text-left p-4 rounded-2xl border transition-all",
                        active
                          ? "border-[#1A1916] dark:border-[#f7f6f3] bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                          : "border-transparent hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-white/10",
                      ].join(" ")}>
                      {/* icon + title row */}
                      <div className="flex items-center gap-2">
                        <opt.Icon
                          size={16}
                          className={
                            active
                              ? "text-white dark:text-[#1a1916]"
                              : "text-[#1A1916] dark:text-[#f7f6f3]"
                          }
                        />
                        <span className="font-bold text-sm">{opt.title}</span>
                        {active && (
                          <ChevronRight
                            size={13}
                            className="ml-auto text-white dark:text-[#1a1916]/60"
                          />
                        )}
                      </div>
                      {/* sub */}
                      <p
                        className={`text-[11px] leading-relaxed ${active ? "text-white/70 dark:text-[#1a1916]/60" : "text-[#9B9895]"}`}>
                        {opt.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-[#9B9895] italic">
              Saves instantly. Your choice is remembered on this device.
            </p>
          </Card>
        </BlurFade>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <SettingsPageContent />
    </React.Suspense>
  );
}
