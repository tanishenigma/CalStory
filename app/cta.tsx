"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import BlurFade from "@/app/components/animations/BlurFade";
import { CardContent } from "@/app/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useProfileStore } from "@/app/store/profileStore";

interface CtaSectionProps {
  handleSignIn: () => void;
}

const CTASection = ({ handleSignIn }: CtaSectionProps) => {
  const { user } = useAuthStore();
  const router = useRouter();
  const hasProfile = useProfileStore((s) => s.hasProfile);
  const profileHydrated = useProfileStore((s) => s.hydrated);

  return (
    <section className="relative z-10 px-6  w-full  overflow-hidden  ">
      <div className="flex justify-center ">
        <div className="relative w-full max-w-5xl overflow-hidden  px-4 sm:px-6 lg:px-8 py-12 lg:py-24 text-center group mx-auto rounded-2xl  backdrop-blur-md! dark:backdrop-blur-md! border border-white/10   z-0">
          <CardContent className="relative  space-y-8 w-full p-0 z-20 ">
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight leading-[1.05] text-balance mx-auto font-heading ">
              {hasProfile ? "Continue your" : "Ready to hit your"} <br />
              <span className="text-primary">
                {hasProfile ? "fitness journey" : "absolute peak?"}
              </span>
            </h2>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              {hasProfile
                ? "Your progress is waiting. Dive back into your data and keep hitting your targets."
                : "Stop guessing. Start tracking with the elite interface designed for high-performance individuals."}
            </p>

            <div className="flex items-center justify-center gap-4 pt-4 w-full">
              <button
                onClick={() =>
                  user && profileHydrated && hasProfile
                    ? router.push("/dashboard")
                    : handleSignIn()
                }
                className="h-14 px-10 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2.5 shadow-xl hover:shadow-2xl hover:shadow-primary/10">
                {hasProfile ? "Go to Dashboard" : "Get started free"}
                <ArrowRight size={18} />
              </button>
            </div>
          </CardContent>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
