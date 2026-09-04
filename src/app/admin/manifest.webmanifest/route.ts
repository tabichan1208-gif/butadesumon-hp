import type { MetadataRoute } from "next";

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    id: "/admin", name: "豚ですもん。店舗管理", short_name: "豚ですもん。",
    description: "予約と駐車場を確認するオンライン専用の店舗管理アプリ",
    lang: "ja", start_url: "/admin", scope: "/admin", display: "standalone",
    background_color: "#f6f4f0", theme_color: "#533b35",
    icons: [192, 512].map(size => ({
      src: `/app-icon/${size}`, sizes: `${size}x${size}`, type: "image/png", purpose: "any",
    })),
  };
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } });
}
