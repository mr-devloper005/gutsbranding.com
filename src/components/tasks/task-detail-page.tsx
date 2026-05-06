import { ContentImage } from "@/components/shared/content-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Globe, Phone, Tag, Mail, FileText, Bookmark, Building2, Sparkles, Download } from "lucide-react";
import { NavbarShell } from "@/components/shared/navbar-shell";
import { Footer } from "@/components/shared/footer";
import { TaskPostCard } from "@/components/shared/task-post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildPostUrl, fetchTaskPostBySlug, fetchTaskPosts } from "@/lib/task-data";
import { SITE_CONFIG, getTaskConfig, type TaskKey } from "@/lib/site-config";
import type { SitePost } from "@/lib/site-connector";
import { TaskImageCarousel } from "@/components/tasks/task-image-carousel";
import { cn } from "@/lib/utils";
import { ArticleComments } from "@/components/tasks/article-comments";
import { SchemaJsonLd } from "@/components/seo/schema-jsonld";
import { RichContent, formatRichHtml } from "@/components/shared/rich-content";
import { getFactoryState } from "@/design/factory/get-factory-state";
import { getProductKind } from "@/design/factory/get-product-kind";
import { DirectoryTaskDetailPage } from "@/design/products/directory/task-detail-page";
import { TASK_DETAIL_PAGE_OVERRIDE_ENABLED, TaskDetailPageOverride } from "@/overrides/task-detail-page";

type PostContent = {
  category?: string;
  location?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  description?: string;
  body?: string;
  excerpt?: string;
  author?: string;
  highlights?: string[];
  logo?: string;
  images?: string[];
  latitude?: number | string;
  longitude?: number | string;
};

const isValidImageUrl = (value?: string | null) =>
  typeof value === "string" && (value.startsWith("/") || /^https?:\/\//i.test(value));

const absoluteUrl = (value?: string | null) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith("/")) return null;
  return `${SITE_CONFIG.baseUrl.replace(/\/$/, "")}${value}`;
};

const getContent = (post: SitePost): PostContent => {
  const content = post.content && typeof post.content === "object" ? post.content : {};
  return content as PostContent;
};

const formatArticleHtml = (content: PostContent, post: SitePost) => {
  const raw =
    (typeof content.body === "string" && content.body.trim()) ||
    (typeof content.description === "string" && content.description.trim()) ||
    (typeof post.summary === "string" && post.summary.trim()) ||
    "";

  return formatRichHtml(raw, "Details coming soon.");
};

const getImageUrls = (post: SitePost, content: PostContent) => {
  const media = Array.isArray(post.media) ? post.media : [];
  const mediaImages = media
    .map((item) => item?.url)
    .filter((url): url is string => isValidImageUrl(url));
  const contentImages = Array.isArray(content.images)
    ? content.images.filter((url): url is string => isValidImageUrl(url))
    : [];
  const merged = [...mediaImages, ...contentImages];
  if (merged.length) return merged;
  if (isValidImageUrl(content.logo)) return [content.logo as string];
  return ["/placeholder.svg?height=900&width=1400"];
};

const toNumber = (value?: number | string) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const buildMapEmbedUrl = (
  latitude?: number | string,
  longitude?: number | string,
  address?: string
) => {
  const lat = toNumber(latitude);
  const lon = toNumber(longitude);
  const normalizedAddress = typeof address === "string" ? address.trim() : "";
  const googleMapsEmbedApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();

  if (googleMapsEmbedApiKey) {
    const query = lat !== null && lon !== null ? `${lat},${lon}` : normalizedAddress;
    if (!query) return null;
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
      googleMapsEmbedApiKey
    )}&q=${encodeURIComponent(query)}`;
  }

  if (lat !== null && lon !== null) {
    const delta = 0.01;
    const left = lon - delta;
    const right = lon + delta;
    const bottom = lat - delta;
    const top = lat + delta;
    const bbox = `${left},${bottom},${right},${top}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox
    )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}`;
  }

  if (normalizedAddress) {
    return `https://www.google.com/maps?q=${encodeURIComponent(normalizedAddress)}&output=embed`;
  }

  return null;
};

export async function TaskDetailPage({ task, slug }: { task: TaskKey; slug: string }) {
  if (TASK_DETAIL_PAGE_OVERRIDE_ENABLED) {
    return await TaskDetailPageOverride({ task, slug });
  }

  const taskConfig = getTaskConfig(task);
  let post: SitePost | null = null;
  try {
    post = await fetchTaskPostBySlug(task, slug);
  } catch (error) {
    console.warn("Failed to load post detail", error);
  }

  if (!post) {
    notFound();
  }

  const content = getContent(post);
  const isClassified = task === "classified";
  const isArticle = task === "article";
  const isPdf = task === "pdf";
  const category = content.category || post.tags?.[0] || taskConfig?.label || task;
  const description = content.description || post.summary || "Details coming soon.";
  const descriptionHtml = !isArticle ? formatRichHtml(description, "Details coming soon.") : "";
  const articleHtml = isArticle ? formatArticleHtml(content, post) : "";
  const articleSummary =
    post.summary ||
    (typeof content.excerpt === "string" ? content.excerpt : "") ||
    "";
  const articleAuthor =
    (typeof content.author === "string" && content.author.trim()) ||
    post.authorName ||
    "Editorial Team";
  const postTags = Array.isArray(post.tags) ? post.tags.filter((tag) => typeof tag === "string") : [];
  const location = content.address || content.location;
  const images = getImageUrls(post, content);
  const mapEmbedUrl = buildMapEmbedUrl(content.latitude, content.longitude, location);
  const isBookmark = task === "sbm" || task === "social";
  const hideSidebar = isClassified || isArticle || isPdf || task === "image" || isBookmark;
  const related = (await fetchTaskPosts(task, 6))
    .filter((item) => item.slug !== post.slug)
    .filter((item) => {
      if (!content.category) return true;
      const itemContent = getContent(item);
      return itemContent.category === content.category;
    })
    .slice(0, 3);
  const articleUrl = `${SITE_CONFIG.baseUrl.replace(/\/$/, "")}${taskConfig?.route || "/articles"}/${post.slug}`;
  const articleImage = absoluteUrl(images[0]) || absoluteUrl(SITE_CONFIG.defaultOgImage);
  const articleSchema = isArticle
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: articleSummary || description,
        image: articleImage ? [articleImage] : [],
        author: {
          "@type": "Person",
          name: articleAuthor,
        },
        datePublished: post.publishedAt || undefined,
        dateModified: post.publishedAt || undefined,
        articleSection: category,
        keywords: postTags.join(", "),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": articleUrl,
        },
      }
    : null;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_CONFIG.baseUrl.replace(/\/$/, ""),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: taskConfig?.label || "Posts",
        item: `${SITE_CONFIG.baseUrl.replace(/\/$/, "")}${taskConfig?.route || "/"}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_CONFIG.baseUrl.replace(/\/$/, "")}${taskConfig?.route || "/posts"}/${post.slug}`,
      },
    ],
  };
  const schemaPayload = articleSchema ? [articleSchema, breadcrumbSchema] : breadcrumbSchema;
  const { recipe } = getFactoryState();
  const productKind = getProductKind(recipe);

  if (productKind === "directory" && (task === "listing" || task === "classified" || task === "profile")) {
    return (
      <div className="min-h-screen bg-[#f8fbff]">
        <NavbarShell />
        <DirectoryTaskDetailPage
          task={task}
          taskLabel={taskConfig?.label || task}
          taskRoute={taskConfig?.route || "/"}
          post={post}
          description={description}
          category={category}
          images={images}
          mapEmbedUrl={mapEmbedUrl}
          related={related}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavbarShell />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SchemaJsonLd data={schemaPayload} />
        <Link
          href={taskConfig?.route || "/"}
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to {taskConfig?.label || "posts"}
        </Link>

        <div
          className={cn(
            "grid gap-10",
            hideSidebar ? "lg:grid-cols-1" : "lg:grid-cols-[2fr_1fr]"
          )}
        >
          <div className={cn(isClassified ? "space-y-8" : "")}>
            {isArticle ? (
              <div className="relative">
                {/* Hero Section with Featured Image */}
                {images[0] ? (
                  <div className="relative aspect-[21/9] w-full overflow-hidden">
                    <ContentImage
                      src={images[0]}
                      alt={`${post.title} featured image`}
                      fill
                      className="object-cover"
                      intrinsicWidth={1920}
                      intrinsicHeight={823}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="mx-auto max-w-4xl">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                            <Tag className="h-3 w-3" />
                            {category}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                            By {articleAuthor}
                          </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white mb-4">
                          {post.title}
                        </h1>
                        {postTags.length ? (
                          <div className="flex flex-wrap gap-2">
                            {postTags.map((tag) => (
                              <span key={tag} className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-700 aspect-[21/9] w-full flex items-center justify-center">
                    <div className="mx-auto max-w-4xl text-center px-8">
                      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                          <Tag className="h-3 w-3" />
                          {category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                          By {articleAuthor}
                        </span>
                      </div>
                      <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white mb-6">
                        {post.title}
                      </h1>
                      {postTags.length ? (
                        <div className="flex flex-wrap justify-center gap-2">
                          {postTags.map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div className="relative -mt-16">
                  <div className="mx-auto max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12">
                      {articleSummary ? (
                        <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-lg leading-7 text-slate-700 italic">
                            {articleSummary}
                          </p>
                        </div>
                      ) : null}
                      
                      <div className="prose prose-lg max-w-none leading-8 prose-p:my-6 prose-h2:my-8 prose-h3:my-6 prose-ul:my-6">
                        <RichContent html={articleHtml} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-12">
                  <div className="mx-auto max-w-4xl">
                    <ArticleComments slug={post.slug} />
                  </div>
                </div>
              </div>
            ) : null}

            {!isArticle ? (
              <>
                {isPdf ? (
                  <div className="mx-auto w-full max-w-4xl">
                    <div className="group relative">
                      {/* Card with 3D flip effect */}
                      <div className="relative preserve-3d transition-transform duration-700 group-hover:rotate-y-180">
                        {/* Front of card */}
                        <div className="absolute inset-0 backface-hidden">
                          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-1 shadow-2xl">
                            <div className="bg-slate-950 rounded-3xl p-8 h-full">
                              <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                                  <FileText className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Document Archive</p>
                                  <h2 className="text-3xl font-bold text-white mb-2">Digital Library</h2>
                                  <p className="text-slate-400">Professional document management system</p>
                                </div>
                                <div className="flex gap-4 text-slate-500 text-sm">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    <span>PDF Ready</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                    <span>Metadata</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Back of card */}
                        <div className="absolute inset-0 rotate-y-180 backface-hidden">
                          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 h-full">
                            <div className="space-y-6">
                              <h3 className="text-2xl font-bold text-white">Document Features</h3>
                              <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <FileText className="h-3 w-3 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold">Smart Organization</p>
                                    <p className="text-blue-100 text-sm">Advanced metadata and categorization</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Download className="h-3 w-3 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold">Quick Download</p>
                                    <p className="text-blue-100 text-sm">One-click access to all documents</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isBookmark ? (
                  <div className="mx-auto w-full max-w-4xl">
                    <div className="relative overflow-hidden">
                      {/* Animated border card */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-3xl animate-pulse" />
                      <div className="relative bg-slate-900 rounded-3xl p-1">
                        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 rounded-3xl p-8">
                          <div className="text-center space-y-6">
                            <div className="relative inline-block">
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl blur-xl opacity-50 animate-pulse" />
                              <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl">
                                <Bookmark className="h-8 w-8 text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">Curated Links</p>
                              <h2 className="text-3xl font-bold text-white mb-2">Social Hub</h2>
                              <p className="text-slate-400">Intelligent bookmark management</p>
                            </div>
                            <div className="flex justify-center gap-6">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-400">∞</div>
                                <div className="text-xs text-slate-500">References</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-400">⚡</div>
                                <div className="text-xs text-slate-500">Quick Access</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-teal-400">🔗</div>
                                <div className="text-xs text-slate-500">Connected</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {!isBookmark ? (
                  <div className={cn(isClassified ? "w-full" : "")}>
                    <TaskImageCarousel images={images} />
                  </div>
                ) : null}

                <div className={cn(isClassified ? "mx-auto w-full max-w-4xl" : "mt-6")}>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="inline-flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {category}
                    </Badge>
                    {location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {location}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-4 text-3xl font-semibold text-foreground">{post.title}</h1>
                  <RichContent html={descriptionHtml} className="mt-3 max-w-3xl" />
                </div>
              </>
            ) : null}

            {isClassified ? (
              <div className="mx-auto w-full max-w-4xl">
                {/* Neon-style business card */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-3xl blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-slate-900 rounded-3xl border border-orange-500/30 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-orange-500/10 to-transparent" />
                    
                    <div className="relative p-8">
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:rotate-12 transition-transform duration-300">
                            <Building2 className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-orange-400 uppercase tracking-widest">Business Hub</p>
                            <h2 className="text-3xl font-bold text-white">Contact Portal</h2>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {content.website && (
                          <div className="group relative bg-slate-800/50 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Globe className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Website</p>
                                <a
                                  href={content.website}
                                  className="text-white font-medium hover:text-orange-400 transition-colors duration-300 break-all"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {content.website}
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {content.phone && (
                          <div className="group relative bg-slate-800/50 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Phone className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Phone</p>
                                <p className="text-white font-medium">{content.phone}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {content.email && (
                          <div className="group relative bg-slate-800/50 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-red-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Mail className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Email</p>
                                <a
                                  href={`mailto:${content.email}`}
                                  className="text-white font-medium hover:text-orange-400 transition-colors duration-300 break-all"
                                >
                                  {content.email}
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {location && (
                          <div className="group relative bg-slate-800/50 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <MapPin className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Location</p>
                                <p className="text-white font-medium">{location}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {content.highlights?.length && !isArticle ? (
              <div className={cn("mt-8", isClassified ? "mx-auto w-full max-w-4xl" : "")}>
                {/* Holographic-style highlights card */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 animate-pulse" />
                  <div className="relative bg-slate-900 rounded-3xl border border-purple-500/30 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
                    
                    <div className="relative p-8">
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:rotate-180 transition-transform duration-500">
                            <Sparkles className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Feature Matrix</p>
                            <h2 className="text-3xl font-bold text-white">Core Highlights</h2>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid gap-4">
                        {content.highlights.map((item, index) => (
                          <div key={item} className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                              <div className="flex items-start gap-4">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                    <span className="text-white font-bold">{index + 1}</span>
                                  </div>
                                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-medium leading-relaxed group-hover:text-cyan-400 transition-colors duration-300">{item}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-8 flex justify-center">
                        <div className="flex gap-8 text-center">
                          <div className="relative">
                            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
                            <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping" />
                          </div>
                          <div className="relative">
                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-75" />
                            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping delay-75" />
                          </div>
                          <div className="relative">
                            <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse delay-150" />
                            <div className="absolute inset-0 bg-pink-500 rounded-full animate-ping delay-150" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {isClassified && mapEmbedUrl ? (
              <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">Location map</p>
                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                  <iframe
                    title="Business location map"
                    src={mapEmbedUrl}
                    className="h-56 w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            ) : null}

          </div>

          {!hideSidebar ? (
            <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground">Listing details</h2>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {content.website && (
                    <div className="flex items-start gap-2">
                      <Globe className="mt-0.5 h-4 w-4" />
                      <a
                        href={content.website}
                        className="break-all text-foreground hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {content.website}
                      </a>
                    </div>
                  )}
                  {content.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="mt-0.5 h-4 w-4" />
                      <span>{content.phone}</span>
                    </div>
                  )}
                  {content.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="mt-0.5 h-4 w-4" />
                      <a
                        href={`mailto:${content.email}`}
                        className="break-all text-foreground hover:underline"
                      >
                        {content.email}
                      </a>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
              {content.website ? (
                <Button className="mt-5 w-full" asChild>
                  <a href={content.website} target="_blank" rel="noreferrer">
                    Visit Website
                  </a>
                </Button>
              ) : null}
            </div>

            {mapEmbedUrl ? (
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">Location map</p>
                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                  <iframe
                    title="Business location map"
                    src={mapEmbedUrl}
                    className="h-56 w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            ) : null}

          </aside>
          ) : null}
        </div>

        <section className="mt-12">
          {related.length ? (
            <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                More in {category}
              </h2>
              {taskConfig?.route && (
                <Link
                  href={taskConfig.route}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  View all
                </Link>
              )}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <TaskPostCard
                  key={item.id}
                  post={item}
                  href={buildPostUrl(task, item.slug)}
                />
              ))}
            </div>
            </>
          ) : null}
          <nav className="mt-6 rounded-2xl border border-border bg-card/60 p-4">
            <p className="text-sm font-semibold text-foreground">Related links</p>
            <ul className="mt-2 space-y-2 text-sm">
              {related.map((item) => (
                <li key={`link-${item.id}`}>
                  <Link
                    href={buildPostUrl(task, item.slug)}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
              {taskConfig?.route ? (
                <li>
                  <Link
                    href={taskConfig.route}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Browse all {taskConfig.label}
                  </Link>
                </li>
              ) : null}
              <li>
                <Link
                  href={`/search?q=${encodeURIComponent(category)}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Search more in {category}
                </Link>
              </li>
            </ul>
          </nav>
        </section>
      </main>
      <Footer />
    </div>
  );
}
