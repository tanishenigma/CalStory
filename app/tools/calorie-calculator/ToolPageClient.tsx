"use client";

/**
 * Client wrapper for the public Calorie Calculator page.
 *
 * The page itself is a server component (so the calculator widget
 * and educational copy render in the initial HTML response), but
 * `<Navbar onSignIn={...} />` needs a handler that uses
 * `next/navigation`. Hosting the Navbar inside this thin
 * `"use client"` wrapper is the standard fix — see
 * `app/about/AboutClient.tsx` for the same pattern.
 */

import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/landing/Navbar";

export function ToolPageClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function handleSignIn() {
    router.push("/auth");
  }

  return (
    <>
      <Navbar onSignIn={handleSignIn} />
      {children}
    </>
  );
}
