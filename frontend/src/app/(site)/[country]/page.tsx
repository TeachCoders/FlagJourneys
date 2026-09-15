import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import CmsPageDetail from "@/feature/cms/components/CmsPageDetail";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema } from "@/lib/jsonLd";
import { fetchBySlug } from "@/feature/destinations/api/public-server";
import { stripHtml, absoluteUrl } from "@/lib/utils";
import type { Country } from "@/feature/country/type";
import type { Journey } from "@/feature/journey/type";
import type { CmsPage } from "@/feature/cms/type";
import type { Season } from "@/feature/season/type";

export const revalidate = 60;

type Props = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params;

  const journey = await fetchBySlug<Journey>("/journey/by-slug", slug);
  if (journey) {
    const title = journey.seoTitle || journey.title;
    const description = stripHtml(journey.seoDescription || journey.overView || "").slice(0, 160);
    return {
      title,
      description,
      keywords: journey.seoKeyword,
      alternates: { canonical: `/tour-packages/${journey.slug}` },
    };
  }

  const country = await fetchBySlug<Country>("/country/by-slug", slug);
  if (country) {
    const title =
      country.seoTitle ||
      country.title?.replace(/\s*Tour$/i, "") ||
      country.title ||
      slug;
    const description =
      stripHtml(country.seoDescription || country.overView || "")
        .slice(0, 160) || undefined;
    return {
      title,
      description,
      keywords: country.seoKeyword,
      alternates: { canonical: `/tour-packages/${country.slug}` },
    };
  }

  const season = await fetchBySlug<Season>("/season/by-slug", slug);
  if (season) {
    const title = season.seoTitle || season.title;
    const description = stripHtml(season.seoDescription || season.overView || "").slice(0, 160);
    return {
      title,
      description,
      keywords: season.seoKeyword,
      alternates: { canonical: `/season/${season.slug}` },
    };
  }

  const page = await fetchBySlug<CmsPage>("/cms/by-slug", slug);
  if (!page) return { title: "Page Not Found | Flag Journeys" };
  const seoDescription = stripHtml(page.seoDescription || page.moreDescription || "").slice(0, 160);
  const title = page.seoTitle || page.title;
  const canonical = page.canonical || `/${page.slug}`;
  return {
    title,
    description: seoDescription || undefined,
    keywords: page.seoKeyword || undefined,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description: seoDescription || undefined,
      url: canonical,
      images: absoluteUrl(page.thumbImg)
        ? [{ url: absoluteUrl(page.thumbImg)!, alt: page.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: seoDescription || undefined,
      images: absoluteUrl(page.thumbImg) ? [absoluteUrl(page.thumbImg)!] : undefined,
    },
  };
}

export default async function OldCountryRedirectPage({ params }: Props) {
  const { country: slug } = await params;

  const journey = await fetchBySlug<Journey>("/journey/by-slug", slug);
  if (journey) redirect(`/tour-packages/${journey.slug}`);

  const country = await fetchBySlug<Country>("/country/by-slug", slug);
  if (country) redirect(`/tour-packages/${country.slug}`);

  const season = await fetchBySlug<Season>("/season/by-slug", slug);
  if (season) redirect(`/season/${season.slug}`);

  const page = await fetchBySlug<CmsPage>("/cms/by-slug", slug);
  if (!page) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: page.title, path: `/${page.slug}` },
        ])}
      />
      <CmsPageDetail page={page} />
    </>
  );
}
