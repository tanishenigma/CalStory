import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell } from "./BlogShell";
import { StructuredData } from "@/app/components/seo/StructuredData";
import { listBlogPosts } from "./_posts";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

export const metadata: Metadata = {
  // Falls under the "%s | CalStory" template — final tab title reads
  // "CalStory Blog | CalStory".
  title: "CalStory Blog",
  description:
    "Evidence-led guides on calorie tracking, TDEE, macro splits and training from the CalStory team. No bro-science, no affiliate links — just the math.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "CalStory Blog",
    description:
      "Practical guides on calorie tracking, TDEE, and training for lifters.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": `${SITE_URL}/blog#blog`,
  name: "CalStory Blog",
  url: `${SITE_URL}/blog`,
  description:
    "Practical guides on calorie tracking, TDEE, macro splits, and training.",
  inLanguage: "en-US",
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
};

export default function BlogIndexPage() {
  const posts = listBlogPosts();
  return (
    <>
      <StructuredData data={blogJsonLd} />
      <BlogShell
        title="CalStory Blog"
        intro="Practical, evidence-led guides on calorie tracking, TDEE, macro splits, and training. No bro-science, no supplement affiliate links — just the math and the method."
        datePublished="2026-06-01"
        dateModified="2026-06-26"
        readTime="Index">
        <ul className="space-y-8 not-prose">
          {posts.map((p) => (
            <li key={p.id} className="border-b border-border/40 pb-8">
              <Link href={`/blog/${p.id}`} className="block group">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors font-heading tracking-tight mb-2">
                  {p.title}
                </h2>
                <p className="text-muted-foreground">{p.description}</p>
                <span className="text-sm text-muted-foreground mt-2 inline-block">
                  Read the guide →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </BlogShell>
    </>
  );
}
