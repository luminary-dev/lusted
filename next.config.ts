import type { NextConfig } from "next";

// The photos are served from the site's own origin (/img, read from a private R2 bucket — src/app/img). Only when
// NEXT_PUBLIC_IMAGE_CDN names a public address instead does next/image need that host allowed.
const imageCdn = process.env.NEXT_PUBLIC_IMAGE_CDN ? new URL(process.env.NEXT_PUBLIC_IMAGE_CDN) : null;

// Security headers on every response. The content security policy allows only the site itself; images come from the
// site (the photo route) and data/blob URLs (next/image's blur placeholders, canvases); scripts and styles are allowed
// inline because Next's hydration scripts, the theme/intro scripts in layout.tsx and the component styles are inline —
// a per-request nonce would make every page dynamic. frame-ancestors 'none' stops the site being framed; form-action
// keeps forms on the site. HSTS is set by Vercel.
// 'unsafe-eval' only while developing: React's dev tooling (stack reconstruction) wants eval, production never does
const dev = process.env.NODE_ENV === "development";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const consoleHeaders = [
  { key: "Content-Security-Policy", value: csp.replace("connect-src 'self'", "connect-src 'self' https://*.r2.cloudflarestorage.com") },
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // the owner console (src/app/admin): never cached, never indexed, and its browser puts photos straight into the
      // bucket (src/lib/admin/r2.ts), so its connect-src also allows the bucket's address
      { source: "/admin", headers: consoleHeaders },
      { source: "/admin/:path*", headers: consoleHeaders },
      { source: "/api/admin/:path*", headers: consoleHeaders },
    ];
  },
  partialPrefetching: true,
  // lets a phone on the laptop's iPhone hotspot (172.20.10.x) load the dev server's scripts and live reload
  allowedDevOrigins: ["172.20.10.3", "172.20.10.*"],
  images: {
    remotePatterns: imageCdn ? [{ protocol: imageCdn.protocol.replace(":", "") as "http" | "https", hostname: imageCdn.hostname, port: imageCdn.port }] : [],
    // AVIF first (about a third smaller than WebP for these soft, diffused photos at the same look; Next lowers the
    // AVIF quality by 20 under the hood, so q90 is AVIF 70), WebP where a browser can't take it.
    formats: ["image/avif", "image/webp"],
    // 90 is used for photography so the optimiser doesn't soften the 4K sources.
    qualities: [75, 90],
    // hero + collection photos are 4096 px (AI-upscaled) so Retina screens get full detail
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2880, 3840],
  },
};

export default nextConfig;
