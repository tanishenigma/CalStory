"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { BlurFade } from "@/app/components/BlurFade";
import { useApp } from "@/app/context/AppContext";
import { Card, CardContent } from "@/app/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

interface CtaSectionProps {
  handleSignIn: () => void;
}

const CTASection = ({ handleSignIn }: CtaSectionProps) => {
  const { user } = useAuthStore();
  const { state } = useApp();
  const router = useRouter();

  const hasProfile = !!state.profile;

  return (
    <section className="relative z-10 py-32 px-6 w-full overflow-hidden">
      <BlurFade delay={0.1} className="w-full flex justify-center">
        <Card className="relative w-full max-w-5xl rounded-[32px] overflow-hidden card-elevated backdrop-blur-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-24 text-center group mx-auto">
          {/* Atmospheric backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none rounded-[32px]" />
          <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

          {/* Decorative glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/15 transition-colors duration-700" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

          <CardContent className="relative z-10 space-y-8 w-full p-0">
            {!hasProfile && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-orange-600 mx-auto">
                <Sparkles size={12} />
                Start your transformation
              </div>
            )}

            <h2 className="text-4xl md:text-7xl font-bold tracking-tight leading-[1.05] text-balance mx-auto font-heading">
              {hasProfile ? "Continue your" : "Ready to hit your"} <br />
              <span className="text-primary">
                {hasProfile ? "fitness journey" : "absolute peak?"}
              </span>
            </h2>

            <p className="text-muted-foreground-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              {hasProfile
                ? "Your progress is waiting. Dive back into your data and keep hitting your targets."
                : "Stop guessing. Start tracking with the elite interface designed for high-performance individuals."}
            </p>

            <div className="flex items-center justify-center gap-4 pt-4 w-full">
              <button
                onClick={() =>
                  user && hasProfile
                    ? router.push("/dashboard")
                    : handleSignIn()
                }
                className="h-14 px-10 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2.5 shadow-xl hover:shadow-2xl hover:shadow-primary/10">
                {hasProfile ? "Go to Dashboard" : "Get started free"}
                <ArrowRight size={18} />
              </button>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </section>
  );
};

export default CTASection;
