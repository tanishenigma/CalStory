"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageSkeleton } from "@/app/components/PageSkeleton";
import { useAuthStore } from "@/app/store/authStore";
import { useApp } from "@/app/context/AppContext";
import { signInWithGoogle } from "@/app/lib/auth";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const { state } = useApp();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading && !user) return;
    if (user && state.profile !== undefined) {
      router.replace("/dashboard");
    }
  }, [user, loading, state.profile, router]);

  if (loading && !user) {
    return <PageSkeleton variant="auth" />;
  }

  async function handleGoogleSignIn() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code === "auth/popup-closed-by-user") return;
      toast.error("Could not sign in with Google. Please try again.");
      console.error("[auth] signInWithGoogle failed", err);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* ── Left column: form ── */}
      <div className="flex flex-col p-6 md:p-10">
        {/* Brand */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold tracking-tight font-heading self-start">
          <span className="grid h-9 w-9 place-items-center rounded-full overflow-hidden bg-foreground">
            <img
              src="/dark.png"
              alt="CalStory"
              width={28}
              height={28}
              className="w-7 h-7 object-contain  block"
            />
          </span>
          <span>CalStory</span>
        </Link>

        {/* Centred form area */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-sm space-y-8">
            {/* Heading */}
            <div className="space-y-2 text-center">
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Hey There,
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign in with Google to track your calories, workouts, and
                progress.
              </p>
            </div>

            {/* Google button */}
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

            {/* Legal */}
            <p className="text-center text-xs text-muted-foreground">
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
        </div>

        {/* Back link at bottom */}
        <Link
          href="/"
          className="md:inline-flex hidden  items-center gap-1.5 self-start text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>

      {/* ── Right column: cover image, desktop only ── */}
      <div className="relative hidden lg:block m-4 rounded-2xl overflow-hidden">
        {/* Ambient overlay so image doesn't compete with dark UI */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.45) 100%)",
          }}
        />

        <Image
          src="/screenshots/dashboard_dark.png"
          alt="CalStory — track your progress"
          fill
          quality={100}
          priority
          className="block forced-dark:block object-cover object-center brightness-[0.55]"
        />

        {/* Optional tagline over the image */}
        <div className="absolute bottom-8 left-8 right-8 z-20">
          <p className="font-heading text-xl font-bold text-white leading-snug drop-shadow-md">
            Every meal logged.
            <br />
            Every rep counted.
          </p>
          <p className="mt-1 text-sm text-white/70">
            Your story, by the numbers.
          </p>
        </div>
      </div>
    </div>
  );
}

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
