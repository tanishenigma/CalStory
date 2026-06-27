"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { useApp } from "@/app/context/AppContext";
import { useToast } from "@/app/components/ToastContainer";
import {
  kgToLbs,
  lbsToKg,
  cmToFtInParts,
  displayHeight,
} from "@/app/lib/units";
import { dobToAge, maxDobIso, minDobIso, ageToDobIso } from "@/app/lib/age";
import { calcTDEE } from "@/app/lib/tdee";
import type { MouseEvent } from "react";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal for editing the user's date-of-birth, current weight, and
 * height from the settings page.
 *
 * - Age is derived from the DOB and read-only in this view — the
 *   user picks a date and we show the resulting age next to the
 *   input.
 * - Height respects the user's stored `heightUnit` (metric cm vs
 *   imperial ft+in) and is always normalised to cm before being
 *   written to the profile. BMR depends on height, so a height
 *   change also forces a TDEE / macro recompute.
 * - When weight changes, a new `WeightLog` entry is written and
 *   the change is mirrored onto `profile.weight`, so the progress
 *   page chart updates immediately. This is the "settings ↔
 *   progress" sync the spec calls for.
 */
export function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { state, setProfile, logWeight } = useApp();
  const toast = useToast();
  const profile = state.profile;

  // Local form state — initialised from the profile the moment
  // the modal opens, so closing & re-opening always reflects the
  // latest saved values.
  const [dob, setDob] = useState<string>("");
  const [weightInput, setWeightInput] = useState<string>("");
  // Height is edited in the user's display unit but always
  // normalised to cm on save. Imperial needs two inputs (feet +
  // inches); metric needs a single cm number.
  const [heightCmInput, setHeightCmInput] = useState<string>("");
  const [heightFeet, setHeightFeet] = useState<string>("");
  const [heightInches, setHeightInches] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !profile) return;
    // Prefer the stored DOB; fall back to deriving one from the
    // numeric age (legacy profiles created before the DOB field
    // existed will only have `age`).
    const initialDob = profile.dob ?? ageToDobIso(profile.age) ?? "";
    setDob(initialDob);
    const initialWeightDisplay =
      profile.weightUnit === "lbs" ? kgToLbs(profile.weight) : profile.weight;
    setWeightInput(String(initialWeightDisplay));
    // Prefill height in the user's preferred unit. The internal
    // `profile.height` is always stored in cm, so we convert
    // outward for display.
    if (profile.heightUnit === "imperial") {
      const { feet, inches } = cmToFtInParts(profile.height);
      setHeightFeet(String(feet));
      setHeightInches(String(inches));
      setHeightCmInput("");
    } else {
      setHeightCmInput(String(profile.height));
      setHeightFeet("");
      setHeightInches("");
    }
  }, [open, profile]);

  if (!open || !profile) return null;

  // Local alias after the early-return guard so the rest of the
  // component body (and any closures defined below) can treat
  // `profile` as non-null without using `!`.
  const currentProfile = profile;

  const weightUnit = currentProfile.weightUnit;
  const inputWeightKg =
    weightUnit === "lbs" ? lbsToKg(Number(weightInput)) : Number(weightInput);

  // Normalise height to cm regardless of which unit the user is
  // editing in. Returned height is `null` when the inputs are
  // empty or non-numeric so the caller can show the right
  // validation message.
  const inputHeightCm = (() => {
    if (currentProfile.heightUnit === "imperial") {
      const ft = Number(heightFeet);
      const inches = Number(heightInches);
      if (
        !Number.isFinite(ft) ||
        !Number.isFinite(inches) ||
        (ft === 0 && inches === 0)
      ) {
        return null;
      }
      return Math.round((ft * 12 + inches) * 2.54);
    }
    const cm = Number(heightCmInput);
    return Number.isFinite(cm) && cm > 0 ? cm : null;
  })();

  const ageFromDob = dobToAge(dob);
  const weightChanged =
    Number.isFinite(inputWeightKg) &&
    Math.abs(inputWeightKg - currentProfile.weight) > 0.05;
  const heightChanged =
    inputHeightCm !== null &&
    Math.abs(inputHeightCm - currentProfile.height) > 0.1;
  const dobChanged = (currentProfile.dob ?? "") !== dob;
  const anyChange = dobChanged || weightChanged || heightChanged;

  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !saving) onClose();
  }

  async function save() {
    if (saving) return;
    if (!Number.isFinite(inputWeightKg) || inputWeightKg <= 0) {
      toast("Enter a valid weight", "⚠️");
      return;
    }
    if (inputHeightCm === null) {
      toast("Enter a valid height", "⚠️");
      return;
    }
    if (ageFromDob === null) {
      toast("Pick a valid date of birth", "⚠️");
      return;
    }
    setSaving(true);

    try {
      // 1. Recompute TDEE / macro split whenever any of age,
      //    weight, or height changed. All three feed BMR
      //    (Mifflin–St Jeor) and weight also feeds the macro
      //    weight calculation, so we batch the writes.
      if (anyChange) {
        const base = {
          ...currentProfile,
          dob,
          age: ageFromDob,
          weight: inputWeightKg,
          height: inputHeightCm,
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
      }

      // 2. Log the weight change. `logWeight` is the single source
      //    of truth for weight sync — it writes to the
      //    `weight_logs` collection AND mirrors onto
      //    `profile.weight`, which is what the progress page reads.
      if (weightChanged) {
        const log = await logWeight(inputWeightKg, weightUnit);
        if (!log) {
          toast("Saved profile, but logging weight failed", "⚠️");
        }
      }

      toast("Profile updated ✓");
      onClose();
    } catch (err) {
      console.error("[EditProfileModal] save failed:", err);
      toast("Could not save changes", "⚠️");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          key="dialog"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="w-full max-w-md">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-lg font-bold">Edit profile</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Your age is calculated from your date of birth.
                </div>
              </div>
              <button
                aria-label="Close"
                onClick={onClose}
                disabled={saving}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50">
                <X size={16} />
              </button>
            </div>

            {/* DOB */}
            <div className="mb-5">
              <label
                htmlFor="edit-dob"
                className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5">
                Date of Birth
              </label>
              <input
                id="edit-dob"
                type="date"
                min={minDobIso()}
                max={maxDobIso()}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-3 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
              />
              {ageFromDob !== null && (
                <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                  Age: {ageFromDob} yrs
                </div>
              )}
            </div>

            {/* Weight */}
            <div className="mb-5">
              <label
                htmlFor="edit-weight"
                className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5">
                Weight
              </label>
              <div className="relative">
                <input
                  id="edit-weight"
                  type="number"
                  step="0.1"
                  min={weightUnit === "lbs" ? 66 : 30}
                  max={weightUnit === "lbs" ? 500 : 230}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full px-3.5 py-3 pr-14 border border-transparent rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {weightUnit}
                </span>
              </div>
              {weightChanged && (
                <div className="text-[11px] text-primary mt-1.5 font-medium">
                  Saving will log this as a new weigh-in.
                </div>
              )}
            </div>

            {/* Height — respects the user's `heightUnit` preference.
                Both branches normalise to cm before being saved. */}
            <div className="mb-2">
              <label
                htmlFor="edit-height-cm"
                className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5">
                Height
              </label>
              {currentProfile.heightUnit === "imperial" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      id="edit-height-feet"
                      type="number"
                      min={1}
                      max={8}
                      placeholder="5"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      className="w-full px-3.5 py-3 pr-12 border border-transparent rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                    />
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                      ft
                    </span>
                  </div>
                  <div>
                    <input
                      id="edit-height-in"
                      type="number"
                      min={0}
                      max={11}
                      step="0.1"
                      placeholder="9"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      className="w-full px-3.5 py-3 pr-12 border border-transparent rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                    />
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                      in
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    id="edit-height-cm"
                    type="number"
                    min={100}
                    max={250}
                    step="0.1"
                    placeholder="175"
                    value={heightCmInput}
                    onChange={(e) => setHeightCmInput(e.target.value)}
                    className="w-full px-3.5 py-3 pr-14 border border-transparent rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    cm
                  </span>
                </div>
              )}
              {heightChanged && (
                <div className="text-[11px] text-primary mt-1.5 font-medium">
                  Saving will update TDEE for the new height.
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !anyChange}
                className="flex-1 py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-85 transition-opacity disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
