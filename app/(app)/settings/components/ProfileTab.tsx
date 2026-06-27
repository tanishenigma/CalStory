"use client";

import { Pencil, CheckCircle2 } from "lucide-react";
import type { User } from "firebase/auth";
import { Card } from "@/app/components/ui/card";
import BlurFade from "@/app/components/animations/BlurFade";
import { kgToLbs, displayHeight } from "@/app/lib/units";
import type { Profile } from "@/app/types";
import { ApiKeyCard } from "./ApiKeyCard";

interface ProfileTabProps {
  user: User | null;
  profile: Profile | null | undefined;
  onEditProfile: () => void;
  onSignOut: () => void;
}

const GOAL_BADGE: Record<string, string> = {
  bulk: "💪 Bulking",
  cut: "🔥 Cutting",
  maintain: "⚖️ Maintaining",
};

export function ProfileTab({
  user,
  profile,
  onEditProfile,
  onSignOut,
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

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              {
                label: "Age",
                val: `${profile?.age ?? "—"} yrs`,
                sub: "years old",
                
              },
              {
                label: "Weight",
                val:
                  profile?.weightUnit === "lbs"
                    ? `${kgToLbs(profile?.weight ?? 0)}`
                    : `${Math.round(profile?.weight ?? 0)}`,
                sub: profile?.weightUnit === "lbs" ? "lbs" : "kg",
              },
              {
                label: "Height",
                val: profile
                  ? displayHeight(profile.height, profile.heightUnit)
                  : "—",
                sub: profile?.heightUnit === "imperial" ? "ft/in" : "cm",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-muted/60 rounded-xl px-3 py-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                  {item.label}
                </div>
                <div className="font-bold text-base truncate leading-tight">
                  {item.val}
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/40">
                Daily Energy Targets
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
                { label: "Protein", val: `${profile?.protein ?? 0}g` },
                { label: "Carbs", val: `${profile?.carbs ?? 0}g` },
                { label: "Fat", val: `${profile?.fat ?? 0}g` },
              ].map((m) => (
                <div
                  key={m.label}
                  className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider">
                    {m.label}
                  </span>
                  <span className="text-sm font-medium text-foreground/70 tabular-nums">
                    {m.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            {" "}
            {user && (
              <button
                onClick={onSignOut}
                className="w-full py-3.5 rounded-xl border border-destructive text-destructive text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                Sign out
              </button>
            )}
          </div>
        </Card>

        <div>
          <ApiKeyCard user={user} />
        </div>
      </div>
    </BlurFade>
  );
}
