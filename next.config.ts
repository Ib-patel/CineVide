import type { NextConfig } from "next";

// React Refresh needs eval in development only; production scripts never do.
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Embed players (YouTube, stream embeds and CDN mirrors).
      `script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com${isDev ? " 'unsafe-eval'" : ""}`,
      "frame-src 'self' https: http: blob: data:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://image.tmdb.org https://archive.org https://*.archive.org https://i.ytimg.com",
      // Licensed streams can come from any HTTPS CDN (hls.js fetches manifests/segments via XHR);
      // plain http is only allowed in development.
      `media-src 'self' blob: data: https:${isDev ? " http:" : ""}`,
      `connect-src 'self' https:${isDev ? " http: ws:" : ""}`,
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/**",
      },
      // Internet Archive stills/tiles (download URLs redirect to *.archive.org nodes).
      {
        protocol: "https",
        hostname: "archive.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.archive.org",
        port: "",
        pathname: "/**",
      },
      // Episode thumbnails for series streamed from official YouTube channels.
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/vi/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
