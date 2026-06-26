"use client";

import { ReactLenis } from "lenis/react";
import { BlurFade } from "@/app/components/BlurFade";
import { useAuthStore } from "@/app/store/authStore";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/landing/Navbar";
import Footer from "@/app/footer";

export function TermsClient() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Navbar's "Get Started" / mobile "Login" buttons route through here.
  // Delegate to /auth so the user lands on the dedicated sign-in surface.
  function handleSignIn() {
    router.push("/auth");
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        <Navbar onSignIn={handleSignIn} user={user} />

        <main className="relative z-10 pt-32 pb-24 px-6 max-w-4xl mx-auto w-full min-h-[80vh]">
          <BlurFade delay={0.1}>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 font-heading">
              Terms of <span className="text-primary">Service</span>
            </h1>
            <p className="text-muted-foreground-foreground mb-12">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </BlurFade>

          <BlurFade
            delay={0.2}
            className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80">
            <div className="space-y-8 text-muted-foreground-foreground leading-relaxed">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing or using CalStory, you agree to be bound by these
                  Terms of Service. If you disagree with any part of the terms,
                  you may not access the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  2. Description of Service
                </h2>
                <p>
                  CalStory is a health and fitness tracking application that
                  allows users to log meals, workouts, and monitor their
                  physical progress. We provide tools for data entry, analysis,
                  and AI-assisted logging.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  3. User Accounts
                </h2>
                <p>
                  When you create an account with us, you must provide accurate,
                  complete, and current information. Failure to do so
                  constitutes a breach of the Terms, which may result in
                  immediate termination of your account on our service.
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>
                    You are responsible for safeguarding the password and
                    authentication methods you use to access the service.
                  </li>
                  <li>
                    You must notify us immediately upon becoming aware of any
                    breach of security or unauthorized use of your account.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  4. Health and Medical Disclaimer
                </h2>
                <p>
                  CalStory is not a medical device or a substitute for
                  professional medical advice. The information provided by our
                  service is for general informational purposes only. Always
                  consult with a qualified healthcare provider before making any
                  changes to your diet, exercise routine, or lifestyle.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  5. User Data and Privacy
                </h2>
                <p>
                  We care about your privacy. Our collection and use of personal
                  information in connection with your access to and use of the
                  Service is described in our{" "}
                  <a href="/privacy">Privacy Policy</a>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  6. Changes to Terms
                </h2>
                <p>
                  We reserve the right to modify or replace these Terms at any
                  time. We will try to provide at least 30 days' notice prior to
                  any new terms taking effect. What constitutes a material
                  change will be determined at our sole discretion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  7. Contact Us
                </h2>
                <p>
                  If you have any questions about these Terms, please contact us
                  through our official GitHub repository.
                </p>
              </section>
            </div>
          </BlurFade>
        </main>

        <Footer />
      </div>
    </ReactLenis>
  );
}
