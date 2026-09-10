"use client";

import dynamic from "next/dynamic";
import BlurFade from "../animations/BlurFade";
import { DashboardMock } from "./DashboardMock";
import { MobileDashboardMock } from "./MobileDashboardMock";

export const dashboardDark = "/screenshots/dashboard_dark.png";
export const dashboardLight = "/screenshots/dashboard_light.png";

function DesktopScreenshotCard() {
  return (
    <div className="relative w-full aspect-[7/5] overflow-hidden rounded-2xl">
      <div className="absolute inset-0 z-10 pointer-events-none" />
      <DashboardMock />
    </div>
  );
}

function MobileScreenshotCard() {
  return (
    <div
      className="relative mx-auto aspect-[9/16] w-full max-w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border shadow-sm pointer-events-none select-none"
      aria-hidden="true"
      inert>
      <MobileDashboardMock />
    </div>
  );
}

function HeroCopy() {
  return (
    <div className="text-left">
      <h1 className="text-5xl font-bold tracking-tight">
        Track your <span className="text-primary">nutrition</span>,
        <br /> no hassle.
      </h1>

      <p className="mt-6 text-lg text-muted-foreground">
        CalStory makes tracking calories
        <br /> and workout simple, fast, and effortless.
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
    <div className="md:hidden py-12 max-w-xl mx-auto text-center px-4">
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
    <section className="relative w-full z-10 overflow-hidden">
      <MobileLayout />
      <DesktopLayout />
    </section>
  );
}
