import type { Metadata } from "next";
import { getBlogPost, type BlogPostMeta } from "@/app/blog/_posts";
import { type PostSlug, TITLE_VARIANTS } from "@/lib/blog/clusters";
import { pickTitleVariant } from "@/lib/blog/titleVariants";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

/**
 * Build a Next.js `Metadata` object from a `BlogPostMeta` registry
 * entry. Centralised so the page's `generateMetadata` and any future
 * surfaces (Open Graph debuggers, social previews, RSS feed) stay
 * aligned with the same title/description/canonical/og/twitter shape.
 *
 * Adding a new blog post is a single-file change: add a row to
 * `BLOG_POSTS` in `app/blog/_posts.ts` and the sitemap, the JSON-LD
 * schema, the page metadata, and the RelatedGuides block all pick
 * it up automatically.
 *
 * Title / description (Task 5 of the SEO playbook):
 *   - If `TITLE_VARIANTS[slug]` is registered, the most specific
 *     variant (highest score) is used for both `title` and the OG /
 *     Twitter mirrors. Specificity = longest title up to 60 chars,
 *     bonus for containing a number or a concrete timeframe.
 *   - Otherwise, falls back to the registry entry's title/description.
 */
export function buildPostMetadata(
  post: BlogPostMeta,
  faqCount: number = 0,
): Metadata {
  const postUrl = `${SITE_URL}/blog/${post.id}`;
  const author = post.author ?? "CalStory Team";

  /* Title / description — prefer the most specific variant if
   * registered for this post. The cast is safe because
   * `TITLE_VARIANTS` is keyed by `PostSlug` (a string literal union)
   * and every post registered in `BLOG_POSTS` is one of those
   * literals. If you add a new slug to `BLOG_POSTS` you must also
   * extend the `PostSlug` union in clusters.ts — the TS error
   * here is the contract. */
  const variants = TITLE_VARIANTS[post.id as PostSlug];
  const variant = variants ? pickTitleVariant(post.id as PostSlug) : null;
  const title = variant?.title ?? post.title;
  const description = variant?.description ?? post.description;

  return {
    /* `title` is appended with the global "%s | CalStory" template
     * defined in app/layout.tsx, so the final tab title reads
     * "<title> | CalStory". */
    title,
    description,
    alternates: { canonical: `/blog/${post.id}` },
    authors: [{ name: author }],
    openGraph: {
      type: "article",
      title,
      description,
      url: postUrl,
      siteName: "CalStory",
      locale: "en_US",
      publishedTime: post.publishedTime,
      modifiedTime: post.modifiedTime,
      authors: [author],
      ...(post.imagePath
        ? {
            images: [
              {
                url: `${SITE_URL}${post.imagePath}`,
                width: 1200,
                height: 630,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(post.imagePath ? { images: [`${SITE_URL}${post.imagePath}`] } : {}),
    },
    /* `faqCount` is reserved for future use: when Google sees an
     * article + a rendered FAQ block, surfacing FAQ rich results
     * depends on consistent matching between visible HTML and the
     * FAQPage JSON-LD `mainEntity` count. The wiring is here so a
     * post author can add a build-time assertion. */
    other: {
      "x:faq-count": String(faqCount),
    },
  };
}

/**
 * Convenience: lookup-then-build. Returns `null` if the post doesn't
 * exist, so the caller can `notFound()` cleanly.
 */
export function postMetadataFor(
  id: string,
  faqCount: number = 0,
): Metadata | null {
  const post = getBlogPost(id);
  if (!post) return null;
  return buildPostMetadata(post, faqCount);
}
