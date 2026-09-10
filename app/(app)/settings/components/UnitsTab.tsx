"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    setProfile({ ...profile, weightUnit, heightUnit, volumeUnit })
      .catch(() => {})
      .finally(() => setSaving(false));
  }, [weightUnit, heightUnit, volumeUnit]);

  return (
    <div>
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
            <div className="relative z-10 font-mono text-3xl font-medium mb-1">
              {u.sub}
            </div>
            <div className="relative z-10 text-sm font-semibold">{u.label}</div>
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
            <div className="relative z-10 font-mono text-3xl font-medium mb-1">
              {u.sub}
            </div>
            <div className="relative z-10 text-sm font-semibold">{u.label}</div>
          </button>
        ))}
      </div>

      <div className="text-sm font-bold mb-4">Volume Unit</div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {(
          [
            { key: "ml", label: "Millilitres / Litres", sub: "ml / L" },
            { key: "floz", label: "Fluid Ounces", sub: "fl oz" },
          ] as { key: VolumeUnit; label: string; sub: string }[]
        ).map((u) => (
          <button
            key={u.key}
            onClick={() => setVolumeUnit(u.key)}
            className={`relative p-5 rounded-xl border text-center transition-colors ${
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
            <div className="relative z-10 font-mono text-2xl font-medium mb-1">
              {u.sub}
            </div>
            <div className="relative z-10 text-sm font-semibold">{u.label}</div>
          </button>
        ))}
      </div>

      {saving && (
        <p className="text-center text-xs text-muted-foreground">Saving…</p>
      )}
    </div>
  );
}
