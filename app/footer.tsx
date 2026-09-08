"use client";

import { useState } from "react";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { ArrowRight } from "lucide-react";
import BrandLogo from "@/app/components/BrandLogo";

const productLinks = [
  {
    label: "Pricing",
    href: "/pricing",
  },
  {
    label: "AI Food Logger",
    href: "/nutrition/",
  },
  {
    label: "Macro Tracker",
    href: "/blog/best-macro-calculator",
  },
  {
    label: "TDEE Calculator",
    href: "/settings",
  },
  {
    label: "Calorie Tracker",
    href: "/dashboard",
  },
  {
    label: "Progress Dashboard",
    href: "/progress",
  },
];

const resourceLinks = [
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  {
    label: "Calorie Calculator",
    href: "/tools/calorie-calculator",
  },
  {
    label: "Calorie Tracking for Beginners",
    href: "/blog/calorie-tracking-for-beginners",
  },
  { label: "Best Macro Calculator Guide", href: "/blog/best-macro-calculator" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

const Footer = () => {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSubState("loading");
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubState("done");
      setEmail("");
    } catch {
      setSubState("error");
    }
  }

  return (
    <footer
      id="footer"
      role="contentinfo"
      className="relative z-10 pt-16 pb-8 backdrop-blur-sm border-t border-border/30">
      {/* Structured data: entity signal for search engines, unrelated to the visible layout */}
      {/* ship-safe-ignore: XSS_DANGEROUS_HTML — JSON-LD payload is developer-controlled static data, not user input */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "CalStory",
            url: "https://calstory.app",
            logo: "https://calstory.app/light.png",
            email: "support@calstory.app",
            sameAs: ["https://github.com/tanishenigma"],
          }),
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Top: brand pinned left, nav columns grouped and pinned right */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-16">
          {/* Brand + description + contact */}
          <div className="md:max-w-xs shrink-0">
            <Link
              href="/"
              aria-label="CalStory home"
              className="flex items-center gap-2.5 group w-fit">
              <BrandLogo className="h-8 w-8" />
              <p className="font-bold text-xl tracking-tight font-heading">
                CalStory
              </p>
            </Link>

            <p className="mt-4 text-sm text-muted-foreground/80 leading-relaxed max-w-xs">
              CalStory is the free AI-powered calorie and macro tracker built
              for lifters and runners. Log meals in plain English, hit your
              macros, and track workouts in one place.
            </p>

            <div className="mt-6">
              {" "}
              <Link
                href="/contact"
                className="mt-2 inline-block text-sm text-muted-foreground/80 hover:text-foreground transition-colors">
                <h3 className="font-semibold text-sm font-heading">Contact</h3>
              </Link>
              <a
                href="mailto:support@calstory.app"
                className="mt-1 ml-1 inline-block text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors break-all">
                support@calstory.app
              </a>
            </div>
          </div>

          {/* Grouped nav columns, pinned together on the right */}
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
            {/* Product */}
            <nav aria-label="Product links">
              <h3 className="font-semibold text-sm font-heading">Product</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground/80 list-none">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Resources */}
            <nav aria-label="Resource links">
              <h3 className="font-semibold text-sm font-heading">Resources</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground/80 list-none">
                {resourceLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Legal */}
            <nav aria-label="Legal links">
              <h3 className="font-semibold text-sm font-heading">Legal</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground/80 list-none">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Email capture row */}
        <div className="mt-10 pt-8 border-t border-border/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-sm font-heading">
                Stay in the loop
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Product updates, new features, and the occasional insight from
                the team.
              </p>
            </div>
            {subState === "done" ? (
              <p className="text-sm text-primary font-semibold shrink-0">
                ✓ You&apos;re on the list.
              </p>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="flex gap-2 shrink-0"
                aria-label="Email subscription form">
                <input
                  id="footer-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={subState === "loading"}
                  className="h-10 px-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 w-52"
                />
                <button
                  type="submit"
                  disabled={subState === "loading"}
                  className="h-10 px-4 rounded-xl bg-foreground text-background text-sm font-bold inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0">
                  {subState === "loading" ? "..." : "Subscribe"}
                  {subState !== "loading" && (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </form>
            )}
          </div>
          {subState === "error" && (
            <p className="text-xs text-red mt-2">
              Something went wrong — try again.
            </p>
          )}
        </div>

        {/* Bottom bar: copyright + GitHub */}
        <div className="mt-8 pt-6 border-t border-border/30 flex flex-col-reverse md:flex-row items-center justify-between gap-4 text-[11px] font-medium text-muted-foreground/80">
          <span>&copy;{year} CalStory. All rights reserved.</span>
          <a
            href="https://github.com/tanishenigma"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CalStory on GitHub (opens in a new tab)"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <FaGithub size={12} aria-hidden="true" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
