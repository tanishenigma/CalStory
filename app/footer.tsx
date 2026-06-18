import React from "react";
import Link from "next/link";
import { ExternalLink, Flame } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      id="footer"
      className="relative z-10 py-12 border-t border-border/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6">
        {/* Desktop: single row — Logo | GitHub | Legal + Copyright */}
        <div className="hidden md:grid md:grid-cols-3 items-center gap-8">
          {/* Left: Logo */}
          <div className="flex justify-start">
            <Link
              href="/"
              className="flex items-center cursor-pointer relative z-10 shrink-0 gap-2.5 group">
              <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                <Flame size={18} className="text-background fill-background" />
              </div>
              <h1 className="font-bold text-xl tracking-tight font-heading">
                CalStory
              </h1>
            </Link>
          </div>

          {/* Center: GitHub */}
          <div className="flex justify-center">
            <Link
              href="https://github.com/tanishenigma"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground-foreground hover:text-foreground transition-all hover:translate-y-[-2px]">
              <div className="p-1.5 rounded-full bg-foreground/5 text-foreground ring-1 ring-foreground/10">
                <ExternalLink size={14} />
              </div>
              <span className="font-medium tracking-wide">@tanishenigma</span>
            </Link>
          </div>

          {/* Right: Legal + Copyright */}
          <div className="flex items-center justify-end gap-3 text-[11px] font-medium text-muted-foreground-foreground/80">
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span className="text-border/60">•</span>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span className="text-border/60">•</span>
            <span className="text-foreground/60">©{year} CalStory.</span>
          </div>
        </div>

        {/* Mobile: stacked — Logo → GitHub → Legal → Copyright */}
        <div className="flex md:hidden flex-col items-center gap-8 text-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-foreground rounded-xl flex items-center justify-center">
              <Flame size={20} className="text-background fill-background" />
            </div>
            <span className="font-bold text-2xl tracking-tight font-heading">
              CalStory
            </span>
          </Link>

          {/* GitHub */}
          <Link
            href="https://github.com/tanishenigma"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 text-xs text-muted-foreground-foreground hover:text-foreground transition-colors">
            <div className="p-2 rounded-full bg-foreground/5 text-foreground ring-1 ring-foreground/10">
              <ExternalLink size={18} />
            </div>
            <span className="font-medium">tanishenigma</span>
          </Link>

          {/* Legal links */}
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground-foreground">
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span className="text-border">•</span>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>

          {/* Copyright — always last on mobile */}
          <p className="text-[11px] font-medium text-muted-foreground-foreground/60 tracking-wider">
            ©{year} CALSTORY. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
