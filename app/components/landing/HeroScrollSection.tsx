"use client";

import React from "react";
import dynamic from "next/dynamic";
import BlurFade from "../animations/BlurFade"; // Update import path if necessary

export const dashboardDark = "/dashboard_dark.png";

function ScreenshotCard() {
  return (
    <div className="relative w-full aspect-[7/5] overflow-hidden bg-foreground/[0.04] border border-border/60 rounded-2xl ">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(120,119,198,0.12),transparent_70%)] z-10 pointer-events-none" />
      <img
        src={dashboardDark}
        alt="CalStory dashboard"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function HeroCopy() {
  return (
    <div className="space-y-4 text-left px-4 md:px-0">
      <h2 className="text-3xl xl:text-5xl xxl:text-8xl md:text-3xl font-bold tracking-tight leading-tight font-heading lg:text-4xl">
        Get fit with <span className="text-primary">AI-powered</span> tracking.
      </h2>
      <p className="text-muted-foreground text-base md:text-xs leading-relaxed lg:text-sm xl:text-xl xxl:text-xl">
        CalStory uses computer vision to log meals from a single photo — then
        continuously adapts your calorie and macro targets to your metabolism.
      </p>
    </div>
  );
}

const ContainerScroll = dynamic(
  () =>
    import("@/app/components/ui/container-scroll-animation").then(
      (m) => m.ContainerScroll,
    ),
  { ssr: false },
);

function MobileLayout() {
  return (
    <div className="md:hidden py-36 space-y-6 max-w-xl mx-auto text-center px-4">
      <BlurFade delay={0.15}>
        <ScreenshotCard />
      </BlurFade>
      <BlurFade>
        <h2 className="text-3xl font-bold leading-tight">
          Get fit with <span className="text-primary">AI-powered</span>{" "}
          tracking.
        </h2>
        <p className="text-muted-foreground text-base leading-relaxed mt-3">
          CalStory uses computer vision to log meals from a single photo — then
          continuously adapts your calorie and macro targets to your metabolism.
        </p>
      </BlurFade>
    </div>
  );
}

function DesktopLayout() {
  return (
    <div className="hidden md:block w-full ">
      <ContainerScroll titleComponent={<HeroCopy />}>
        <ScreenshotCard />
      </ContainerScroll>
    </div>
  );
}

export default function HeroScrollSection() {
  return (
    <section className="relative w-full z-10 overflow-hidden ">
      <MobileLayout />
      <DesktopLayout />
    </section>
  );
}
