import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Footer from "@/app/footer";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The page you're looking for doesn't exist. Head back to the CalStory home page or browse the blog.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Page not found — CalStory",
    description:
      "The page you're looking for doesn't exist. Head back to the CalStory home page.",
    type: "website",
  },
};

const QUICK_LINKS: { label: string; href: string; description: string }[] = [
  {
    label: "Home",
    href: "/",
    description: "AI calorie tracking, macro rings, and workout logs.",
  },
  {
    label: "Blog",
    href: "/blog",
    description: "Calorie tracking guides and macro deep-dives.",
  },
  {
    label: "About",
    href: "/about",
    description: "Who builds CalStory and why it exists.",
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Get in touch — email, GitHub, and response times.",
  },
];

/**
 * Global 404 page.
 *
 * Next 16 auto-wires the closest `not-found.tsx` for unmatched
 * routes. Keeping this at the `app/` root means every URL outside
 * the route table falls back to this page (including bad links,
 * typos, and stale blog slugs). Setting `robots: { index: false }`
 * is important — we don't want Google indexing this.
 */
export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 flex flex-col">
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="max-w-xl mx-auto w-full">
          <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary/70 mb-4">
            Error 404
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] font-heading mb-6">
            Lost the <span className="text-primary">plot</span>.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist. It may have
            moved, been renamed, or never existed in the first place.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/"
              className="h-12 px-6 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-lg shadow-foreground/10">
              <ArrowLeft size={16} />
              Back to home
            </Link>
            <Link
              href="/blog"
              className="h-12 px-6 rounded-2xl border-2 font-bold hover:bg-foreground/5 transition-colors inline-flex items-center gap-2">
              Read the blog
              <ArrowRight size={16} />
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
