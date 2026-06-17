"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

/* ------------------------------------------------------------------
 * Dropdown menu — shadcn-style API built without Radix.
 *
 * Usage
 *   <DropdownMenu>
 *     <DropdownMenuTrigger>Pick…</DropdownMenuTrigger>
 *     <DropdownMenuContent>
 *       <DropdownMenuLabel>Meal time</DropdownMenuLabel>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem onSelect={() => setTime("lunch")}>Lunch</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 * ------------------------------------------------------------------ */

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownCtx = React.createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = React.useContext(DropdownCtx);
  if (!ctx)
    throw new Error("Dropdown components must be inside <DropdownMenu>");
  return ctx;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  /** Optional: open the menu by default. */
  defaultOpen?: boolean;
}

/**
 * Root of the dropdown. Provides shared open/close state + a trigger
 * ref so the content can position itself relative to the trigger.
 */
export function DropdownMenu({
  children,
  defaultOpen = false,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <DropdownCtx.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block w-full">{children}</div>
    </DropdownCtx.Provider>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ className, children, onClick, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdown();
  return (
    <button
      ref={(node) => {
        // Forward to consumer ref + store in context
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current =
            node;
        triggerRef.current = node;
      }}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      onClick={(e) => {
        onClick?.(e);
        setOpen(!open);
      }}
      className={cn(
        "w-full flex items-center justify-between gap-2 px-3.5 py-3 border border-border rounded-lg text-sm bg-background hover:bg-white dark:hover:bg-[#1a1916] dark:bg-[#1a1916] hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-[#f7f6f3] outline-none transition-all cursor-pointer text-left",
        open &&
          "bg-card border-[#1A1916] dark:border-[#f7f6f3]",
        className,
      )}
      {...props}>
      {children}
      <svg
        className={cn(
          "h-4 w-4 text-[#9B9895] transition-transform duration-200",
          open && "rotate-180 text-[#1A1916] dark:text-[#f7f6f3]",
        )}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden>
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "center";
  /** Offset from the trigger in pixels. */
  sideOffset?: number;
}

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, children, align = "start", sideOffset = 6, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdown();
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Close on outside click + Escape
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (contentRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
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
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  const alignClass =
    align === "end"
      ? "right-0"
      : align === "center"
        ? "left-1/2 -translate-x-1/2"
        : "left-0";

  return (
    <div
      ref={(node) => {
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        contentRef.current = node;
      }}
      role="menu"
      data-state={open ? "open" : "closed"}
      style={{ marginTop: sideOffset }}
      className={cn(
        "absolute z-50 min-w-[var(--radix-trigger-width)] w-full",
        alignClass,
        "rounded-xl border border-border bg-card shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]",
        "p-1.5",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
      {...props}>
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onSelect?: () => void;
  icon?: React.ReactNode;
  active?: boolean;
}

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className, onSelect, onClick, icon, active, children, ...props }, ref) => {
  const { setOpen } = useDropdown();
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-semibold text-left",
        "cursor-pointer transition-colors",
        "hover:bg-background dark:bg-[#0f0f0e] focus:bg-background focus:outline-none",
        active && "bg-background",
        className,
      )}
      {...props}>
      {icon && <span className="text-base flex-shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {active && (
        <svg
          className="h-4 w-4 text-[#1A1916] dark:text-[#f7f6f3] flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden>
          <path d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.8a1 1 0 011.4 0z" />
        </svg>
      )}
    </button>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

export function DropdownMenuLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9B9895]",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("h-px bg-[#E8E7E4] my-1", className)}
      {...props}
    />
  );
}
