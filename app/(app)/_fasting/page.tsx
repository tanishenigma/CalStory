import { Suspense } from "react";
import { Spinner } from "@/app/hooks/useAuthGuard";
import FastingClient from "./FastingClient";

export const metadata = {
  title: "Fasting Tracker | CalStory",
  description:
    "Track your intermittent fasting sessions with a live progress ring.",
};

export default function FastingPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <FastingClient />
    </Suspense>
  );
}
