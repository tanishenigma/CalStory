"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Log meals in seconds with AI",
    description:
      'CalStory turns "I had two eggs, toast, and a protein shake" into a saved entry in under five seconds. Our AI food logger understands plain English then estimates calories and macros against a nutrition database. You confirm before anything is committed, so the numbers stay yours — not the model\'s.',
    image: "/landing/log-meals.webp",
  },
  {
    title: "Hit your macros without spreadsheets",
    description:
      "Calorie targets, protein floors, and macro splits update in real time as you log. The calorie ring on the dashboard shows what's left for the day; macro pills show whether you're ahead or behind on protein, carbs, and fat. No mental math, no forgotten cells in a Google Sheet.",
    image: "/landing/hit-macros.webp",
  },
  {
    title: "Track every set, every workout",
    description:
      "Strength sessions, HIIT, cardio, yoga, sports — CalStory's schema-driven workout form logs sets, reps, and weight for resistance work, distance and pace for cardio, and duration for everything else. Save workouts as templates and re-log them with one tap.",
    image: "/landing/tack-every-set.webp",
  },
  {
    title: "See real progress, not just numbers",
    description:
      "The Progress page turns your logs into a 16-week consistency heatmap, a calorie-vs-TDEE chart, weekly energy averages, and weight-trend tracking. Spot patterns. Catch stalls. Adjust before frustration sets in.",
    image: "/landing/real-progress.webp",
  },
  {
    title: "Built for lifters, runners, and everyone in between",
    description:
      "CalStory is opinionated about strength training — but the tracking model is generic enough to work for runners logging mileage, cyclists tracking TSS, or anyone who wants to know whether they ate enough protein this week. The TDEE calculator uses the Mifflin-St Jeor equation and refines its estimate as you log weight over time.",
    image: "/landing/built-for-lifters.webp",
  },
];

function FeatureRow({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const isEven = index % 2 === 0;

  useEffect(() => {
    const row = rowRef.current;
    const text = textRef.current;
    const image = imageRef.current;
    const title = titleRef.current;
    const desc = descRef.current;
    const line = lineRef.current;

    if (!row || !text || !image || !title || !desc || !line) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        noReducedMotion: "(prefers-reduced-motion: no-preference)",
        reducedMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { noReducedMotion } = context.conditions as {
          noReducedMotion: boolean;
        };

        if (noReducedMotion) {
          const textX = isEven ? -60 : 60;
          const imageX = isEven ? 60 : -60;

          gsap.set(text, { x: textX, opacity: 0 });
          gsap.set(image, { x: imageX, opacity: 0, scale: 0.96 });
          gsap.set(title, { y: 24, opacity: 0 });
          gsap.set(desc, { y: 16, opacity: 0 });
          gsap.set(line, { scaleX: 0, transformOrigin: "left center" });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: row,
              start: "top 82%",
              end: "top 40%",
              toggleActions: "play none none none",
            },
          });

          tl.to(text, {
            x: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power3.out",
          })
            .to(
              line,
              {
                scaleX: 1,
                duration: 0.5,
                ease: "power2.inOut",
              },
              "-=0.5",
            )
            .to(
              title,
              {
                y: 0,
                opacity: 1,
                duration: 0.55,
                ease: "power2.out",
              },
              "-=0.35",
            )
            .to(
              desc,
              {
                y: 0,
                opacity: 1,
                duration: 0.55,
                ease: "power2.out",
              },
              "-=0.3",
            )
            .to(
              image,
              {
                x: 0,
                opacity: 1,
                scale: 1,
                // expo.out gives the hero image a buttery, cinematic settle
                // — it overshoots softly then decelerates to rest. Longer
                // duration (1.05s) lets the parallax's later offset breathe
                // rather than cutting off mid-motion.
                duration: 1.05,
                ease: "expo.out",
              },
              "-=0.7",
            );

          // ── Parallax ──
          // Drift the image up by 22% of its own height as the row scrolls
          // past — clearly visible without feeling disjointed. `scrub: 0.6`
          // ties the motion to scroll position with a small smoothing
          // window: tight enough to feel responsive on a trackpad, soft
          // enough to never judder on inertial scroll. `ease: "none"` is
          // required when scrub is a number so GSAP doesn't apply a curve.
          gsap.to(image, {
            yPercent: -22,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        } else {
          // Reduced motion: simple fade
          gsap.set([text, image], { opacity: 0 });
          gsap.to([text, image], {
            opacity: 1,
            duration: 0.4,
            stagger: 0.1,
            scrollTrigger: {
              trigger: row,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        }
      },
    );

    // ── Magnetic hover ──
    // gsap.quickTo creates dedicated, lightweight tweens for mouse-driven
    // values that DON'T fight each other or the parallax (which writes
    // yPercent). The previous gsap.to() fired on every mousemove, so
    // dozens of in-flight tweens competed and produced visible jitter —
    // quickTo collapses all of that into one tween-per-axis that's
    // always aiming at the latest target.
    const imageEl = imageRef.current;
    if (!imageEl) return;

    const setX = gsap.quickTo(imageEl, "x", {
      duration: 0.55,
      ease: "power3.out",
    });
    const setY = gsap.quickTo(imageEl, "y", {
      duration: 0.55,
      ease: "power3.out",
    });
    const setScale = gsap.quickTo(imageEl, "scale", {
      duration: 0.6,
      ease: "power3.out",
    });

    const onMouseMove = (e: MouseEvent) => {
      const rect = imageEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalised cursor offset from image centre, in [-1, 1].
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      // Magnitudes tuned for a subtle drift — large enough to feel alive,
      // small enough that the image never leaves its frame.
      setX(dx * 14);
      setY(dy * 10);
      setScale(1.06);
    };

    const onMouseLeave = () => {
      setX(0);
      setY(0);
      setScale(1);
    };

    imageEl.addEventListener("mousemove", onMouseMove);
    imageEl.addEventListener("mouseleave", onMouseLeave);

    return () => {
      imageEl.removeEventListener("mousemove", onMouseMove);
      imageEl.removeEventListener("mouseleave", onMouseLeave);
      mm.revert();
    };
  }, [isEven]);

  return (
    <div
      ref={rowRef}
      className={`flex flex-col md:flex-row items-center gap-12 lg:gap-20 ${
        isEven ? "" : "md:flex-row-reverse"
      }`}>
      {/* Text Content */}
      <div ref={textRef} className="flex-1 space-y-4">
        {/* Animated accent line */}
        <span
          ref={lineRef}
          className="block h-[2px] w-12 bg-primary mb-6 rounded-full"
          aria-hidden="true"
        />
        <h3
          ref={titleRef}
          className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight font-heading">
          {feature.title}
        </h3>
        <p
          ref={descRef}
          className="text-muted-foreground leading-relaxed text-lg">
          {feature.description}
        </p>
      </div>

      {/* Feature Image */}
      <div
        ref={imageRef}
        // will-change-transform keeps the image wrapper on its own GPU
        // layer so the parallax ScrollTrigger can scrub transform values
        // every frame without triggering a repaint of surrounding layout.
        className="flex-1 w-full relative aspect-4/3 will-change-transform">
        <Image
          src={feature.image}
          alt={feature.title}
          fill
          className="object-cover object-center rounded-xl"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}

export default function FeatureGrid() {
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(footer, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: footer,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      aria-labelledby="seo-content"
      className="relative z-10 py-24 px-6 w-full flex justify-center">
      <div className="max-w-6xl mx-auto w-full">
        <h2 id="seo-content" className="sr-only">
          Why CalStory is the best calorie and macro tracker
        </h2>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <FeatureRow key={index} feature={feature} index={index} />
          ))}
        </div>

        <div
          ref={footerRef}
          className="mb-6 max-w-3xl mx-auto text-center mt-24">
          <p className="text-sm text-muted-foreground">
            Want a deeper walkthrough? Read our guides on{" "}
            <Link
              href="/blog/calorie-tracking-for-beginners"
              className="text-primary hover:underline font-medium">
              calorie tracking for beginners
            </Link>{" "}
            and{" "}
            <Link
              href="/blog/best-macro-calculator"
              className="text-primary hover:underline font-medium">
              choosing the best macro calculator for lifters
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
