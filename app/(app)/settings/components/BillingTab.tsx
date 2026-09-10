"use client";

import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Crown,
  Loader2,
  ReceiptText,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import type { User } from "firebase/auth";
import { Card } from "@/app/components/ui/card";
import BlurFade from "@/app/components/animations/BlurFade";
import { FREE_DAILY_PROMPT_LIMIT } from "@/app/lib/plan-limits";
import { PLAN_TIERS } from "@/app/lib/plan-tiers";
import type { SubscriptionTier } from "@/app/types";
import { toast } from "sonner";

interface BillingOrder {
  id: string;
  createdAt: string | null;
  description: string;
  status: string;
  paid: boolean;
  totalAmount: number;
  currency: string;
  invoiceNumber: string | null;
}

interface BillingData {
  plan: SubscriptionTier;
  status: string;
  subscription: {
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    amount: number;
    currency: string;
    interval: string;
  } | null;
  orders: BillingOrder[];
  portalUrl: string | null;
  promptUsage: {
    used: number;
    limit: number | null;
  };
}

interface BillingTabProps {
  user: User | null;
}

const PLAN_COPY: Record<
  SubscriptionTier,
  { label: string; description: string }
> = {
  free: {
    label: "Free",
    description: "Core tracking with 5 AI prompts every day.",
  },
  plus: {
    label: "Plus",
    description: "Unlimited AI prompts plus adaptive insights.",
  },
  pro: {
    label: "Pro",
    description: "Unlimited AI prompts, exports and workout analysis.",
  },
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function displayStatus(status: string): string {
  return status.replaceAll("_", " ");
}

function formatResetCountdown(timestamp: number): string {
  if (!timestamp) return "soon";

  const nextReset = new Date(timestamp);
  nextReset.setUTCHours(24, 0, 0, 0);
  const minutes = Math.max(
    1,
    Math.ceil((nextReset.getTime() - timestamp) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
}

// ─── Upgrade card shown to Free and Plus users ────────────────────────────────
function UpgradeCard({
  targetPlan,
  onUpgrade,
  hasExistingSubscription = false,
}: {
  targetPlan: "plus" | "pro";
  onUpgrade: () => Promise<void>;
  hasExistingSubscription?: boolean;
}) {
  const [isOpening, setIsOpening] = useState(false);
  const tier = PLAN_TIERS.find((t) => t.id === targetPlan)!;
  const isPlus = targetPlan === "plus";

  async function handleUpgrade() {
    setIsOpening(true);
    try {
      await onUpgrade();
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : "Checkout is unavailable right now.",
      );
      setIsOpening(false);
    }
  }

  return (
    <Card
      className={`overflow-hidden border transition-colors ${
        isPlus
          ? "border-primary/20 bg-primary/[0.03] hover:border-primary/45"
          : "border-purple-500/20 bg-purple-500/[0.03] hover:border-purple-500/45"
      }`}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                isPlus
                  ? "text-primary"
                  : "text-purple-500"
              }`}>
              {isPlus ? <Zap size={10} /> : <Star size={10} />}
              {tier.name}
            </div>
            <h3 className="mt-2 text-lg font-bold tracking-tight">
              Upgrade to {tier.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {hasExistingSubscription && !isPlus
                ? "Upgrade your existing subscription with a prorated charge."
                : isPlus
                ? "Unlock unlimited AI logging and adaptive insights."
                : "Everything in Plus, plus exports and priority support."}
            </p>
          </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold num">${tier.price}</div>
              <div className="text-xs text-muted-foreground">/ month</div>
            </div>
        </div>

        <ul className="mt-5 grid gap-x-5 gap-y-2 sm:grid-cols-2">
          {tier.features.map((f) => {
            const key = typeof f === "string" ? f : `${f.mono}${f.rest}`;
            const text = typeof f === "string" ? f : `${f.mono}${f.rest}`;
            return <li key={key} className="flex items-start gap-2 text-sm">
                <Check
                  size={13}
                  className={`mt-0.5 shrink-0 ${isPlus ? "text-primary" : "text-purple-500"}`}
                />
                <span className="text-foreground/75">{text}</span>
              </li>;
          })}
        </ul>

        <button
          id={`billing-upgrade-${targetPlan}`}
          type="button"
          onClick={() => void handleUpgrade()}
          disabled={isOpening}
          className={`mt-5 w-full h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-wait disabled:opacity-70 ${
            isPlus
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-purple-600 text-white hover:bg-purple-500"
          }`}>
          {isOpening
            ? hasExistingSubscription
              ? "Updating plan…"
              : "Opening checkout…"
            : `Upgrade to ${tier.name}`}
          {!isOpening && <ArrowRight size={14} />}
        </button>

        {!isPlus && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {hasExistingSubscription
              ? "Only the difference for the remaining period is charged today."
              : "Plus access is included automatically."}
          </p>
        )}
      </div>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function BillingTab({ user }: BillingTabProps) {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  async function loadBilling(signal?: AbortSignal) {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getIdToken(user);
      const response = await fetch("/api/billing", {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const data = (await response.json()) as BillingData & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load billing information.");
      }
      setBilling(data);
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") return;
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load billing information.",
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }

  async function startCheckout(targetPlan: "plus" | "pro") {
    if (!user) throw new Error("Please sign in before upgrading.");

    const token = await getIdToken(user);
    const response = await fetch(`/api/checkout?plan=${targetPlan}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as {
      url?: string;
      error?: string;
      message?: string;
      mode?: "already_active" | "upgraded";
    };
    if (!response.ok || !data.url) {
      if (response.ok && data.mode) {
        toast.success(data.message ?? "Your subscription is already up to date.");
        await loadBilling();
        return;
      }
      throw new Error(data.error ?? "Checkout is unavailable right now.");
    }

    window.location.assign(data.url);
  }

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void loadBilling(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (billing?.plan !== "free") return;

    const updateClock = () => setNow(Date.now());
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, [billing?.plan]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2
          size={20}
          className="animate-spin"
          aria-label="Loading billing"
        />
      </div>
    );
  }

  if (error || !billing) {
    return (
      <Card className="p-6">
        <p className="text-sm text-destructive">
          {error ?? "Unable to load billing information."}
        </p>
        <button
          type="button"
          onClick={() => void loadBilling()}
          className="mt-4 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-foreground transition-colors">
          Try again
        </button>
      </Card>
    );
  }

  const plan = PLAN_COPY[billing.plan];
  const isUnlimited = billing.promptUsage.limit === null;
  const usageLimit = billing.promptUsage.limit ?? FREE_DAILY_PROMPT_LIMIT;
  const usagePercent = isUnlimited
    ? 100
    : Math.min(100, (billing.promptUsage.used / usageLimit) * 100);
  const resetCountdown = formatResetCountdown(now);
  const promptsRemaining = Math.max(
    0,
    usageLimit - billing.promptUsage.used,
  );
  const freeLimitReached =
    !isUnlimited && billing.promptUsage.used >= usageLimit;

  return (
    <>
      <BlurFade>
        <div className="space-y-5">
          {/* Current plan card */}
          <Card className="overflow-hidden">
            <div className="bg-foreground text-background p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 text-background/60 text-[11px] font-bold uppercase tracking-[0.18em]">
                    <Crown size={14} /> Current plan
                  </div>
                  <h2 className="mt-2 text-3xl font-bold">{plan.label}</h2>
                  <p className="mt-1 text-sm text-background/65">
                    {plan.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        billing.status === "active" ||
                        billing.status === "trialing"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                      {displayStatus(billing.status)}
                    </span>
                    {billing.subscription?.currentPeriodEnd && (
                      <span className="text-xs text-background/50">
                        {billing.subscription.cancelAtPeriodEnd
                          ? "Cancels"
                          : "Renews"}{" "}
                        {formatDate(billing.subscription.currentPeriodEnd)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  {billing.portalUrl && (
                    <a
                      href={billing.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-background text-foreground px-4 py-3 text-sm font-bold hover:opacity-90 transition-opacity">
                      Manage <ArrowUpRight size={15} />
                    </a>
                  )}
                  {billing.subscription && (
                    <div className="text-right">
                      <div className="text-lg font-bold num">
                        {formatAmount(
                          billing.subscription.amount,
                          billing.subscription.currency,
                        )}
                      </div>
                      <div className="text-xs text-background/50">
                        / {billing.subscription.interval}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI usage */}
            <div className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-sm font-bold">AI prompts today</span>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  {isUnlimited
                    ? `${billing.promptUsage.used} used · Unlimited`
                    : `${billing.promptUsage.used} / ${usageLimit}`}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {isUnlimited
                  ? "Your plan has no daily AI prompt limit."
                  : freeLimitReached
                    ? `You can log calories again in ${resetCountdown}.`
                    : `${promptsRemaining} prompt${promptsRemaining === 1 ? "" : "s"} remaining · resets in ${resetCountdown}.`}
              </p>

            </div>
          </Card>

          {/* Pro top-plan banner */}
          {billing.plan === "pro" && (
            <Card className="p-6 flex items-center gap-4 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Star size={18} className="text-purple-500" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  You’re on our top plan
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  You have access to every CalStory feature. Thank you for your
                  support!
                </div>
              </div>
            </Card>
          )}

          {/* Free -> Plus upgrade */}
          {billing.plan === "free" && (
            <>
              <UpgradeCard
                targetPlan="plus"
                onUpgrade={() => startCheckout("plus")}
              />
              <UpgradeCard
                targetPlan="pro"
                onUpgrade={() => startCheckout("pro")}
              />
            </>
          )}

          {/* Plus -> Pro upgrade */}
          {billing.plan === "plus" &&
            !billing.subscription?.cancelAtPeriodEnd && (
              <UpgradeCard
                targetPlan="pro"
                onUpgrade={() => startCheckout("pro")}
                hasExistingSubscription
              />
            )}

          {/* Orders */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ReceiptText size={17} />
              <h3 className="font-bold">Orders</h3>
            </div>
            {billing.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No orders yet. Your receipts will appear here after you upgrade.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {billing.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {order.description}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDate(order.createdAt)} ·{" "}
                        {displayStatus(order.status)}
                        {order.invoiceNumber
                          ? ` · ${order.invoiceNumber}`
                          : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0">
                      <div className="text-sm font-bold">
                        {formatAmount(order.totalAmount, order.currency)}
                      </div>
                      {order.paid && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                          <Check size={9} /> Paid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </BlurFade>
    </>
  );
}
