"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { getIdToken } from "firebase/auth";
import { PLAN_TIERS, type PlanTier } from "@/app/lib/plan-tiers";
import { toast } from "sonner";

const EASE = [0.16, 1, 0.3, 1] as const;

interface TierCardProps {
  tier: PlanTier;
  onCta: (tier: PlanTier) => void;
}

function TierCard({ tier, onCta }: TierCardProps) {
  const isPlus = tier.id === "plus";

  return (
    <motion.div
      className={`flex flex-col p-7 h-full rounded-2xl border shadow-sm hover:shadow-md transition-shadow duration-300 ${
        isPlus
          ? "bg-[#FFF1E6] border-[#FF6A00]/20 text-[#2B211A]"
          : "bg-card border-border text-foreground"
      }`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}>
      {/* Header — tier name + price, one line, same size logic */}
      <div className="flex items-baseline justify-between gap-4">
        <h3 className={`font-heading text-xl font-semibold tracking-tight ${isPlus ? "text-[#2B211A]" : "text-foreground"}`}>
          {tier.name}
        </h3>
        <p className="whitespace-nowrap">
          <span className={`num text-xl ${isPlus ? "text-[#2B211A]" : "text-foreground"}`}>${tier.price}</span>
          <span className={`text-sm ${isPlus ? "text-[#7B6658]" : "text-muted-foreground"}`}>
            {" "}
            {tier.priceNote}
          </span>
        </p>
      </div>

      {/* Inheritance line — quiet, muted, not a bullet, never repeated
       * in full. The base tier gets a factual one-liner instead. */}
      <p className={`text-sm mt-3 leading-relaxed ${isPlus ? "text-[#7B6658]" : "text-muted-foreground"}`}>
        {tier.inherits ? `Everything in ${tier.inherits}` : tier.intro}
      </p>

      {/* Hairline divider */}
      <div className={`h-px my-5 ${isPlus ? "bg-[#FF6A00]/15" : "bg-border"}`} aria-hidden="true" />

      {/* Net-new features only — the differentiating content, dominant */}
      <ul className="space-y-2.5 flex-1">
        {tier.features.map((f) => {
          const key = typeof f === "string" ? f : `mono-${f.mono}`;
          const body =
            typeof f === "string" ? (
              <span className={`text-sm leading-relaxed ${isPlus ? "text-[#49382D]" : "text-foreground"}`}>
                {f}
              </span>
            ) : (
              <span className={`text-sm leading-relaxed ${isPlus ? "text-[#49382D]" : "text-foreground"}`}>
                {/* Numbers in mono, same size/weight as surrounding text */}
                <span className="num">{f.mono}</span>
                {f.rest}
              </span>
            );
          return (
            <li key={key} className="flex items-start gap-2.5">
              <Check
                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isPlus ? "text-primary" : "text-muted-foreground"}`}
                aria-hidden="true"
              />
              {body}
            </li>
          );
        })}
      </ul>

      {/* CTA — solid foreground button, shadcn primary style */}
      <button
        id={`pricing-cta-${tier.id}`}
        onClick={() => onCta(tier)}
        className={`w-full h-11 mt-7 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] cursor-pointer ${isPlus ? "bg-primary text-white" : "bg-foreground text-background"}`}>
        {tier.cta}
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function PricingSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const cardMotion: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  };

  async function handleCta(tier: PlanTier) {
    if (tier.id === "free") {
      router.push(user ? "/dashboard" : "/auth");
      return;
    }
    if (!user) {
      router.push("/auth");
      return;
    }

    try {
      const token = await getIdToken(user);
      const response = await fetch(`/api/checkout?plan=${tier.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as {
        url?: string;
        error?: string;
        message?: string;
        mode?: "already_active" | "upgraded";
      };
      if (response.ok && data.mode) {
        toast.success(data.message ?? "Your subscription is already up to date.");
        router.push("/settings?tab=billing");
        return;
      }
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Checkout is unavailable right now.");
      }
      window.location.assign(data.url);
    } catch (error) {
      console.error("[pricing] Checkout failed:", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Checkout is unavailable right now. Please try again later.",
      );
    }
  }

  return (
    <section
      ref={ref}
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative z-10 py-16 md:py-32 px-6 w-full">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-4">
            Pricing
          </span>
          <h2
            id="pricing-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-heading text-foreground">
            Simple, honest pricing
          </h2>
          <p className="text-muted-foreground mt-3 text-base max-w-xl mx-auto">
            Free for core tracking. Paid plans add unlimited AI logging.
          </p>
        </motion.div>

        {/* Tier cards — uniform white cards; the tier structure carries
         * the information, no recommended badge, no highlight. */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch mt-12">
          {PLAN_TIERS.map((tier) => (
            <motion.div key={tier.id} variants={cardMotion} className="h-full">
              <TierCard tier={tier} onCta={handleCta} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
