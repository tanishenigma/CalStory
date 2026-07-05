"use client";

import BlurFade from "@/app/components/animations/BlurFade";

import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/landing/Navbar";
import Footer from "@/app/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function BlogShell({
  title,
  intro,
  datePublished,
  dateModified,
  readTime,
  children,
}: {
  title: string;
  intro: string;
  datePublished: string;
  dateModified: string;
  readTime: string;
  children: ReactNode;
}) {
  const router = useRouter();
  function handleSignIn() {
    router.push("/auth");
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar onSignIn={handleSignIn} />
      <BlurFade>
        <main className="relative z-10 pt-32 pb-24 px-6 max-w-3xl mx-auto w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={14} />
            Back
          </Link>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-6 font-heading">
            {title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-10">
            <time dateTime={datePublished}>
              {new Date(datePublished).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden="true">•</span>
            <span>{readTime}</span>
            {dateModified !== datePublished && (
              <>
                <span aria-hidden="true">•</span>
                <span>
                  Updated{" "}
                  <time dateTime={dateModified}>
                    {new Date(dateModified).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </span>
              </>
            )}
          </div>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-12">
            {intro}
          </p>

          <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80">
            {children}
          </article>

          <div className="mt-16 pt-8 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              Found this useful? Try the free{" "}
              <Link href="/" className="text-primary hover:underline">
                CalStory calorie tracker
              </Link>{" "}
              — built by the same team.
            </p>
          </div>
        </main>
      </BlurFade>
      <Footer />
    </div>
  );
}
