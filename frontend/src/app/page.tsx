import React from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

import HomePageClient from "@/feature/home/components/HomePageClient";
import JsonLd from "@/components/shared/JsonLd";
import { faqSchema } from "@/lib/jsonLd";
import { HOME_FAQS } from "@/lib/homeFaqs";
import { fetchPublicJson } from "@/feature/destinations/api/public-server";
import type { Metadata } from "next";
import type { State, PaginatedResponse as StatePage } from "@/feature/state/type";
import type { City, PaginatedResponse as CityPage } from "@/feature/city/type";
import type { Journey, PaginatedResponse as JourneyPage } from "@/feature/journey/type";
import type { Season, PaginatedResponse as SeasonPage } from "@/feature/season/type";

export const revalidate = 60;

export const metadata: Metadata = {
  metadataBase: new URL("https://flagjourneys.com"),
  title: "Flag Journeys | Premier India Inbound Tour Operator & Local DMC",
  description:
    "Leading India Inbound Tour Operator offering bespoke luxury tours, private car rentals, certified local guides, and custom holiday packages across India for international travelers.",
  alternates: { canonical: "https://flagjourneys.com" },
  openGraph: {
    title: "Flag Journeys | Premier India Inbound Tour Operator & Local DMC",
    description:
      "Bespoke India holiday packages, private luxury transport, and local tour guides for international tourists.",
    url: "https://flagjourneys.com",
    siteName: "Flag Journeys India",
    locale: "en_US", // International inbound clients target karne ke liye en_US optimal hai
    type: "website",
  },
  other: {
    "geo.region": "IN",
    "geo.placename": "India",
  },
};;

export default async function Home() {
  const [initialStates, initialCities, initialJourneys, initialSeasons] = await Promise.all([
    fetchPublicJson<StatePage<State>>("/state?limit=100&isActive=true"),
    fetchPublicJson<CityPage<City>>("/city?limit=1000&isActive=true"),
    fetchPublicJson<JourneyPage<Journey>>("/journey?limit=100&isActive=true"),
    fetchPublicJson<SeasonPage<Season>>("/season?limit=100&isActive=true"),
  ]);
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans">
      <JsonLd data={faqSchema(HOME_FAQS)} />
      <Header />
      <main className="flex-1">
        <HomePageClient
          initialStates={initialStates}
          initialCities={initialCities}
          initialJourneys={initialJourneys}
          initialSeasons={initialSeasons}
        />
      </main>
      <Footer />

    </div>
  );
}
