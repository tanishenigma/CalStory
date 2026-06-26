"use client";

import Link from "next/link";
import { ReactLenis } from "lenis/react";
import { BlurFade } from "@/app/components/BlurFade";
import { useAuthStore } from "@/app/store/authStore";
import { useApp } from "@/app/context/AppContext";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  CircleQuestionMark,
  Brain,
  TrendingUp,
  Zap,
  Shield,
} from "lucide-react";
import Footer from "./footer";
import CTASection from "@/app/cta";
import PrecisionWorkflow from "@/app/components/landing/PrecisionWorkflow";
import EngineeredPerformance from "@/app/components/landing/EngineeredPerformance";
import FAQSection from "@/app/components/landing/FAQSection";
import HeroScrollSection from "@/app/components/landing/HeroScrollSection";
import { Navbar } from "@/app/components/landing/Navbar";
import { StructuredData } from "@/app/components/seo/StructuredData";
import { landingJsonLd } from "@/app/components/landing/landingJsonLd";
import CurvedLoop from "./components/ui/CurvedLoop";
import FeatureGrid from "./components/landing/Features";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    n: "01",
    title: "Engineer your profile",
    desc: "Set your physiological benchmarks and goals in under 60 seconds.",
  },
  {
    n: "02",
    title: "Streamline logging",
    desc: "Our friction-less interface makes tracking as fast as a text message.",
  },
  {
    n: "03",
    title: "Maximize results",
    desc: "Daily data-driven adjustments ensure you never plateau again.",
  },
];

export default function LandingPage() {
  const { user } = useAuthStore();
  const { state } = useApp();
  const router = useRouter();
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  const hasProfile = !!state.profile;

  useEffect(() => {
    const circumference = 415;
    const target = 1840;
    const endOffset = circumference * (1 - target / 2200);

    const ctx = gsap.context(() => {
      stepsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: "power3.out",
            delay: i * 0.1,
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      });
    });

    return () => ctx.revert();
  }, []);

  // The landing page's three "Get started" entry points (Navbar "Get
  // Started", hero "Start Tracking", CTASection "Get started free") all
  // route through here. We delegate to /auth instead of triggering the
  // Google popup directly so the user gets a dedicated, on-brand sign-in
  // surface with the privacy/terms context around it.
  function handleSignIn() {
    router.push("/auth");
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      {/* ── Animated gradient orbs ──────────────────────────────────
          Rendered as a sibling BEFORE the content wrapper so they are
          NOT inside the bg-background stacking context. Body already
          owns the page background colour. Orbs sit at z-0, content at z-10.
      ────────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        {/* Primary orange orb — top-right */}
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
              "radial-gradient(circle at center, rgba(249,115,22,0.30) 0%, rgba(249,115,22,0.14) 40%, transparent 70%)",
            filter: "blur(48px)",
          }}
        />
        {/* Secondary orange orb — bottom-left */}
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
              "radial-gradient(circle at center, rgba(249,115,22,0.20) 0%, rgba(251,146,60,0.10) 45%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Accent deep-orange orb — center */}
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
              "radial-gradient(circle at center, rgba(234,88,12,0.14) 0%, rgba(249,115,22,0.05) 50%, transparent 70%)",
            filter: "blur(72px)",
          }}
        />
      </div>

      {/* Content — relative z-10 sits above the orb layer */}
      <div
        className="relative min-h-screen text-foreground font-sans selection:bg-primary/30"
        style={{ zIndex: 1 }}>
        {/* NAV */}
        <Navbar onSignIn={handleSignIn} user={user} />
        {/* SEO: Organization + SoftwareApplication + FAQPage JSON-LD.
            Rendered server-side; no client JS shipped. */}
        <StructuredData data={landingJsonLd} />
        {/* HERO - Simplified, single focus */}
        <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-30  min-h-[85vh] w-full overflow-hidden">
          <BlurFade delay={0.2} className="w-full max-w-5xl mx-auto px-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-6 font-heading">
              Your calorie <br />
              <span className="text-primary ">story.</span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.3} className="w-full max-w-xl mx-auto px-4">
            <p className="text-muted-foreground-foreground text-lg md:text-xl leading-relaxed mb-10">
              Log what you eat. Track how you train. Build the story of your
              best self.
            </p>
          </BlurFade>

          <BlurFade
            delay={0.4}
            className="flex flex-wrap items-center justify-center gap-4">
            {!hasProfile ? (
              <>
                <button
                  onClick={() =>
                    user ? router.push("/dashboard") : handleSignIn()
                  }
                  className="h-12 px-8 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-3 shadow-xl shadow-black/10 whitespace-nowrap">
                  {user ? "Enter Dashboard" : "Start Tracking"}
                  <ArrowRight size={18} />
                </button>
                <Link
                  href="#features"
                  className="inline-flex h-12 items-center text-sm font-medium text-muted-foreground-foreground hover:text-foreground transition-colors whitespace-nowrap gap-2 border-2 px-12 py-2 md:p-4 rounded-2xl">
                  Learn more <CircleQuestionMark />
                </Link>
              </>
            ) : (
              <button
                onClick={() => router.push("/dashboard")}
                className="h-14 px-10 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-3 shadow-xl shadow-black/10 whitespace-nowrap">
                Enter Dashboard
                <ArrowRight size={18} />
              </button>
            )}
          </BlurFade>

          <HeroScrollSection />
        </section>
        {/* FEATURES GRID */}
        <section
          id="features"
          className="relative z-10 pb-24 md:mt-24 px-6 w-full flex justify-center">
          <div className="max-w-5xl mx-auto w-full">
            <BlurFade className="text-center mb-16 w-full flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 font-heading">
                Data, without the noise.
              </h2>
              <p className="text-muted-foreground-foreground text-base font-medium">
                Built for the obsessive. Engineered for clarity.
              </p>
            </BlurFade>

            <div>
              <EngineeredPerformance />
            </div>
          </div>
        </section>
        {/* METHOD SECTION */}
        <section
          id="how-it-works"
          className="relative z-10 py-24 px-6  w-full flex justify-center">
          <div className="max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
              <BlurFade>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] font-heading">
                  Zero Friction.{" "}
                  <span className="text-primary">Maximum Results.</span>
                </h2>
                <p className="mt-6 text-muted-foreground-foreground text-base leading-relaxed">
                  Most trackers fail because they're too slow. CalStory is
                  optimized for speed, so you spend less time logging and more
                  time training.
                </p>
              </BlurFade>

              <div className="flex flex-col gap-8">
                {STEPS.map((s, i) => (
                  <div
                    key={s.n}
                    ref={(el) => {
                      stepsRef.current[i] = el;
                    }}
                    className="flex items-start gap-5 group">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center text-sm font-bold tabular-nums group-hover:bg-primary transition-colors">
                      {s.n}
                    </div>
                    <div>
                      <div className="font-bold text-base mb-1 tracking-tight font-heading">
                        {s.title}
                      </div>
                      <div className="text-muted-foreground-foreground text-sm leading-relaxed">
                        {s.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/*  Features*/}
        <FeatureGrid />

        {/* FAQ Section */}
        <section
          id="faq"
          className="relative z-10 pt-24 px-6 w-full flex justify-center">
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-20 sm:gap-28">
            <FAQSection />
          </div>
        </section>
        <section className="relative w-full pt-24 px-6">
          <CurvedLoop
            marqueeText="✦ Cal ✦ Story"
            speed={2}
            curveAmount={180}
            direction="right"
            interactive
            className="relative z-0 opacity-50 dark:opacity-20"
          />

          <div className="absolute inset-0 flex items-center justify-center z-10">
            <CTASection handleSignIn={handleSignIn} />
          </div>
        </section>
        <Footer />
      </div>
    </ReactLenis>
  );
}
