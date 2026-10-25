import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // lets a phone on the laptop's iPhone hotspot (172.20.10.x) load the dev server's scripts and live reload
  allowedDevOrigins: ["172.20.10.3", "172.20.10.*"],
  images: {
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
