"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PillNav from "@/app/components/PillNav";
import BottomNav from "@/app/components/BottomNav";
import FAB from "@/app/components/FAB";
import { usePrefsStore } from "@/app/store/prefsStore";
import { useUiStore } from "@/app/store/uiStore";
import { usePathname } from "next/navigation";

function MobilePageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

  // Desktop, or user prefers reduced motion → render plainly.
  if (!isMobile || reducedMotion) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -16, opacity: 0 }}
        // Sub-300ms so a fast tap between tabs doesn't feel laggy.
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="w-full will-change-transform">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navStyle = usePrefsStore((s) => s.navbarStyle);
  const chromeHidden = useUiStore((s) => s.chromeHidden);
  const pathname = usePathname();
  // `chromeHidden` is set by fullscreen overlays (e.g. the
  // delete-account confirmation) so the sidebar / bottom nav /
  // FAB can't sit above or beside the modal.
  const padLeft = navStyle === "floating" ? "lg:pl-[240px]" : "lg:pl-20";
  return (
    <>
      <div
        style={{ minHeight: "100dvh" }}
        className="bg-background ml-0 sm:ml-5">
        {!chromeHidden && <PillNav />}
        <main
          style={{ paddingBottom: "96px" }}
          className={`${padLeft} pb-0 min-h-screen transition-[padding] duration-300`}>
          <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
            <MobilePageShell>{children}</MobilePageShell>
          </div>
        </main>
      </div>
      {!chromeHidden && <BottomNav />}
      {!chromeHidden && pathname === "/dashboard" && <FAB />}
    </>
  );
}
