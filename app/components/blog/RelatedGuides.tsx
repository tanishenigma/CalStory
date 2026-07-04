"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import {
  CLUSTERS,
  clusterForPost,
  type PostSlug,
  type CTAFeature,
  BLOG_CTA,
  CTA_PATH,
  CTA_COPY,
} from "@/lib/blog/clusters";
import { getBlogPost } from "@/app/blog/_posts";

/**
 * RelatedGuides — auto-rendered "related guides" block at the bottom
 * of every blog post. Reads the cluster config from `lib/blog/clusters`
 * and pulls titles from the central `BLOG_POSTS` registry, so a new
 * post is automatically linked from its siblings as soon as it's
 * added to `_posts.ts` + `clusters.ts` — no manual cross-linking.
 *
 * Three sections (in order):
 *   1. Pillar — the cluster's main page (one entry).
 *   2. Sibling articles — other articles in the same cluster.
 *   3. Closing CTA — the single most relevant CalStory feature for
 *      the article's topic, with a direct link.
 */
export function RelatedGuides({ slug }: { slug: PostSlug }) {
  const cluster = clusterForPost(slug);
  const cta: CTAFeature = BLOG_CTA[slug] ?? "generic";

  if (!cluster) {
    /* No cluster config — still render the closing CTA so every
     * post has a single conversion lever, even if it hasn't been
     * slotted into a cluster yet. */
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mt-16 pt-10 border-t border-border/40"
        aria-label="Try CalStory">
        <CTABlock feature={cta} />
      </motion.section>
    );
  }

  const siblings = (cluster.siblingLinks ?? cluster.articles).filter(
    (s) => s !== slug,
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mt-16 pt-10 border-t border-border/40 space-y-10"
      aria-label="Related guides">
      {/* Pillar link — narrow the type to a non-null key with the
       * local helper. The helper walks the in-memory CLUSTERS map
       * and returns the first key whose value is identity-equal to
       * the cluster we already have. */}
      <PillarLink clusterKey={clusterKeyFor(cluster)!} />

      {/* Sibling articles */}
      {siblings.length > 0 && (
        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">
            More in {cluster.pillarLabel}
          </h3>
          <ul className="space-y-3 not-prose">
            {siblings.map((s) => {
              const post = getBlogPost(s);
              if (!post) return null;
              return (
                <li key={s}>
                  <Link
                    href={`/blog/${s}`}
                    className="group flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:border-border hover:bg-foreground/[0.02] transition-colors">
                    <BookOpen
                      size={16}
                      className="text-muted-foreground mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {post.title}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {post.description}
                      </div>
                    </div>
                    <ArrowUpRight
                      size={14}
                      className="text-muted-foreground mt-1 shrink-0 group-hover:text-foreground transition-colors"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Closing CTA — single feature, not generic */}
      <CTABlock feature={cta} />
    </motion.section>
  );
}

function PillarLink({ clusterKey }: { clusterKey: keyof typeof CLUSTERS }) {
  const cluster = CLUSTERS[clusterKey];
  return (
    <Link
      href={`/${cluster.pillar}`}
      className="group block p-5 rounded-2xl border border-border/50 hover:border-border bg-foreground/[0.02] transition-colors">
      <div className="text-[10px] font-bold tracking-widest uppercase text-primary mb-1.5">
        Cluster pillar
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-foreground text-lg">
            {cluster.pillarLabel}
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed">
            {cluster.pillarDescription}
          </div>
        </div>
        <ArrowUpRight
          size={18}
          className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors"
        />
      </div>
    </Link>
  );
}

function CTABlock({ feature }: { feature: CTAFeature }) {
  const copy = CTA_COPY[feature];
  const path = CTA_PATH[feature];
  return (
    <Link
      href={path}
      className="group block p-5 rounded-2xl border border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.07] transition-colors">
      <div className="text-[10px] font-bold tracking-widest uppercase text-primary mb-1.5">
        {copy.eyebrow}
      </div>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground leading-relaxed">{copy.body}</p>
        <ArrowUpRight
          size={18}
          className="text-primary shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
        />
      </div>
    </Link>
  );
}

/* Find the key in CLUSTERS whose `.articles` includes the given
 * post. Used by PillarLink so we can pass a typed key. */
function clusterKeyFor(cluster: {
  pillar: string;
  articles: PostSlug[];
}): keyof typeof CLUSTERS | null {
  for (const [k, c] of Object.entries(CLUSTERS)) {
    if (c === cluster) return k as keyof typeof CLUSTERS;
  }
  return null;
}
