"use client";

/**
 * TodayFitnessSync — small card that surfaces today's synced
 * fitness data on the Progress dashboard. Mirrors the steps /
 * active calories stored on today's `FitnessLog`.
 *
 * Hidden entirely when no sync has run today — keeps the dashboard
 * clean for users who don't use the feature.
 */

import { Footprints, Flame, Clock4 } from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { todayLocalKey } from "@/app/context/AppContext";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";

function formatSyncTime(ts: number | null | undefined): string {
  if (!ts) return "Never";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TodayFitnessSync() {
  const { state } = useApp();
  const todayLog = state.fitnessLogs[todayLocalKey()];

  if (!todayLog) return null;

  // Without a sync we don't render — keeps the dashboard tidy for
  // users who don't use a fitness service. The conditional lives
  // above so it executes before we read `state.profile` etc.
  const sourceLabel =
    todayLog.source === "google_fit" ? "Google Fit" : "Manual";

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Footprints size={18} className="text-primary" />
            <div>
              <div className="text-base font-bold tabular-nums leading-none">
                {todayLog.steps.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                steps
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-primary" />
            <div>
              <div className="text-base font-bold tabular-nums leading-none">
                {todayLog.activeCalories.toLocaleString()}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  kcal
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                active
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Clock4 size={14} />
            <span>
              synced {formatSyncTime(todayLog.syncedAt)} ·{" "}
              <span className="font-semibold">{sourceLabel}</span>
            </span>
          </div>
        </div>
        <Link
          href="/fitness"
          className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline">
          Manage
        </Link>
      </div>
    </Card>
  );
}
