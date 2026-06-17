"use client";

import Link from "next/link";
import { ReactLenis } from "lenis/react";
import { BlurFade } from "@/app/components/BlurFade";
import { useAuthStore } from "@/app/store/authStore";
import { useApp } from "@/app/context/AppContext";
import { signInWithGoogle } from "@/app/lib/auth";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Flame,
  ArrowRight,
  BarChart3,
  Target,
  Calendar,
  CircleQuestionMark,
} from "lucide-react";
import Footer from "./footer";
import CTASection from "@/app/cta";
import { Card, CardContent } from "@/app/components/ui/card";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Precision tracking",
    desc: "Log meals in seconds. Watch your macro balance shift in real-time.",
    wide: true,
  },
  {
    icon: <Flame className="w-6 h-6" />,
    title: "Dynamic TDEE",
    desc: "Adapts to your metabolism and activity level daily.",
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: "Consistency loops",
    desc: "Psychology-backed streak systems to keep you in the zone.",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Elite targets",
    desc: "Custom calorie and macro goals for professionals.",
  },
  {
    icon: <Flame className="w-6 h-6" />,
    title: "Instant insights",
    desc: "No digging. Your data is served raw and clear, exactly when you need it.",
    wide: true,
  },
];

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

const STATS = [
  { val: "24/7", label: "real-time data" },
  { val: "0.4s", label: "logging latency" },
  { val: "100%", label: "privacy focused" },
];

export default function LandingPage() {
  const { user } = useAuthStore();
  const { state } = useApp();
  const router = useRouter();
  const arcRef = useRef<SVGCircleElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  const hasProfile = !!state.profile;

  useEffect(() => {
    const circumference = 415;
    const target = 1840;
    const endOffset = circumference * (1 - target / 2200);

    const ctx = gsap.context(() => {
      if (arcRef.current) {
        gsap.fromTo(
          arcRef.current,
          { strokeDashoffset: circumference },
          {
            strokeDashoffset: endOffset,
            duration: 2.2,
            ease: "power4.inOut",
            delay: 0.5,
          },
        );
      }
      gsap.to(
        { val: 0 },
        {
          val: target,
          duration: 2.2,
          ease: "power4.inOut",
          delay: 0.5,
          onUpdate() {
            if (countRef.current)
              countRef.current.textContent = Math.round(
                this.targets()[0].val,
              ).toLocaleString();
          },
        },
      );

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

  async function handleSignIn() {
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        {/* Single subtle gradient */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute top-0 right-1/4 w-[50%] h-[60%] rounded-full bg-primary/[0.03] blur-[120px]" />
        </div>

        {/* NAV */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-[90%] max-w-4xl px-4 pr-3 h-14 bg-background/80 dark:bg-[#1a1916]/80 backdrop-blur-2xl border border-border dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center transition-transform group-hover:rotate-12">
              <Flame size={18} className="text-background fill-background" />
            </div>
            <span className="font-bold text-lg tracking-tight font-heading">
              CalStory
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Method
            </Link>
          </div>
          {!hasProfile && (
            <button
              onClick={() =>
                user ? router.push("/dashboard") : handleSignIn()
              }
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-foreground text-background text-xs font-bold px-5 py-2.5 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer shadow-lg shadow-black/5 whitespace-nowrap">
              {user ? "Dashboard" : "Get Started"}
            </button>
          )}
        </nav>

        {/* HERO - Simplified, single focus */}
        <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-48 pb-24 min-h-[85vh] w-full overflow-hidden">
          <BlurFade delay={0.2} className="w-full max-w-5xl mx-auto px-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-6 font-heading">
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
                  className="h-14 px-8 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-3 shadow-xl shadow-black/10 whitespace-nowrap">
                  {user ? "Enter Dashboard" : "Start Tracking"}
                  <ArrowRight size={18} />
                </button>
                <Link
                  href="#features"
                  className="inline-flex items-center text-sm font-medium text-muted-foreground-foreground hover:text-foreground transition-colors whitespace-nowrap gap-2 border-2 p-4 rounded-2xl">
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

          {/* Subtle calorie ring - moved below CTAs, smaller */}
          <BlurFade delay={0.5} className="relative w-32 h-32 mt-16">
            <svg viewBox="0 0 160 160" className="-rotate-90 w-full h-full">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-foreground/[0.04]"
              />
              <circle
                ref={arcRef}
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="440"
                strokeDashoffset="440"
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                ref={countRef}
                className="text-3xl font-bold tabular-nums tracking-tighter">
                0
              </span>
              <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground-foreground">
                kcal
              </span>
            </div>
          </BlurFade>
        </section>

        {/* FEATURES GRID */}
        <section
          id="features"
          className="relative z-10 py-24 px-6 w-full flex justify-center">
          <div className="max-w-5xl mx-auto w-full">
            <BlurFade className="text-center mb-16 w-full flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 font-heading">
                Data, without the noise.
              </h2>
              <p className="text-muted-foreground-foreground text-base font-medium">
                Built for the obsessive. Engineered for clarity.
              </p>
            </BlurFade>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {FEATURES.map((f, i) => (
                <BlurFade key={f.title} delay={0.1 * i}>
                  <Card className="card-interactive h-full p-6 sm:p-8 group">
                    <CardContent className="p-0 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                        {f.icon}
                      </div>
                      <div className="font-bold text-lg mb-2 tracking-tight font-heading">
                        {f.title}
                      </div>
                      <div className="text-muted-foreground-foreground text-sm leading-relaxed">
                        {f.desc}
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {/* METHOD SECTION */}
        <section
          id="how-it-works"
          className="relative z-10 py-24 px-6 border-t border-border/60 w-full flex justify-center">
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

        <CTASection handleSignIn={handleSignIn} />
        <Footer />
      </div>
    </ReactLenis>
  );
}
