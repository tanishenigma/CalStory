/**
 * Title / meta description variant selector.
 *
 * The SEO playbook (Task 5) says: "Generate 3 title/meta variants per
 * article and pick the most specific, not the most clever." Specificity
 * is operationalised here as: longest title up to 60 chars (Google's
 * title-pixel truncation limit ≈ 580px ≈ 60 chars at standard fonts),
 * with a heavy bonus for containing a number or a concrete timeframe
 * (those consistently get higher CTR in our niche).
 */

import { TITLE_VARIANTS, type PostSlug } from "@/lib/blog/clusters";

/**
 * Score a single title/description pair. Higher = more specific.
 * Scoring rubric:
 *   - Title length: sweet spot is 40–60 chars (penalise too short
 *     or too long).
 *   - Contains a number: +2 (numbers consistently win CTR in
 *     "how to" / list-style searches).
 *   - Contains a concrete timeframe ("10 minutes", "3 numbers",
 *     "47s vs 9s"): +2.
 *   - Contains a specific audience ("for lifters", "for beginners",
 *     "for runners"): +1.
 *   - Contains a quantifier ("best", "top", "vs"): +1.
 */
function scoreVariant(variant: { title: string; description: string }): number {
  const t = variant.title;
  const len = t.length;
  let score = 0;

  // Title length: best at 40–60 chars.
  if (len >= 40 && len <= 60) score += 3;
  else if (len >= 30 && len <= 70) score += 1;
  else score -= 1;

  // Number anywhere in the title.
  if (/\d/.test(t)) score += 2;

  // Concrete timeframe or measured outcome.
  if (
    /\b(minute|min|hour|day|week|second|sec|month|year|x|times|kg|lb|g|calorie|protein|gram|percent|%)\b/i.test(
      t,
    )
  ) {
    score += 2;
  }

  // Specific audience.
  if (
    /\b(for|vs|without|after|before|while|during|beginner|advanced|expert|lifter|runner|gainer|cutter|powerlifter|bodybuilder)\b/i.test(
      t,
    )
  ) {
    score += 1;
  }

  // Quantifier.
  if (/\b(best|top|complete|ultimate|definitive|no[- ]bs|honest)\b/i.test(t)) {
    score += 1;
  }

  return score;
}

/**
 * Pick the most specific title/description variant for a given post.
 * Returns the first variant in `TITLE_VARIANTS` if none are registered.
 */
export function pickTitleVariant(slug: PostSlug): {
  title: string;
  description: string;
} {
  const variants = TITLE_VARIANTS[slug];
  if (!variants || variants.length === 0) {
    throw new Error(
      `No TITLE_VARIANTS registered for "${slug}" — add 3 CTR-oriented variants to lib/blog/clusters.ts.`,
    );
  }

  let best = variants[0];
  let bestScore = scoreVariant(best);
  for (let i = 1; i < variants.length; i++) {
    const score = scoreVariant(variants[i]);
    if (score > bestScore) {
      best = variants[i];
      bestScore = score;
    }
  }
  return best;
}

/* Helper: list all variants for a slug (used by the editor preview
 * tool we may add later — exposed here so the scoring rubric is the
 * single source of truth). */
export function listTitleVariants(slug: PostSlug) {
  return TITLE_VARIANTS[slug] ?? [];
}
