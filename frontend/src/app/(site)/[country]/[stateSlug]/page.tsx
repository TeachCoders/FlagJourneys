import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import CmsPageDetail from "@/feature/cms/components/CmsPageDetail";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema } from "@/lib/jsonLd";
import { fetchBySlug } from "@/feature/destinations/api/public-server";
import { stripHtml } from "@/lib/utils";
import type { State } from "@/feature/state/type";
import type { CmsPage } from "@/feature/cms/type";

export const revalidate = 60;

type Props = { params: Promise<{ country: string; stateSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug, stateSlug } = await params;
  const state = await fetchBySlug<State>("/state/by-slug", stateSlug);
  if (state && state.country?.slug === countrySlug) {
    const title = state.seoTitle || state.title;
    const description = stripHtml(state.seoDescription || state.overView || "").slice(0, 160);
    return {
      title,
      description,
      keywords: state.seoKeyword,
      alternates: { canonical: `/tour-packages/${countrySlug}/${state.slug}` },
    };
  }
  const page = await fetchBySlug<CmsPage>("/cms/by-slug", `${countrySlug}/${stateSlug}`);
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

export default async function OldStateRedirectPage({ params }: Props) {
  const { country: countrySlug, stateSlug } = await params;
  const state = await fetchBySlug<State>("/state/by-slug", stateSlug);
  if (state && state.country?.slug === countrySlug) {
    redirect(`/tour-packages/${state.country.slug}/${state.slug}`);
  }

  const page = await fetchBySlug<CmsPage>("/cms/by-slug", `${countrySlug}/${stateSlug}`);
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
