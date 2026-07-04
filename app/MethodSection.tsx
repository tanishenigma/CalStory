"use client";

import React, { forwardRef, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BlurFade from "@/app/components/animations/BlurFade";

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

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const MethodSection = forwardRef<HTMLElement>(
  function MethodSection(_props, ref) {
    const sectionRef = useRef<HTMLElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const setRefs = (node: HTMLElement | null) => {
      sectionRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    };

    useEffect(() => {
      if (typeof window === "undefined") return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "120% top",
          end: "+=80%",
          onUpdate: (self) => {
            const progress = self.progress;

            if (progress < 0.08) {
              setActiveIndex(0);
            } else if (progress < 0.45) {
              setActiveIndex(1);
            } else {
              setActiveIndex(2);
            }
          },
        });
      });

      return () => ctx.revert();
    }, []);

    return (
      <div className="flex flex-col w-full gap-10">
        <section
          ref={setRefs}
          id="how-it-works"
          className="relative w-full h-[100vh] scroll-mt-24">
          <div className="relative top-0 w-full h-screen flex items-center justify-center overflow-hidden px-6">
            {/* Foreground Card */}
            <div className="max-w-5xl mx-auto w-full backdrop-blur-2xl shadow-2xl p-10 rounded-lg relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
                <BlurFade>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] font-heading">
                    Zero Friction.{" "}
                    <span className="text-primary">Maximum Results.</span>
                  </h2>
                  <p className="mt-6 text-muted-foreground text-base leading-relaxed">
                    Most trackers fail because they're too slow. CalStory is
                    optimized for speed, so you spend less time logging and more
                    time training.
                  </p>
                </BlurFade>

                <div className="flex flex-col gap-8">
                  {STEPS.map((s, i) => {
                    const isActive = activeIndex === i;
                    return (
                      <div
                        key={s.n}
                        className={`flex items-start gap-5 transition-all duration-300 ${
                          isActive ? "opacity-100" : "opacity-50"
                        }`}>
                        <div
                          className={`step-badge shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold tabular-nums transition-colors duration-300 ${
                            isActive
                              ? "bg-green-500 text-white"
                              : "bg-foreground text-background"
                          }`}>
                          {s.n}
                        </div>
                        <div>
                          <div
                            className={`step-title font-bold text-base mb-1 tracking-tight font-heading transition-colors duration-300 ${
                              isActive ? "text-green-500" : ""
                            }`}>
                            {s.title}
                          </div>
                          <div className="step-desc text-muted-foreground text-sm leading-relaxed">
                            {s.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>{" "}
            <div className="absolute lg:right-72 bottom-16 text-[360px] font-heading text-primary/10 font-bold">
              {activeIndex + 1}
            </div>
          </div>{" "}
        </section>
      </div>
    );
  },
);

export default MethodSection;
