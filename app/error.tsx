"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import Footer from "@/app/footer";

const QUICK_LINKS: { label: string; href: string; description: string }[] = [
  {
    label: "Home",
    href: "/",
    description: "AI calorie tracking, macro rings, and workout logs.",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Jump straight back into today's tracking.",
  },
  {
    label: "About",
    href: "/about",
    description: "Who builds CalStory and why it exists.",
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Report this error and we'll look into it.",
  },
];

/**
 * Global 500 / runtime-error boundary.
 *
 * Next 16 renders the closest `error.tsx` for uncaught exceptions
 * in the route tree. The page must be a Client Component because
 * the `reset()` callback (re-render the segment) is interactive.
 *
 * The `digest` on the error object is a server-side hash of the
 * real error — safe to log, never includes the message itself.
 * Surfacing it lets users quote the digest when they file a bug
 * so we can find the matching log entry.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* Surface to the browser console so devs (and Sentry, if ever
     * wired up) can pick it up. We deliberately don't render the
     * raw error.message on the page — server messages can include
     * stack frames, file paths, or query fragments. */
    console.error("[app/error] Unhandled error:", error);
  }, [error]);

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 flex flex-col">
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="max-w-xl mx-auto w-full">
          <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary/70 mb-4">
            Error 500
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] font-heading mb-6">
            Something <span className="text-primary">broke</span>.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6 max-w-md mx-auto">
            We hit an unexpected error rendering this page. You can try again,
            head back home, or report the issue so we can fix it.
          </p>

          {error.digest && (
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-mono text-muted-foreground">
              <span className="uppercase tracking-wider opacity-70">Ref</span>
              <code className="select-all text-foreground">{error.digest}</code>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <button
              type="button"
              onClick={reset}
              className="h-12 px-6 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-lg shadow-foreground/10 cursor-pointer">
              <RotateCw size={16} />
              Try again
            </button>
            <Link
              href="/"
              className="h-12 px-6 rounded-2xl border-2 font-bold hover:bg-foreground/5 transition-colors inline-flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to home
            </Link>
          </div>

          <div className="text-left">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground/70 mb-4 text-center">
              Or jump to
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-2xl border border-border bg-card p-4 sm:p-5 hover:border-primary/40 transition-all">
                  <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    {link.label}
                    <ArrowRight
                      size={13}
                      className="text-primary transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {link.description}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
