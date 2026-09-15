import type { Metadata } from "next";
import TravelExperienceDetail from "@/feature/travelExperience/components/TravelExperienceDetail";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema, touristDestinationSchema, itemListSchema, faqSchema, graphSchema } from "@/lib/jsonLd";
import { fetchBySlug, fetchPublicJson } from "@/feature/destinations/api/public-server";
import { stripHtml, absoluteUrl } from "@/lib/utils";
import { HOME_FAQS } from "@/lib/homeFaqs";
import type { TravelExperience } from "@/feature/travelExperience/type";
import type { Journey, PaginatedResponse as JourneyPage } from "@/feature/journey/type";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchBySlug<TravelExperience>("/holidays/by-slug", slug);
  if (!data) return { title: "Travel Experience Not Found | Flag Journeys" };
  const title = data.seoTitle || data.title;
  const seoDescription = stripHtml(data.seoDescription || data.moreDescription || "").slice(0, 160);
  const canonical = canonicalFor(data, slug);
  const ogImage = absoluteUrl(data.thumbImg);
  return {
    title,
    description: seoDescription,
    keywords: data.seoKeyword,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description: seoDescription,
      url: canonical,
      images: ogImage ? [{ url: ogImage, alt: data.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: seoDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function canonicalFor(
  data: { canonical?: string | null; slug: string },
  paramSlug: string
): string {
  const derived = `/travel-experiences/${data.slug || paramSlug}`;
  if (!data.canonical) return derived;
  const base = data.canonical.includes("://")
    ? data.canonical.slice(data.canonical.indexOf("/", data.canonical.indexOf("://") + 3))
    : data.canonical;
  return base.startsWith("/travel-experiences/") ? base : derived;
}

export default async function TravelExperiencePage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchBySlug<TravelExperience>("/holidays/by-slug", slug);

  let schema = null;
  if (data) {
    const journeys = await fetchPublicJson<JourneyPage<Journey>>("/journey?limit=100&isActive=true");
    const relatedJourneys = (journeys?.data || []).filter((j) =>
      (j.travelExperiences || []).some((e) => e.slug === data.slug)
    );
    const faqItems =
      data.faqs && data.faqs.length > 0
        ? data.faqs
            .filter((f) => f?.ques && f?.ans)
            .map((f) => ({ question: stripHtml(f.ques), answer: stripHtml(f.ans) }))
        : HOME_FAQS;
    schema = graphSchema([
      touristDestinationSchema({
        name: data.h1Title || data.title,
        description: data.seoDescription || data.overView || undefined,
        image: data.banner?.images?.[0] || data.thumbImg || undefined,
        url: `/travel-experiences/${data.slug}`,
      }),
      itemListSchema(
        relatedJourneys.slice(0, 10).map((j) => ({
          name: j.title.split("|")[0].trim(),
          url: `/tour-packages/${j.slug}`,
        }))
      ),
      breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Travel Experiences", path: "/travel-experiences" },
        { name: data.title, path: `/travel-experiences/${data.slug}` },
      ]),
      faqSchema(faqItems),
    ]);
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {schema && <JsonLd data={schema} />}
      <main className="flex-1">
        <TravelExperienceDetail slug={slug} initialExperience={data} />
      </main>
    </div>
  );
}
