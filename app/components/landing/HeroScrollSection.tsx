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
    <div className="relative mx-auto w-full max-w-90 aspect-[9/19] overflow-hidden rounded-[28px] border border-border shadow-xl shadow-black/10">
      <MobileDashboardMock />
    </div>
  );
}

function HeroCopy() {
  return null;
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
