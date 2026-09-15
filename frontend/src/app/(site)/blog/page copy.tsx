import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Search, ArrowRight, Sparkles } from "lucide-react";
import BlogCard from "@/feature/blog/components/BlogCard";
import JsonLd from "@/components/shared/JsonLd";
import { itemListSchema } from "@/lib/jsonLd";
import type { BlogPost } from "@/feature/blog/type";
import { API_BASE } from "@/lib/apiClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Travel Blog | Flag Journeys",
  description:
    "Travel guides, itineraries and tips for India tours — destinations, honeymoon, heritage and more.",
  alternates: { canonical: "/blog" },
};

async function fetchPosts(search?: string): Promise<BlogPost[]> {
  try {
    const url = `${API_BASE}/blog?limit=100&isActive=true${search ? `&search=${encodeURIComponent(search)}` : ""}`;
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
    const url = `${API_BASE}/blog-category?limit=100&isActive=true`;
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
 
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f8f8] font-sans">
      {posts.length > 0 && <JsonLd data={listSchemaData} />}
      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden bg-[#1C1C1C] pt-32 pb-36 md:pt-40 md:pb-48">
          <img
            src="/destinationImage/image/agra-6.webp"
            alt="Travel Blog"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#D4561A] mb-6 drop-shadow-md bg-white rounded-full">
              <Sparkles size={14} className="text-[#D4561A]" /> FlagJourney Travel Blog
            </span>
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight drop-shadow-2xl [text-shadow:_0_4px_24px_rgb(0_0_0_/_0.8)] max-w-[1400px] mx-auto">
              Stories, Guides & Travel Inspiration
            </h1>
            <p className="mt-6 text-white/95 font-medium max-w-2xl mx-auto text-lg leading-relaxed drop-shadow-lg [text-shadow:_0_2px_10px_rgb(0_0_0_/_0.8)]">
              Explore breathtaking destinations, handpicked itineraries, and insider tips curated by our passionate travel experts.
            </p>

            {/* ===== HERO SEARCH ===== */}
            <div className="mt-10 max-w-xl mx-auto relative">
              <form action="/blog" method="GET" className="relative flex items-center bg-white rounded-2xl overflow-hidden shadow-xl">
                <Search size={20} className="absolute left-5 text-slate-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchTerm}
                  placeholder="What are you looking for?"
                  className="w-full bg-transparent py-4 pl-14 pr-32 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <button type="submit" className="absolute right-2 top-2 bottom-2 bg-[#D4561A] text-white px-5 rounded-xl text-sm font-bold shadow-md hover:bg-[#b84a16] transition-colors flex items-center gap-2">
                  Search
                </button>
              </form>
            </div>
          </div>
        </section>

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
      </main>
    </div>
  );
}
