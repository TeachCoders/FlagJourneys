import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema } from "@/lib/jsonLd";
import { fetchBySlug, fetchPublicJson } from "@/feature/destinations/api/public-server";
import RichContent from "@/components/shared/RichContent";
import GuestGalleryClient from "@/feature/guestGallery/components/GuestGalleryClient";
import type { PaginatedGuestGallery } from "@/feature/guestGallery/type";
import type { CmsPage } from "@/feature/cms/type";
import { stripHtml } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await fetchBySlug<CmsPage>("/cms/by-slug", "guest-gallery");

  const title = cmsPage?.seoTitle || cmsPage?.title || "Guest Photo Gallery | Flag Journeys";
  const description =
    stripHtml(cmsPage?.seoDescription || cmsPage?.moreDescription || "").slice(0, 160) ||
    "Explore real moments captured by our travelers during their journeys across India. Authentic travel memories with Flag Journeys.";
  const canonical = cmsPage?.canonical || "/guest-gallery";

  return {
    title,
    description,
    keywords: cmsPage?.seoKeyword || undefined,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function GuestGalleryPage() {
  // Fetch CMS page content created/managed in CMS (/dashboard/cms-page)
  const cmsPage = await fetchBySlug<CmsPage>("/cms/by-slug", "guest-gallery");

  // Fetch uploaded guest gallery photos
  const galleryResponse = await fetchPublicJson<PaginatedGuestGallery>(
    "/guest-gallery?limit=100&isActive=true"
  );

  const galleryItems = galleryResponse?.data || [];

  const displayTitle = cmsPage?.h1Title || cmsPage?.title || "Guest Gallery";
  const cmsDescription = cmsPage?.moreDescription || cmsPage?.seoDescription;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">
      {/* SEO Breadcrumb Schema */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: displayTitle, path: "/guest-gallery" },
        ])}
      />

      {/* Dark Hero Header Section */}
      <div className="bg-[#1C1C1C] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='white' stroke-width='0.5'%3E%3Ccircle cx='40' cy='40' r='10'/%3E%3Ccircle cx='40' cy='40' r='18'/%3E%3Cpath d='M40 12 L40 4 M40 68 L40 76 M12 40 L4 40 M68 40 L76 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-12 md:py-16">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md mb-3">
            {displayTitle}
          </h1>

          {/* Breadcrumbs positioned below Title */}
          <nav className="flex items-center gap-1.5 text-white/70 text-sm">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={14} className="text-white/40" />
            <span className="text-white/95 font-medium">{displayTitle}</span>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-10 md:py-14 space-y-8">
        {/* CMS Page Description / Overview Content (from /dashboard/cms-page) */}
        {cmsDescription && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
            <RichContent html={cmsDescription} />
          </div>
        )}

        {/* Uploaded Guest Gallery Photo Grid & Lightbox */}
        <GuestGalleryClient initialItems={galleryItems} />
      </div>
    </div>
  );
}
