import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import CmsPageDetail from "@/feature/cms/components/CmsPageDetail";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema } from "@/lib/jsonLd";
import { fetchBySlug } from "@/feature/destinations/api/public-server";
import { stripHtml } from "@/lib/utils";
import type { City } from "@/feature/city/type";
import type { CmsPage } from "@/feature/cms/type";

export const revalidate = 60;

type Props = { params: Promise<{ country: string; stateSlug: string; citySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug, stateSlug, citySlug } = await params;
  const city = await fetchBySlug<City>("/city/by-slug", citySlug);
  if (
    city &&
    city.state?.slug === stateSlug &&
    city.state?.country?.slug === countrySlug
  ) {
    const title = city.seoTitle || city.title;
    const description = stripHtml(city.seoDescription || city.overView || "").slice(0, 160);
    return {
      title,
      description,
      keywords: city.seoKeyword,
      alternates: {
        canonical: `/tour-packages/${city.state.country.slug}/${city.state.slug}/${city.slug}`,
      },
    };
  }
  const page = await fetchBySlug<CmsPage>(
    "/cms/by-slug",
    `${countrySlug}/${stateSlug}/${citySlug}`,
  );
  return cmsMetadata(page);
}

async function cmsMetadata(page: CmsPage | null): Promise<Metadata> {
  if (!page) return { title: "Page Not Found | Flag Journeys" };
  const seoDescription = stripHtml(page.seoDescription || page.moreDescription || "").slice(0, 160);
  const title = page.seoTitle || page.title;
  const canonical = page.canonical || `/${page.slug}`;
  return {
    title,
    description: seoDescription || undefined,
    keywords: page.seoKeyword || undefined,
    alternates: { canonical },
  };
}

export default async function OldCityRedirectPage({ params }: Props) {
  const { country: countrySlug, stateSlug, citySlug } = await params;
  const city = await fetchBySlug<City>("/city/by-slug", citySlug);
  if (
    city &&
    city.state?.slug === stateSlug &&
    city.state?.country?.slug === countrySlug
  ) {
    redirect(
      `/tour-packages/${city.state.country.slug}/${city.state.slug}/${city.slug}`,
    );
  }

  const page = await fetchBySlug<CmsPage>(
    "/cms/by-slug",
    `${countrySlug}/${stateSlug}/${citySlug}`,
  );
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
