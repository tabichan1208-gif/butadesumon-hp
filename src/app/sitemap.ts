import type { MetadataRoute } from "next";
import { SITE_CANONICAL_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_CANONICAL_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
