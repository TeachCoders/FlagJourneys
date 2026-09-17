import type { Metadata } from "next";
import Link from "next/link";
import { Package, Star, MapPin, Clock, Users, CheckCircle2, XCircle, Hotel, Car, Navigation, ArrowLeft } from "lucide-react";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema, touristTripSchema } from "@/lib/jsonLd";
import RichContent from "@/components/shared/RichContent";
import { fetchPackageBySlug } from "@/feature/tourPackages/public-server";
import { stripHtml } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://flagjourneys.com";

function absoluteUrl(src?: string): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  return `${SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await fetchPackageBySlug(slug);
  if (!pkg) return { title: "Package Not Found | Flag Journeys" };
  const title = pkg.name;
  const description = stripHtml(pkg.shortDescription || pkg.description || "").slice(0, 160);
  const canonical = `/packages/${pkg.slug}`;
  const image = Array.isArray(pkg.bannerImageUrl) ? pkg.bannerImageUrl[0] : pkg.bannerImageUrl;
  const ogImage = image ? absoluteUrl(image) : undefined;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage, alt: pkg.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params;
  const pkg = await fetchPackageBySlug(slug);

  if (!pkg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package size={48} className="text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium text-lg">Package not found</p>
        <Link href="/packages" className="mt-4 text-indigo-600 font-semibold hover:underline">← Back to packages</Link>
      </div>
    );
  }

  const itinerary = (pkg.itinerary || []) as { day: number; title: string; content: string }[];
  const hotels = (pkg.hotelDetails || []) as {
    name?: string;
    type?: string;
    location?: string;
    nights?: number;
    pricePerNight?: number;
  }[];
  const cars = (pkg.carDetails || []) as {
    name?: string;
    type?: string;
    ownerName?: string;
    location?: string;
    price?: number;
  }[];
  const guides = (pkg.guideDetails || []) as {
    name?: string;
    language?: string;
    location?: string;
    pricePerDay?: number;
  }[];
  const bannerUrl = Array.isArray(pkg.bannerImageUrl) ? pkg.bannerImageUrl[0] : pkg.bannerImageUrl;

  return (
    <div className="min-h-screen bg-slate-50">
      <JsonLd
          data={touristTripSchema({
            name: pkg.name,
            description: pkg.shortDescription || pkg.description || undefined,
            image: bannerUrl || undefined,
            url: `/packages/${pkg.slug}`,
            price: pkg.pricePerPerson && pkg.pricePerPerson > 0 ? pkg.pricePerPerson : undefined,
          })}
        />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tour Packages", path: "/packages" },
          { name: pkg.name, path: `/packages/${pkg.slug}` },
        ])}
      />
      {/* Banner */}
      <div className="relative h-72 md:h-96">
        {bannerUrl ? (
          <img src={bannerUrl} alt={pkg.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-[1600px] mx-auto">
            <Link href="/packages" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft size={14} /> Back to packages
            </Link>
            {pkg.isBestSelling && (
              <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full mb-3">
                <Star size={10} fill="currentColor" /> BEST SELLING
              </span>
            )}
            <h1 className="h1 text-white">{pkg.name}</h1>
            <div className="flex items-center gap-4 mt-3 text-white/80 text-sm">
              {pkg.destination && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {pkg.destination}</span>
              )}
              {pkg.duration && (
                <span className="flex items-center gap-1"><Clock size={14} /> {pkg.duration}</span>
              )}
              {(pkg.purchaseCount ?? 0) > 0 && <span className="flex items-center gap-1"><Users size={14} /> {pkg.purchaseCount} booked</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-10">
        {/* Gallery — multiple banners */}
        {Array.isArray(pkg.bannerImageUrl) && pkg.bannerImageUrl.length > 1 && (
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pkg.bannerImageUrl.map((url: string, i: number) => (
                <div key={i} className="rounded-xl overflow-hidden border border-slate-200">
                  <img src={url} alt={`${pkg.name} ${i + 1}`} className="w-full h-32 object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Short Description */}
            {pkg.shortDescription && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <p className="text-slate-600 text-base leading-relaxed">{pkg.shortDescription}</p>
              </div>
            )}

            {/* Full Description */}
            {pkg.description && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">About This Package</h2>
                <RichContent html={pkg.description} />
              </div>
            )}

            {/* Day-wise Itinerary */}
            {itinerary.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Day-by-Day Itinerary</h2>
                <div className="space-y-6">
                  {itinerary.map((day, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                          {day.day || i + 1}
                        </div>
                        {i < itinerary.length - 1 && <div className="w-0.5 flex-1 bg-indigo-100 mt-2" />}
                      </div>
                      <div className="pb-6 flex-1">
                        <h3 className="text-sm font-bold text-slate-900">{day.title || `Day ${i + 1}`}</h3>
                        <RichContent html={day.content} className="mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotels */}
            {hotels.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Hotel size={18} className="text-indigo-500" /> Hotel Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hotels.map((h, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{h.type} • {h.location} • {h.nights} nights</p>
                      {(h.pricePerNight ?? 0) > 0 && <p className="text-xs text-indigo-600 font-semibold mt-1">₹{h.pricePerNight?.toLocaleString()}/night</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cars */}
            {cars.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Car size={18} className="text-emerald-500" /> Transport Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cars.map((c, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{c.type} • Owner: {c.ownerName} • {c.location}</p>
                      {(c.price ?? 0) > 0 && <p className="text-xs text-emerald-600 font-semibold mt-1">₹{c.price?.toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guides */}
            {guides.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Navigation size={18} className="text-amber-500" /> Guide Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {guides.map((g, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{g.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{g.language} • {g.location}</p>
                      {(g.pricePerDay ?? 0) > 0 && <p className="text-xs text-amber-600 font-semibold mt-1">₹{g.pricePerDay?.toLocaleString()}/day</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Includes / Excludes */}
            {((pkg.includes?.length ?? 0) > 0 || (pkg.excludes?.length ?? 0) > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {(pkg.includes?.length ?? 0) > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-1.5"><CheckCircle2 size={14} /> What's Included</h3>
                    <ul className="space-y-2">
                      {(pkg.includes || []).map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(pkg.excludes?.length ?? 0) > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-1.5"><XCircle size={14} /> What's Excluded</h3>
                    <ul className="space-y-2">
                      {(pkg.excludes || []).map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <XCircle size={13} className="text-red-500 mt-0.5 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar — Price Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="text-center mb-6">
                {pkg.discountPrice && pkg.discountPrice > (pkg.pricePerPerson || 0) && (
                  <p className="text-sm text-slate-400 line-through">₹{pkg.discountPrice.toLocaleString()}</p>
                )}
                <p className="text-4xl font-black text-indigo-600">₹{pkg.pricePerPerson?.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">per person</p>
              </div>
              <div className="space-y-3 text-sm text-slate-600 mb-6">
                {pkg.destination && (
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {pkg.destination}</div>
                )}
                {pkg.duration && (
                  <div className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /> {pkg.duration}</div>
                )}
                {(pkg.purchaseCount ?? 0) > 0 && (
                  <div className="flex items-center gap-2"><Users size={14} className="text-slate-400" /> {pkg.purchaseCount} people booked</div>
                )}
              </div>
              <Link href="/booking" className="block w-full py-3 bg-indigo-600 text-white text-center text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                Book Now
              </Link>
              <p className="text-[10px] text-slate-400 text-center mt-3">Prices may vary based on season & group size</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
