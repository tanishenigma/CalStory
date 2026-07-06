"use client";

/**
 * FitnessClient — Google Fit sync page.
 *
 * Platform detection:
 *  - Desktop/unsupported: explicit "feature needs mobile browser" message
 *  - Mobile web: Google Fit connect button + sync status
 *
 * Failure modes (all explicit, no silent failures):
 *  - NO_CLIENT_ID    → config notice
 *  - UNSUPPORTED     → platform message
 *  - PERMISSION_DENIED / REVOKED → labelled prompt to re-connect
 *  - NETWORK_ERROR   → error card with retry
 *  - TOKEN_EXPIRED   → re-connect prompt
 *  - No internet     → error state, not crash (fetch throws, caught)
 *
 * Auto-sync: `useFitnessAutoSync` fires on mount + visibility
 * changes + a 30-min cadence. The app context recomputes the user's
 * TDEE + calorie target whenever the step bucket crosses a TDEE
 * boundary (5k / 7.5k / 10k / 15k) or the sync source changes — so
 * the dashboard "live updates" without re-running onboarding.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Info,
  Smartphone,
} from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { useFitnessStore } from "@/app/store/fitnessStore";
import {
  requestFitConsent,
  getFitnessData,
  hasValidToken,
  clearStoredToken,
} from "@/app/lib/google-fit";
import { useFitnessAutoSync } from "@/app/hooks/useFitnessAutoSync";
import BlurFade from "@/app/components/animations/BlurFade";
import { Card } from "@/app/components/ui/card";
import { todayLocalKey } from "@/app/context/AppContext";
import type { FitnessLog } from "@/app/types";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID ?? "";

function usePlatform() {
  const [isMobileWeb, setIsMobileWeb] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setIsMobileWeb(/android|iphone|ipad|ipod/i.test(ua));
  }, []);
  return { isMobileWeb };
}

function formatSyncTime(ts: number | null | undefined): string {
  if (!ts) return "Never";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FitnessClient() {
  const { profile, isLoading } = useAuthGuard();
  const { state, saveFitnessLog } = useApp();
  const { status, lastSyncedAt, setStatus, setLastSyncedAt, setError } =
    useFitnessStore();
  const { isMobileWeb } = usePlatform();
  const searchParams = useSearchParams();
  const todayLog = state.fitnessLogs[todayLocalKey()];

  // Handle OAuth2 callback query params
  useEffect(() => {
    const connected = searchParams.get("fit_connected");
    const fitError = searchParams.get("fit_error");

    if (fitError) {
      if (fitError === "access_denied") {
        setStatus("permission_denied");
        setError(
          "You declined Google Fit access. You can reconnect at any time.",
        );
      } else {
        setStatus("error");
        setError(`Connection failed: ${fitError}`);
      }
    } else if (connected === "1") {
      // Token stored in sessionStorage by the callback page — trigger sync
      void handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync on mount + visibility change + 30-min interval
  useFitnessAutoSync({
    enabled: !!profile,
    onSync: (log: FitnessLog) => {
      void saveFitnessLog(log).then(() => {
        setStatus("success");
        setLastSyncedAt(Date.now());
      });
    },
  });

  async function handleSync(): Promise<void> {
    if (!hasValidToken()) {
      setStatus("permission_denied");
      setError("Connect Google Fit first.");
      return;
    }
    setStatus("syncing");
    setError(null);

    const result = await getFitnessData(todayLocalKey());
    if (result.ok && result.log) {
      await saveFitnessLog(result.log);
      setStatus("success");
      setLastSyncedAt(Date.now());
    } else {
      switch (result.error) {
        case "PERMISSION_DENIED":
          setStatus("revoked");
          setError(
            "Google Fit access was revoked. Reconnect to resume syncing. Your last known data is shown below.",
          );
          break;
        case "TOKEN_EXPIRED":
          setStatus("permission_denied");
          setError("Session expired. Reconnect Google Fit to resume syncing.");
          break;
        case "NETWORK_ERROR":
          setStatus("error");
          setError(
            `Could not reach Google Fit${result.errorDetail ? ` (${result.errorDetail})` : ""}. Check your connection and retry.`,
          );
          break;
        default:
          setStatus("error");
          setError("Something went wrong while syncing. Please try again.");
      }
    }
  }

  function handleConnect(): void {
    if (!CLIENT_ID) {
      setStatus("no_client_id");
      return;
    }
    requestFitConsent();
  }

  function handleDisconnect(): void {
    clearStoredToken();
    setStatus("idle");
    setError(null);
  }

  if (isLoading || !profile) return <Spinner variant="dashboard" />;

  const isConnected = hasValidToken();

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="pt-2">
        <h1 className="text-3xl font-bold mb-2">Fitness Sync</h1>
        <p className="text-sm text-muted-foreground">
          Pull steps, calories, and workouts from Google Fit
        </p>
      </div>

      {/* ── Desktop unsupported notice ── */}
      {!isMobileWeb && (
        <Card className="p-6 border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex gap-3">
            <Smartphone
              size={20}
              className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm mb-1">
                Mobile browser required
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Fitness sync is optimised for mobile browsers (Android Chrome,
                iOS Safari) where Google Fit integration works best. On desktop
                you can still view previously synced data.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── No client ID ── */}
      {status === "no_client_id" && (
        <Card className="p-6 border-border">
          <div className="flex gap-3">
            <Info
              size={20}
              className="text-muted-foreground flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-muted-foreground">
              Google Fit is not configured for this instance. Set{" "}
              <code className="font-mono bg-muted px-1 rounded">
                NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID
              </code>{" "}
              to enable fitness sync.
            </p>
          </div>
        </Card>
      )}

      {/* ── Error / revoked states ── */}
      {useFitnessStore.getState().errorMessage && (
        <Card className="p-4 border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/30">
          <div className="flex gap-3">
            <AlertCircle
              size={18}
              className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-red-700 dark:text-red-300">
              {useFitnessStore.getState().errorMessage}
            </p>
          </div>
        </Card>
      )}

      {/* ── Connect / Status card ── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            <span className="font-semibold text-sm">Google Fit</span>
          </div>
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-semibold">
              <CheckCircle2 size={13} />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <WifiOff size={13} />
              Not connected
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Last synced:{" "}
          <span className="font-semibold text-foreground">
            {lastSyncedAt
              ? formatSyncTime(lastSyncedAt)
              : todayLog
                ? `last known: ${new Date(todayLog.syncedAt).toLocaleDateString()}`
                : "Never"}
          </span>
        </p>

        <div className="flex gap-2">
          {isConnected ? (
            <>
              <button
                onClick={handleSync}
                disabled={status === "syncing"}
                id="fitness-sync-now"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-85 transition-opacity disabled:opacity-50">
                <RefreshCw
                  size={14}
                  className={status === "syncing" ? "animate-spin" : ""}
                />
                {status === "syncing" ? "Syncing…" : "Sync now"}
              </button>
              <button
                onClick={handleDisconnect}
                id="fitness-disconnect"
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              id="fitness-connect-google-fit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-85 transition-opacity">
              <Wifi size={14} />
              Connect Google Fit
            </button>
          )}
        </div>
      </Card>

      {/* ── Fitness data cards ── */}
      {(todayLog || status === "success") && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FitnessMetricCard
            label="Steps"
            value={todayLog?.steps.toLocaleString() ?? "—"}
            icon="👟"
            note={
              status === "revoked" || status === "error"
                ? `last known: ${todayLog ? new Date(todayLog.syncedAt).toLocaleDateString() : "—"}`
                : undefined
            }
          />
          <FitnessMetricCard
            label="Active Cal"
            value={
              todayLog?.activeCalories ? `${todayLog.activeCalories} kcal` : "—"
            }
            icon="🔥"
          />
          <FitnessMetricCard
            label="Basal Cal"
            value={
              todayLog?.basalCalories ? `${todayLog.basalCalories} kcal` : "—"
            }
            icon="💤"
          />
        </div>
      )}

      {/* ── No data + no token state ── */}
      {!isConnected && !todayLog && status === "idle" && isMobileWeb && (
        <Card className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <span className="text-4xl mb-2">📊</span>
          <p className="font-bold text-[15px]">No fitness data yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Connect Google Fit above to start pulling your steps and calorie
            data automatically.
          </p>
        </Card>
      )}
    </div>
  );
}

function FitnessMetricCard({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: string;
  icon: string;
  note?: string;
}) {
  return (
    <Card className="p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xl font-bold text-foreground tabular-nums mb-0.5">
        {value}
      </div>
      <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
        {label}
      </div>
      {note && (
        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
          {note}
        </div>
      )}
    </Card>
  );
}
