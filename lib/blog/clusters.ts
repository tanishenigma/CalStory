/**
 * Blog cluster architecture — the core data model behind CalStory's
 * SEO content engine.
 *
 * Structure:
 *   1. Keyword map (Task 1 of the playbook) — `KEYWORD_MAP`
 *      Each entry is a long-tail, audience-specific query that
 *      CalStory's content should target. The head-term SEO battle
 *      (MyFitnessPal, Cronometer, Lose It) is unwinnable; the
 *      narrow, specific, high-intent queries are how a new site
 *      earns organic traffic with no domain authority.
 *
 *   2. Clusters (Task 2) — `CLUSTERS`
 *      A pillar page → cluster articles mapping. Each cluster has a
 *      pillar URL, a one-line description, and the slugs of the
 *      articles in it. Articles cross-link via `RelatedGuides`.
 *
 *   3. CTA targets — `BLOG_CTA`
 *      Each post maps to ONE CalStory feature, not a generic
 *      "Try CalStory". An article on AI food logging CTAs to the AI
 *      logger; one on plateaus CTAs to the Progress page; etc. This
 *      is the conversion lever — generic CTAs don't convert.
 *
 *   4. Title/description variants (Task 5) — `TITLE_VARIANTS`
 *      Three CTR-oriented title/meta variants per cluster. Titles
 *      combine specificity + concrete number/outcome so a result
 *      landing at position 8–15 still gets clicks. Pick the most
 *      specific, not the most clever.
 *
 * Status is tracked in `BACKLOG` for Task 6.
 */

export type KeywordIntent = "informational" | "comparison" | "bottom-funnel";

export type CTAFeature =
  | "ai-logger"
  | "tdee"
  | "progress"
  | "workout-tracker"
  | "macro-tracker"
  | "streak"
  | "generic";

export interface KeywordEntry {
  keyword: string;
  intent: KeywordIntent;
  cta: CTAFeature;
  why: string;
}

/* ------------------------------------------------------------------
 * 1. Keyword map — 50 long-tail queries across 6 thematic clusters.
 * Each one is specific enough that the existing head-term SEO
 * competitors won't write a dedicated page for it.
 * ------------------------------------------------------------------ */
export const KEYWORD_MAP: KeywordEntry[] = [
  /* Cluster A — population-specific TDEE / macro guides */
  {
    keyword: "TDEE calculator for skinny fat beginners",
    intent: "informational",
    cta: "tdee",
    why: "Big sites don't write for this persona — they only cover the average case.",
  },
  {
    keyword: "macro split for female powerlifters cutting",
    intent: "informational",
    cta: "macro-tracker",
    why: "Female powerlifters cut differently — strength floor matters more than scale weight.",
  },
  {
    keyword: "how many calories should a 130lb runner eat marathon training",
    intent: "informational",
    cta: "tdee",
    why: "Concrete bodyweight + concrete training load — high specificity beats generic TDEE pages.",
  },
  {
    keyword: "best macro split for recomp after 30",
    intent: "informational",
    cta: "macro-tracker",
    why: "Recomp after 30 has different hormonal reality than recomp at 22.",
  },
  {
    keyword: "calorie target for 5'4 woman trying to lose last 10 pounds",
    intent: "informational",
    cta: "tdee",
    why: "Concrete height + concrete phase — likely 'stubborn fat' framing.",
  },
  {
    keyword: "TDEE for skinny ectomorph trying to gain",
    intent: "informational",
    cta: "tdee",
    why: "Ectomorph framing is still surprisingly underserved.",
  },
  {
    keyword: "macros for powerlifting meet prep without gaining fat",
    intent: "informational",
    cta: "macro-tracker",
    why: "Meet-prep is a specific phase with specific tactics — long-tail viable.",
  },
  {
    keyword: "calorie deficit for 40 year old man losing weight",
    intent: "informational",
    cta: "tdee",
    why: "Age + sex + goal — three parameters down, narrow result.",
  },

  /* Cluster B — AI food logging use cases */
  {
    keyword: "how to log a homemade meal without a barcode",
    intent: "informational",
    cta: "ai-logger",
    why: "The most common daily pain point. Direct CTA to the AI logger.",
  },
  {
    keyword: "best calorie tracker for eating out often",
    intent: "comparison",
    cta: "ai-logger",
    why: "Restaurant logging is the failure mode for most apps.",
  },
  {
    keyword: "AI food logger accuracy vs manual logging",
    intent: "comparison",
    cta: "ai-logger",
    why: "Direct comparison piece — high conversion intent.",
  },
  {
    keyword: "how to log a recipe with multiple ingredients",
    intent: "informational",
    cta: "ai-logger",
    why: "Recipe form exists exactly for this — natural product fit.",
  },
  {
    keyword: "log meal from photo vs text description",
    intent: "comparison",
    cta: "ai-logger",
    why: "Photo-vs-text is a real UX question; CalStory supports both.",
  },
  {
    keyword: "voice calorie tracker accuracy 2026",
    intent: "comparison",
    cta: "ai-logger",
    why: "New modality — still few direct comparisons.",
  },
  {
    keyword: "best calorie tracker for Indian food",
    intent: "comparison",
    cta: "ai-logger",
    why: "Cultural specificity. MyFitnessPal's database is weak here.",
  },
  {
    keyword: "how to track calories without a food scale",
    intent: "informational",
    cta: "ai-logger",
    why: "Beginner friction — anyone starting out hits this.",
  },

  /* Cluster C — sport/training-specific logging */
  {
    keyword: "how to track calories for CrossFit Open prep",
    intent: "informational",
    cta: "workout-tracker",
    why: "CrossFit Open is a fixed phase — timed content opportunity.",
  },
  {
    keyword: "calorie tracking for powerlifting vs bodybuilding",
    intent: "comparison",
    cta: "workout-tracker",
    why: "Side-by-side comparison; a natural pillar for the workout cluster.",
  },
  {
    keyword: "should runners track macros differently than lifters",
    intent: "informational",
    cta: "macro-tracker",
    why: "Cross-audience question; good cluster-cross-link opportunity.",
  },
  {
    keyword: "how many calories does heavy lifting actually burn",
    intent: "informational",
    cta: "workout-tracker",
    why: "Dispel a popular myth with numbers — links back to TDEE pillar.",
  },
  {
    keyword: "macros for hypertrophy vs strength training",
    intent: "comparison",
    cta: "macro-tracker",
    why: "Classic debate. CalStory's schema-driven workout form supports both.",
  },
  {
    keyword: "calorie tracking during marathon training block",
    intent: "informational",
    cta: "workout-tracker",
    why: "Endurance athletes have wildly different needs than lifters.",
  },
  {
    keyword: "best calorie tracker for home workout no gym",
    intent: "comparison",
    cta: "workout-tracker",
    why: "Bodyweight + bands + dumbbells — growing segment.",
  },
  {
    keyword: "should I eat back calories burned from cardio",
    intent: "informational",
    cta: "tdee",
    why: "Classic question; natural fit for the TDEE pillar.",
  },

  /* Cluster D — plateau / troubleshooting */
  {
    keyword: "why am I not losing weight eating in a deficit",
    intent: "informational",
    cta: "tdee",
    why: "Plateau is the #1 search intent in the niche — narrow the cause.",
  },
  {
    keyword: "reverse dieting after a long cut",
    intent: "informational",
    cta: "tdee",
    why: "Reverse diet = step-up in calories over weeks. Very specific tactic.",
  },
  {
    keyword: "TDEE recalculation after weight loss plateau",
    intent: "informational",
    cta: "tdee",
    why: "TDEE drops as you lose weight — readers need this guidance.",
  },
  {
    keyword:
      "how to break a weight loss plateau without lowering calories more",
    intent: "informational",
    cta: "progress",
    why: "Diet break / refeed / NEAT — there are real alternatives.",
  },
  {
    keyword: "why am I gaining weight on a deficit",
    intent: "informational",
    cta: "progress",
    why: "Common frustration — water, glycogen, sodium all matter.",
  },
  {
    keyword: "weight went up after one cheat day how to recover",
    intent: "informational",
    cta: "progress",
    why: "Reframe weight fluctuations — habit, not failure.",
  },
  {
    keyword: "is my calorie tracker lying to me",
    intent: "informational",
    cta: "generic",
    why: "Address the meta-trust question — good top-of-funnel piece.",
  },
  {
    keyword: "should I stop tracking calories to lose weight",
    intent: "informational",
    cta: "progress",
    why: "Counterintuitive intent — many people hit tracking fatigue.",
  },

  /* Cluster E — comparison / decision content */
  {
    keyword: "MyFitnessPal alternatives without ads",
    intent: "comparison",
    cta: "generic",
    why: "Ad-fatigue is real; bottom-funnel comparison piece.",
  },
  {
    keyword: "best free calorie tracker with AI 2026",
    intent: "comparison",
    cta: "ai-logger",
    why: "Direct bottom-of-funnel — CalStory is the answer.",
  },
  {
    keyword: "MacroFactor vs CalStory vs MyFitnessPal",
    intent: "comparison",
    cta: "generic",
    why: "Head-to-head comparison — capture competitor-research queries.",
  },
  {
    keyword: "free calorie tracker that doesn't sell your data",
    intent: "comparison",
    cta: "generic",
    why: "Privacy differentiator — natural fit for self-hosted angle.",
  },
  {
    keyword: "best calorie tracker for people who hate tracking",
    intent: "comparison",
    cta: "ai-logger",
    why: "Anti-tracking users — AI logging is the answer.",
  },
  {
    keyword: "Cronometer vs CalStory which is more accurate",
    intent: "comparison",
    cta: "generic",
    why: "Cronometer owns 'accuracy' in the niche — must answer it head-on.",
  },
  {
    keyword: "manual macro tracking vs app tracking is one better",
    intent: "comparison",
    cta: "macro-tracker",
    why: "Honest comparison — wins trust.",
  },
  {
    keyword: "best calorie tracker with workout logging built in",
    intent: "comparison",
    cta: "workout-tracker",
    why: "Bundled feature comparison — CalStory's unique angle.",
  },

  /* Cluster F — beginner logistics */
  {
    keyword: "how long should you track calories before it becomes automatic",
    intent: "informational",
    cta: "ai-logger",
    why: "Habits piece — sets realistic expectations for new users.",
  },
  {
    keyword: "what to do when you forget to log a meal",
    intent: "informational",
    cta: "generic",
    why: "Common beginner fail mode — short, useful, shareable.",
  },
  {
    keyword: "do you have to track calories every day to lose weight",
    intent: "informational",
    cta: "progress",
    why: "Question of consistency vs perfection — common doubt.",
  },
  {
    keyword: "how accurate does calorie tracking need to be",
    intent: "informational",
    cta: "generic",
    why: "Permission to track loosely — reduces friction.",
  },
  {
    keyword: "first week of calorie tracking what to expect",
    intent: "informational",
    cta: "ai-logger",
    why: "Onboarding-friendly — captures new users searching for guidance.",
  },
  {
    keyword: "should you track macros or just calories for fat loss",
    intent: "informational",
    cta: "macro-tracker",
    why: "Tiered approach — meets readers where they are.",
  },
  {
    keyword: "calorie tracking without a food scale alternatives",
    intent: "informational",
    cta: "ai-logger",
    why: "Practical guide — answers a real onboarding friction.",
  },
  {
    keyword: "calorie tracking apps vs paper journal which works better",
    intent: "comparison",
    cta: "generic",
    why: "Surprisingly persistent question — research-backed comparison piece.",
  },

  /* Cluster G — feature-led (CalStory-specific) */
  {
    keyword: "what is AI food logging",
    intent: "informational",
    cta: "ai-logger",
    why: "New category — explain the concept, then CTA to CalStory's implementation.",
  },
  {
    keyword: "is Gemini good for calorie tracking",
    intent: "comparison",
    cta: "ai-logger",
    why: "CalStory uses Gemini under the hood — explain why that matters.",
  },
  {
    keyword: "best open source calorie tracker",
    intent: "comparison",
    cta: "generic",
    why: "Self-hosted is a real differentiator — natural SEO angle.",
  },
  {
    keyword: "self hosted calorie tracker with Firebase",
    intent: "comparison",
    cta: "generic",
    why: "Developer audience — technical SEO angle, very low competition.",
  },
  {
    keyword: "how to read a calorie tracker progress heatmap",
    intent: "informational",
    cta: "progress",
    why: "Feature explainer — pulls users into the Progress page.",
  },
  {
    keyword: "what does TDEE mean for cutting vs bulking",
    intent: "informational",
    cta: "tdee",
    why: "Definitional content — supports both clusters.",
  },
  {
    keyword: "does macro tracking work for skinny fat transformation",
    intent: "informational",
    cta: "macro-tracker",
    why: "Concrete transformation phase — high specificity.",
  },
  {
    keyword: "how to log a meal without weighing it",
    intent: "informational",
    cta: "ai-logger",
    why: "Practical friction — repeat-search query.",
  },
];

/* ------------------------------------------------------------------
 * 2. Clusters — pillar → cluster-article mapping.
 *
 * Slugs must match `BLOG_POSTS[id]` in app/blog/_posts.ts. Adding
 * a new post to that file is the ONLY step needed to publish;
 * `RelatedGuides` and `sitemap.ts` derive everything from there.
 * ------------------------------------------------------------------ */

export type PostSlug =
  | "calorie-tracking-for-beginners"
  | "best-macro-calculator";

export interface ClusterDef {
  /** URL slug of the pillar landing page (planned, may not exist yet). */
  pillar: string;
  /** Short label for the pillar, used in the RelatedGuides heading. */
  pillarLabel: string;
  /** One-line description of what the pillar covers. */
  pillarDescription: string;
  /** Slugs of the cluster articles in this pillar. */
  articles: PostSlug[];
  /** Sibling slugs that cluster articles should cross-link to each other. */
  siblingLinks?: PostSlug[];
}

export const CLUSTERS: Record<string, ClusterDef> = {
  tdee: {
    pillar: "blog/tdee-and-macros",
    pillarLabel: "TDEE & Macros",
    pillarDescription:
      "Everything you need to know about total daily energy expenditure, macro splits, and how to adjust as your training changes.",
    articles: ["calorie-tracking-for-beginners", "best-macro-calculator"],
    siblingLinks: ["best-macro-calculator", "calorie-tracking-for-beginners"],
  },
};

/* Reverse lookup: for a given post slug, return its cluster. */
export function clusterForPost(slug: PostSlug): ClusterDef | null {
  for (const cluster of Object.values(CLUSTERS)) {
    if (cluster.articles.includes(slug)) return cluster;
  }
  return null;
}

/* ------------------------------------------------------------------
 * 3. CTA targets — every post maps to ONE CalStory feature.
 * ------------------------------------------------------------------ */
export const BLOG_CTA: Record<PostSlug, CTAFeature> = {
  "calorie-tracking-for-beginners": "generic",
  "best-macro-calculator": "macro-tracker",
};

export const CTA_PATH: Record<CTAFeature, string> = {
  "ai-logger": "/dashboard",
  tdee: "/onboarding",
  progress: "/progress",
  "workout-tracker": "/workouts",
  "macro-tracker": "/nutrition",
  streak: "/dashboard",
  generic: "/dashboard",
};

export const CTA_COPY: Record<CTAFeature, { eyebrow: string; body: string }> = {
  "ai-logger": {
    eyebrow: "Try the AI food logger",
    body: "CalStory's AI turns 'two eggs, toast, and a protein shake' into a saved meal in under 9 seconds. Free, no signup walls.",
  },
  tdee: {
    eyebrow: "Compute your TDEE",
    body: "CalStory uses the Mifflin-St Jeor equation, refines it as you log weight, and adapts your targets as your metabolism changes.",
  },
  progress: {
    eyebrow: "See the consistency heatmap",
    body: "The Progress page turns your logs into a 16-week heatmap so you can spot patterns before frustration sets in.",
  },
  "workout-tracker": {
    eyebrow: "Log your workouts",
    body: "Strength, cardio, HIIT, yoga — schema-driven forms for sets, reps, weight, distance, pace, and duration.",
  },
  "macro-tracker": {
    eyebrow: "Hit your macros",
    body: "Calorie ring on the dashboard, real-time macro pills on Nutrition, protein floor pre-set on onboarding. No spreadsheet.",
  },
  streak: {
    eyebrow: "Build the streak",
    body: "One meal logged per day keeps the streak alive. CalStory's day-strip shows the full 16-week picture at a glance.",
  },
  generic: {
    eyebrow: "Try CalStory",
    body: "Free calorie, macro, and workout tracker with an AI food logger. Built for lifters, runs in your browser.",
  },
};

/* ------------------------------------------------------------------
 * 4. Title / meta description variants — Task 5 framework.
 * Pattern: specificity + concrete number/timeframe + outcome.
 * ------------------------------------------------------------------ */
export const TITLE_VARIANTS: Record<
  PostSlug,
  { title: string; description: string }[]
> = {
  "calorie-tracking-for-beginners": [
    {
      title:
        "Calorie Tracking for Beginners: The 10-Minute Setup That Lasts Past Week 3",
      description:
        "Three numbers you actually need on day one, two habits that decide if you survive week three, and what to do when logging breaks down.",
    },
    {
      title: "How to Start Tracking Calories Without Burning Out in a Week",
      description:
        "Why most calorie trackers fail by day 7, and the 10-minute setup that takes the friction out of logging for good.",
    },
    {
      title:
        "The Beginner's Calorie Tracker Setup: Protein, TDEE, and Trend Weight",
      description:
        "Set your calorie target, protein floor, and trend weight in 10 minutes. Then log in under 9 seconds per meal.",
    },
  ],
  "best-macro-calculator": [
    {
      title:
        "The Best Macro Calculator for Lifters: Mifflin-St Jeor, Adjusted for Real Life",
      description:
        "A no-BS macro calculator for lifters. The Mifflin-St Jeor equation, what to fix when you've been dieting too long, and the three macros that move the needle.",
    },
    {
      title:
        "Macro Calculator for Lifters: Protein, Carbs, and Fat in the Right Ratio",
      description:
        "Cut through the bro-science. The Mifflin-St Jeor math, the protein ceiling, and the one ratio that actually matters.",
    },
    {
      title: "How to Calculate Your Macros for Cutting, Bulking, and Recomp",
      description:
        "Three macro presets, one Mifflin-St Jeor equation, and the maintenance check that prevents 80% of beginner mistakes.",
    },
  ],
};

/* ------------------------------------------------------------------
 * 5. Content backlog — Task 6 status tracker.
 *
 * Each entry is a candidate post derived from KEYWORD_MAP. Status:
 *   - "planned"   — keyword reserved, no draft yet
 *   - "drafted"   — outline + first draft exists
 *   - "published" — live at /blog/<slug>
 *   - "indexed"   — published AND submitted to Search Console
 *
 * This file is the single source of truth; adding a `published` row
 * here means a real post must exist in BLOG_POSTS.
 * ------------------------------------------------------------------ */
export type BacklogStatus = "planned" | "drafted" | "published" | "indexed";

export interface BacklogRow {
  slug: string;
  title: string;
  keyword: string;
  cluster: keyof typeof CLUSTERS | null;
  status: BacklogStatus;
}

export const BACKLOG: BacklogRow[] = [
  {
    slug: "calorie-tracking-for-beginners",
    title: "Calorie Tracking for Beginners",
    keyword: "calorie tracking for beginners",
    cluster: "tdee",
    status: "published",
  },
  {
    slug: "best-macro-calculator",
    title: "The Best Macro Calculator for Lifters",
    keyword: "best macro calculator for lifters",
    cluster: "tdee",
    status: "published",
  },
  {
    slug: "how-to-log-homemade-meal-without-barcode",
    title: "How to Log a Homemade Meal Without a Barcode",
    keyword: "how to log a homemade meal without a barcode",
    cluster: "tdee",
    status: "planned",
  },
  {
    slug: "tdee-skinny-fat-beginners",
    title: "TDEE Calculator for Skinny Fat Beginners",
    keyword: "TDEE calculator for skinny fat beginners",
    cluster: "tdee",
    status: "planned",
  },
  {
    slug: "macros-female-powerlifters-cutting",
    title: "Macro Split for Female Powerlifters on a Cut",
    keyword: "macro split for female powerlifters cutting",
    cluster: "tdee",
    status: "planned",
  },
  {
    slug: "tdee-recalculation-weight-loss-plateau",
    title: "When to Recalculate Your TDEE After a Weight Loss Plateau",
    keyword: "TDEE recalculation after weight loss plateau",
    cluster: "tdee",
    status: "planned",
  },
  {
    slug: "ai-food-logger-accuracy-vs-manual",
    title: "AI Food Logger Accuracy vs Manual Logging: 47s vs 9s",
    keyword: "AI food logger accuracy vs manual logging",
    cluster: "tdee",
    status: "planned",
  },
  {
    slug: "myfitnesspal-alternatives-without-ads",
    title: "MyFitnessPal Alternatives Without Ads: 6 Free Trackers Compared",
    keyword: "MyFitnessPal alternatives without ads",
    cluster: "tdee",
    status: "planned",
  },
  {
    slug: "calorie-tracking-without-food-scale",
    title: "Calorie Tracking Without a Food Scale: Practical Alternatives",
    keyword: "calorie tracking without a food scale",
    cluster: "tdee",
    status: "planned",
  },
  {
    slug: "reverse-dieting-after-long-cut",
    title: "Reverse Dieting After a Long Cut: The Step-Up Protocol",
    keyword: "reverse dieting after a long cut",
    cluster: "tdee",
    status: "planned",
  },
];

/* Helper used by the sitemap and the post page to enumerate
 * every published post. We intentionally re-export the type so the
 * post page and sitemap can stay strictly typed to PostSlug. */
export type PublishedSlug = PostSlug;
