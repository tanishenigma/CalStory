"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Profile, HeightUnit, WeightUnit, VolumeUnit } from "@/app/types";

interface UnitsTabProps {
  profile: Profile;
  weightUnit: WeightUnit;
  setWeightUnit: (u: WeightUnit) => void;
  heightUnit: HeightUnit;
  setHeightUnit: (u: HeightUnit) => void;
  volumeUnit: VolumeUnit;
  setVolumeUnit: (u: VolumeUnit) => void;
  setProfile: (p: Profile) => Promise<void>;
}

export function UnitsTab({
  profile,
  weightUnit,
  setWeightUnit,
  heightUnit,
  setHeightUnit,
  volumeUnit,
  setVolumeUnit,
  setProfile,
}: UnitsTabProps) {
  // Auto-save whenever the user changes a unit preference. We skip the
  // initial render (units match the profile) and any no-op re-render,
  // so the profile is only persisted when a value actually changes.
  useEffect(() => {
    if (
      weightUnit === profile.weightUnit &&
      heightUnit === profile.heightUnit &&
      volumeUnit === profile.volumeUnit
    ) {
      return;
    }
    toast.promise(setProfile({ ...profile, weightUnit, heightUnit, volumeUnit }), {
      loading: "Saving unit preferences…",
      success: "Unit preferences saved",
      error: "Could not save unit preferences",
    });
  }, [weightUnit, heightUnit, volumeUnit]);

  return (
    <div>
      <div className="mb-2 text-sm font-bold">Weight Unit</div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {(
          [
            { key: "kg", label: "Kilograms", sub: "kg" },
            { key: "lbs", label: "Pounds", sub: "lbs" },
          ] as { key: WeightUnit; label: string; sub: string }[]
        ).map((u) => (
          <button
            key={u.key}
            onClick={() => setWeightUnit(u.key)}
              className={`relative min-h-[5.5rem] rounded-xl border p-3 text-center transition-colors ${
              weightUnit === u.key
                ? "border-transparent bg-foreground text-background"
                : "border-foreground/10 hover:border-foreground dark:border-foreground/10 dark:hover:border-foreground"
            }`}>
            {weightUnit === u.key && (
              <motion.div
                layoutId="active-weight-unit"
                initial={false}
                className="absolute inset-0 rounded-xl bg-foreground text-background"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <div className="relative z-10 mb-0.5 font-mono text-2xl font-medium">
              {u.sub}
            </div>
            <div className="relative z-10 text-xs font-semibold sm:text-sm">{u.label}</div>
          </button>
        ))}
      </div>

      <div className="mb-2 text-sm font-bold">Height Unit</div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {(
          [
            { key: "metric", label: "Centimetres", sub: "cm" },
            { key: "imperial", label: "Feet & Inches", sub: "ft/in" },
          ] as { key: HeightUnit; label: string; sub: string }[]
        ).map((u) => (
          <button
            key={u.key}
            onClick={() => setHeightUnit(u.key)}
              className={`relative min-h-[5.5rem] rounded-xl border p-3 text-center transition-colors ${
              heightUnit === u.key
                ? "border-transparent bg-foreground text-background"
                : "border-foreground/10 hover:border-foreground dark:border-foreground/10 dark:hover:border-foreground"
            }`}>
            {heightUnit === u.key && (
              <motion.div
                layoutId="active-height-unit"
                initial={false}
                className="absolute inset-0 rounded-xl  bg-foreground text-background"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <div className="relative z-10 mb-0.5 font-mono text-2xl font-medium">
              {u.sub}
            </div>
            <div className="relative z-10 text-xs font-semibold sm:text-sm">{u.label}</div>
          </button>
        ))}
      </div>

      <div className="mb-2 text-sm font-bold">Volume Unit</div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {(
          [
            { key: "ml", label: "Millilitres / Litres", sub: "ml / L" },
            { key: "floz", label: "Fluid Ounces", sub: "fl oz" },
          ] as { key: VolumeUnit; label: string; sub: string }[]
        ).map((u) => (
          <button
            key={u.key}
            onClick={() => setVolumeUnit(u.key)}
              className={`relative min-h-[5.5rem] rounded-xl border p-3 text-center transition-colors ${
              volumeUnit === u.key
                ? "border-transparent bg-foreground text-background"
                : "border-foreground/10 hover:border-foreground dark:border-foreground/10 dark:hover:border-foreground"
            }`}>
            {volumeUnit === u.key && (
              <motion.div
                layoutId="active-volume-unit"
                initial={false}
                className="absolute inset-0 rounded-xl bg-foreground text-background"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <div className="relative z-10 mb-0.5 font-mono text-2xl font-medium">
              {u.sub}
            </div>
            <div className="relative z-10 text-xs font-semibold sm:text-sm">{u.label}</div>
          </button>
        ))}
      </div>

    </div>
  );
}
