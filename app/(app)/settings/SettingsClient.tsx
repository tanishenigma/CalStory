"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { useApp } from "@/app/context/AppContext";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { signOut } from "@/app/lib/auth";
import { kgToLbs } from "@/app/lib/units";
import BlurFade from "@/app/components/animations/BlurFade";
import { EditProfileModal } from "@/app/components/EditProfileModal";
import type {
  GoalKey,
  IntensityKey,
  WeightUnit,
  HeightUnit,
  VolumeUnit,
} from "@/app/types";
import { SettingsTabs } from "./components/SettingsTabs";
import { ProfileTab } from "./components/ProfileTab";
import { GoalsTab } from "./components/GoalsTab";
import { UnitsTab } from "./components/UnitsTab";
import { AppearanceTab } from "./components/AppearanceTab";
import { DeleteAccountModal } from "./components/DeleteAccountModal";
import type { Tab } from "./components/types";
import { User2, TargetIcon, Brush, Ruler } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "profile", label: "Profile", icon: User2 },
  { key: "goals", label: "Goals", icon: TargetIcon },
  { key: "appearance", label: "Style", icon: Brush },
  { key: "units", label: "Units", icon: Ruler },
];

function SettingsPageContent() {
  const { profile, isLoading } = useAuthGuard();
  const { state, setProfile, logWeight } = useApp();
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as Tab | null) ?? "profile";
  const [tab, setTab] = useState<Tab>(
    ["profile", "goals", "appearance", "units", "ai"].includes(initialTab)
      ? initialTab
      : "profile",
  );
  const [editProfileOpen, setEditProfileOpen] = useState<boolean>(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState<boolean>(false);

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

  // Target weight is the *goal* the user is working toward. Kept
  // separate from `weight` (current weigh-in) so saving a new target
  // doesn't silently shift TDEE math or write a bogus weigh-in.
  // Default to the current weight so the field is pre-filled and
  // "no change" → save still leaves the user's target intact.
  const initialTargetDisplay =
    state.profile?.weightUnit === "lbs"
      ? kgToLbs(state.profile?.targetWeight ?? state.profile?.weight ?? 0)
      : (state.profile?.targetWeight ?? state.profile?.weight ?? 0);
  const [targetWeightInput, setTargetWeightInput] = useState<string>(
    String(initialTargetDisplay),
  );

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    state.profile?.weightUnit || "kg",
  );
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(
    state.profile?.heightUnit || "metric",
  );
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>(
    state.profile?.volumeUnit ?? "ml",
  );

  if (isLoading || !profile) return <Spinner variant="settings" />;

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-10">
      <BlurFade>
        <div className="pt-2">
          <h1 className="text-3xl font-bold ">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile, goals and preferences
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.05}>
        <SettingsTabs active={tab} onChange={setTab} tabs={TABS} />
      </BlurFade>

      {tab === "profile" && (
        <ProfileTab
          user={user}
          profile={state.profile}
          onEditProfile={() => setEditProfileOpen(true)}
          onSignOut={handleSignOut}
          onDeleteAccount={() => setDeleteAccountOpen(true)}
        />
      )}

      {tab === "goals" && (
        <GoalsTab
          profile={state.profile!}
          goal={goal}
          setGoal={setGoal}
          intensity={intensity}
          setIntensity={setIntensity}
          steps={steps}
          setSteps={setSteps}
          workoutsPerWeek={workoutsPerWeek}
          setWorkoutsPerWeek={setWorkoutsPerWeek}
          weightInput={weightInput}
          setWeightInput={setWeightInput}
          targetWeightInput={targetWeightInput}
          setTargetWeightInput={setTargetWeightInput}
          weightUnit={weightUnit}
          setProfile={setProfile}
          logWeight={logWeight}
        />
      )}

      {tab === "units" && (
        <UnitsTab
          profile={state.profile!}
          weightUnit={weightUnit}
          setWeightUnit={setWeightUnit}
          heightUnit={heightUnit}
          setHeightUnit={setHeightUnit}
          volumeUnit={volumeUnit}
          setVolumeUnit={setVolumeUnit}
          setProfile={setProfile}
        />
      )}

      {tab === "appearance" && <AppearanceTab />}

      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />

      <DeleteAccountModal
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
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
