/**
 * Blog post template — encodes the SEO content engine structure
 * from the playbook so every new post starts from the right skeleton.
 *
 * The 7-section structure (from Task 3 of the playbook):
 *   1. Problem-aware opening — name the specific frustration in the
 *      first 2 sentences.
 *   2. Answer the core question in the first 100–150 words (don't
 *      bury the lede — this is what Google harvests for the
 *      featured snippet).
 *   3. Question-based H2 headers — these map directly to "People
 *      Also Ask" queries.
 *   4. 1,500–3,000 words of genuine depth, no filler.
 *   5. 2–3 internal links to siblings/pillar, placed mid-content
 *      (not just at the end).
 *   6. A closing CTA to the single most relevant CalStory feature
 *      (handled automatically by <RelatedGuides /> in the page).
 *   7. JSON-LD schema — BlogPosting + BreadcrumbList + optional
 *      FAQPage (handled automatically by `articleJsonLd`).
 *
 * How to use this template:
 *   1. Copy `_TEMPLATE.tsx` → `<your-slug>.tsx` next to this file
 *      (or just register your slug in `BLOG_POSTS` and add a new
 *      `POST_BODIES` entry below).
 *   2. Add the slug to `BLOG_POSTS` in `app/blog/_posts.ts` with
 *      title + description + publishedTime + modifiedTime + cluster.
 *   3. Register the slug in `lib/blog/clusters.ts` (post slug type
 *      union + cluster `articles` list + BLOG_CTA mapping).
 *   4. Add a matching `BACKLOG` row in clusters.ts with status
 *      flipped to "published" once the post is live.
 *   5. Build, then request indexing in Search Console for the new
 *      URL — don't wait for organic crawl discovery.
 *
 * Example: to add a new post "Why Skinny Fat Beginners Should
 * Recomp", the slug is `tdee-skinny-fat-beginners`, it goes in the
 * `tdee` cluster, the CTA target is `tdee`, the post body uses
 * the question-based H2 outline below.
 */

import { BlogShell } from "./BlogShell";

/* eslint-disable @typescript-eslint/no-unused-vars */
// Example body — copy this and replace with the real post content.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TEMPLATE_BODY = (
  <>
    {/* 1. PROBLEM-AWARE OPENING (first 2 sentences) */}
    <p>
      <strong>[Specific frustration the reader is feeling right now.]</strong>{" "}
      [Continue with a one-sentence pivot to the rest of the article.]
    </p>

    {/* 2. ANSWER THE CORE QUESTION IN THE FIRST 100–150 WORDS */}
    <p>
      <strong>The short answer:</strong> [One or two sentences that directly
      answer the article's title query. This is the paragraph Google harvests
      for the featured snippet — keep it self-contained and factual.]
    </p>

    <h2>[Question-based H2 — directly maps to a "People Also Ask" query]</h2>
    <p>
      [Body paragraph. Cite a primary source where possible (study, guide, or
      expert resource). Keep paragraphs to 80–120 words for scannability.]
    </p>
    <p>
      [Continue with the next beat.{" "}
      <a href="/blog/calorie-tracking-for-beginners">Link to a sibling post</a>{" "}
      here when the topic naturally bridges — don't force it.]
    </p>

    <h2>[Second question-based H2]</h2>
    <p>[Body.]</p>

    <h3>[Optional H3 sub-section for depth]</h3>
    <p>[Body.]</p>

    <h2>[Third question-based H2 — usually the most-searched PAA]</h2>
    <p>[Body.]</p>

    <h2>[Closing H2 — what to do next]</h2>
    <p>
      [Actionable next steps.{" "}
      <a href="/blog/best-macro-calculator">
        Link to the most-related pillar or sibling
      </a>{" "}
      once more before the closing CTA. The RelatedGuides component below the
      body will auto-render the full related-posts + closing CTA — you don't
      need to write that part manually.]
    </p>
  </>
);
// eslint-enable @typescript-eslint/no-unused-vars

/* eslint-disable @typescript-eslint/no-unused-vars */
function _unusedTemplateExample() {
  return (
    <BlogShell
      title="[Title — keep under 60 characters, specific + concrete number]"
      intro="[Answer the title query in 1–2 sentences. This is the first thing readers and search engines see.]"
      datePublished="2026-07-01"
      dateModified="2026-07-01"
      readTime="[X] min read">
      {TEMPLATE_BODY}
    </BlogShell>
  );
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// Re-export the type so the example is type-checked.
export { _unusedTemplateExample as _TemplateExample };
