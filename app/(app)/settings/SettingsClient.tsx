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
} from "@/app/types";
import { SettingsTabs } from "./components/SettingsTabs";
import { ProfileTab } from "./components/ProfileTab";
import { GoalsTab } from "./components/GoalsTab";
import { UnitsTab } from "./components/UnitsTab";
import { AppearanceTab } from "./components/AppearanceTab";
import type { Tab } from "./components/types";

const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "goals", label: "Goals" },
  { key: "appearance", label: "Style" },
  { key: "units", label: "Units" },
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

  // Goals tab form state lives in the parent so the user can flip tabs
  // and come back without losing their edits. It mirrors the prior
  // single-file implementation exactly.
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

  if (isLoading || !profile) return <Spinner />;

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-10">
      <BlurFade>
        <div className="pt-2">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-[#9B9895]">
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
          setProfile={setProfile}
        />
      )}

      {tab === "appearance" && <AppearanceTab />}

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
