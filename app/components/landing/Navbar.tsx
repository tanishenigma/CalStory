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
import type { RefObject } from "react";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useProfileStore } from "@/app/store/profileStore";

/**
 * Map of `href` target key → element ref attached to the section in
 * `LandingClient`. Resolving the target via ref is more reliable than
 * `document.getElementById` (which fails for sections that mount
 * after the navbar, e.g. below-the-fold reveals, or whose `id` is on
 * an ancestor the navbar cannot see). Passing the ref down keeps
 * the navbar dumb: it scrolls to whatever the parent owns.
 */
export type NavbarTargets = Partial<{
  features: RefObject<HTMLElement | null>;
  "how-it-works": RefObject<HTMLElement | null>;
  faq: RefObject<HTMLElement | null>;
}>;

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Features", href: "/#features" },
  { label: "Method", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
];

function useNavbarTokens() {
  const parseTriplet = (raw: string, fallback: [number, number, number]) => {
    const m = raw.trim().match(/^(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/);
    if (!m) return fallback;
    return [Number(m[1]), Number(m[2]), Number(m[3])] as [
      number,
      number,
      number,
    ];
  };

  const fallback: [number, number, number] = [255, 255, 255];

  const [tokens, setTokens] = useState({
    bg: [255, 255, 255] as [number, number, number],
    fg: [26, 25, 22] as [number, number, number],
    bgScrolled: [255, 255, 255] as [number, number, number],
    fgScrolled: [26, 25, 22] as [number, number, number],
    icon: [26, 25, 22] as [number, number, number],
    iconScrolled: [26, 25, 22] as [number, number, number],
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const cs = getComputedStyle(document.documentElement);
      setTokens({
        bg: parseTriplet(cs.getPropertyValue("--navbar-bg-rgb"), fallback),
        fg: parseTriplet(cs.getPropertyValue("--navbar-fg-rgb"), fallback),
        bgScrolled: parseTriplet(
          cs.getPropertyValue("--navbar-bg-scrolled-rgb"),
          fallback,
        ),
        fgScrolled: parseTriplet(
          cs.getPropertyValue("--navbar-fg-scrolled-rgb"),
          fallback,
        ),
        icon: parseTriplet(cs.getPropertyValue("--navbar-icon-rgb"), fallback),
        iconScrolled: parseTriplet(
          cs.getPropertyValue("--navbar-icon-scrolled-rgb"),
          fallback,
        ),
      });
    };

    compute();

    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  return tokens;
}

export function Navbar({
  onSignIn,
  targets,
}: {
  onSignIn: () => void | Promise<void>;
  targets?: NavbarTargets;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-detect sign-in. The Firebase auth listener is null while
  // warming up and resolves in the same tick on a hard refresh
  // (IndexedDB persistence). `hasProfile` comes from the global
  // profile store so returning users with a cached "true" see the
  // right CTA copy on the very first paint.
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const hasProfile = useProfileStore((s) => s.hasProfile);
  // Treat the auth-warming window as "signed out" for the nav so a
  // signed-in user on a hard refresh doesn't briefly see a "Get
  // Started" button before the listener resolves. The flip is
  // sub-frame because Firebase's IndexedDB persistence resolves the
  // listener synchronously.
  const isSignedIn = !!user && !authLoading;
  // Keep `user` referenced so the selector subscription isn't
  // tree-shaken; the value itself is consumed via `isSignedIn`.
  void user;

  // Where the signed-in CTA goes. Cached `hasProfile` (from
  // localStorage) is good enough to route here; if we guessed wrong
  // and the profile is actually missing, the auth guard will bounce
  // them to /onboarding instead. Routing first paints the right
  // shape and we don't block the navbar on Firestore.
  const signedInHref = hasProfile ? "/dashboard" : "/onboarding";

  const tokens = useNavbarTokens();

  const handleHashClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute("href");
    if (!href) return;

    // Accept both `#features` and `/#features` as hash links. For
    // `/#foo` we resolve the in-page section via the parent-provided
    // ref map (preferred — works regardless of mount order or
    // virtualisation) and fall back to `document.getElementById` if
    // the parent didn't supply a ref for that target.
    if (href.startsWith("/#")) {
      const targetId = href.slice(2);
      const refTarget = targets?.[targetId as keyof NavbarTargets]?.current;
      const domTarget =
        typeof document !== "undefined"
          ? document.getElementById(targetId)
          : null;
      const target = refTarget ?? domTarget;
      if (!target) return;

      event.preventDefault();
      setMobileOpen(false);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", href);
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

  // Animate the navbar background from the unscrolled (transparent)
  // state toward the theme-defined scrolled background. Both endpoints
  // come from CSS tokens so dark mode just works.
  const bgR = useTransform(
    smoothScroll,
    [0, 80],
    [tokens.bg[0], tokens.bgScrolled[0]],
    easeConfig,
  );
  const bgG = useTransform(
    smoothScroll,
    [0, 80],
    [tokens.bg[1], tokens.bgScrolled[1]],
    easeConfig,
  );
  const bgB = useTransform(
    smoothScroll,
    [0, 80],
    [tokens.bg[2], tokens.bgScrolled[2]],
    easeConfig,
  );

  // Opacity is higher in light mode so the glass actually blocks
  // out the bright page background; in dark mode a lighter veil
  // reads as a subtle scrim without crushing the page beneath.
  const bgOpacity = useTransform(smoothScroll, [0, 80], [0, 0.45], easeConfig);

  const backgroundColor = useMotionTemplate`rgba(${bgR}, ${bgG}, ${bgB}, ${bgOpacity})`;

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

  const textR = useTransform(
    smoothScroll,
    [0, 80],
    [tokens.fg[0], tokens.fgScrolled[0]],
    easeConfig,
  );
  const textG = useTransform(
    smoothScroll,
    [0, 80],
    [tokens.fg[1], tokens.fgScrolled[1]],
    easeConfig,
  );
  const textB = useTransform(
    smoothScroll,
    [0, 80],
    [tokens.fg[2], tokens.fgScrolled[2]],
    easeConfig,
  );
  const textColor = useMotionTemplate`rgb(${textR}, ${textG}, ${textB})`;

  // The chip background inverts to whatever the current text color
  // is, so the flame icon always sits on a contrast pill.
  const chipBg = textColor;
  const iconR = useTransform(
    smoothScroll,
    [0, 80],
    [tokens.icon[0], tokens.iconScrolled[0]],
    easeConfig,
  );
  const iconG = useTransform(
    smoothScroll,
    [0, 80],
    [tokens.icon[1], tokens.iconScrolled[1]],
    easeConfig,
  );
  const iconB = useTransform(
    smoothScroll,
    [0, 80],
    [tokens.icon[2], tokens.iconScrolled[2]],
    easeConfig,
  );
  const iconColor = useMotionTemplate`rgb(${iconR}, ${iconG}, ${iconB})`;

  const boxShadow = useMotionTemplate`
  0 10px 10px rgba(0, 0, 0, ${shadowOpacity}),
  inset 0 1px 1px rgba(255, 255, 255, ${highlightOpacity}),
  inset 0 0 0 1px rgba(255, 255, 255, ${staticInsetOpacity})
`;
  const border = useMotionTemplate`1px solid rgba(128, 128, 128, ${borderOpacity})`;
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
          backgroundColor, // Explicitly mapped to backgroundColor
          backgroundImage,
          backgroundSize: "16px 16px",
          boxShadow,
          overflow,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border,
        }}
        className="relative w-[calc(100%-2rem)] flex items-center justify-between will-change-transform">
        <motion.div
          style={{
            opacity: highlightOpacity,
            backgroundImage:
              "linear-gradient(to top, var(--navbar-highlight-from), var(--navbar-highlight-via), transparent)",
            borderTopColor: "var(--color-background)",
          }}
          className="absolute inset-0 pointer-events-none border-t-2"
        />

        <Link
          href="/"
          className="flex items-center relative z-10 shrink-0 gap-2.5 cursor-pointer">
          <img
            src="/dark.png"
            alt="CalStory"
            width={32}
            height={32}
            className="w-10 h-10 object-contain block"
          />
          <motion.span
            style={{ color: textColor }}
            className="font-bold text-lg tracking-tight font-heading ">
            CalStory
          </motion.span>
        </Link>

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

        {isSignedIn ? (
          <Link
            href={signedInHref}
            className="hidden md:inline-flex cursor-pointer relative z-10 shrink-0 h-9 px-5 rounded-full bg-foreground text-background text-xs font-bold text-center items-center uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-foreground/10 whitespace-nowrap">
            {hasProfile ? "Dashboard" : "Finish setup"}
          </Link>
        ) : (
          <button
            onClick={() => {
              void onSignIn();
            }}
            className="hidden md:inline-flex cursor-pointer relative z-10 shrink-0 h-9 px-5 rounded-full bg-foreground text-background text-xs font-bold text-center items-center uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-foreground/10 whitespace-nowrap">
            Get Started
          </button>
        )}

        <div className="flex md:hidden items-center gap-3 relative z-10 shrink-0">
          {isSignedIn ? (
            <Link
              href={signedInHref}
              className="h-8 px-4 rounded-full bg-foreground text-background text-xs font-bold uppercase cursor-pointer inline-flex items-center">
              {hasProfile ? "Dashboard" : "Finish setup"}
            </Link>
          ) : (
            <button
              onClick={() => {
                void onSignIn();
              }}
              className="h-8 px-4 rounded-full bg-foreground text-background text-xs font-bold uppercase cursor-pointer">
              Login
            </button>
          )}
          <motion.button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ color: textColor }}
            className="p-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
            {mobileOpen ? "" : <Menu size={18} />}
          </motion.button>
        </div>
      </motion.nav>

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
            <div className="mt-16 rounded-2xl border border-border backdrop-blur-3xl shadow-2xl overflow-hidden bg-background/95">
              <div className="flex flex-col py-2">
                {isSignedIn && (
                  <Link
                    href={signedInHref}
                    onClick={() => setMobileOpen(false)}
                    className="px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors">
                    {hasProfile ? "Dashboard" : "Finish setup"}
                  </Link>
                )}
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
