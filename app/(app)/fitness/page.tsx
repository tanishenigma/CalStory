import { Suspense } from "react";
import { Spinner } from "@/app/hooks/useAuthGuard";
import FitnessClient from "./FitnessClient";

export const metadata = {
  title: "Fitness Sync | CalStory",
  description: "Sync your daily steps, active calories, and workouts from Google Fit.",
};

export default function FitnessPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <FitnessClient />
    </Suspense>
  );
}
