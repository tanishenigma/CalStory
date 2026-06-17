"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import RecipeForm from "@/app/components/RecipeForm";
import { Utensils, UtensilsCrossed, Plus, X } from "lucide-react";

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
      // Ignore clicks that originated inside the FAB panel
      if (rootRef.current.contains(target)) return;
      // Ignore clicks inside Radix portals (Select dropdowns, popovers, etc.)
      // which are rendered into document.body and live outside rootRef.
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
      {open && (
        <div className="mb-4">
          <RecipeForm onClose={() => setOpen(false)} />
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] shadow-[0_8px_24px_rgba(26,25,22,0.28)] transition-transform duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1916]/40 focus-visible:ring-offset-2">
        <div className="relative w-6 h-6">
          <>
            <Utensils
              size={24}
              className={`absolute inset-0 transition-all duration-300 ${
                open
                  ? "opacity-0 scale-75 rotate-90"
                  : "opacity-100 scale-100 rotate-0"
              }`}
            />
            <UtensilsCrossed
              size={24}
              className={`absolute inset-0 transition-all duration-300 ${
                open
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-75 rotate-90"
              }`}
            />
          </>
        </div>
      </button>
    </div>
  );
}
