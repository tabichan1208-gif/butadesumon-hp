import type { NextConfig } from "next";

const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const nextConfig: NextConfig = {
  images: {
    remotePatterns: storageUrl ? [new URL("/storage/v1/object/public/site-media/**", storageUrl)] : [],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    minimumCacheTTL: 2592000,
    formats: ["image/webp"],
  },
};
export default nextConfig;
