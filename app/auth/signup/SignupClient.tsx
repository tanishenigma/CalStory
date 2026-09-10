"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { PageSkeleton } from "@/app/components/PageSkeleton";
import BrandLogo from "@/app/components/BrandLogo";
import { useAuthStore } from "@/app/store/authStore";
import { useApp } from "@/app/context/AppContext";
import { signUpWithEmail, signInWithGoogle } from "@/app/lib/auth";
import { toast } from "sonner";

export default function SignupClient() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const { state } = useApp();
  const [submitting, setSubmitting] = useState(false);

  // ── Email / password form state ────────────────────────────────────
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);

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
      toast.error("Could not sign up with Google. Please try again.");
      console.error("[auth/signup] signInWithGoogle failed", err);
      setSubmitting(false);
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (emailSubmitting) return;

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      toast.warning("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.warning("Passwords do not match.");
      return;
    }

    setEmailSubmitting(true);
    try {
      await signUpWithEmail(email.trim(), password, trimmedUsername);
      router.push("/dashboard");
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code === "auth/email-already-in-use") {
        toast.error("An account already exists with that email.");
      } else if (code === "auth/invalid-email") {
        toast.error("Please enter a valid email address.");
      } else if (code === "auth/weak-password") {
        toast.error("Password is too weak. Use at least 6 characters.");
      } else if (code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please wait a moment and try again.");
      } else {
        toast.error("Could not create account. Please try again.");
      }
      console.error("[auth/signup] signUpWithEmail failed", err);
      setEmailSubmitting(false);
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
          <span className="grid h-9 w-9 place-items-center">
            <BrandLogo className="h-9 w-9" />
          </span>
          <span>CalStory</span>
        </Link>

        {/* Centred form area */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-sm space-y-8">
            {/* Heading */}
            <div className="space-y-2 text-center">
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Create Account
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Start tracking your calories, workouts, and progress.
              </p>
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              aria-label="Sign up with Google"
              className="group relative inline-flex h-12 w-full items-center justify-center gap-3 rounded-[10px] bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-[transform,opacity,background-color] duration-150 ease-out hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100">
              {submitting ? (
                <>
                  <span
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
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

            {/* OR divider */}
            <div className="flex items-center gap-3" aria-hidden="true">
              <div className="h-px flex-1 bg-border" />
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                OR
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Email / password card */}
            <form
              onSubmit={handleEmailSignUp}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-username"
                  className="text-sm font-medium text-foreground">
                  Username
                </label>
                <input
                  id="signup-username"
                  type="text"
                  autoComplete="username"
                  placeholder="yourname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  className="h-11 w-full rounded-[10px] border border-border bg-subtle px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-email"
                  className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-[10px] border border-border bg-subtle px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-password"
                  className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 w-full rounded-[10px] border border-border bg-subtle px-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-confirm"
                  className="text-sm font-medium text-foreground">
                  Confirm password
                </label>
                <input
                  id="signup-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="h-11 w-full rounded-[10px] border border-border bg-subtle px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={emailSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-[transform,opacity,background-color] duration-150 ease-out hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                {emailSubmitting ? (
                  <>
                    <span
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      style={{ animation: "spin 0.7s linear infinite" }}
                      aria-hidden="true"
                    />
                    <span>Creating account…</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            {/* Sign in link */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth"
                className="font-semibold text-foreground underline-offset-2 hover:text-primary hover:underline">
                Sign In
              </Link>
            </p>

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
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 55%, rgba(255,255,255,0.55) 100%)",
          }}
        />

        <Image
          src="/light_dashboard.png"
          alt="CalStory — track your progress"
          fill
          quality={100}
          priority
          className="object-cover object-center"
        />

        <div className="absolute bottom-8 left-8 right-8 z-20">
          <p className="font-heading text-xl font-bold text-ink leading-snug drop-shadow-sm">
            Every meal logged.
            <br />
            Every rep counted.
          </p>
          <p className="mt-1 text-sm text-ink/70">
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
