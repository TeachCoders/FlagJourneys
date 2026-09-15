import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["isomorphic-dompurify"],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      ...(process.env.NODE_ENV !== "production"
        ? [{ protocol: "http" as const, hostname: "localhost" }]
        : []),
    ],
  },
  async redirects() {
    return [
      {
        source: "/destinations",
        destination: "/tour-packages",
        permanent: true,
      },
    ];
  },
  async headers() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/^https?:\/\//, "") || "api.flagjourneys.com";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
        ],
      },
      {
        source: "/",
        headers: [
          { key: "Link", value: `<https://${apiOrigin}>; rel=preconnect` },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.API_BASE_URL || "http://localhost:5000";
    // Public image folders are served locally by the backend (Backend/public).
    // In production nginx serves these via the site's own domain; locally the
    // backend serves them from disk, so we proxy the same folders there.
    const cdn = backendUrl;
    const cdnFolders = [
      "content",
      "india-tour",
      "indai",
      "india",
      "spiritual",
      "wildlife",
      "taj-mahal",
      "desert-safari",
      "golden-triangle",
      "heritage-and-culture",
      "hill-station",
      "honeymoon",
      "ayurveda-yoga",
      "quotations",
      "3-days-delhit-agra-jaipur-tirp-golden-triangle",
    ];
    return [
      ...cdnFolders.map((folder) => ({
        source: `/${folder}/:path*`,
        destination: `${cdn}/${folder}/:path*`,
      })),
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
      {
        source: "/quotations/:path*",
        destination: `${backendUrl}/quotations/:path*`,
      },
      {
        source: "/:path*\\.:ext(webp|jpg|jpeg|png|gif|svg|pdf|docx|doc)",
        destination: `${backendUrl}/:path*.:ext`,
      },
    ];
  },
};

export default nextConfig;
