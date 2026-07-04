"use client";

import dynamic from "next/dynamic";
import { ReactLenis } from "lenis/react";
import BlurFade from "../animations/BlurFade";
import { DashboardMock } from "./DashboardMock";
import { MobileDashboardMock } from "./MobileDashboardMock";

export const dashboardDark = "/screenshots/dashboard_dark.png";
export const dashboardLight = "/screenshots/dashboard_light.png";

/**
 * DesktopScreenshotCard — wide 7:5 canvas, renders `DashboardMock`
 * (the desktop-style dashboard with sidebar + grid layout).
 */
function DesktopScreenshotCard() {
  return (
    <div className="relative w-full aspect-[7/5] overflow-hidden rounded-2xl">
      <div className="absolute inset-0 z-10 pointer-events-none" />
      <DashboardMock />
    </div>
  );
}

/**
 * MobileScreenshotCard — phone-shaped (9:19 portrait) canvas,
 * renders `MobileDashboardMock`. This mock mirrors the real
 * CalStory mobile dashboard exactly — logo + streak header,
 * circular day strip, calories card, stacked macro rows, FAB —
 * so on a phone the landing hero previews what the user will
 * actually see when they open the app.
 */
function MobileScreenshotCard() {
  return (
    <div className="relative mx-auto w-full max-w-90 aspect-[9/19] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl shadow-black/40">
      <MobileDashboardMock />
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
    <div className="md:hidden py-24 space-y-8 max-w-xl mx-auto text-center px-4">
      <BlurFade delay={0.15}>
        <MobileScreenshotCard />
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
    <div className="hidden md:block w-full">
      <ContainerScroll titleComponent={<HeroCopy />}>
        <DesktopScreenshotCard />
      </ContainerScroll>
    </div>
  );
}

export default function HeroScrollSection() {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.4, smoothWheel: true }}>
      <section className="relative w-full z-10 overflow-hidden">
        <MobileLayout />
        <DesktopLayout />
      </section>
    </ReactLenis>
  );
}
