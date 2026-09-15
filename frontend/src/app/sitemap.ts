import type { MetadataRoute } from "next";
const API_BASE = process.env.API_BASE_URL || "http://localhost:5000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://flagjourneys.com";

export const revalidate = 60;

type SitemapItem = {
  slug: string;
  updatedAt?: string;
  country?: { slug: string } | null;
  state?: { slug: string; country?: { slug: string } | null } | null;
  cities?: { slug: string; state?: { slug: string; country?: { slug: string } | null } | null }[];
  category?: string;
};

async function fetchAll<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

function url(path: string, lastModified?: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countries, states, cities, experiences, journeys, posts, cmsPages] =
    await Promise.all([
      fetchAll<SitemapItem>("/country?limit=5000"),
      fetchAll<SitemapItem>("/state?limit=5000"),
      fetchAll<SitemapItem>("/city?limit=5000"),
      fetchAll<SitemapItem>("/holidays?limit=5000"),
      fetchAll<SitemapItem>("/journey?limit=5000&isActive=true"),
      fetchAll<SitemapItem>("/blog?limit=5000&isActive=true"),
      fetchAll<SitemapItem>("/cms?limit=5000"),
    ]);

  const RESERVED_SLUGS = new Set([
    "tour-packages",
    "travel-experiences",
    "blog",
    "packages",
    "auth",
    "booking",
    "profile",
    "dashboard",
  ]);

  const entries: MetadataRoute.Sitemap = [
    url("/", new Date().toISOString()),
    url("/travel-experiences"),
    url("/blog"),
    url("/tour-packages"),
  ];

  countries.forEach((c: SitemapItem) => entries.push(url(`/tour-packages/${c.slug}`, c.updatedAt)));
  states.forEach((s: SitemapItem) => {
    if (s.country?.slug) entries.push(url(`/tour-packages/${s.country.slug}/${s.slug}`, s.updatedAt));
  });
  cities.forEach((c: SitemapItem) => {
    if (c.state?.country?.slug) {
      entries.push(url(`/tour-packages/${c.state.country.slug}/${c.state.slug}/${c.slug}`, c.updatedAt));
    }
  });
  experiences.forEach((e: SitemapItem) => entries.push(url(`/travel-experiences/${e.slug}`, e.updatedAt)));
  journeys.forEach((j: SitemapItem) => {
    entries.push(url(`/tour-packages/${j.slug}`, j.updatedAt));
  });
  posts.forEach((p: SitemapItem) => entries.push(url(`/blog/${p.slug}`, p.updatedAt)));
  cmsPages.forEach((c: SitemapItem) => {
    if (RESERVED_SLUGS.has(c.slug)) return;
    entries.push(url(`/${c.slug}`, c.updatedAt));
  });

  return entries;
}
