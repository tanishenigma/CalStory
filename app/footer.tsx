import React from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer id="footer" className="relative z-10 py-12  backdrop-blur-sm">
      <div className=" max-w-6xl mx-auto px-6">
        <div className="hidden md:grid md:grid-cols-2 items-center gap-8  justify-around">
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
          {/* Between:  links */}
          <div>
            <div className="flex flex-2 items-center justify-end gap-3 text-[11px] font-medium text-muted-foreground-foreground/80">
              {" "}
              <Link
                href="/blog"
                className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link
                href="/about"
                className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span className="text-border/60">•</span>
            </div>
          </div>
        </div>
        {/* Bottom: Sitemap & Copyright*/}
        <div className="hidden md:flex-col md:flex pt-4 items-center  justify-around  gap-3 text-[11px] font-medium text-muted-foreground-foreground/80 border-t border-border/30  ">
          <Link
            href="https://github.com/tanishenigma"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <FaGithub size={12} />
            <span>GitHub</span>
          </Link>
          <span className="text-foreground/60 text-[11px]">
            ©{year} CalStory. All rights reserved.
          </span>
        </div>
        {/* Mobile: stacked — Logo → Sitemap → Legal → Copyright */}
        <div className="flex flex-col md:hidden items-center gap-8 text-center">
          <div className="flex flex-2 md:hidden items-center gap-8 text-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 -mb-2">
              <div className="w-9 h-9 bg-foreground rounded-full flex items-center justify-center">
                <Flame size={20} className="text-background fill-background" />
              </div>
              <span className="font-bold text-2xl tracking-tight font-heading">
                CalStory
              </span>
            </Link>

            {/* Legal links */}
            <div className="grid grid-cols-2 items-center gap-4 text-xs font-medium text-muted-foreground-foreground">
              <Link
                href="/blog"
                className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link
                href="/about"
                className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-xs justify-center items-center pt-5  border-t border-border/70">
            {/* Sitemap links */}
            <div className="flex  items-center gap-5 text-xs font-medium text-muted-foreground-foreground">
              <Link
                href="https://github.com/tanishenigma"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                <FaGithub size={14} />
                <span>GitHub</span>
              </Link>
            </div>

            {/* Copyright — always last on mobile */}
            <p className="text-[10px] font-medium text-muted-foreground/60 tracking-wider">
              ©{year} CALSTORY. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
