"use client";

import { useMemo } from "react";
import Link from "next/link";
import { TaskPostCard } from "@/components/shared/task-post-card";
import { buildPostUrl } from "@/lib/task-data";
import { normalizeCategory, isValidCategory } from "@/lib/categories";
import type { TaskKey } from "@/lib/site-config";
import type { SitePost } from "@/lib/site-connector";
import { getLocalPostsForTask } from "@/lib/local-posts";

type Props = {
  task: TaskKey;
  initialPosts: SitePost[];
  category?: string;
};

export function TaskListClient({ task, initialPosts, category }: Props) {
  const localPosts = getLocalPostsForTask(task);

  const merged = useMemo(() => {
    const bySlug = new Set<string>();
    const combined: Array<SitePost & { localOnly?: boolean; task?: TaskKey }> = [];

    localPosts.forEach((post) => {
      if (post.slug) {
        bySlug.add(post.slug);
      }
      combined.push(post);
    });

    initialPosts.forEach((post) => {
      if (post.slug && bySlug.has(post.slug)) return;
      combined.push(post);
    });

    const normalizedCategory = category ? normalizeCategory(category) : "all";
    if (normalizedCategory === "all") {
      return combined.filter((post) => {
        const content = post.content && typeof post.content === "object" ? post.content : {};
        const value = typeof (content as any).category === "string" ? (content as any).category : "";
        return !value || isValidCategory(value);
      });
    }

    return combined.filter((post) => {
      const content = post.content && typeof post.content === "object" ? post.content : {};
      const value =
        typeof (content as any).category === "string"
          ? normalizeCategory((content as any).category)
          : "";
      return value === normalizedCategory;
    });
  }, [category, initialPosts, localPosts]);

  if (!merged.length) {
    const fallbackArticles = [
      {
        id: "sample-article-1",
        title: "City Budget Hearings Reveal a Hidden Transit Funding Gap",
        summary:
          "A close read of committee transcripts shows why daily riders may face service cuts unless emergency funding is approved.",
        href: "/articles/city-budget-hearings-reveal-a-hidden-transit-funding-gap",
      },
      {
        id: "sample-article-2",
        title: "What the New Housing Ordinance Means for First-Time Renters",
        summary:
          "We break down rent cap language, enforcement timelines, and what tenants can expect over the next six months.",
        href: "/articles/what-the-new-housing-ordinance-means-for-first-time-renters",
      },
      {
        id: "sample-article-3",
        title: "Inside the Local Water Plan: Costs, Risks, and Climate Tradeoffs",
        summary:
          "Experts explain where infrastructure upgrades will happen first and who is likely to bear the long-term cost.",
        href: "/articles/inside-the-local-water-plan-costs-risks-and-climate-tradeoffs",
      },
    ];

    if (task === "article") {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fallbackArticles.map((article) => (
            <Link
              key={article.id}
              href={article.href}
              className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Sample story</p>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{article.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{article.summary}</p>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
        No posts yet for this section.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {merged.map((post) => {
        const localOnly = (post as any).localOnly;
        const href = localOnly
          ? `/local/${task}/${post.slug}`
          : buildPostUrl(task, post.slug);
        return <TaskPostCard key={post.id} post={post} href={href} taskKey={task} />;
      })}
    </div>
  );
}
