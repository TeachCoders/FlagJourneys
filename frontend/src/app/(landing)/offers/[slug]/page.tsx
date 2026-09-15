import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import AdLandingHero from "@/feature/landing/components/AdLandingHero";
import AdTrustBar from "@/feature/landing/components/AdTrustBar";
import AdPackageShowcase from "@/feature/landing/components/AdPackageShowcase";
import AdAccordionSection from "@/feature/landing/components/AdAccordionSection";
import MobileStickyBar from "@/feature/landing/components/MobileStickyBar";
import AdWhyChooseUs from "@/feature/landing/components/AdWhyChooseUs";
import AdTestimonials from "@/feature/landing/components/AdTestimonials";
import { getAdLandingPage } from "@/feature/landing/api/getAdLandingPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const parseJsonArray = (val: any) => {
  if (!val) return [];
  let current = val;
  if (typeof current === "string") {
    try { current = JSON.parse(current); } catch (e) {}
  }
  if (typeof current === "string") {
    try { current = JSON.parse(current); } catch (e) {}
  }
  if (Array.isArray(current)) return current;
  return [];
};

const parseJsonObject = (val: any) => {
  if (!val) return {};
  let current = val;
  if (typeof current === "string") {
    try { current = JSON.parse(current); } catch (e) {}
  }
  if (typeof current === "string") {
    try { current = JSON.parse(current); } catch (e) {}
  }
  if (current && typeof current === "object" && !Array.isArray(current)) return current;
  return {};
};

async function getJourneyById(id: number) {
  try {
    const res = await fetch(`${API_BASE}/journey/${id}?includeInactive=true`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json.journey || (json.id ? json : null);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getAdLandingPage(slug);
  
  if (!campaign) {
    return { title: "Offer Page Not Found" };
  }

  return {
    title: campaign.seoTitle || campaign.title || "Special Travel Offer",
    description: campaign.seoDescription || "Book your dream trip with Flag Journeys.",
  };
}

export default async function AdLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await getAdLandingPage(slug);

  if (!campaign) {
    notFound();
  }

  // Fetch linked journeys
  const linkedJourneyIds = parseJsonArray(campaign.linkedJourneyIds);
  let journeysData = [];
  if (linkedJourneyIds.length > 0) {
    const journeyPromises = linkedJourneyIds.map((id: any) => getJourneyById(Number(id)));
    const results = await Promise.all(journeyPromises);
    journeysData = results.filter(Boolean);
  }

  const customOverrides = parseJsonObject(campaign.customCardOverrides);

  const packages = linkedJourneyIds.map((idVal: any, idx: number) => {
    const id = Number(idVal);
    const j = journeysData.find((item: any) => Number(item.id) === id) || { id };
    const override = customOverrides[id] || customOverrides[String(id)] || customOverrides[Number(id)] || {};
    const rawImage = override.image || j.thumbImg || j.banner?.images?.[0] || "";
    const image = rawImage.includes("photo-1590523741831-ab7e8b8f9c7f") ? "" : rawImage;

    return {
      id: j.id || id,
      name: override.name || j.title || `Package #${idx + 1}`,
      duration: override.duration || j.duration || (j.noDays > 1 ? `${j.noDays - 1}N / ${j.noDays}D` : j.noDays ? `${j.noDays} Day` : "Flexible"),
      price: override.price || j.discountPrice || j.pricePerPerson || 0,
      originalPrice: j.pricePerPerson || 0,
      image,
      destination: j.destination || (j.route?.map ? j.route.map((r: any) => r.title).join(", ") : "") || "",
      route: override.route || (j.route?.map ? j.route.map((r: any) => r.title).join(" ➔ ") : "") || "",
      description: override.description || j.shortDescription || j.overView || "",
      highlights: override.highlights || j.highlights || [],
      inclusions: j.inclusions || [],
      days: j.days || [],
    };
  });

  // Fallbacks based on new model schema
  const bannerImage = campaign.bannerImages?.[0] || "";
  const title = campaign.heroHeading || campaign.title;
  const subtitle = campaign.heroSubheading || campaign.h1Title || "";
  const destinationName = campaign.theme || "Holiday";

  const sectionsOrder: string[] = Array.isArray(campaign.sectionsOrder) && campaign.sectionsOrder.length > 0
    ? campaign.sectionsOrder
    : ["hero", "packages", "why-choose", "faq", "cta"];

  const discountBadge = campaign.theme
    ? (campaign.theme.toLowerCase().includes("offer") || campaign.theme.toLowerCase().includes("special")
        ? campaign.theme
        : `${campaign.theme.toUpperCase()} SPECIAL OFFER`)
    : "LIMITED TIME OFFER";

  const sectionComponents: Record<string, React.ReactNode> = {
    hero: (
      <AdLandingHero
        key="hero"
        title={title}
        subtitle={subtitle}
        destinationName={destinationName}
        discountBadge={discountBadge}
        bannerImage={bannerImage}
        slug={slug}
        ctaText={campaign.ctaText}
      />
    ),
    packages: (
      <AdPackageShowcase
        key="packages"
        destinationName={destinationName}
        packages={packages.length > 0 ? packages : undefined} 
      />
    ),
    "why-choose": (
      <AdWhyChooseUs
        key="why-choose"
        images={campaign.whyChooseImages && campaign.whyChooseImages.length > 0 ? campaign.whyChooseImages : campaign.bannerImages}
      />
    ),
    faq: (
      <AdAccordionSection
        key="faq"
        destinationName={destinationName}
        customFaqs={campaign.customFaqs}
        inclusions={campaign.inclusions}
        exclusions={campaign.exclusions}
      />
    ),
    cta: <AdTestimonials key="cta" destinationName={destinationName} />,
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      {sectionsOrder.map((sectionId: string) => sectionComponents[sectionId] || null)}

      {/* Mobile Fixed Action Bar (Call + WhatsApp + Form Trigger) */}
      <MobileStickyBar
        destinationName={destinationName}
      />
    </main>
  );
}
