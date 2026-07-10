"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AIFabChat from "@/app/components/AIFabChat";
import { Sparkles, X } from "lucide-react";

export default function FAB() {
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current) return;
      const target = e.target as Node;
      if (rootRef.current.contains(target)) return;
      if (target instanceof Element) {
        const inPortal = target.closest(
          '[data-radix-popper-content-wrapper], [data-slot="select-content"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"], [role="dialog"]',
        );
        if (inPortal) return;
      }
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pathname === "/" || pathname === "/onboarding") return null;

  return (
    <div
      ref={rootRef}
      className="fixed bottom-24 sm:bottom-28 md:bottom-8 right-4 sm:right-6 z-50 flex flex-col items-end">
      {/* AnimatePresence gives the chat panel a proper exit animation.
          Without this, the panel just disappears instantly on close. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-chat"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{
              duration: 0.22,
              ease: [0.165, 0.84, 0.44, 1],
            }}
            className="mb-4">
            <AIFabChat onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close quick log" : "Open quick log"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-[0_8px_24px_oklch(0.2272_0.0049_173.9454/_0.28)] transition-transform duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-none ">
        <div className="relative w-6 h-6">
          <Sparkles
            size={22}
            className={`absolute inset-0 m-auto transition-all duration-200 ${
              open
                ? "opacity-0 scale-75 rotate-90 blur-md"
                : "opacity-100 scale-100 rotate-0 blur-0"
            }`}
          />
          <X
            size={22}
            className={`absolute inset-0 m-auto transition-all duration-200 ${
              open
                ? "opacity-100 scale-100 rotate-0 blur-0"
                : "opacity-0 scale-75 -rotate-90 blur-md"
            }`}
          />
        </div>
      </button>
    </div>
  );
}
