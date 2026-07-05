"use client";

/**
 * CalorieDeficitFaq — extended FAQ for /about.
 *
 * Holds the long-tail "calorie deficit" questions that used to
 * live on the landing page. Splitting them off keeps the landing
 * FAQ focused on bare-definitions (the highest-intent, largest
 * volume queries) while the deeper / deficit-specific questions
 * ride on the About route where they get richer context and a
 * dedicated FAQPage JSON-LD slot for sitelinks.
 *
 * The questions/answers here are kept byte-identical to what was
 * previously rendered on `/` so we don't lose any ranking signal:
 * Google indexes each URL's content independently, and the
 * /about#calorie-deficit-faq deep link lets the landing page
 * pass link equity through. Keep this list and the JSON-LD in
 * `app/about/page.tsx` in sync.
 */

import { useState, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { ABOUT_FAQS } from "./faqData";

type Faq = {
  q: string;
  /** Plain-text mirror emitted into the page-level FAQPage JSON-LD. */
  short: string;
  a: ReactNode;
};

/* Build the visible FAQ list by pairing the canonical JSON-LD
 * entries from `faqData` (which the server-rendered `about/page.tsx`
 * can import directly without the `"use client"` boundary) with
 * the rich JSX answers defined here. Keeping them in two arrays of
 * matching length means a reorder in one forces a reorder in the
 * other — humans notice mismatches that the build process doesn't. */
const ANSWERS: ReadonlyArray<ReactNode> = [
  <>
    <p>
      To calculate a calorie deficit, first find your Total Daily Energy
      Expenditure (TDEE), the number of calories your body burns in a day based
      on your age, weight, height, activity level, and training. Then subtract a
      set amount, typically 250 to 750 calories, depending on how aggressive you
      want your weight loss to be. Eating below your TDEE by that amount each
      day creates the deficit needed for fat loss.
    </p>
    <p>
      CalStory runs this calculation for you using the Mifflin-St Jeor formula
      and automatically refines your target as you log new weight entries, so
      you&apos;re not stuck doing the math yourself.
    </p>
  </>,
  <>
    <p>
      Most people do well with a moderate deficit of 300 to 500 calories per
      day, which supports steady fat loss of about 0.5 to 1 pound per week
      without excessive muscle loss or energy crashes. Lifters and runners often
      lean toward the smaller end of that range to preserve performance and
      strength during a cut.
    </p>
    <p>
      The right number depends on your body composition, training volume, and
      how quickly you want results. CalStory sets a personalized deficit target
      based on your stats and automatically adjusts it as your weight changes,
      so you&apos;re not guessing.
    </p>
  </>,
  <>
    <p>
      Losing one pound of fat requires roughly a 3,500-calorie deficit, so a
      daily deficit of 500 calories adds up to about one pound lost per week.
      Smaller deficits (around 250 calories/day) lead to slower, more
      sustainable loss, while larger deficits speed things up but increase the
      risk of muscle loss and fatigue, especially for people training hard.
    </p>
    <p>
      Most sustainable weight loss plans stay in the 300 to 750 calorie/day
      range. CalStory&apos;s calorie ring and macro tracking make it easy to see
      exactly where you land against your target every day.
    </p>
  </>,
  <>
    <p>
      For most adults — and especially lifters and runners — 1,000 calories a
      day is too low to sustain training, recovery, or even normal hormonal
      function. Diets that aggressive routinely burn through muscle mass along
      with fat, tank your energy, and trigger metabolic adaptation that makes
      the weight come straight back the moment you return to normal eating.
    </p>
    <p>
      A more sustainable target is a 300 to 500 calorie deficit below your
      maintenance calories — enough to lose roughly 0.5 to 1 pound of fat per
      week without wrecking your lifts. CalStory calculates your personal
      deficit using the Mifflin-St Jeor equation and the activity factor you
      log, so the target adjusts as your weight changes.
    </p>
  </>,
  <>
    <p>
      Yes, but it&apos;s harder and slower than building muscle in a surplus.
      Body recomposition — gaining muscle while losing fat — is achievable in a
      mild deficit if you&apos;re strength training consistently and eating
      enough protein, typically 0.7 to 1 g per pound of bodyweight.
    </p>
    <p>
      Beginners and lifters returning after a break tend to see the best
      muscle-building results while cutting, since their bodies are more
      responsive to training stimulus. CalStory&apos;s workout logging and macro
      targets are built for exactly this — helping you keep protein high and
      track training volume while you&apos;re in a deficit.
    </p>
  </>,
  <>
    <p>
      Eating in a calorie deficit means prioritizing protein and fiber-rich,
      high-volume foods that keep you full on fewer calories, while still
      hitting your daily calorie and macro targets. Lean proteins, vegetables,
      and whole grains help you stay satisfied, while tracking consistently
      prevents the small overages that stall progress.
    </p>
    <p>
      It also helps to plan meals ahead rather than reacting to hunger in the
      moment. CalStory&apos;s AI logger makes tracking effortless — just
      describe your meal in plain English, and it handles the calorie and macro
      breakdown for you.
    </p>
  </>,
  <>
    <p>
      Staying in a calorie deficit long-term comes down to consistency, not
      perfection. Set a realistic deficit you can maintain without constant
      hunger, track your intake daily so small overages don&apos;t go unnoticed,
      and adjust your target as your weight drops and your TDEE changes.
    </p>
    <p>
      Building a routine — like logging meals at the same times each day — makes
      it far easier to stick with. CalStory&apos;s streak tracking and progress
      heatmap help you stay accountable day to day, so the deficit becomes a
      habit instead of a constant decision.
    </p>
  </>,
  <>
    <p>
      A calorie deficit calculator works in two steps: first it estimates your
      maintenance calories (TDEE) from your age, weight, height, sex, and
      activity level; then it subtracts a target deficit — typically 300 to 500
      kcal per day for sustainable fat loss — to set your daily calorie goal.
    </p>
    <p>
      CalStory&apos;s built-in calorie deficit calculator does both, using the
      Mifflin-St Jeor equation as the BMR base. It then re-checks the math each
      week from your logged weight, so the target adapts as your body changes
      instead of staying frozen at your onboarding number.
    </p>
  </>,
  <>
    <p>
      The best calorie calculator to lose weight combines three things: an
      accurate BMR formula (Mifflin-St Jeor, not Harris-Benedict), a real
      activity factor instead of a guess, and weekly auto-tuning from your
      actual logged weight. A calculator that returns a single number on day one
      and never updates it will overshoot as your body changes.
    </p>
    <p>
      CalStory does all three, and then layers AI food logging and macro
      tracking on top — so the calculator isn&apos;t just a one-shot number,
      it&apos;s the same tool you use every day to actually hit the target.
    </p>
  </>,
  <>
    <p>
      Yes. CalStory includes a free food calorie calculator that pairs an AI
      food logger with the FatSecret nutrition database. You can search any
      packaged food by name or type a whole meal in plain English (&ldquo;two
      eggs, toast, and a protein shake&rdquo;) and get a calorie and macro
      breakdown in seconds.
    </p>
    <p>
      The core flow is free with no usage caps. AI logging has a shared daily
      quota that covers most people; paste a personal Gemini API key into
      Settings if you want unlimited usage billed to your own Google account.
    </p>
  </>,
];

/* Length parity: an unequal length between canonical data and the
 * visible JSX list means the visible ↔ JSON-LD mapping would drift
 * at runtime. Catch that at module-eval time on the client. */
if (process.env.NODE_ENV !== "production") {
  if (ABOUT_FAQS.length !== ANSWERS.length) {
    throw new Error(
      `CalorieDeficitFaq: ABOUT_FAQS (${ABOUT_FAQS.length}) and ANSWERS (${ANSWERS.length}) must be the same length.`,
    );
  }
}

const FAQS: Faq[] = ABOUT_FAQS.map((entry, i) => ({
  q: entry.q,
  short: entry.short,
  a: ANSWERS[i],
}));

function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: Faq;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
      className="w-full">
      <h3 className="sr-only" itemProp="name">
        {item.q}
      </h3>
      <div
        itemProp="acceptedAnswer"
        itemScope
        itemType="https://schema.org/Answer"
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`about-faq-panel-${index}`}
          id={`about-faq-trigger-${index}`}
          className="w-full text-left px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4 cursor-pointer group">
          <span className="flex-1 min-w-0 font-bold text-sm sm:text-base text-foreground tracking-tight break-words">
            {item.q}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center group-hover:border-primary/40">
            <Plus
              size={14}
              className="text-muted-foreground"
              style={{
                color: isOpen ? "var(--color-primary)" : undefined,
              }}
            />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={`about-faq-panel-${index}`}
              role="region"
              aria-labelledby={`about-faq-trigger-${index}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="overflow-hidden">
              <div className="mx-5 sm:mx-6 h-px bg-border" />
              <div
                className="px-5 sm:px-6 pt-4 pb-5 text-left text-xs sm:text-sm text-muted-foreground leading-relaxed
                  [&_p]:mb-3 [&_p:last-child]:mb-0
                  [&_p]:break-words
                  [&_strong]:text-foreground [&_strong]:font-semibold
                  [&_a]:text-primary [&_a:hover]:underline [&_a]:break-words">
                {item.a}
                <meta itemProp="text" content={item.short} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function CalorieDeficitFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const headerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="calorie-deficit-faq"
      aria-labelledby="calorie-deficit-faq-heading"
      className="relative z-10 py-24 px-4 sm:px-6 w-full flex justify-center scroll-mt-24 border-t border-border/40">
      <div className="max-w-3xl mx-auto w-full">
        <div ref={headerRef} className="text-center mb-12">
          <span className="inline-block text-xs font-mono tracking-[0.25em] uppercase text-primary/70 mb-4">
            Deep dive
          </span>
          <h2
            id="calorie-deficit-faq-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] font-heading text-balance">
            Calorie Deficit <span className="text-primary">FAQ</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about running a calorie deficit without
            losing muscle or energy — the way the data actually works, not the
            way wellness blogs describe it.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((item, i) => (
            <FaqItem
              key={item.q}
              item={item}
              index={i}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
