export interface BlogPostMeta {
  /**
   * Stable, unique identifier for the post. This is the value the
   * `/blog/[id]` dynamic segment resolves against — the URL is built
   * from this, so it must not change once a post has shipped (it would
   * break inbound links and the sitemap). Keep it lowercase, dash-cased,
   * and short.
   */
  id: string;
  /**
   * Optional display slug for nicer-looking URLs. Currently equals `id`
   * for every post, but kept separate so a post can be renamed without
   * changing the route segment.
   */
  slug?: string;
  title: string;
  description: string;
  publishedTime: string;
  modifiedTime: string;
}

/**
 * Source of truth for blog posts. Routes under `/blog/[id]` resolve
 * metadata here via `generateMetadata`, so adding a new post is just
 * a new entry + a render step.
 */
export const BLOG_POSTS: Record<string, BlogPostMeta> = {
  "calorie-tracking-for-beginners": {
    id: "calorie-tracking-for-beginners",
    title: "Calorie Tracking for Beginners",
    description:
      "A practical 10-minute calorie tracking setup for beginners. Learn the three numbers that matter, the one you can ignore, and how to log in under 10 seconds.",
    publishedTime: "2026-06-10",
    modifiedTime: "2026-06-26",
  },
  "best-macro-calculator": {
    id: "best-macro-calculator",
    title: "The Best Macro Calculator for Lifters",
    description:
      "A no-BS macro calculator guide for lifters. The Mifflin-St Jeor equation, what to fix when you've been dieting too long, and the three macros that move the needle.",
    publishedTime: "2026-06-18",
    modifiedTime: "2026-06-26",
  },
};

export function getBlogPost(id: string): BlogPostMeta | undefined {
  return BLOG_POSTS[id];
}

export function listBlogPosts(): BlogPostMeta[] {
  return Object.values(BLOG_POSTS);
}
