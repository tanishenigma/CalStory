"use client";

import BlurFade from "@/app/components/animations/BlurFade";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/app/components/landing/Navbar";
import Footer from "@/app/footer";
import { ArrowRight, Mail, MessageSquare } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export function ContactClient() {
  const router = useRouter();

  function handleSignIn() {
    router.push("/auth");
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar onSignIn={handleSignIn} />

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-3xl mx-auto w-full">
        <BlurFade delay={0.1}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 font-heading">
            Contact <span className="text-primary">CalStory</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg mb-12">
            CalStory is built in public and most of the team conversation
            happens on GitHub. Pick whichever channel is fastest for the kind of
            message you have.
          </p>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BlurFade delay={0.15}>
            <ContactCard
              icon={<Mail size={20} />}
              title="Email"
              description="General questions, partnership enquiries, account help."
              actionLabel="support@calstory.app"
              href="mailto:support@calstory.app"
            />
          </BlurFade>

          <BlurFade delay={0.2}>
            <ContactCard
              icon={<FaGithub size={20} />}
              title="GitHub Issues"
              description="Bug reports, feature requests, and roadmap discussion."
              actionLabel="Open an issue"
              href="https://github.com/tanishenigma/CalStory/issues"
              external
            />
          </BlurFade>

          <BlurFade delay={0.25}>
            <ContactCard
              icon={<FaGithub size={20} />}
              title="Pull Requests"
              description="Fixes, new features, and translations are all welcome."
              actionLabel="View the repo"
              href="https://github.com/tanishenigma/CalStory"
              external
            />
          </BlurFade>

          <BlurFade delay={0.3}>
            <ContactCard
              icon={<MessageSquare size={20} />}
              title="Discussions"
              description="Long-form conversation about the app, training, and nutrition."
              actionLabel="Read the blog"
              href="/blog"
            />
          </BlurFade>
        </div>

        <BlurFade delay={0.35}>
          <div className="mt-16 rounded-2xl border border-border bg-card/50 p-6 sm:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-heading">
              Response times
            </h2>
            <ul className="mt-4 space-y-3 text-muted-foreground leading-relaxed text-base">
              <li className="flex gap-3">
                <span className="font-bold text-foreground shrink-0">
                  Email:
                </span>
                <span>
                  We read every message. Most replies land within 2 business
                  days; complex account issues can take up to a week.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-foreground shrink-0">
                  GitHub issues:
                </span>
                <span>
                  Triaged within a few days. Confirmed bugs and accepted
                  features get a milestone label so you can track progress.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-foreground shrink-0">
                  Pull requests:
                </span>
                <span>
                  Reviewed in the order they arrive. Smaller, focused PRs are
                  reviewed faster than large rewrites.
                </span>
              </li>
            </ul>
          </div>
        </BlurFade>

        <BlurFade delay={0.4}>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="https://github.com/tanishenigma/CalStory"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-foreground text-background font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">
              <FaGithub size={18} />
              GitHub
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border-2 font-bold hover:bg-foreground/5 transition-colors">
              About CalStory
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border-2 font-bold hover:bg-foreground/5 transition-colors">
              Read the blog
              <ArrowRight size={16} />
            </Link>
          </div>
        </BlurFade>
      </main>
      <Footer />
    </div>
  );
}

function ContactCard({
  icon,
  title,
  description,
  actionLabel,
  href,
  external,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  external?: boolean;
}) {
  const isExternal =
    (external ?? false) ||
    href.startsWith("http") ||
    href.startsWith("mailto:");
  const content = (
    <>
      <div className="shrink-0 w-11 h-11 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-foreground text-base">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground leading-relaxed break-words">
          {description}
        </div>
        <div className="mt-3 text-sm font-semibold text-primary inline-flex items-center gap-1.5 break-all">
          {actionLabel}
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5 shrink-0"
          />
        </div>
      </div>
    </>
  );

  const className =
    "group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/40 hover:bg-card/80 transition-all";

  if (isExternal) {
    return (
      <a
        href={href}
        target={href.startsWith("mailto:") ? undefined : "_blank"}
        rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
        className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
