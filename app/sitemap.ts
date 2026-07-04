import type { MetadataRoute } from "next";
import { listBlogPosts } from "@/app/blog/_posts";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

/**
 * Sitemap — Next.js MetadataRoute.Sitemap entries.
 *
 * Google uses this to discover every important public route and the
 * `image` entries also feed the Google Images tab. Once deployed,
 * submit `https://<site>/sitemap.xml` in Google Search Console under
 * Indexing → Sitemaps.
 *
 * Auto-update behaviour (Task 4 + Task 5 of the SEO playbook):
 *   - Static routes (landing, about, blog, privacy, terms) are
 *     hard-coded.
 *   - Blog posts are pulled from `BLOG_POSTS` at build time, so
 *     adding a new post to `app/blog/_posts.ts` automatically
 *     extends the sitemap. No second-place update needed.
 *   - Each entry's `lastModified` is the post's `modifiedTime` for
 *     blog posts and the file-system mtime for static routes.
 *   - `images` is `string[]` (URLs only); the per-image metadata
 *     shape lives in Google's sitemap-extensions schema, not in
 *     the Next.js MetadataRoute type. JSON-LD `image` on the
 *     BlogPosting payload carries the full object form.
 *
 * Indexable public routes (auth/onboarding/app routes are `noindex`
 * and intentionally excluded):
 *   /                       — Landing
 *   /about                  — About
 *   /blog                   — Blog index
 *   /blog/{slug}            — Individual posts
 *   /privacy                — Privacy policy
 *   /terms                  — Terms of service
 */

const { stat } =
  require("node:fs/promises") as typeof import("node:fs/promises");

/** Best-effort mtime lookup; falls back to "now" when the file is missing. */
async function mtimeOf(relPath: string): Promise<Date> {
  try {
    const stats = await stat(relPath);
    return stats.mtime;
  } catch {
    return new Date();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [landingMtime, aboutMtime, blogMtime, privacyMtime, termsMtime] =
    await Promise.all([
      mtimeOf("./app/page.tsx"),
      mtimeOf("./app/about/page.tsx"),
      mtimeOf("./app/blog/page.tsx"),
      mtimeOf("./app/privacy/page.tsx"),
      mtimeOf("./app/terms/page.tsx"),
    ]);

  // Shared OG image reused as the entry-level image so Google Images
  // has a thumbnail for every route.
  const ogImageUrl = `${SITE_URL}/og.svg`;

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: landingMtime,
      changeFrequency: "weekly",
      priority: 1.0,
      images: [ogImageUrl],
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: aboutMtime,
      changeFrequency: "monthly",
      priority: 0.6,
      images: [ogImageUrl],
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: blogMtime,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [ogImageUrl],
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: privacyMtime,
      changeFrequency: "yearly",
      priority: 0.3,
      images: [ogImageUrl],
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: termsMtime,
      changeFrequency: "yearly",
      priority: 0.3,
      images: [ogImageUrl],
    },
  ];

  // Derive blog-post entries from the central post registry. This
  // means adding a new post to `BLOG_POSTS` automatically extends
  // the sitemap with the correct URL, modifiedTime, and image — no
  // second-place update needed.
  const blogEntries: MetadataRoute.Sitemap = listBlogPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.id}`,
    lastModified: new Date(p.modifiedTime),
    changeFrequency: "monthly",
    priority: 0.8,
    images: [ogImageUrl],
  }));

  return [...staticEntries, ...blogEntries];
}
