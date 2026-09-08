"use client";

import Link from "next/link";
import { ReactLenis } from "lenis/react";
import BlurFade from "@/app/components/animations/BlurFade";

import { useAuthStore } from "@/app/store/authStore";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Footer from "./footer";
import CTASection from "@/app/cta";
import HeroScrollSection from "@/app/components/landing/HeroScrollSection";
import { Navbar } from "@/app/components/landing/Navbar";
import { StructuredData } from "@/app/components/seo/StructuredData";
import { landingJsonLd } from "@/app/components/landing/landingJsonLd";
import CurvedLoop from "./components/ui/CurvedLoop";
import { BackgroundGrid } from "@/app/components/BackgroundGrid";

import ProblemSolution from "@/app/components/landing/ProblemSolution";
import ReviewsSection from "@/app/components/landing/ReviewsSection";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const isSignedIn = !!user && !authLoading;

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
              "radial-gradient(circle at center, color-mix(in srgb, var(--color-primary) 30%, transparent) 0%, color-mix(in srgb, var(--color-primary) 14%, transparent) 40%, transparent 70%)",
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
              "radial-gradient(circle at center, color-mix(in srgb, var(--color-primary) 20%, transparent) 0%, color-mix(in srgb, var(--color-primary) 10%, transparent) 45%, transparent 70%)",
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
              "radial-gradient(circle at center, color-mix(in srgb, var(--color-primary) 14%, transparent) 0%, color-mix(in srgb, var(--color-primary) 5%, transparent) 50%, transparent 70%)",
            filter: "blur(72px)",
          }}
        />
      </div>

      <div
        className="relative min-h-screen text-foreground font-sans selection:bg-primary/30"
        style={{ zIndex: 1 }}>
        <Navbar onSignIn={handleSignIn} />
        <StructuredData data={landingJsonLd} />

        {/* ── SECTION 1: Hero ──────────────────────────────────────────── */}
        <section
          id="hero"
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-30 min-h-[88vh] w-full overflow-hidden">
          <BackgroundGrid scopedToHero />

          {/* ── 1b: H1 ── */}
          <BlurFade delay={0.2} className="w-full max-w-5xl mx-auto px-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-6 font-heading">
              Your calorie <br />
              <span className="text-primary">story.</span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.3} className="w-full max-w-xl mx-auto px-4">
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-10">
              Log meals. Track workouts. Watch your progress add up.
            </p>
          </BlurFade>

          {/* ── 1c: CTA buttons ── */}
          <BlurFade delay={0.4} className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {!isSignedIn ? (
                <>
                  <button
                    id="hero-cta-primary"
                    onClick={handleSignIn}
                    className="h-12 px-8 rounded-full bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-3 shadow-xl shadow-black/10 whitespace-nowrap">
                    Start Tracking
                    <ArrowRight size={18} />
                  </button>
                  <Link
                    href="/pricing"
                    className="inline-flex h-12 items-center text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap gap-2 border-2 border-accent-foreground px-10 py-2 md:py-4 rounded-2xl  hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer hadow-xl shadow-black/10 ">
                    See pricing
                  </Link>
                </>
              ) : (
                <button
                  id="hero-cta-dashboard"
                  onClick={() => router.push("/dashboard")}
                  className="h-14 px-10 rounded-full bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-3 shadow-xl shadow-black/10 whitespace-nowrap">
                  Enter Dashboard
                  <ArrowRight size={18} />
                </button>
              )}
            </div>

            {/* Guarantee microcopy — repeated under every CTA per Ayurveda pattern */}
          </BlurFade>

          <BlurFade delay={0.6} className="w-full mt-14">
            <HeroScrollSection />
          </BlurFade>
        </section>

        <div className="flex flex-col gap-0">
          {/* ── SECTION 2: Problem → Solution ──────────────────────────── */}
          <ProblemSolution />

          {/* ── SECTION 3: Reviews ─────────────────────────────────────── */}
          <ReviewsSection />

          {/* ── SECTION 4: CTA — FROZEN ────────────────────────────────── */}
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
