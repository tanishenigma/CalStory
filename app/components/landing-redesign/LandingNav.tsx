"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import BrandLogo from "@/app/components/BrandLogo";
import { PrimaryCta } from "./shared";
import styles from "@/app/landing.module.css";
export function LandingNav({signedIn}:{signedIn:boolean}){const[open,setOpen]=useState(false);const toTop=(event:React.MouseEvent<HTMLAnchorElement>)=>{event.preventDefault();setOpen(false);window.scrollTo({top:0,behavior:"smooth"});};return <header className={styles.navWrap}><nav className={styles.nav}><Link href="#top" onClick={toTop} className={styles.brand}><BrandLogo className={styles.logo}/><span>CalStory</span></Link><div className={styles.desktopLinks}><Link href="/#features">Features</Link><Link href="/pricing">Pricing</Link><Link href="/about">About</Link></div><div className={styles.desktopActions}><PrimaryCta signedIn={signedIn}/></div><button className={styles.menuButton} aria-expanded={open} aria-label={open?"Close menu":"Open menu"} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></nav><AnimatePresence>{open&&<motion.div className={styles.mobileMenu} initial={{opacity:0,y:-8,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-6,scale:.98}} transition={{duration:.18,ease:"easeOut"}}><Link href="/#features" onClick={()=>setOpen(false)}>Features</Link><Link href="/pricing" onClick={()=>setOpen(false)}>Pricing</Link><Link href="/about" onClick={()=>setOpen(false)}>About</Link><PrimaryCta signedIn={signedIn}/></motion.div>}</AnimatePresence></header>}
