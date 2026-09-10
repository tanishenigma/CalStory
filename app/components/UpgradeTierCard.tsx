"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Crown } from "lucide-react";
import type { SubscriptionTier } from "@/app/types";

type UpgradeTierCardProps = {
  currentTier: SubscriptionTier;
};

export function UpgradeTierCard({ currentTier }: UpgradeTierCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (currentTier === "pro") return null;

  const isFree = currentTier === "free";
  const nextTier = isFree ? "Plus" : "Pro";
  const description = isFree
    ? "Unlock meal plans, workout tracking and more."
    : "Unlock advanced insights, priority support and more.";
  const anchor = isFree ? "pricing-cta-plus" : "pricing-cta-pro";

  return (
    <div
      className={`mx-0.5 my-3 rounded-2xl bg-[#FDEDE4] p-4 text-[#bd4b12] shadow-sm transition-all duration-300 ease-out ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}>
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd7bd] text-[#d85b18]">
        <Crown size={16} fill="currentColor" />
      </div>
      <h2 className="text-sm font-bold leading-5 text-[#bd4b12]">
        Upgrade to {nextTier}
      </h2>
      <p className="mt-1.5 text-[11px] leading-4 text-[#8f7669]">
        {description}
      </p>
      <Link
        href={`/pricing#${anchor}`}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] px-3 text-xs font-bold text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/50 focus-visible:ring-offset-2">
        View Plans
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
