"use client";

import Link from "next/link";
import { useRef } from "react";
import { ReactLenis } from "lenis/react";
import BlurFade from "@/app/components/animations/BlurFade";

import { useAuthStore } from "@/app/store/authStore";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Footer from "./footer";
import CTASection from "@/app/cta";
import FAQSection from "@/app/components/landing/FAQSection";
import HeroScrollSection from "@/app/components/landing/HeroScrollSection";
import { Navbar } from "@/app/components/landing/Navbar";
import { StructuredData } from "@/app/components/seo/StructuredData";
import { landingJsonLd } from "@/app/components/landing/landingJsonLd";
import CurvedLoop from "./components/ui/CurvedLoop";
import { BackgroundGrid } from "@/app/components/BackgroundGrid";
import MethodSection from "./MethodSection";

import PricingSection from "@/app/components/landing/PricingSection";
import ProblemSolution from "@/app/components/landing/ProblemSolution";
import ReasonsSection from "@/app/components/landing/ReasonsSection";
import ComparisonTable from "@/app/components/landing/ComparisonTable";
import TestimonialsCarousel from "@/app/components/landing/TestimonialsCarousel";


if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const isSignedIn = !!user && !authLoading;

  const methodRef = useRef<HTMLElement>(null);

  function handleSignIn() {
    router.push("/auth");
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      {/* ── Ambient background orbs ──────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <div
          className="orb-1 absolute"
          style={{
            top: "-10%",
            right: "-5%",
            width: "65vw",
            height: "65vw",
            maxWidth: "860px",
            maxHeight: "860px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, rgba(48, 158, 134, 0.30) 0%, rgba(48, 158, 134, 0.14) 40%, transparent 70%)",
            filter: "blur(48px)",
          }}
        />
        <div
          className="orb-2 absolute"
          style={{
            bottom: "5%",
            left: "-8%",
            width: "55vw",
            height: "55vw",
            maxWidth: "720px",
            maxHeight: "720px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, rgba(48, 158, 134, 0.20) 0%, rgba(48, 158, 134, 0.10) 45%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="orb-3 absolute"
          style={{
            top: "35%",
            left: "30%",
            width: "50vw",
            height: "50vw",
            maxWidth: "640px",
            maxHeight: "640px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, rgba(48, 158, 134, 0.14) 0%, rgba(48, 158, 134, 0.05) 50%, transparent 70%)",
            filter: "blur(72px)",
          }}
        />
      </div>

      <div
        className="relative min-h-screen text-foreground font-sans selection:bg-primary/30"
        style={{ zIndex: 1 }}
      >
        <Navbar
          onSignIn={handleSignIn}
          targets={{
            "how-it-works": methodRef,
          }}
        />
        <StructuredData data={landingJsonLd} />

        {/* ── SECTION 1: Hero ──────────────────────────────────────────── */}
        <section
          id="hero"
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-30 min-h-[88vh] w-full overflow-hidden"
        >
          <BackgroundGrid scopedToHero />



          {/* ── 1b: H1 ── */}
          <BlurFade delay={0.2} className="w-full max-w-5xl mx-auto px-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-6 font-heading">
              Your calorie <br />
              <span className="text-primary">story.</span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.3} className="w-full max-w-xl mx-auto px-4">
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-10">
              Log what you eat. Track how you train. Build the story of your
              best self.
            </p>
          </BlurFade>

          {/* ── 1c: CTA buttons ── */}
          <BlurFade
            delay={0.4}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              {!isSignedIn ? (
                <>
                  <button
                    id="hero-cta-primary"
                    onClick={handleSignIn}
                    className="h-12 px-8 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-3 shadow-xl shadow-black/10 whitespace-nowrap"
                  >
                    Start Tracking — it&apos;s free
                    <ArrowRight size={18} />
                  </button>
                  <Link
                    href="#pricing"
                    className="inline-flex h-12 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap gap-2 border-2 px-8 py-2 md:p-4 rounded-2xl"
                  >
                    See pricing
                  </Link>
                </>
              ) : (
                <button
                  id="hero-cta-dashboard"
                  onClick={() => router.push("/dashboard")}
                  className="h-14 px-10 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-3 shadow-xl shadow-black/10 whitespace-nowrap"
                >
                  Enter Dashboard
                  <ArrowRight size={18} />
                </button>
              )}
            </div>

            {/* Guarantee microcopy — repeated under every CTA per Ayurveda pattern */}
            {!isSignedIn && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                Free forever. Paid plans cancel anytime — no contracts.
              </p>
            )}
          </BlurFade>

          <BlurFade delay={0.6} className="w-full mt-14">
            <HeroScrollSection />
          </BlurFade>
        </section>

        <div className="flex flex-col gap-0">
          {/* ── SECTION 2: Pricing (+ Founding Member Bonus) ──────────── */}
          <PricingSection />

          {/* ── SECTION 4: Problem → Solution ──────────────────────────── */}
          <ProblemSolution />

          {/* ── SECTION 6: 6 Reasons to Switch ────────────────────────── */}
          <ReasonsSection />

          {/* ── SECTION 7: Comparison Table ────────────────────────────── */}
          <ComparisonTable />

          {/* ── SECTION 8: Testimonials (capped at 4) ──────────────────── */}
          <TestimonialsCarousel />

          {/* ── SECTION 9: FAQ ──────────────────────────────────────────── */}
          <FAQSection />

          {/* ── SECTION 10: CTA — FROZEN ────────────────────────────────── */}
          {/* TODO: CTA unchanged — do not modify cta.tsx copy, layout, or component */}
          <div className="relative w-full min-h-screen isolate">
            <div className="absolute inset-0 2xl:-top-80 -top-40 md:-top-20 z-0 pointer-events-none">
              <CurvedLoop
                marqueeText="✦ CalStory"
                speed={1}
                curveAmount={180}
                direction="right"
                className="w-screen h-screen opacity-40 font-heading"
              />
            </div>
            <div className="relative z-10">
              <CTASection handleSignIn={handleSignIn} />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </ReactLenis>
  );
}
