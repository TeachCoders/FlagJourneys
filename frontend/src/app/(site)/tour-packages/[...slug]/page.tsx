import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CountryDetail from "@/feature/destinations/components/CountryDetail";
import StateDetail from "@/feature/destinations/components/StateDetail";
import CityDetail from "@/feature/destinations/components/CityDetail";
import JourneyDetail from "@/feature/journey/components/JourneyDetail";
import CmsFallbackPage from "@/feature/cms/components/CmsFallbackPage";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema, faqSchema, touristDestinationSchema, touristTripSchema, itemListSchema, graphSchema } from "@/lib/jsonLd";
import { fetchBySlug, fetchPublicJson } from "@/feature/destinations/api/public-server";
import { stripHtml } from "@/lib/utils";
import { HOME_FAQS } from "@/lib/homeFaqs";
import type { Country } from "@/feature/country/type";
import type { State, PaginatedResponse as StatePage } from "@/feature/state/type";
import type { City } from "@/feature/city/type";
import type { Journey, PaginatedResponse as JourneyPage } from "@/feature/journey/type";
import type { CmsPage } from "@/feature/cms/type";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://flagjourneys.com";

function absoluteUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  return `${SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

function journeySlugCanonical(slug: string, stored?: string | null): string {
  const derived = `/tour-packages/${slug}`;
  if (!stored) return derived;
  const base = stored.includes("://")
    ? stored.slice(stored.indexOf("/", stored.indexOf("://") + 3))
    : stored;
  return base.startsWith("/tour-packages/") ? base : derived;
}

function resolveFaqItems(faqs?: { ques: string; ans: string }[]): { question: string; answer: string }[] {
  if (faqs && faqs.length > 0) {
    return faqs
      .filter((f) => f?.ques && f?.ans)
      .map((f) => ({ question: stripHtml(f.ques), answer: stripHtml(f.ans) }));
  }
  return HOME_FAQS.map((f) => ({ question: f.question, answer: f.answer }));
}

export const revalidate = 60;

type Props = { params: Promise<{ slug: string[] }> };

type Resolved =
  | { type: "country"; country: Country }
  | { type: "state"; state: State }
  | { type: "city"; city: City }
  | { type: "journey"; journey: Journey }
  | { type: "cms"; cms: CmsPage }
  | { type: "notfound" };

async function resolveSlug(slug: string[]): Promise<Resolved> {
  if (slug.length === 0) return { type: "notfound" };

  if (slug.length === 1) {
    const segment = slug[0];
    const journey = await fetchBySlug<Journey>("/journey/by-slug", segment);
    if (journey) return { type: "journey", journey };
    const country = await fetchBySlug<Country>("/country/by-slug", segment);
    if (country) return { type: "country", country };
    const cms = await fetchBySlug<CmsPage>("/cms/by-slug", segment);
    if (cms) return { type: "cms", cms };
    return { type: "notfound" };
  }

  if (slug.length === 2) {
    const [countrySlug, stateSlug] = slug;
    const state = await fetchBySlug<State>("/state/by-slug", stateSlug);
    if (state && state.country?.slug === countrySlug) return { type: "state", state };
    const cms = await fetchBySlug<CmsPage>("/cms/by-slug", slug.join("/"));
    if (cms) return { type: "cms", cms };
    return { type: "notfound" };
  }

  if (slug.length === 3) {
    const [countrySlug, stateSlug, citySlug] = slug;
    const city = await fetchBySlug<City>("/city/by-slug", citySlug);
    if (
      city &&
      city.state?.slug === stateSlug &&
      city.state?.country?.slug === countrySlug
    ) {
      return { type: "city", city };
    }
    const cms = await fetchBySlug<CmsPage>("/cms/by-slug", slug.join("/"));
    if (cms) return { type: "cms", cms };
    return { type: "notfound" };
  }

  const cms = await fetchBySlug<CmsPage>("/cms/by-slug", slug.join("/"));
  if (cms) return { type: "cms", cms };
  return { type: "notfound" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveSlug(slug);

  switch (resolved.type) {
    case "country": {
      const { country } = resolved;
      const title =
        country?.seoTitle ||
        country?.title?.replace(/\s*Tour$/i, "") ||
        country?.title ||
        (slug[0] ? slug[0] : "Tour Package");
      const seoDescription =
        stripHtml(country?.seoDescription || country?.overView || "")
          .slice(0, 160) || undefined;
      const canonical = `/tour-packages/${country.slug}`;
      const ogImage = absoluteUrl(country?.thumbImg);
      return {
        title,
        description: seoDescription,
        keywords: country?.seoKeyword,
        alternates: { canonical },
        openGraph: {
          type: "website",
          title,
          description: seoDescription,
          url: canonical,
          images: ogImage ? [{ url: ogImage, alt: title }] : undefined,
        },
        twitter: {
          card: "summary_large_image",
          title,
          description: seoDescription,
          images: ogImage ? [ogImage] : undefined,
        },
      };
    }
    case "state": {
      const { state } = resolved;
      const title = state.seoTitle || state.title;
      const seoDescription = stripHtml(state.seoDescription || state.overView).slice(0, 160);
      const canonical = `/tour-packages/${state.country?.slug}/${state.slug}`;
      const ogImage = absoluteUrl(state.thumbImg);
      return {
        title,
        description: seoDescription,
        keywords: state.seoKeyword,
        alternates: { canonical },
        openGraph: {
          type: "website",
          title,
          description: seoDescription,
          url: canonical,
          images: ogImage ? [{ url: ogImage, alt: state.title }] : undefined,
        },
        twitter: {
          card: "summary_large_image",
          title,
          description: seoDescription,
          images: ogImage ? [ogImage] : undefined,
        },
      };
    }
    case "city": {
      const { city } = resolved;
      const title = city.seoTitle || city.title;
      const seoDescription = stripHtml(city.seoDescription || city.overView).slice(0, 160);
      const canonical =
        `/tour-packages/${city.state?.country?.slug}/${city.state?.slug}/${city.slug}`;
      const ogImage = absoluteUrl(city.thumbImg);
      return {
        title,
        description: seoDescription,
        keywords: city.seoKeyword,
        alternates: { canonical },
        openGraph: {
          type: "website",
          title,
          description: seoDescription,
          url: canonical,
          images: ogImage ? [{ url: ogImage, alt: city.title }] : undefined,
        },
        twitter: {
          card: "summary_large_image",
          title,
          description: seoDescription,
          images: ogImage ? [ogImage] : undefined,
        },
      };
    }
    case "journey": {
      const { journey } = resolved;
      const title = journey.seoTitle || journey.title;
      const seoDescription = stripHtml(journey.seoDescription || journey.overView).slice(0, 160);
      const canonical = journeySlugCanonical(journey.slug, journey.canonical);
      const ogImage = absoluteUrl(journey.thumbImg);
      return {
        title,
        description: seoDescription,
        keywords: journey.seoKeyword,
        alternates: { canonical },
        openGraph: {
          type: "website",
          title,
          description: seoDescription,
          url: canonical,
          images: ogImage ? [{ url: ogImage, alt: journey.title }] : undefined,
        },
        twitter: {
          card: "summary_large_image",
          title,
          description: seoDescription,
          images: ogImage ? [ogImage] : undefined,
        },
      };
    }
    case "cms": {
      const { cms } = resolved;
      const seoDescription = stripHtml(cms.seoDescription || cms.moreDescription || "").slice(0, 160);
      return {
        title: cms.seoTitle || cms.title,
        description: seoDescription || undefined,
        keywords: cms.seoKeyword || undefined,
        alternates: { canonical: cms.canonical || `/tour-packages/${cms.slug}` },
      };
    }
    default:
      return { title: "Page Not Found | Flag Journeys" };
  }
}

export default async function TourPackageCatchAllPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveSlug(slug);

  switch (resolved.type) {
    case "country": {
      const { country } = resolved;
      const [initialStates, initialJourneys] = await Promise.all([
        country
          ? fetchPublicJson<StatePage<State>>(`/state?limit=100&countryId=${country.id}`)
          : null,
        fetchPublicJson<JourneyPage<Journey>>("/journey?limit=100&isActive=true"),
      ]);

      const schema = graphSchema([
        touristDestinationSchema({
          name: country.title,
          description: country.seoDescription || country.overView || undefined,
          image: country.thumbImg || undefined,
          url: `/tour-packages/${country.slug}`,
        }),
        itemListSchema(
          (initialJourneys?.data || []).slice(0, 10).map((j) => ({
            name: j.title.split("|")[0].trim(),
            url: `/tour-packages/${j.slug}`,
          }))
        ),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tour Packages", path: "/tour-packages" },
          { name: country.title.replace(/\s*Tour$/i, ""), path: `/tour-packages/${country.slug}` },
        ]),
        faqSchema(resolveFaqItems(country.faqs)),
      ]);

      return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
          <JsonLd data={schema} />
          <main className="flex-1">
            <CountryDetail
              slug={country.slug}
              initialCountry={country}
              initialStates={initialStates}
              initialJourneys={initialJourneys}
            />
          </main>
        </div>
      );
    }

    case "state": {
      const { state } = resolved;
      const initialJourneys =
        state?.journeys && state.journeys.length > 0
          ? null
          : await fetchPublicJson<JourneyPage<Journey>>(
              "/journey?limit=100&isActive=true"
            );
      const stateJourneys = state?.journeys?.length
        ? state.journeys
        : (initialJourneys?.data || []);
      const schema = graphSchema([
        touristDestinationSchema({
          name: state.title,
          description: state.seoDescription || state.overView || undefined,
          image: state.thumbImg || undefined,
          url: `/tour-packages/${state.country?.slug}/${state.slug}`,
        }),
        itemListSchema(
          stateJourneys.slice(0, 10).map((j) => ({
            name: j.title.split("|")[0].trim(),
            url: `/tour-packages/${j.slug}`,
          }))
        ),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tour Packages", path: "/tour-packages" },
          ...(state.country?.slug
            ? [{ name: state.country.title.replace(/\s*Tour$/i, ""), path: `/tour-packages/${state.country.slug}` }]
            : []),
          { name: state.title, path: `/tour-packages/${state.country?.slug}/${state.slug}` },
        ]),
        faqSchema(resolveFaqItems(state.faqs)),
      ]);
      return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
          <JsonLd data={schema} />
          <main className="flex-1">
            <StateDetail slug={state.slug} initialState={state} initialJourneys={initialJourneys} />
          </main>
        </div>
      );
    }

    case "city": {
      const { city } = resolved;
      const initialJourneys = await fetchPublicJson<JourneyPage<Journey>>(
        "/journey?limit=100&isActive=true"
      );
      const schema = graphSchema([
        touristDestinationSchema({
          name: city.title,
          description: city.seoDescription || city.overView || undefined,
          image: city.thumbImg || undefined,
          url: `/tour-packages/${city.state?.country?.slug}/${city.state?.slug}/${city.slug}`,
        }),
        itemListSchema(
          (initialJourneys?.data || []).slice(0, 10).map((j) => ({
            name: j.title.split("|")[0].trim(),
            url: `/tour-packages/${j.slug}`,
          }))
        ),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tour Packages", path: "/tour-packages" },
          ...(city.state?.country?.slug
            ? [{ name: city.state.country.title.replace(/\s*Tour$/i, ""), path: `/tour-packages/${city.state.country.slug}` }]
            : []),
          ...(city.state?.slug
            ? [{ name: city.state.title, path: `/tour-packages/${city.state.country?.slug}/${city.state.slug}` }]
            : []),
          { name: city.title, path: `/tour-packages/${city.state?.country?.slug}/${city.state?.slug}/${city.slug}` },
        ]),
        faqSchema(resolveFaqItems(city.faqs)),
      ]);
      return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
          <JsonLd data={schema} />
          <main className="flex-1">
            <CityDetail citySlug={city.slug} initialCity={city} initialJourneys={initialJourneys} />
          </main>
        </div>
      );
    }

    case "journey": {
      const { journey } = resolved;
      const canonical = journeySlugCanonical(journey.slug, journey.canonical);
      const journeyFaqs = resolveFaqItems(journey.faqs);
      const breadcrumbItems: { name: string; path: string }[] = [
        { name: "Home", path: "/" },
        { name: "Tour Packages", path: "/tour-packages" },
      ];
      const firstCity = journey.cities?.[0];
      if (firstCity?.state?.country?.slug && firstCity.state.country.title) {
        breadcrumbItems.push({
          name: firstCity.state.country.title.replace(/\s*Tour$/i, ""),
          path: `/tour-packages/${firstCity.state.country.slug}`,
        });
      }
      if (firstCity?.state?.slug && firstCity.state.title && firstCity.state.country?.slug) {
        breadcrumbItems.push({
          name: firstCity.state.title,
          path: `/tour-packages/${firstCity.state.country.slug}/${firstCity.state.slug}`,
        });
      }
      breadcrumbItems.push({ name: journey.title, path: canonical });

      const tourProductNode =
        journey.pricePerPerson && journey.pricePerPerson > 0
          ? touristTripSchema({
              name: journey.title,
              description: journey.seoDescription || journey.overView || undefined,
              image: journey.banner?.images?.[0] || journey.thumbImg || undefined,
              url: canonical,
              price: journey.pricePerPerson,
              touristType: journey.travelExperiences?.map((e) => e.title) || [],
              itinerary: journey.days?.map((d) => ({
                day: `Day ${d.day}`,
                description: d.seoDescription || undefined,
              })),
            })
          : null;
      const schema = journey
        ? graphSchema([
            ...(tourProductNode ? [tourProductNode] : []),
            breadcrumbSchema(breadcrumbItems),
            faqSchema(journeyFaqs),
          ])
        : null;
      return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
          {schema && <JsonLd data={schema} />}
          <main className="flex-1">
            <JourneyDetail slug={journey.slug} initialJourney={journey} />
          </main>
        </div>
      );
    }

    case "cms":
      return <CmsFallbackPage slug={slug.join("/")} />;

    default:
      return notFound();
  }
}
