import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://flagjourneys.com";

export function absoluteUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  return `${SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripHtml(html?: string) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, "\u2013")
    .replace(/&mdash;/gi, "\u2014")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripTourSuffix(label: string): string {
  const t = label.trim();
  const lower = t.toLowerCase();
  const suffixes = [" tour packages", " tours", " tour"];
  const matched = suffixes.find((s) => lower.endsWith(s));
  return matched ? t.slice(0, t.length - matched.length).trim() : t;
}

export const MAX_NAV_ITEMS = 12;

export type NavChild = { href: string; label: string };

export function pickPriorityLinks<T>(
  items: T[],
  getPriority: (item: T) => number,
  mapItem: (item: T) => NavChild
): NavChild[] {
  const sorted = [...items].sort(
    (a, b) => (getPriority(a) || 0) - (getPriority(b) || 0)
  );
  const prioritized = sorted
    .filter((item) => (getPriority(item) || 0) > 0)
    .slice(0, MAX_NAV_ITEMS)
    .map(mapItem);
  if (prioritized.length) return prioritized;
  return sorted.slice(0, MAX_NAV_ITEMS).map(mapItem);
}


