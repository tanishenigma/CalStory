"use client";

import {
  useScroll,
  useTransform,
  useMotionTemplate,
  motion,
  easeInOut,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Method", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
];

/**
 * Resolve the theme's resting text colour from the active CSS variables.
 *
 * The morphed pill is always a dark backdrop (`rgba(15, 23, 42, 0.75)`),
 * so the navbar text needs to fade from the page's resting text colour
 * (dark ink in light mode, off-white in dark mode) to pure white as the
 * user scrolls past ~80px. Reading the resolved CSS value via
 * getComputedStyle gives us theme-awareness without hard-coding either
 * end, and the MutationObserver picks up theme changes triggered by
 * usePrefsStore (which toggles the `.dark` class on <html>).
 */
function useRestingTextColor(): string {
  const [color, setColor] = useState<string>("#1a1916");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const cs = getComputedStyle(document.documentElement);
      // --color-foreground is the page text colour in the active theme.
      const value = cs.getPropertyValue("--color-foreground").trim();
      if (value) setColor(value);
    };

    compute();

    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  return color;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return [26, 25, 22];
  const intVal = parseInt(m[1], 16);
  return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
}

export function Navbar({
  onSignIn,
  user,
}: {
  onSignIn: () => void | Promise<void>;
  user: unknown;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const restTextColor = useRestingTextColor();
  const [restRGB, setRestRGB] = useState<[number, number, number]>([
    26, 25, 22,
  ]);

  useEffect(() => {
    setRestRGB(hexToRgb(restTextColor));
  }, [restTextColor]);

  const handleHashClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute("href");
    if (!href) return;

    if (href.startsWith("/#")) {
      setMobileOpen(false);
      return;
    }

    if (!href.startsWith("#")) return;

    const targetId = href.slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    setMobileOpen(false);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
  };

  const { scrollY } = useScroll();
  const smoothScroll = useSpring(scrollY, {
    stiffness: 200,
    damping: 20,
    restDelta: 0.001,
  });

  const easeConfig = { ease: easeInOut };

  // Scroll-driven morph: at scrollY=0 the navbar is a full-width flat bar;
  // as the user scrolls past ~80px it morphs into a compact pill.
  const borderRadius = useTransform(
    smoothScroll,
    [0, 80],
    [0, 9999],
    easeConfig,
  );
  const paddingX = useTransform(smoothScroll, [0, 80], [20, 16], easeConfig);
  const height = useTransform(smoothScroll, [0, 100], [72, 56], easeConfig);
  const maxWidth = useTransform(smoothScroll, [0, 80], [1400, 720], easeConfig);
  const top = useTransform(smoothScroll, [0, 80], [0, 12], easeConfig);
  const bgOpacity = useTransform(smoothScroll, [0, 80], [0, 0.75], easeConfig);
  const borderOpacity = useTransform(
    smoothScroll,
    [0, 80],
    [0, 0.5],
    easeConfig,
  );
  const shadowOpacity = useTransform(
    smoothScroll,
    [0, 80],
    [0, 0.12],
    easeConfig,
  );
  const highlightOpacity = useTransform(
    smoothScroll,
    [40, 80],
    [0, 0.3],
    easeConfig,
  );
  const dotOpacity = useTransform(
    smoothScroll,
    [40, 80],
    [0, 0.15],
    easeConfig,
  );
  const staticInsetOpacity = useTransform(
    smoothScroll,
    [0, 80],
    [0, 0.05],
    easeConfig,
  );

  // Text colour morph: theme-aware resting colour → pure white as the pill
  // backdrop fills in. We animate each RGB channel independently so the
  // interpolation respects the active theme (dark ink in light mode, off-white
  // in dark mode) at scrollY=0.
  const textR = useTransform(
    smoothScroll,
    [0, 80],
    [restRGB[0], 255],
    easeConfig,
  );
  const textG = useTransform(
    smoothScroll,
    [0, 80],
    [restRGB[1], 255],
    easeConfig,
  );
  const textB = useTransform(
    smoothScroll,
    [0, 80],
    [restRGB[2], 255],
    easeConfig,
  );
  const textColor = useMotionTemplate`rgb(${textR}, ${textG}, ${textB})`;
  const chipBg = textColor;

  const background = useMotionTemplate`rgba(24, 20, 15, ${bgOpacity})`;
  const boxShadow = useMotionTemplate`
  0 10px 10px rgba(0, 0, 0, ${shadowOpacity}),
  inset 0 1px 1px rgba(255, 255, 255, ${highlightOpacity}),
  inset 0 0 0 1px rgba(255, 255, 255, ${staticInsetOpacity})
`;
  const border = useMotionTemplate`1px solid rgba(194, 120, 3, ${borderOpacity})`;
  const backgroundImage = useMotionTemplate`radial-gradient(circle, rgba(255, 255, 255, ${dotOpacity}) 1px, transparent 1px)`;
  const overflow = useMotionTemplate`hidden`;
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
      <motion.nav
        style={{
          borderRadius,
          height,
          maxWidth,
          top,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          background,
          backgroundImage,
          backgroundSize: "16px 16px",
          boxShadow,
          overflow,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border,
        }}
        className="relative w-[calc(100%-2rem)] flex items-center justify-between will-change-transform">
        {/* Top-edge highlight gradient */}
        <motion.div
          style={{ opacity: highlightOpacity }}
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-foreground/20 via-primary/10 to-transparent border-t-background border-t-2"
        />

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center relative z-10 shrink-0 gap-2.5 cursor-pointer">
          {" "}
          <motion.div
            style={{ backgroundColor: chipBg }}
            className="w-10 h-10 rounded-full flex items-center justify-center ">
            <motion.span style={{ color: chipBg }} className="inline-flex">
              {" "}
              <Flame size={36} className=" fill-white dark:fill-black" />
            </motion.span>
          </motion.div>
          <motion.span
            style={{ color: textColor }}
            className="font-bold text-lg tracking-tight font-heading ">
            CalStory
          </motion.span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 relative z-10">
          {NAV_LINKS.map((link) => {
            const isHash =
              link.href.startsWith("#") || link.href.startsWith("/#");
            return (
              <motion.span
                key={link.label}
                style={{ color: textColor }}
                className="text-xs font-bold uppercase tracking-widest">
                {isHash ? (
                  <a
                    href={link.href}
                    onClick={handleHashClick}
                    className="opacity-80 hover:opacity-100 transition-opacity">
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="opacity-80 hover:opacity-100 transition-opacity">
                    {link.label}
                  </Link>
                )}
              </motion.span>
            );
          })}
        </div>

        {/* Desktop CTA */}
        {user == null && (
          <button
            onClick={() => {
              void onSignIn();
            }}
            className="hidden md:inline-flex cursor-pointer relative z-10 shrink-0 h-9 px-5 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-black/5 whitespace-nowrap">
            Get Started
          </button>
        )}

        {/* Mobile: CTA + hamburger */}
        <div className="flex md:hidden items-center gap-3 relative z-10 shrink-0">
          {user === null && (
            <button
              onClick={() => {
                void onSignIn();
              }}
              className="h-8 px-4 rounded-full bg-foreground text-background text-xs font-bold uppercase  cursor-pointer text-">
              Login
            </button>
          )}
          <motion.button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ color: textColor }}
            className="p-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
            {mobileOpen ? <X size={20} /> : <Menu size={18} />}
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ top }}
            className="absolute w-[calc(100%-2rem)] max-w-[44rem]">
            <div className="mt-16 rounded-2xl border border-border/40 backdrop-blur-3xl shadow-lg overflow-hidden bg-background/80">
              <div className="flex flex-col py-2">
                {NAV_LINKS.map((link) => {
                  const isHash =
                    link.href.startsWith("#") || link.href.startsWith("/#");
                  const className =
                    "px-5 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors";
                  if (isHash) {
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={handleHashClick}
                        className={className}>
                        {link.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={className}>
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
