import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Search, ArrowRight, Sparkles, ChevronRight, Compass, MapPin } from "lucide-react";
import BlogCard from "@/feature/blog/components/BlogCard";
import JsonLd from "@/components/shared/JsonLd";
import { itemListSchema, breadcrumbSchema } from "@/lib/jsonLd";
import type { BlogPost } from "@/feature/blog/type";
import { SERVER_API_BASE } from "@/feature/destinations/api/public-server";
import { FallbackImage } from "@/components/shared/FallbackImage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Travel Blog — Guides, Itineraries and India Tour Tips | Flag Journeys",
  description:
    "Explore expert travel guides, holiday itineraries, budgeting tips, and hidden destination insights for India tours — curated by Flag Journeys.",
  alternates: { canonical: "/blog" },
  openGraph: {
title: "Travel Blog — Guides, Itineraries and India Tour Tips | Flag Journeys",
    description:
      "Explore expert travel guides, holiday itineraries, budgeting tips, and hidden destination insights for India tours — curated by Flag Journeys.",
    url: "/blog",
    type: "website",
  },
};

async function fetchPosts(search?: string): Promise<BlogPost[]> {
  try {
    const url = `${SERVER_API_BASE}/blog?limit=100&isActive=true${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

async function fetchCategories(): Promise<string[]> {
  try {
    const url = `${SERVER_API_BASE}/blog-category?limit=100&isActive=true`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data || []).map((c: { name: string }) => c.name);
  } catch {
    return [];
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const { search } = await searchParams;
  const searchTerm = Array.isArray(search) ? search[0] : search || "";
  const [posts, managedCategories] = await Promise.all([
    fetchPosts(searchTerm || undefined),
    fetchCategories(),
  ]);
  const postCategories = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];
  const categories = managedCategories.length > 0 ? managedCategories : postCategories;
  
  const listSchemaData = itemListSchema(
    posts.map((p) => ({ name: p.title, url: `/blog/${p.slug}` }))
  );
  
  const breadcrumbData = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Travel Blog", path: "/blog" },
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f8f8] font-sans">
      {posts.length > 0 && <JsonLd data={listSchemaData} />}
      <JsonLd data={breadcrumbData} />

      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative h-[480px] md:h-[560px] overflow-hidden bg-slate-900 flex items-center justify-center">
          <FallbackImage
            src="/destinationImage/image/agra-6.webp"
            alt="FlagJourney Travel Blog Background"
            fill
            priority
            className="object-cover object-center"
            theme="dark"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />
          
          <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 text-center py-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#D4561A] rounded-full mb-5 shadow-lg">
              <Sparkles size={14} className="text-white" /> Travel Guides & Inspiration
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-2xl max-w-4xl mx-auto">
              India Travel Guides, Itineraries & Expert Tips
            </h1>
            <p className="mt-4 text-white/90 font-medium max-w-2xl mx-auto text-base sm:text-lg leading-relaxed drop-shadow-md">
              Explore breathtaking destinations, handpicked itineraries, and insider tips curated by our travel experts.
            </p>

            {/* ===== HERO SEARCH ===== */}
            <div className="mt-8 max-w-xl mx-auto relative">
              <form action="/blog" method="GET" className="relative flex items-center bg-white rounded-2xl overflow-hidden shadow-2xl">
                <Search size={20} className="absolute left-5 text-slate-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchTerm}
                  placeholder="Search destination guides, travel tips..."
                  className="w-full bg-transparent py-4 pl-14 pr-32 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <button type="submit" className="absolute right-2 top-2 bottom-2 bg-[#D4561A] text-white px-5 rounded-xl text-sm font-bold shadow-md hover:bg-[#b84a16] transition-colors flex items-center gap-2">
                  Search
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ===== BREADCRUMB (BELOW HERO) ===== */}
        <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white shadow-sm">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-3.5 flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Link href="/" className="hover:text-[#2E8B8B] transition-colors shrink-0">
              Home
            </Link>
            <ChevronRight size={14} className="text-slate-300 shrink-0" />
            <span className="text-[#1C1C1C] font-semibold">Blog</span>
          </div>
        </nav>

        {/* ===== CATEGORY PILLS ===== */}
        {categories.length > 0 && (
          <div className="relative -mt-6 z-20 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
            <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-wrap items-center justify-center gap-2.5 max-w-5xl mx-auto">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2 hidden sm:block">Filter by:</span>
              {categories.map((c) => (
                <a
                  key={c}
                  href={`#${c.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-4 py-2 text-[13px] font-bold text-[#1C1C1C] bg-slate-100/80 hover:bg-[#2E8B8B] hover:text-white rounded-full transition-all duration-300 hover:shadow-md"
                >
                  {c}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ===== POSTS GRID ===== */}
        <section className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-16 md:py-24">
          {searchTerm && (
            <div className="flex items-center gap-4 mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-heading text-lg font-bold text-[#1C1C1C]">
                Search results for <span className="text-[#2E8B8B]">&ldquo;{searchTerm}&rdquo;</span>
              </h2>
              <Link
                href="/blog"
                className="text-sm font-bold text-[#D4561A] hover:underline flex items-center gap-1 ml-auto bg-orange-50 px-3 py-1.5 rounded-full"
              >
                Clear Search
              </Link>
            </div>
          )}
          {posts.length === 0 ? (
            <div className="text-center py-28 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <Search size={48} className="mx-auto text-slate-300 mb-5" />
              {searchTerm ? (
                <p className="text-lg text-slate-500 font-medium">No posts found for &ldquo;{searchTerm}&rdquo;.</p>
              ) : (
                <p className="text-lg text-slate-500 font-medium">No blog posts yet — coming soon.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* ===== INTERNAL LINKING SEO CTA ===== */}
        <section className="bg-white border-t border-slate-200 py-16">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] tracking-tight">
              Ready to Turn Inspiration Into Reality?
            </h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto text-base">
              Explore our hand-crafted holiday packages and custom trip itineraries designed for couples, families, and solo travelers.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/tour-packages"
                className="btn-primary px-7 py-3.5 text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#D4561A]/20"
              >
                <Compass size={16} />
                <span>Explore Tour Packages</span>
              </Link>
              <Link
                href="/travel-experiences"
                className="bg-slate-100 text-[#1C1C1C] hover:bg-[#2E8B8B] hover:text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all flex items-center gap-2"
              >
                <MapPin size={16} />
                <span>Browse Travel Experiences</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
