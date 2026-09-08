"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import styles from "@/app/landing.module.css";
export const AUTH_ENTRY_PATH = "/auth";
export function PrimaryCta({ signedIn, className = "", label }: { signedIn: boolean; className?: string; label?: string }) { return <Link href={signedIn ? "/dashboard" : AUTH_ENTRY_PATH} className={`${styles.primaryButton} ${className}`}>{label ?? (signedIn ? "Open dashboard" : "Start tracking free")}<ArrowRight size={15} /></Link>; }
export function Eyebrow({ children }: { children: React.ReactNode }) { return <p className={styles.eyebrow}>{children}</p>; }
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) { const reduced=useReducedMotion(); return <motion.div className={className} initial={reduced?false:{opacity:0,y:22,filter:"blur(7px)"}} whileInView={{opacity:1,y:0,filter:"blur(0px)"}} viewport={{once:true,margin:"-10% 0px"}} transition={{duration:.65,delay,ease:[.16,1,.3,1]}}>{children}</motion.div>; }
