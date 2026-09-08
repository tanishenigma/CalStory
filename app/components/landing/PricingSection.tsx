"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";

const EASE = [0.16, 1, 0.3, 1] as const;

// ---------------------------------------------------------------------------
// Polar checkout links — set in .env.local:
//   NEXT_PUBLIC_POLAR_PLUS_CHECKOUT_LINK, NEXT_PUBLIC_POLAR_PRO_CHECKOUT_LINK
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tier definitions — Free / Plus / Pro.
// Each tier lists only its net-new features; the lower tier is inherited
// via a quiet "Everything in X" line, so the layout shows accumulation
// instead of repeating full lists at equal weight.
// ---------------------------------------------------------------------------
const TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceNote: "/ forever",
    // Base tier — its own features are defined explicitly.
    intro: "The complete base tracker. No card, no trial.",
    inherits: null,
    features: [
      "Unlimited manual food logging",
      "Full workout tracker (sets × reps × kg)",
      "Calorie + macro targets",
      "Weight trend tracking",
      { mono: "16-week", rest: " streak heatmap" },
      "TDEE calculator",
      { mono: "5", rest: " AI meal logs / day" },
    ],
    cta: "Start free — no card",
    polarCheckoutLink: null,
  },
  {
    id: "plus",
    name: "Plus",
    price: 7,
    priceNote: "/ mo",
    intro: null,
    inherits: "Free",
    features: [
      "Unlimited AI meal logs",
      "Daily AI progress insights",
      "Adaptive TDEE recalculation",
      "Advanced macro split views",
      "Workout templates + re-log",
    ],
    cta: "Get Plus",
    polarCheckoutLink:
      process.env.NEXT_PUBLIC_POLAR_PLUS_CHECKOUT_LINK ||
      "https://buy.polar.sh/polar_cl_o705YWAwROcBAmFgWwhu7IQ73TblaR8U1MlDX1wHvNU",
  },
  {
    id: "pro",
    name: "Pro",
    price: 14,
    priceNote: "/ mo",
    intro: null,
    inherits: "Plus",
    features: [
      "Data export (CSV / JSON)",
      "Priority support",
      "Early access to features in development",
    ],
    cta: "Get Pro",
    polarCheckoutLink:
      process.env.NEXT_PUBLIC_POLAR_PRO_CHECKOUT_LINK ||
      "https://buy.polar.sh/polar_cl_3xXxFPrnqJ0iEa5R4PEO9YABKLXejLF9Sryrf0d5JZ0",
  },
] as const;

type Tier = (typeof TIERS)[number];

interface TierCardProps {
  tier: Tier;
  onCta: (tier: Tier) => void;
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

  async function handleCta(tier: Tier) {
    if (tier.id === "free") {
      router.push(user ? "/dashboard" : "/auth");
      return;
    }
    if (
      tier.polarCheckoutLink &&
      !tier.polarCheckoutLink.includes("REPLACE_ME")
    ) {
      window.location.href = tier.polarCheckoutLink;
      return;
    }
    router.push(user ? "/dashboard" : "/auth");
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
          {TIERS.map((tier) => (
            <motion.div key={tier.id} variants={cardMotion} className="h-full">
              <TierCard tier={tier} onCta={handleCta} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
