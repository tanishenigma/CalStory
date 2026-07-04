"use client";

import { ReactLenis } from "lenis/react";
import BlurFade from "@/app/components/animations/BlurFade";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/landing/Navbar";
import Footer from "@/app/footer";

export function CookiesClient() {
  const router = useRouter();
  function handleSignIn() {
    router.push("/auth");
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        <Navbar onSignIn={handleSignIn} />

        <main className="relative z-10 pt-32 pb-24 px-6 max-w-4xl mx-auto w-full min-h-[80vh]">
          <BlurFade delay={0.1}>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 font-heading">
              Cookie <span className="text-primary">Policy</span>
            </h1>
            <p className="text-muted-foreground mb-12">
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
            <div className="space-y-8 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  1. What this policy covers
                </h2>
                <p>
                  This Cookie Policy explains how CalStory uses cookies, local
                  storage, IndexedDB, and other client-side state. It is a
                  companion to our{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  ; together they describe what data is stored on your device
                  and what is sent over the network.
                </p>
                <p className="mt-3">
                  CalStory is open source. You can audit the full client code on{" "}
                  <a
                    href="https://github.com/tanishenigma/CalStory"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline">
                    GitHub
                  </a>{" "}
                  to verify every storage key we set.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  2. What we store on your device
                </h2>
                <p>
                  CalStory uses three categories of client-side storage. None of
                  them is used for advertising or cross-site tracking.
                </p>

                <h3 className="text-lg font-bold text-foreground mt-6 mb-2">
                  a. Functional — required for the app to work
                </h3>
                <ul>
                  <li>
                    <code>firebase:authUser:</code> — Firebase Auth session
                    token. Lets you stay signed in across page refreshes. Set by
                    Firebase's own SDK; not a CalStory cookie.
                  </li>
                  <li>
                    <code>calstory_profile_cache</code> — A cached copy of your
                    onboarding profile (height, weight, age, units, goal). Lets
                    the dashboard render instantly while the real data loads
                    from Firestore.
                  </li>
                  <li>
                    <code>calstory_streak_cache</code> — Last computed streak
                    number, so the streak badge animates in immediately.
                  </li>
                </ul>

                <h3 className="text-lg font-bold text-foreground mt-6 mb-2">
                  b. Preferences — written by CalStory, easy to clear
                </h3>
                <ul>
                  <li>
                    <code>ft_theme</code> and <code>theme</code> — your theme
                    preference (light / dark / system). Used to render the
                    correct palette on the next page load.
                  </li>
                  <li>
                    <code>calstory_navbar_style</code> — floating vs pill navbar
                    layout. Cosmetic only.
                  </li>
                  <li>
                    <code>calstory_dynamic_bg</code> — whether you enabled the
                    dynamic background on the dashboard. Cosmetic only.
                  </li>
                  <li>
                    <code>gemini_api_key</code> — your personal Gemini API key,
                    if you chose to use one. Stored in your browser only; never
                    sent to any CalStory-controlled server. Lives under{" "}
                    <code>localStorage</code> encrypted with your
                    user-id-derived key.
                  </li>
                </ul>

                <h3 className="text-lg font-bold text-foreground mt-6 mb-2">
                  c. Analytics — none
                </h3>
                <p>
                  CalStory does not use Google Analytics, Meta Pixel, Hotjar,
                  Mixpanel, or any third-party analytics tool. The dashboard's
                  <em> "dynamic background"</em> setting is a CSS animation that
                  runs entirely on your device.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  3. What we do NOT store
                </h2>
                <ul>
                  <li>No advertising IDs (Google Advertising ID, IDFA).</li>
                  <li>
                    No third-party tracking pixels (Facebook, Twitter, TikTok,
                    LinkedIn).
                  </li>
                  <li>
                    No fingerprinting techniques (canvas, audio context, font
                    enumeration).
                  </li>
                  <li>
                    No data sold to data brokers, ad networks, or analytics
                    vendors.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  4. How to clear your data
                </h2>
                <p>
                  You can clear all CalStory-specific data at any time without
                  deleting your account.
                </p>
                <h3 className="text-lg font-bold text-foreground mt-6 mb-2">
                  a. From the app
                </h3>
                <p>
                  Settings → Style → "Reset all preferences" (coming soon). For
                  now, the steps below work the same way.
                </p>

                <h3 className="text-lg font-bold text-foreground mt-6 mb-2">
                  b. From your browser
                </h3>
                <ol>
                  <li>
                    Open DevTools (right-click → Inspect, or Cmd/Ctrl+Shift+I).
                  </li>
                  <li>
                    Go to <strong>Application → Local Storage</strong> (or
                    Storage in Firefox).
                  </li>
                  <li>
                    Select the CalStory origin and click{" "}
                    <strong>Clear All</strong>.
                  </li>
                </ol>

                <h3 className="text-lg font-bold text-foreground mt-6 mb-2">
                  c. To delete your account
                </h3>
                <p>
                  Settings → Account → Delete account. This permanently removes
                  your profile, meals, workouts, and any cached data on our
                  servers. The cookies above are also cleared on the next page
                  load.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  5. Third-party cookies set by CalStory's dependencies
                </h2>
                <p>
                  Two services can set their own cookies on the CalStory origin:
                </p>
                <ul>
                  <li>
                    <strong>Firebase Auth</strong> —{" "}
                    <code>firebase:authUser:</code> session token. Managed by
                    Firebase; see{" "}
                    <a
                      href="https://firebase.google.com/support/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline">
                      Firebase's privacy policy
                    </a>
                    .
                  </li>
                  <li>
                    <strong>Google Fonts</strong> — used for typography. Google
                    may log requests; the CSS is inlined on the landing page
                    where possible to avoid the round-trip.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  6. Changes to this policy
                </h2>
                <p>
                  We will update this page when we add or remove any client-side
                  storage. The "Last updated" date at the top changes on every
                  change. For material changes (a new third-party service, a new
                  analytics vendor) we will also surface a banner inside the app
                  for 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  7. Contact
                </h2>
                <p>
                  Questions about cookies or storage? Email{" "}
                  <a
                    href="mailto:support@calstory.app"
                    className="text-primary hover:underline">
                    support@calstory.app
                  </a>
                  .
                </p>
                <p className="mt-4">
                  See also:{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  ·{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
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
