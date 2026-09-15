import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-provider";
import { SentryErrorBoundary } from "@/components/shared/sentry-error-boundary";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://flagjourneys.com";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-MHMD6R9X";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-BJQ7L9MPX3";
import JsonLd from "@/components/shared/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/jsonLd";
import { ChatWidgetWrapper } from "@/components/shared/ChatWidgetWrapper";
import WhatsAppWidget from "@/components/shared/WhatsAppWidget";
import MobileStickyActionBar from "@/components/shared/MobileStickyActionBar";
import UserActivityTracker from "@/components/shared/UserActivityTracker";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Flag Journeys | Customized Holiday Tour Packages and Cab Rentals",
    template: "%s | Flag Journeys",
  },
  description: "Book customized holiday tour packages, luxury stays, verified cabs, and local tour guides across Kashmir, Kerala, Himachal, Rajasthan and international destinations.",
  openGraph: {
    type: "website",
    siteName: "Flag Journeys",
    locale: "en_IN",
    url: SITE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Flag Journeys" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flag Journeys",
    description: "Customized holiday tour packages and cab rentals across India.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      "/favicon.ico",
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", nunito.variable, "font-sans")}
    >
      <head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', '${GA_ID}');`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans text-[#1C1C1C]">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <AppProviders>
          <SentryErrorBoundary>
            {children}
          </SentryErrorBoundary>
          <ChatWidgetWrapper />
          <WhatsAppWidget />
          <MobileStickyActionBar />
          <UserActivityTracker />
        </AppProviders>
      </body>
    </html>
  );
}
