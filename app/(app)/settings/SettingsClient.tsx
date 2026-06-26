"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { useApp } from "@/app/context/AppContext";
import { useToast } from "@/app/components/ToastContainer";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { signOut } from "@/app/lib/auth";
import { calcTDEE } from "@/app/lib/tdee";
import { GOALS } from "@/app/lib/constants";
import { kgToLbs, lbsToKg, displayHeight } from "@/app/lib/units";
import BlurFade from "@/app/components/animations/BlurFade";
import { Card } from "@/app/components/ui/card";
import { EditProfileModal } from "@/app/components/EditProfileModal";
import {
  usePrefsStore,
  resolveTheme,
  type NavbarStyle,
  type Theme,
} from "@/app/store/prefsStore";
import { motion } from "framer-motion";
import { animateThemeTransition } from "@/app/components/ThemeToggle";
import {
  LayoutPanelLeft,
  PanelLeft,
  ChevronRight,
  Monitor,
  Sun,
  Moon,
  Pencil,
  Key,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getIdToken } from "firebase/auth";
import type {
  GoalKey,
  IntensityKey,
  WeightUnit,
  HeightUnit,
} from "@/app/types";

type Tab = "profile" | "goals" | "appearance" | "units" | "ai";

interface IntensityOption {
  key: IntensityKey;
  pct: string;
}

const INTENSITIES: IntensityOption[] = [
  { key: "mildCut", pct: "9%" },
  { key: "weightloss", pct: "19%" },
  { key: "extremeCut", pct: "37%" },
];

function getIntensityLabel(
  key: string,
  goal: GoalKey,
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

function SettingsPageContent() {
  const { profile, isLoading } = useAuthGuard();
  const { state, setProfile, logWeight } = useApp();
  const { user } = useAuthStore();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as Tab | null) ?? "profile";
  const [tab, setTab] = useState<Tab>(
    ["profile", "goals", "appearance", "units", "ai"].includes(initialTab)
      ? initialTab
      : "profile",
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [editProfileOpen, setEditProfileOpen] = useState<boolean>(false);

  // ── AI Key state ──────────────────────────────────────────────────
  // `apiKeyInput`  — controlled value of the password input (cleared after save)
  // `apiKeyPreview` — masked token returned by the server ("AIza••••abcd")
  // `apiKeyHasKey`  — whether the user has a key stored in Firestore
  // `showKey`       — toggles the input from type=password to type=text
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyPreview, setApiKeyPreview] = useState<string | null>(null);
  const [apiKeyHasKey, setApiKeyHasKey] = useState(false);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyDeleting, setApiKeyDeleting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySuccess, setApiKeySuccess] = useState(false);
  // True when server detects a pre-encryption plaintext key stored in Firestore
  const [apiKeyNeedsReEncrypt, setApiKeyNeedsReEncrypt] = useState(false);

  // Load key status (preview only, never the full key) when the AI tab mounts
  useEffect(() => {
    if (tab !== "ai" || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getIdToken(user);
        const res = await fetch("/api/user/api-key", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          hasKey: boolean;
          preview: string | null;
          needsReEncrypt?: boolean;
        };
        if (!cancelled) {
          setApiKeyHasKey(data.hasKey);
          setApiKeyPreview(data.preview);
          setApiKeyNeedsReEncrypt(data.needsReEncrypt ?? false);
        }
      } catch {
        // Non-fatal — the tab will just show the empty state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, user]);

  async function saveApiKey() {
    if (!user) return;
    setApiKeyError(null);
    setApiKeySuccess(false);

    const trimmed = apiKeyInput.trim();
    // Client-side pre-validation (same regex as server)
    if (!/^AIza[0-9A-Za-z\-_]{35}$/.test(trimmed)) {
      setApiKeyError(
        'Invalid key format. Gemini keys start with "AIza" and are 39 characters long.',
      );
      return;
    }

    setApiKeySaving(true);
    try {
      const token = await getIdToken(user);
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Only the key itself goes in the body — no uid (server uses token)
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        preview?: string;
        error?: string;
      };
      if (!res.ok || !data.success) {
        setApiKeyError(data.error ?? "Failed to save key. Please try again.");
      } else {
        // Clear the raw key from state IMMEDIATELY — we only keep the preview
        setApiKeyInput("");
        setApiKeyHasKey(true);
        setApiKeyPreview(data.preview ?? null);
        setApiKeySuccess(true);
        toast("API key saved ✓");
      }
    } catch {
      setApiKeyError("Network error. Please try again.");
    } finally {
      setApiKeySaving(false);
    }
  }

  async function removeApiKey() {
    if (!user) return;
    setApiKeyError(null);
    setApiKeySuccess(false);
    setApiKeyDeleting(true);
    try {
      const token = await getIdToken(user);
      const res = await fetch("/api/user/api-key", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setApiKeyHasKey(false);
        setApiKeyPreview(null);
        setApiKeyInput("");
        setApiKeyNeedsReEncrypt(false);
        toast("API key removed ✓");
      } else {
        setApiKeyError(data.error ?? "Failed to remove key. Please try again.");
      }
    } catch {
      setApiKeyError("Network error — could not remove key. Please try again.");
    } finally {
      setApiKeyDeleting(false);
    }
  }

  const [goal, setGoal] = useState<GoalKey>(state.profile?.goal || "maintain");
  const [intensity, setIntensity] = useState<IntensityKey>(
    state.profile?.intensity || "weightloss",
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
    // The Goals tab also lets the user update their weight as
    // part of TDEE recalibration. Treat a real weight change as
    // a weigh-in so the progress page picks it up immediately —
    // same bidirectional contract as the Edit profile modal.
    const previousWeight = state.profile?.weight ?? 0;
    if (Math.abs(weightKg - previousWeight) > 0.05) {
      await logWeight(weightKg, weightUnit);
    }
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
    { key: "appearance", label: "Style" },
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
            className={`relative flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
              tab === t.key
                ? "text-[#1A1916] dark:text-[#f7f6f3]"
                : "text-[#9B9895] hover:text-[#1A1916] dark:text-[#f7f6f3] dark:hover:text-white"
            }`}>
            {tab === t.key && (
              <motion.div
                layoutId="active-settings-tab"
                className="absolute inset-0 bg-card rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === "profile" && (
        <BlurFade>
          {/* Identity card */}
          <Card className="p-5 mb-5">
            <div className="flex flex-row items-center gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="rounded-full border-2 border-orange-400"
                    style={{ width: 64, height: 64 }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {(state.profile?.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                  <CheckCircle2 size={10} className="text-white" />
                </div>
              </div>

              {/* Name + meta */}
              <div className="flex flex-col min-w-0 gap-1">
                <div className="font-bold text-lg truncate leading-tight">
                  {state.profile?.name
                    ? state.profile.name.charAt(0).toUpperCase() +
                      state.profile.name.slice(1)
                    : "New User"}
                </div>
                <div className="text-xs text-[#9B9895] truncate">
                  {user?.email || "No email set"}
                </div>
                <div className="inline-flex w-fit items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-accent dark:text-foreground">
                  {state.profile?.goal === "bulk"
                    ? "💪 Bulking"
                    : state.profile?.goal === "cut"
                      ? "🔥 Cutting"
                      : "⚖️ Maintaining"}
                </div>
              </div>

              {/* Vertical divider */}
              <div className="self-stretch w-px bg-border/60 mx-1" />

              {/* Stats inline */}
              <div className="flex flex-row items-center gap-5 flex-1">
                {[
                  {
                    label: "Age",
                    val: `${state.profile?.age ?? "—"}`,
                    sub: "yrs",
                  },
                  {
                    label: "Weight",
                    val:
                      state.profile?.weightUnit === "lbs"
                        ? `${kgToLbs(state.profile?.weight ?? 0)}`
                        : `${Math.round(state.profile?.weight ?? 0)}`,
                    sub: state.profile?.weightUnit === "lbs" ? "lbs" : "kg",
                  },
                  {
                    label: "Height",
                    val: state.profile
                      ? displayHeight(
                          state.profile.height,
                          state.profile.heightUnit,
                        )
                      : "—",
                    sub:
                      state.profile?.heightUnit === "imperial" ? "ft/in" : "cm",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895]">
                      {item.label}
                    </span>
                    <span className="font-bold text-sm leading-tight tabular-nums">
                      {item.val}
                      <span className="text-[10px] font-medium text-[#9B9895] ml-1">
                        {item.sub}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setEditProfileOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground transition-all px-2.5 py-1.5 rounded-lg flex-shrink-0">
                <Pencil size={11} />
                Edit
              </button>
            </div>

            {/* Energy targets — slim horizontal row */}
            <div className="flex flex-row items-center justify-between gap-4 mt-5 pt-4 border-t border-border/40">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/40">
                  Daily Targets
                </span>
              </div>

              <div className="flex items-baseline gap-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[9px] font-medium text-foreground/40 uppercase tracking-wider">
                    TDEE
                  </span>
                  <span className="font-bricolage text-base font-medium text-foreground/80 tabular-nums leading-none">
                    {state.profile?.tdee ?? "—"}
                  </span>
                </div>

                <span className="text-foreground/30">·</span>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-[9px] font-medium text-foreground/40 uppercase tracking-wider">
                    Target
                  </span>
                  <span className="font-bricolage text-base font-medium text-foreground tabular-nums leading-none">
                    {state.profile?.calTarget ?? "—"}
                  </span>
                  <span className="text-[9px] text-foreground/40 font-medium">
                    kcal
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {[
                  { label: "P", val: `${state.profile?.protein ?? 0}g` },
                  { label: "C", val: `${state.profile?.carbs ?? 0}g` },
                  { label: "F", val: `${state.profile?.fat ?? 0}g` },
                ].map((m) => (
                  <div key={m.label} className="flex items-baseline gap-1">
                    <span className="text-[9px] font-medium text-foreground/40">
                      {m.label}
                    </span>
                    <span className="text-xs font-medium text-foreground/70 tabular-nums">
                      {m.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="p-6 flex flex-col gap-8 mb-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Key size={16} className="text-[#9B9895]" />
                <div className="text-sm font-bold">Your Gemini API Key</div>
              </div>
              <p className="text-xs text-[#9B9895] leading-relaxed">
                Use your own key for AI food and workout logging instead of the
                shared key. Your key is stored securely and{" "}
                <strong>never returned to this browser</strong> after saving.
              </p>
            </div>

            {/* Security upgrade banner — shown when plaintext key detected */}
            {apiKeyNeedsReEncrypt && (
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                <AlertCircle
                  size={14}
                  className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                />
                <div>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">
                    Security upgrade required
                  </div>
                  <p className="text-xs text-amber-600/90 dark:text-amber-400/80 leading-relaxed">
                    Your key was saved before encryption was enabled. Please
                    re-enter it below to encrypt it at rest.
                  </p>
                </div>
              </div>
            )}

            {/* Current key status */}
            {apiKeyHasKey && apiKeyPreview && (
              <div className="flex items-center justify-between gap-3 bg-background rounded-xl px-4 py-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] mb-0.5">
                    Stored key{" "}
                    {!apiKeyNeedsReEncrypt && (
                      <span className="normal-case font-normal text-emerald-600 dark:text-emerald-400 ml-1">
                        · encrypted
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-sm tracking-widest">
                    {apiKeyPreview}
                  </div>
                </div>
                <button
                  id="settings-ai-remove-key"
                  onClick={removeApiKey}
                  disabled={apiKeyDeleting}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#EF4444] hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50">
                  <Trash2 size={13} />
                  {apiKeyDeleting ? "Removing…" : "Remove"}
                </button>
              </div>
            )}

            {/* Input */}
            <div>
              <label
                htmlFor="settings-ai-key-input"
                className="text-xs font-bold text-[#9B9895] uppercase tracking-wider mb-2 block">
                {apiKeyHasKey ? "Replace key" : "Enter key"}
              </label>
              <div className="relative">
                <input
                  id="settings-ai-key-input"
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setApiKeyError(null);
                    setApiKeySuccess(false);
                  }}
                  placeholder="AIza…"
                  // Prevent password managers and spell-checkers from storing the key
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-1p-ignore
                  data-lpignore="true"
                  data-gramm="false"
                  className="w-full font-mono text-sm px-3.5 py-3 pr-12 border border-transparent rounded-lg bg-background focus:bg-card focus:border-border outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? "Hide key" : "Show key"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B9895] hover:text-foreground transition-colors">
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Feedback */}
              {apiKeyError && (
                <div className="flex items-start gap-2 mt-2.5 text-xs text-[#EF4444]">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                  {apiKeyError}
                </div>
              )}
              {apiKeySuccess && !apiKeyError && (
                <div className="flex items-center gap-2 mt-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} />
                  Key saved successfully.
                </div>
              )}
            </div>

            {/* Save button */}
            <button
              id="settings-ai-save-key"
              onClick={saveApiKey}
              disabled={apiKeySaving || !apiKeyInput.trim()}
              className="w-full py-3.5 rounded-xl bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] font-bold text-sm hover:opacity-85 transition-opacity disabled:opacity-40">
              {apiKeySaving
                ? "Saving…"
                : apiKeyHasKey
                  ? "Replace Key"
                  : "Save Key"}
            </button>

            {/* Security note */}
            <p className="text-[11px] text-[#9B9895] leading-relaxed">
              🔒 Your key is stored in Firestore under your account and is only
              used server-side to call the Gemini API. It is{" "}
              <strong>never exposed to the browser</strong> after saving. To
              revoke access, remove it here or rotate it in{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors">
                Google AI Studio
              </a>
              .
            </p>
          </Card>

          {user && (
            <button
              onClick={handleSignOut}
              className="w-full py-3.5 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
              Sign out
            </button>
          )}
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
                  className={`relative py-3 rounded-xl border text-center text-sm font-bold transition-colors ${
                    workoutsPerWeek === n
                      ? "border-transparent bg-foreground text-background"
                      : "border-foreground text-foreground"
                  }`}>
                  {workoutsPerWeek === n && (
                    <motion.div
                      layoutId="active-workouts"
                      className="absolute inset-0 rounded-xl bg-foreground text-background"
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 28,
                      }}
                    />
                  )}
                  <span className="relative z-10">{n}</span>
                </button>
              ))}
            </div>

            <div className="text-sm font-bold mb-1">Weight</div>
            <p className="text-xs text-[#9B9895] mb-4 leading-relaxed">
              Saving will log this as a new weigh-in.
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
                  className={`relative p-5 rounded-xl border text-center transition-colors ${
                    goal === g.key
                      ? "border-transparent bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                      : "border-transparent hover:border-[#1A1916] dark:hover:border-[#f7f6f3]"
                  }`}>
                  {goal === g.key && (
                    <motion.div
                      layoutId="active-goal"
                      className="absolute inset-0 rounded-xl  bg-[#1A1916] dark:bg-[#f7f6f3]  "
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 28,
                      }}
                    />
                  )}
                  <div className="relative z-10 text-3xl mb-2">{g.emoji}</div>
                  <div className="relative z-10 text-sm font-bold">
                    {g.label}
                  </div>
                  <div
                    className={`relative z-10 text-xs mt-1 ${goal === g.key ? "text-white dark:text-[#1a1916]/60" : "text-[#9B9895]"}`}>
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
                      className={`relative flex items-center gap-4 p-4 rounded-xl border text-left transition-colors ${
                        intensity === i.key
                          ? "border-transparent bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                          : "border-transparent hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-[#f7f6f3]"
                      }`}>
                      {intensity === i.key && (
                        <motion.div
                          layoutId="active-intensity"
                          className="absolute inset-0 rounded-xl  bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                          transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 28,
                          }}
                        />
                      )}
                      <div
                        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          intensity === i.key
                            ? "bg-card text-[#1A1916] dark:text-[#f7f6f3]"
                            : "bg-background"
                        }`}>
                        {goal === "cut" ? "−" : "+"}
                        {i.pct}
                      </div>
                      <div className="relative z-10">
                        <div className="font-bold text-sm">
                          {getIntensityLabel(i.key, goal).label}
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${intensity === i.key ? "text-white dark:text-[#1a1916]/70" : "text-[#9B9895]"}`}>
                          {getIntensityLabel(i.key, goal).desc}
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
                  className={`relative p-5 rounded-xl border text-center transition-colors ${
                    weightUnit === u.key
                      ? "border-transparent bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                      : "border-transparent hover:border-[#1A1916] dark:border-[#f7f6f3] dark:hover:border-[#f7f6f3]"
                  }`}>
                  {weightUnit === u.key && (
                    <motion.div
                      layoutId="active-weight-unit"
                      className="absolute inset-0 rounded-xl bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 28,
                      }}
                    />
                  )}
                  <div className="relative z-10 font-mono text-3xl font-medium mb-1">
                    {u.sub}
                  </div>
                  <div className="relative z-10 text-sm font-semibold">
                    {u.label}
                  </div>
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
                  className={`relative p-5 rounded-xl border text-center transition-colors ${
                    heightUnit === u.key
                      ? "border-transparent bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                      : "border-transparent hover:border-[#1A1916] dark:border-[#f7f6f3] dark:hover:border-[#f7f6f3]"
                  }`}>
                  {heightUnit === u.key && (
                    <motion.div
                      layoutId="active-height-unit"
                      className="absolute inset-0 rounded-xl  bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 28,
                      }}
                    />
                  )}
                  <div className="relative z-10 font-mono text-3xl font-medium mb-1">
                    {u.sub}
                  </div>
                  <div className="relative z-10 text-sm font-semibold">
                    {u.label}
                  </div>
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
                        const rect = (
                          e.currentTarget as HTMLButtonElement
                        ).getBoundingClientRect();
                        const ox = rect.left + rect.width / 2;
                        const oy = rect.top + rect.height / 2;
                        animateThemeTransition(
                          () => {
                            setTheme(opt.key);
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
                        "relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors",
                        active
                          ? "border-transparent bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                          : "border-transparent hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-white/10",
                      ].join(" ")}>
                      {active && (
                        <motion.div
                          layoutId="active-theme"
                          className="absolute inset-0 rounded-2xl bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                          transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 28,
                          }}
                        />
                      )}
                      <opt.Icon
                        size={20}
                        className={[
                          "relative z-10",
                          active
                            ? "text-white dark:text-[#1a1916]"
                            : "text-[#1A1916] dark:text-[#f7f6f3]",
                        ].join(" ")}
                      />
                      <span className="relative z-10 font-bold text-sm">
                        {opt.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:block">
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
                        "relative flex flex-col gap-3 text-left p-4 rounded-2xl border transition-colors",
                        active
                          ? "border-transparent bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                          : "border-transparent hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-white/10",
                      ].join(" ")}>
                      {active && (
                        <motion.div
                          layoutId="active-nav-style"
                          className="absolute inset-0 rounded-2xl  bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                          transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 28,
                          }}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-2">
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
                      <p
                        className={[
                          "relative z-10 text-[11px] leading-relaxed",
                          active
                            ? "text-white/70 dark:text-[#1a1916]/60"
                            : "text-[#9B9895]",
                        ].join(" ")}>
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

      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
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
