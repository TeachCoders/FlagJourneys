import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, User, ArrowLeft, ChevronRight, Sparkles, MapPin, PhoneCall } from "lucide-react";
import Link from "next/link";
import BlogCard from "@/feature/blog/components/BlogCard";
import BlogSidebar from "@/feature/blog/components/BlogSidebar";
import RichContent from "@/components/shared/RichContent";
import JsonLd from "@/components/shared/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/jsonLd";
import { fetchBySlug, SERVER_API_BASE } from "@/feature/destinations/api/public-server";
import { stripHtml, absoluteUrl } from "@/lib/utils";
import type { BlogPost } from "@/feature/blog/type";
import { FallbackImage } from "@/components/shared/FallbackImage";
import { QuoteModal } from "@/components/shared/QuoteModal";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBySlug<BlogPost>("/blog/by-slug", slug);
  if (!post) return { title: "Blog Post Not Found | Flag Journeys" };
  const seoDescription = stripHtml(post.seoDescription || post.moreDescription || "").slice(0, 160);
  const title = post.seoTitle || post.title;
  const canonical = post.canonical || `/blog/${post.slug}`;
  return {
    title,
    description: seoDescription || undefined,
    keywords: post.seoKeyword || undefined,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description: seoDescription || undefined,
      url: canonical,
      publishedTime: post.publishedAt || undefined,
      authors: post.author ? [post.author] : undefined,
      images: absoluteUrl(post.thumbImg)
        ? [{ url: absoluteUrl(post.thumbImg)!, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: seoDescription || undefined,
      images: absoluteUrl(post.thumbImg) ? [absoluteUrl(post.thumbImg)!] : undefined,
    },
  };
}

async function fetchRelated(category?: string, excludeId?: number): Promise<BlogPost[]> {
  try {
    const url = `${SERVER_API_BASE}/blog?limit=3&isActive=true${category ? `&category=${encodeURIComponent(category)}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data || []).filter((p: BlogPost) => p.id !== excludeId).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchBySlug<BlogPost>("/blog/by-slug", slug);
  if (!post) return notFound();

  const related = await fetchRelated(post.category, post.id);
  const tags = (post.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const articleSchemaData = articleSchema({
    title: post.h1Title || post.title,
    description: post.seoDescription || post.moreDescription || undefined,
    image: post.thumbImg || undefined,
    datePublished: post.publishedAt || undefined,
    author: post.author || undefined,
    url: `/blog/${post.slug}`,
  });
  const breadcrumbData = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  return (
    <div className="bg-[#f8f8f8] min-h-screen pb-20 font-sans">
      <JsonLd data={articleSchemaData} />
      <JsonLd data={breadcrumbData} />

      {/* ===== HERO SECTION ===== */}
      <section className="relative h-[480px] md:h-[560px] overflow-hidden bg-slate-900 flex items-center justify-center">
        <FallbackImage
          src={post.thumbImg}
          alt={post.title}
          fill
          priority
          className="object-cover object-center"
          theme="dark"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 text-center py-8">
          {post.category && (
            <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#D4561A] rounded-full mb-5 shadow-lg">
              {post.category}
            </span>
          )}
          
          {/* Always Guarantee H1 for Search Bots */}
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-2xl max-w-5xl mx-auto">
            {post.h1Title || post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-white/95 text-[15px] font-bold drop-shadow-md">
            {post.author && (
              <span className="inline-flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#2E8B8B] flex items-center justify-center text-white shadow-inner">
                  <User size={14} />
                </span>
                {post.author}
              </span>
            )}
            {post.publishedAt && (
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} className="text-white/70" /> {post.publishedAt}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ===== BREADCRUMB (BELOW HERO) ===== */}
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-3.5 flex items-center gap-2 text-sm text-slate-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link href="/" className="hover:text-[#2E8B8B] transition-colors shrink-0">
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
          <Link href="/blog" className="hover:text-[#2E8B8B] transition-colors shrink-0">
            Blog
          </Link>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
          <span className="text-[#1C1C1C] font-semibold truncate max-w-[280px] sm:max-w-[500px]">
            {post.title}
          </span>
        </div>
      </nav>

      {/* ===== CONTENT + SIDEBAR ===== */}
      <section className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-12 md:py-20 relative z-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px] lg:gap-16">
          <article className="min-w-0 bg-white rounded-3xl p-8 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 prose prose-lg prose-slate max-w-none">
            {post.seoDescription && <RichContent html={post.seoDescription} />}
            {post.moreDescription && (
              <div className="mt-12">
                <RichContent html={post.moreDescription} />
              </div>
            )}

            {/* ===== END OF ARTICLE CONVERSION WIDGET ===== */}
            <div className="not-prose mt-14 pt-10 border-t border-slate-200/80">
              <div className="bg-gradient-to-r from-[#2E8B8B]/10 via-orange-50 to-[#2E8B8B]/10 border border-[#2E8B8B]/20 rounded-3xl p-8 text-center relative overflow-hidden">
                <span className="accent-label inline-flex items-center gap-1.5 mb-3">
                  <Sparkles size={13} /> Tailor-Made Tour Packages
                </span>
                <h3 className="font-heading text-2xl font-extrabold text-[#1C1C1C]">
                  Want a Customized Travel Plan for Your Trip?
                </h3>
                <p className="mt-2 text-slate-600 text-sm md:text-base max-w-xl mx-auto">
                  Our travel experts design 100% personalized itineraries with premium cab transfers, verified hotel stays, and instant booking quotes.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  <QuoteModal>
                    <button
                      type="button"
                      className="btn-primary px-7 py-3.5 text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4561A]/20"
                    >
                      <Sparkles size={16} />
                      <span>Plan My Trip Now</span>
                    </button>
                  </QuoteModal>
                  <Link
                    href="/tour-packages"
                    className="bg-white border border-slate-300 text-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <MapPin size={16} />
                    <span>View Popular Packages</span>
                  </Link>
                </div>
              </div>
            </div>
          </article>

          <div className="mt-16 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <BlogSidebar excludeId={post.id} tags={tags} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== RELATED POSTS ===== */}
      {related.length > 0 && (
        <section className="bg-white border-t border-slate-200/60 py-20">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
            <div className="text-center mb-12">
              <span className="text-[#D4561A] font-black tracking-widest text-xs uppercase mb-3 block">More Reading</span>
              <h2 className="font-heading text-4xl font-extrabold text-[#1C1C1C]">Related Articles</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
