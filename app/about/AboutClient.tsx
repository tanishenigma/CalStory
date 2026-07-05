"use client";

import BlurFade from "@/app/components/animations/BlurFade";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/app/components/landing/Navbar";
import Footer from "@/app/footer";
import { ArrowRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export function AboutClient() {
  const router = useRouter();

  function handleSignIn() {
    router.push("/auth");
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar onSignIn={handleSignIn} />

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-3xl mx-auto w-full">
        <BlurFade delay={0.1}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 font-heading">
            About <span className="text-primary">CalStory</span>
          </h1>
        </BlurFade>

        <BlurFade delay={0.2}>
          <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
            <p>
              CalStory is a calorie, macro, and workout tracker built because of
              the trackers that punished you for logging. Logging food should be
              faster than eating it. The app exists because spreadsheets work,
              but only if you never miss a day; the moment you do, the whole
              streak dies.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-heading pt-4">
              What we believe
            </h2>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-foreground">
                  Tracking should be cheap.
                </strong>{" "}
                If logging a meal takes more than ten seconds, you will stop.
              </li>
              <li>
                <strong className="text-foreground">
                  Macros are a tool, not a religion.
                </strong>{" "}
                Hit protein. Eat enough. The rest is fine-tuning.
              </li>
              <li>
                <strong className="text-foreground">You own your data.</strong>{" "}
                Open source, exportable, deletable, forever.
              </li>
              <li>
                <strong className="text-foreground">No dark patterns.</strong>{" "}
                No streaks that punish one bad day. No paywalls for features
                that are basic math.
              </li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-heading pt-4">
              Get in touch
            </h2>
            <p>
              Open an issue on GitHub, send a pull request, or read the code.
              CalStory is built in public and the source of truth is the repo,
              not a marketing site.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="https://github.com/tanishenigma"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-foreground text-background font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">
                <FaGithub size={18} />
                GitHub
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border-2 font-bold hover:bg-foreground/5 transition-colors">
                Read the blog
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </BlurFade>
      </main>
      <Footer />
    </div>
  );
}
