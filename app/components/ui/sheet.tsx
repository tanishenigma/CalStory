"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/app/lib/utils";

/* ------------------------------------------------------------------
 * Sheet — a slide-in panel built on Radix Dialog.
 *
 * Usage:
 *   <Sheet open={open} onOpenChange={setOpen}>
 *     <SheetContent side="right">…</SheetContent>
 *   </Sheet>
 * ------------------------------------------------------------------ */

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

// ── Overlay ──────────────────────────────────────────────────────
const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

// ── Side variants ────────────────────────────────────────────────
type SheetSide = "right" | "left" | "top" | "bottom";

const sideVariants: Record<SheetSide, string> = {
  right: [
    "inset-y-0 right-0 h-full w-full sm:max-w-[420px]",
    "border-l border-border rounded-l-2xl",
    "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  ].join(" "),
  left: [
    "inset-y-0 left-0 h-full w-full sm:max-w-[420px]",
    "border-r border-border rounded-r-2xl",
    "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  ].join(" "),
  top: [
    "inset-x-0 top-0 w-full",
    "border-b border-border rounded-b-2xl",
    "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
  ].join(" "),
  bottom: [
    "inset-x-0 bottom-0 w-full",
    "border-t border-border rounded-t-2xl",
    "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  ].join(" "),
};

// ── Content ──────────────────────────────────────────────────────
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: SheetSide;
  /** Hide the default × close button */
  hideClose?: boolean;
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "right", hideClose = false, className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col",
        "bg-card text-ink shadow-xl",
        "duration-300",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        sideVariants[side],
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          className={cn(
            "absolute top-4 right-4",
            "p-1.5 rounded-lg",
            "text-muted-foreground hover:text-ink hover:bg-background",
            "transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-border",
          )}
          aria-label="Close panel"
        >
          <X size={18} />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

// ── Semantic slots ───────────────────────────────────────────────
const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1 px-5 pt-5 pb-4 border-b border-border", className)}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base font-bold text-ink leading-tight", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-muted-foreground-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
