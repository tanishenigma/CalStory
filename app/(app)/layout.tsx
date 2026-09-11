"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PillNav from "@/app/components/PillNav";
import BottomNav from "@/app/components/BottomNav";
import FAB from "@/app/components/FAB";
import { usePrefsStore } from "@/app/store/prefsStore";
import { useUiStore } from "@/app/store/uiStore";
import { usePathname } from "next/navigation";

function MobilePageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCalibra = pathname === "/calibra";
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 1023px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setIsMobile(mobileQuery.matches);
      setReducedMotion(motionQuery.matches);
    };
    update();
    mobileQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    return () => {
      mobileQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Always render the same element type (motion.div) regardless of breakpoint
  // so React reconciles the tree instead of unmounting/remounting when the
  // viewport crosses the mobile breakpoint. Remounting would reset the child's
  // local state (e.g. the Calibra chat messages). The animation is only applied
  // on mobile to preserve the existing page-transition feel.
  const isAnimated = isMobile && !reducedMotion;

  return (
    <motion.div
      className={`w-full ${isCalibra ? "flex h-full min-h-0 flex-1 flex-col" : ""}`}
      initial={isAnimated ? { opacity: 0, y: 6 } : false}
      animate={isAnimated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.2, ease: [0.165, 0.84, 0.44, 1] }}>
      {children}
    </motion.div>
  );
}

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navStyle = usePrefsStore((s) => s.navbarStyle);
  const chromeHidden = useUiStore((s) => s.chromeHidden);
  const setChromeHidden = useUiStore((s) => s.setChromeHidden);
  const pathname = usePathname();
  const isCalibra = pathname === "/calibra";
  const padLeft = navStyle === "floating" ? "lg:pl-[272px]" : "lg:pl-[88px]";

  useEffect(() => {
    setChromeHidden(false);
  }, [pathname, setChromeHidden]);
  return (
    <>
      <div
        className={`bg-background ${isCalibra ? "flex h-dvh overflow-hidden" : "min-h-screen"}`}>
        {!chromeHidden && <PillNav />}
        <main
          style={isCalibra ? undefined : { paddingBottom: "96px" }}
          className={`${padLeft} transition-[padding] duration-300 ${
            isCalibra
              ? "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-24 lg:pb-0"
              : "min-h-screen pb-0"
          }`}>
          <div
            className={`w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 ${
              isCalibra
                ? "flex h-full min-h-0 flex-1 flex-col"
                : "py-6 lg:py-10 "
            }`}>
            <MobilePageShell>{children}</MobilePageShell>
          </div>
        </main>
      </div>
      {!chromeHidden && <BottomNav />}
      {!chromeHidden && pathname === "/dashboard" && <FAB />}
    </>
  );
}
