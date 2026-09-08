"use client";

import { ReactLenis } from "lenis/react";
import { useAuthStore } from "@/app/store/authStore";
import { StructuredData } from "@/app/components/seo/StructuredData";
import { landingJsonLd } from "@/app/components/landing/landingJsonLd";
import { LandingNav } from "@/app/components/landing-redesign/LandingNav";
import { LandingHero } from "@/app/components/landing-redesign/LandingHero";
import { ProductStories } from "@/app/components/landing-redesign/ProductStories";
import { Comparison, UseCaseRail } from "@/app/components/landing-redesign/SocialProof";
import { PricingValue, LandingFaq, FinalCta, LandingFooter } from "@/app/components/landing-redesign/ClosingSections";
import styles from "./landing.module.css";

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const signedIn = Boolean(user) && !loading;
  return <ReactLenis root options={{ lerp: 0.085, duration: 1.15, smoothWheel: true }}><main className={styles.page}>
    <StructuredData data={landingJsonLd} />
    <div className={styles.pageSurface}>
      <LandingNav signedIn={signedIn} /><LandingHero signedIn={signedIn} />
      <ProductStories /><Comparison /><UseCaseRail /><PricingValue signedIn={signedIn} /><LandingFaq /><FinalCta signedIn={signedIn} />
    </div>
    <div className={styles.footerRevealSpace} aria-hidden="true" />
    <LandingFooter />
  </main></ReactLenis>;
}
