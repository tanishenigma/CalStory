"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/app/components/ui/card";
import BlurFade from "@/app/components/animations/BlurFade";
import { useToast } from "@/app/components/ToastContainer";
import type { Profile, HeightUnit, WeightUnit } from "@/app/types";

interface UnitsTabProps {
  profile: Profile;
  weightUnit: WeightUnit;
  setWeightUnit: (u: WeightUnit) => void;
  heightUnit: HeightUnit;
  setHeightUnit: (u: HeightUnit) => void;
  setProfile: (p: Profile) => Promise<void>;
}

export function UnitsTab({
  profile,
  weightUnit,
  setWeightUnit,
  heightUnit,
  setHeightUnit,
  setProfile,
}: UnitsTabProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  async function saveUnits() {
    setSaving(true);
    await setProfile({ ...profile, weightUnit, heightUnit });
    setSaving(false);
    toast("Units saved ✓");
  }

  return (
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
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
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
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
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
  );
}
