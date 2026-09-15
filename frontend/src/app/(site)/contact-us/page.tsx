import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Clock,
  HelpCircle,
  Headphones,
  ShieldCheck,
  Award,
  Sparkles,
  Users,
} from "lucide-react";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema } from "@/lib/jsonLd";
import { fetchBySlug } from "@/feature/destinations/api/public-server";
import RichContent from "@/components/shared/RichContent";
import type { CmsPage } from "@/feature/cms/type";
import { stripHtml } from "@/lib/utils";
import ContactFormClient from "@/feature/contact/components/ContactFormClient";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://flagjourneys.com";
const SALES_PHONE = process.env.NEXT_PUBLIC_SALES_PHONE || "+91 91367 39178";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919136739178";
const CLEAN_PHONE = SALES_PHONE.replace(/[^0-9+]/g, "");

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await fetchBySlug<CmsPage>("/cms/by-slug", "contact-us");

  const title =
    cmsPage?.seoTitle || cmsPage?.title || "Contact Us | Flag Journeys - Get in Touch for Custom Tours";
  const description =
    stripHtml(cmsPage?.seoDescription || cmsPage?.moreDescription || "").slice(0, 160) ||
    "Contact Flag Journeys for custom India tour packages, cab rentals, and 24/7 travel assistance. Reach us via phone, email, or visit our head office in New Delhi.";
  const canonical = cmsPage?.canonical || "/contact-us";

  return {
    title,
    description,
    keywords:
      cmsPage?.seoKeyword ||
      "contact flagjourney holiday, travel agency contact delhi, india tour package inquiry, flagjourney holidays phone number",
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function ContactUsPage() {
  // Fetch CMS page content created/managed in CMS (/dashboard/cms-page) with slug 'contact-us'
  const cmsPage = await fetchBySlug<CmsPage>("/cms/by-slug", "contact-us");

  const displayTitle = cmsPage?.h1Title || cmsPage?.title || "Contact Us";
  const cmsDescription = cmsPage?.moreDescription || cmsPage?.seoDescription;

  // JSON-LD Organization & ContactPoint Schema for Google Search Rich Results
  const contactOrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Flag Journeys",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/logo.png`,
    priceRange: "₹₹",
    telephone: CLEAN_PHONE,
    email: "support@flagjourneys.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "102, Destination Hub, MG Road",
      addressLocality: "New Delhi",
      addressRegion: "Delhi",
      postalCode: "110001",
      addressCountry: "IN",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:30",
        closes: "19:00",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CLEAN_PHONE,
      contactType: "customer service",
      availableLanguage: ["English"],
    },
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-slate-800 pb-16">
      {/* SEO Structured Data */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: displayTitle, path: "/contact-us" },
        ])}
      />
      <JsonLd data={contactOrganizationSchema} />

      {/* Hero Header Section */}
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
          <nav className="flex items-center gap-1.5 text-white/70 text-sm mb-3">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={14} className="text-white/40" />
            <span className="text-white/95 font-medium">{displayTitle}</span>
          </nav>

          <p className="mt-1 text-white/80 text-base md:text-lg max-w-2xl">
            Have questions about your upcoming trip or need a custom holiday itinerary? Our travel specialists are available 24/7 to assist you.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-10 md:py-14 space-y-12">
        {/* Dynamic CMS Page Overview (managed via /dashboard/cms-page) */}
        {cmsDescription && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
            <RichContent html={cmsDescription} />
          </div>
        )}

        {/* Contact Form + Side Info Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Interactive Contact Form (7 Cols) */}
          <div className="lg:col-span-7">
            <ContactFormClient />
          </div>

          {/* Right Column: Why Choose Us (5 Cols) - Clean Light Card Design */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md space-y-6">
              <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-[#2E8B8B]/10 text-[#2E8B8B] flex items-center justify-center shrink-0">
                  <Headphones size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 font-heading">Why Plan With Us?</h3>
                  <p className="text-xs font-semibold text-[#2E8B8B]">Flag Journeys Travel Promise</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#2E8B8B] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">100% Customized Itineraries</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      Tailored circuits crafted by destination experts matching your preferred pace and budget.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#D4561A] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Verified Hotels & Cabs</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      Inspected accommodations with clean, sanitized vehicles and English-speaking drivers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Zero Hidden Charges</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      Transparent pricing with detailed inclusion and exclusion checklists before booking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Dedicated Tour Manager</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      A single point of contact assigned to guide and support you throughout your journey.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Quick Contact Cards (Placed right BEFORE 'Got Questions? We Have Answers.' FAQs section) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Head Office */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2E8B8B]/10 text-[#2E8B8B] flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E8B8B]">
                  Head Office
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Visit Our Office</h3>
                <address className="not-italic text-sm text-slate-600 leading-relaxed mt-2">
                  102, Destination Hub, MG Road,<br />
                  New Delhi, Delhi - 110001, India
                </address>
              </div>
            </div>
            <a
              href="https://maps.google.com/?q=MG+Road+New+Delhi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#2E8B8B] hover:underline inline-flex items-center gap-1 pt-2 border-t border-slate-100"
            >
              <span>Get Directions</span>
              <span>→</span>
            </a>
          </div>

          {/* Card 2: Phone / WhatsApp (Using Environment Variables) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4561A]/10 text-[#D4561A] flex items-center justify-center">
                <Phone size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4561A]">
                  24/7 Helpline
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Call / WhatsApp</h3>
                <div className="text-sm text-slate-600 leading-relaxed mt-2 space-y-1">
                  <p>
                    <strong>Phone:</strong>{" "}
                    <a href={`tel:${CLEAN_PHONE}`} className="hover:text-[#D4561A] transition-colors font-medium">
                      {SALES_PHONE}
                    </a>
                  </p>
                  <p>
                    <strong>WhatsApp:</strong>{" "}
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#D4561A] transition-colors font-medium"
                    >
                      +{WHATSAPP_NUMBER}
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 pt-2 border-t border-slate-100">
              Instant Phone Assistance
            </span>
          </div>

          {/* Card 3: Email Support */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Email Inquiry
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Send an Email</h3>
                <div className="text-sm text-slate-600 leading-relaxed mt-2 space-y-1">
                  <p>
                    <a href="mailto:support@flagjourneys.com" className="hover:text-indigo-600 transition-colors font-medium">
                      support@flagjourneys.com
                    </a>
                  </p>
                  <p>
                    <a href="mailto:info@flagjourneys.com" className="hover:text-indigo-600 transition-colors font-medium">
                      info@flagjourneys.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 pt-2 border-t border-slate-100">
              Quick Email Support
            </span>
          </div>

          {/* Card 4: Operating Hours */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Support Timing
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Office Hours</h3>
                <div className="text-sm text-slate-600 leading-relaxed mt-2 space-y-1">
                  <p>Mon - Sat: 9:30 AM - 7:00 PM IST</p>
                  <p className="text-xs text-amber-700 font-semibold mt-1">
                    ⚡ 24/7 On-Trip Emergency Support
                  </p>
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 pt-2 border-t border-slate-100">
              IST Timezone (UTC +5:30)
            </span>
          </div>
        </div>

        {/* Frequently Asked Questions Section (100% SSR Text in Initial HTML Payload) */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-xs space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2E8B8B]">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Got Questions? We Have Answers.
            </h2>
            <p className="text-slate-500 text-sm">
              Here are answers to the most common queries our travelers ask before booking their holiday.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-start gap-2">
                <HelpCircle size={18} className="text-[#2E8B8B] shrink-0 mt-0.5" />
                <span>How quickly will a travel expert respond to my inquiry?</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-6">
                Our team responds to all phone and WhatsApp inquiries instantly during business hours. Online form submissions are replied to promptly with a customized initial proposal.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-start gap-2">
                <HelpCircle size={18} className="text-[#2E8B8B] shrink-0 mt-0.5" />
                <span>Can I customize an itinerary according to my budget?</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-6">
                Yes, absolutely! Every package listed on Flag Journeys can be tailored to suit your specific dates, preferred hotel category (Standard, Deluxe, Luxury), vehicle type, and budget.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-start gap-2">
                <HelpCircle size={18} className="text-[#2E8B8B] shrink-0 mt-0.5" />
                <span>What payment options and cancellation policies do you offer?</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-6">
                We accept secure online card payments, UPI, and bank wire transfers. We offer flexible cancellation policies with full refunds according to our transparent terms.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-start gap-2">
                <HelpCircle size={18} className="text-[#2E8B8B] shrink-0 mt-0.5" />
                <span>Do you provide 24/7 on-trip assistance during our holiday?</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed pl-6">
                Yes! Once your trip is booked, you receive a dedicated tour manager and 24/7 emergency helpline number for smooth coordination throughout your trip across India.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
