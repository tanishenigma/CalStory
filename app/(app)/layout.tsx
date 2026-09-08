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

  if (!isMobile || reducedMotion) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      className="w-full will-change-transform"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
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
  const padLeft = navStyle === "floating" ? "lg:pl-[272px]" : "lg:pl-[88px]";

  useEffect(() => {
    setChromeHidden(false);
  }, [pathname, setChromeHidden]);
  return (
    <>
      <div style={{ minHeight: "100dvh" }} className="bg-background">
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
