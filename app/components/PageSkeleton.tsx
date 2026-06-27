"use client";

import React from "react";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn } from "@/app/lib/utils";

/* ------------------------------------------------------------------
 * PageSkeleton — layout-stable loading placeholders that mirror the
 * real authenticated pages. Replaces the generic centered spinner so
 * removing the localStorage profile cache (which previously let pages
 * render synchronously) doesn't introduce a layout shift or a
 * contentless flash.
 *
 * Each variant is sized to match its real counterpart — same row
 * heights, same card footprints — so the swap to live content is
 * imperceptible.
 * ------------------------------------------------------------------ */

type Variant =
  | "dashboard"
  | "nutrition"
  | "workouts"
  | "progress"
  | "settings"
  | "auth";

export function PageSkeleton({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className={cn("pb-24 p-4 md:p-6 lg:p-8 min-w-0 w-full", className)}>
      {variant === "dashboard" && <DashboardSkeleton />}
      {variant === "nutrition" && <NutritionSkeleton />}
      {variant === "workouts" && <WorkoutsSkeleton />}
      {variant === "progress" && <ProgressSkeleton />}
      {variant === "settings" && <SettingsSkeleton />}
      {variant === "auth" && <AuthSkeleton />}
    </div>
  );
}

/* ─── Shared: page heading placeholder ────────────────────── */
function PageHeading() {
  return (
    <div className="mb-4 sm:mb-8">
      <Skeleton className="h-9 w-40 sm:h-12 sm:w-56" />
    </div>
  );
}

/* ─── Shared: WeekStrip date row placeholder ──────────────── */
function WeekStripPlaceholder() {
  return (
    <div className="flex gap-2 mb-6 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="flex-1 h-16 rounded-2xl" />
      ))}
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <>
      <WeekStripPlaceholder />
      <div className="flex flex-col gap-6 mt-4 sm:mt-8">
        {/* Top row: hero + macro pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
        {/* Bottom row: workout + meals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[260px] rounded-2xl" />
          <Skeleton className="h-[260px] rounded-2xl" />
        </div>
      </div>
    </>
  );
}

/* ─── Nutrition ─────────────────────────────────────────── */
function NutritionSkeleton() {
  return (
    <>
      <WeekStripPlaceholder />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Skeleton className="h-9 w-40 sm:h-12 sm:w-56" />
        <div className="flex flex-col items-start sm:items-end gap-3">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Energy Summary card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="flex justify-between items-center gap-2 px-4">
            <RingBlock />
            <RingBlock />
            <RingBlock />
          </div>
        </div>
        {/* Targets card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-24 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent meals list */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/5" />
              </div>
              <Skeleton className="h-6 w-14" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function RingBlock() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/* ─── Workouts ──────────────────────────────────────────── */
function WorkoutsSkeleton() {
  return (
    <>
      <WeekStripPlaceholder />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Skeleton className="h-9 w-40 sm:h-12 sm:w-56" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Progress ──────────────────────────────────────────── */
function ProgressSkeleton() {
  return (
    <>
      <PageHeading />
      <Skeleton className="h-24 rounded-2xl mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </>
  );
}

/* ─── Settings ──────────────────────────────────────────── */
function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-10 pt-2">
      <div>
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      {/* Tab strip */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-xl" />
        ))}
      </div>
      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Auth (sign-in) ────────────────────────────────────── */
function AuthSkeleton() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col p-6 md:p-10">
        <Skeleton className="h-9 w-28 rounded-full" />
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-3 text-center">
              <Skeleton className="h-9 w-56 mx-auto" />
              <Skeleton className="h-4 w-72 mx-auto" />
            </div>
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-3 w-64 mx-auto" />
          </div>
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="hidden lg:block m-4 rounded-2xl" />
    </div>
  );
}

export default PageSkeleton;
