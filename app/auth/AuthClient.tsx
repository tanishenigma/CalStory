"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame } from "lucide-react";
import { Spinner } from "@/app/hooks/useAuthGuard";
import { useAuthStore } from "@/app/store/authStore";
import { useApp } from "@/app/context/AppContext";
import { signInWithGoogle } from "@/app/lib/auth";
import { setAuthHint } from "@/app/lib/storage";
import { toast } from "sonner";

/**
 * /auth — single sign-in / sign-up surface.
 *
 * Firebase Auth treats Google sign-in as both sign-up and sign-in: the first
 * sign-in for a Google account auto-creates the user, subsequent sign-ins
 * log them back in. We don't need separate "Sign up" / "Sign in" affordances
 * — one button covers both, so the UI stays minimal.
 *
 * Routing rules:
 *   - `loading` (Firebase hasn't resolved yet) → render <Spinner />
 *   - Already signed in  → redirect to /dashboard (useAuthGuard will then
 *     route a brand-new user with no profile onward to /onboarding)
 *   - Popup closed by user → silent no-op
 *   - Any other auth error → sonner toast.error
 *   - Success → router.push("/dashboard")
 */
export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const { state } = useApp();
  const [submitting, setSubmitting] = useState(false);

  // If the visitor lands here while already authenticated, skip the form.
  // We only kick to /dashboard once Firebase has resolved AND the in-memory
  // profile hydration has had a chance to run — otherwise a returning user
  // whose profile is still `undefined` could get bounced to /onboarding by
  // useAuthGuard and then looped back here.
  //
  // Fast path: if the auth store has a user AND AppContext has already
  // synchronously seeded the cached profile from localStorage
  // (profile !== undefined), there's nothing to wait on — redirect now.
  // This is the case after a refresh where everything was hydrated from
  // the cache; the Firestore round-trip still re-validates in the
  // background but we don't gate the redirect on it.
  useEffect(() => {
    if (loading && !user) return;
    if (user && state.profile !== undefined) {
      router.replace("/dashboard");
    }
  }, [user, loading, state.profile, router]);

  // Show a spinner only when truly nothing is known yet — i.e. neither
  // Firebase nor the cache has produced a user.
  if (loading && !user) {
    return <Spinner />;
  }

  async function handleGoogleSignIn() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const cred = await signInWithGoogle();
      // Persist the auth hint immediately so the next refresh renders
      // the dashboard synchronously, without waiting for Firebase to
      // re-validate the session. The auth store's onAuthChange listener
      // will overwrite this with authoritative values a beat later.
      setAuthHint({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        photoURL: cred.user.photoURL,
        onboarded: false,
        cachedAt: Date.now(),
      });
      // After Firebase resolves, useAuthStore.user flips; the landing page
      // uses the same redirect target. useAuthGuard on /dashboard handles
      // the new-user case (no profile) by sending them to /onboarding.
      router.push("/dashboard");
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      // User dismissed the popup — don't surface a scary error.
      if (code === "auth/popup-closed-by-user") return;
      toast.error("Could not sign in with Google. Please try again.");
      console.error("[auth] signInWithGoogle failed", err);
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Ambient gradient orbs — mirrors the landing page so the auth surface
          feels like part of the same product. Pointer-events disabled so they
          never intercept clicks on the form. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -top-24 -right-16 h-[60vw] w-[60vw] max-h-[760px] max-w-[760px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.12) 40%, transparent 70%)",
            filter: "blur(48px)",
          }}
        />
        <div
          className="absolute -bottom-32 -left-20 h-[55vw] w-[55vw] max-h-[680px] max-w-[680px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(249,115,22,0.18) 0%, rgba(251,146,60,0.08) 45%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Top bar — brand mark + back link */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold tracking-tight font-heading">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background">
            <Flame size={18} className="fill-current" />
          </span>
          <span>CalStory</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </header>

      {/* Centered auth card */}
      <section className="relative z-10 flex min-h-[calc(100vh-96px)] items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-10">
            <div className="flex flex-col items-center text-center">
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
                <Flame size={22} className="fill-current" />
              </span>
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome to CalStory
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Sign in or create an account with Google to start tracking your
                calories, workouts and progress.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                aria-label="Sign in with Google"
                className="group relative inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-foreground px-6 text-sm font-bold uppercase tracking-widest text-background shadow-lg shadow-black/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100">
                {submitting ? (
                  <>
                    <span
                      className="h-4 w-4 rounded-full border-2 border-background/30 border-t-background"
                      style={{ animation: "spin 0.7s linear infinite" }}
                      aria-hidden="true"
                    />
                    <span>Connecting…</span>
                  </>
                ) : (
                  <>
                    <GoogleGlyph />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link
              href="/terms"
              className="underline-offset-2 hover:text-foreground hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline-offset-2 hover:text-foreground hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

/** Official Google "G" multi-color mark — embedded inline so we don't ship
 *  another asset or pull a font. Sourced from Google's brand guidelines. */
function GoogleGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      className="shrink-0">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.78-.07-1.53-.2-2.27H12v4.51h6.47c-.28 1.4-1.07 2.59-2.27 3.4v2.84h3.66c2.14-1.97 3.63-4.88 3.63-8.48z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.06 0 5.62-1.01 7.49-2.74l-3.66-2.84c-1.02.69-2.32 1.1-3.83 1.1-2.95 0-5.45-1.99-6.34-4.67H1.85v2.93C3.71 21.43 7.57 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.66 14.85c-.23-.69-.36-1.43-.36-2.18s.13-1.49.36-2.18V7.56H1.85C1.32 8.83 1 10.35 1 12s.32 3.17.85 4.44l3.81-1.59z"
      />
      <path
        fill="#EA4335"
        d="M12 4.78c1.66 0 3.16.57 4.34 1.69l3.25-3.25C17.62 1.19 15.06 0 12 0 7.57 0 3.71 2.57 1.85 6.56l3.81 2.93C6.55 6.77 9.05 4.78 12 4.78z"
      />
    </svg>
  );
}
