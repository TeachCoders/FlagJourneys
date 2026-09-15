import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CmsPageDetail from "@/feature/cms/components/CmsPageDetail";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema } from "@/lib/jsonLd";
import { fetchBySlug } from "@/feature/destinations/api/public-server";
import { stripHtml, absoluteUrl } from "@/lib/utils";
import type { CmsPage } from "@/feature/cms/type";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchBySlug<CmsPage>("/cms/by-slug", slug);
  if (!page) return { title: "Page Not Found | Flag Journeys" };
  const seoDescription = stripHtml(page.seoDescription || page.moreDescription || "").slice(0, 160);
  const title = page.seoTitle || page.title;
  const canonical = page.canonical || `/${page.slug}`;
  const ogImage = absoluteUrl(page.thumbImg);
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
      images: ogImage ? [{ url: ogImage, alt: page.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: seoDescription || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function CmsPageRoute({ params }: Props) {
  const { slug } = await params;
  const page = await fetchBySlug<CmsPage>("/cms/by-slug", slug);
  if (!page) return notFound();

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
