"use client";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import HeroScrollSection from "@/app/components/landing/HeroScrollSection";
import { Eyebrow, PrimaryCta } from "./shared";
import styles from "@/app/landing.module.css";

function HeroCopy({ signedIn }: { signedIn: boolean }) {
  const reduced = useReducedMotion();
  return <motion.div className={styles.topHeroCopy} initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [.16, 1, .3, 1] }}>
    <Eyebrow>NUTRITION + TRAINING, IN ONE SYSTEM</Eyebrow>
    <h1>Track food. Train hard.<br />See the <span>whole story.</span></h1>
    <p>CalStory combines fast meal logging, strength tracking, and adaptive calorie targets so you can see what&apos;s actually working.</p>
    <div className={styles.heroActions}><PrimaryCta signedIn={signedIn} label="Open dashboard" /><a href="#features" className={styles.textLink}>See how it works <ArrowRight size={14} /></a></div>
  </motion.div>;
}

export function LandingHero({ signedIn }: { signedIn: boolean }) {
  return <>
    <section className={styles.heroIntro}>
      <HeroCopy signedIn={signedIn} />
    </section>
    <section className={styles.dashboardStory} aria-label="CalStory dashboard preview">
      <HeroScrollSection />
    </section>
  </>;
}
