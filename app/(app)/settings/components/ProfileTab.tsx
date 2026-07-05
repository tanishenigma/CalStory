"use client";

import { useState } from "react";
import { Droplet, Info, Pencil, Trash2, Wheat } from "lucide-react";
import type { User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/app/components/ui/card";
import BlurFade from "@/app/components/animations/BlurFade";
import { kgToLbs, displayHeight } from "@/app/lib/units";
import type { Profile } from "@/app/types";
import { ApiKeyCard } from "./ApiKeyCard";
import { MilkIcon } from "lucide-react";
interface ProfileTabProps {
  user: User | null;
  profile: Profile | null | undefined;
  onEditProfile: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

const GOAL_BADGE: Record<string, string> = {
  bulk: "💪 Bulking",
  cut: "🔥 Cutting",
  maintain: "⚖️ Maintaining",
};

function EnergyTargetsInfo() {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}>
      <button
        type="button"
        aria-label="What are TDEE and Target?"
        aria-describedby={open ? "energy-targets-info" : undefined}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-full p-0.5 text-foreground/40 hover:text-foreground/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 transition-colors">
        <Info size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            id="energy-targets-info"
            role="tooltip"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-3 text-left">
            <span className=" text-[11px] font-bold text-foreground/80 mb-1.5">
              How these numbers are calculated
            </span>
            <span className="block text-[11px] leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground/80">TDEE</strong>{" "}
              is your Total Daily Energy Expenditure — the calories your body
              burns in a day based on age, height, weight, sex and activity
              level.
            </span>
            <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground/80">
                Target
              </strong>{" "}
              is TDEE adjusted by your goal (cut / maintain / bulk) and chosen
              intensity. Hit this number to track your plan consistently.
            </span>
            {/* Arrow */}
            <span
              aria-hidden
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-l border-t border-border bg-popover"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function ProfileTab({
  user,
  profile,
  onEditProfile,
  onSignOut,
  onDeleteAccount,
}: ProfileTabProps) {
  const name = profile?.name;
  const goal = profile?.goal ?? "maintain";

  return (
    <BlurFade>
      <div className="md:flex gap-4 items-start">
        <Card className="p-6 mb-5  w-full">
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="w-18 h-18 rounded-full "
                  style={{ width: 72, height: 72 }}
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary to-primary-foreground/70 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {(name || "U")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xl truncate">
                {name
                  ? name.charAt(0).toUpperCase() + name.slice(1)
                  : "New User"}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {user?.email || "No email set"}
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/60 text-foreground dark:bg-muted/60 dark:text-foreground">
                {GOAL_BADGE[goal] ?? "⚖️ Maintaining"}
              </div>
            </div>
            <button
              onClick={onEditProfile}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground transition-all px-3 py-2 rounded-lg ml-auto">
              <Pencil size={13} />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <div className="bg-muted/60 rounded-xl px-3 py-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                Age
              </div>
              <div className="font-bold text-base truncate leading-tight">
                {`${profile?.age ?? "—"} yrs`}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                years old
              </div>
            </div>
            <div className="bg-muted/60 rounded-xl px-3 py-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                Weight
              </div>
              <div className="font-bold text-base truncate leading-tight">
                {profile?.weightUnit === "lbs"
                  ? `${kgToLbs(profile?.weight ?? 0)}`
                  : `${Math.round(profile?.weight ?? 0)}`}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {profile?.weightUnit === "lbs" ? "lbs" : "kg"}
              </div>
            </div>
            <div className="bg-muted/60 rounded-xl px-3 py-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                Height
              </div>
              <div className="font-bold text-base truncate leading-tight">
                {profile
                  ? displayHeight(profile.height, profile.heightUnit)
                  : "—"}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {profile?.heightUnit === "imperial" ? "ft/in" : "cm"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/40 flex items-center gap-1.5">
                Daily Energy Targets
                <EnergyTargetsInfo />
              </span>
              <span className="text-[11px] font-medium text-foreground/40">
                kcal
              </span>
            </div>

            <div className="flex items-end justify-between gap-6">
              <div className="flex-1">
                <div className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider mb-1">
                  TDEE
                </div>
                <div className="font-bricolage text-2xl font-medium text-foreground/80 leading-none tabular-nums">
                  {profile?.tdee ?? "—"}
                </div>
              </div>

              <div className="self-stretch w-px bg-border/60" />

              <div className="flex-1 text-right">
                <div className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider mb-1">
                  Target
                </div>
                <div className="font-bricolage text-2xl font-medium text-foreground leading-none tabular-nums">
                  {profile?.calTarget ?? "—"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              {[
                {
                  label: "Protein",
                  val: `${profile?.protein ?? 0}g`,
                  icon: MilkIcon,
                },
                { label: "Carbs", val: `${profile?.carbs ?? 0}g`, icon: Wheat },
                { label: "Fat", val: `${profile?.fat ?? 0}g`, icon: Droplet },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider flex gap-2 items-center">
                    <m.icon size={18} />
                    {m.label}
                  </span>
                  <span className="text-sm font-bold text-foreground/70 tabular-nums">
                    {m.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            {" "}
            {user && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={onSignOut}
                  className="w-full py-3.5 rounded-xl border border-destructive text-destructive text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </Card>

        <div>
          <ApiKeyCard user={user} />
        </div>
      </div>
      <div>
        <Card className="transition-all z-200 ease-out  duration-300 ">
          <CardContent>
            <button
              onClick={onDeleteAccount}
              className="w-full flex items-center justify-center py-2.5 rounded-xl gap-2 text-xs font-medium text-muted-foreground hover:text-destructive  ">
              <Trash2 size={18} /> <span>Delete account</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </BlurFade>
  );
}
