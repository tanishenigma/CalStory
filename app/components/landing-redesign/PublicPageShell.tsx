"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis } from "lenis/react";
import { useAuthStore } from "@/app/store/authStore";
import { LandingNav } from "./LandingNav";
import { LandingFooter } from "./ClosingSections";
import styles from "@/app/landing.module.css";

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return <ReactLenis root options={{ lerp: .085, duration: 1.15, smoothWheel: true }}>
    <div className={styles.page}>
      <div className={styles.pageSurface}>
        <LandingNav signedIn={Boolean(user) && !loading} />
        {children}
      </div>
      <div className={styles.footerRevealSpace} aria-hidden="true" />
      <LandingFooter />
    </div>
  </ReactLenis>;
}
