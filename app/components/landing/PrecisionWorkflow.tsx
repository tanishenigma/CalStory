"use client";

import React from "react";
import { Camera, Brain, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import BlurFade from "@/app/components/animations/BlurFade";

const STEPS = [
  {
    n: "1",
    title: "Input",
    desc: "Add food and automatically identify its nutrients in real time.",
    Icon: Camera,
  },
  {
    n: "2",
    title: "Analyze",
    desc: "Our engine cross-references data with your unique metabolic baseline.",
    Icon: Brain,
  },
  {
    n: "3",
    title: "Optimize",
    desc: "Receive actionable adjustments to stay perfectly on track for your goals.",
    Icon: TrendingUp,
  },
];

export default function PrecisionWorkflow() {
  return (
    <section className="flex flex-col items-center text-center px-2">
      <BlurFade>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading text-foreground">
          Precision Workflow
        </h2>
        <p className="text-sm text-muted-foreground-foreground mt-2 max-w-md">
          Three steps to metabolic clarity. Simple, automated, and scientific.
        </p>
      </BlurFade>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8">
        {STEPS.map((step, i) => (
          <BlurFade key={step.title} delay={0.1 * i} className="h-full">
            <Card className="card-interactive h-full p-6 sm:p-8 group">
              <CardContent className="p-0 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <step.Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                </div>
                <div className="font-bold text-base tracking-tight font-heading text-foreground">
                  {step.n}. {step.title}
                </div>
                <div className="text-muted-foreground-foreground text-xs sm:text-sm leading-relaxed">
                  {step.desc}
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        ))}
      </div>
    </section>
  );
}
