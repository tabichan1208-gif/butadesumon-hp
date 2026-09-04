import { publicImageUrl } from "./site-content";

type ImageSettings = { hero_image_path?: string | null; hero_mobile_image_path?: string | null; about_image_path?: string | null };
type ImagePig = { name: string; image_path: string | null; published: boolean };

export function mediaUsage(path: string, settings: ImageSettings, pigs: ImagePig[], interior: {image_path:string;caption:string;published:boolean}[] = []): string[] {
  const same = (other?: string | null) => Boolean(other) && (other === path || publicImageUrl(other!) === publicImageUrl(path));
  const places: string[] = [];
  if (same(settings.hero_image_path)) {
    places.push("メインビジュアル（PC）");
    if (!settings.hero_mobile_image_path) places.push("メインビジュアル（スマホ・PC写真を共用）");
  }
  if (same(settings.hero_mobile_image_path)) places.push("メインビジュアル（スマホ）");
  if (same(settings.about_image_path)) places.push("店舗紹介");
  for (const pig of pigs) if (same(pig.image_path)) places.push(`こぶた紹介：${pig.name}${pig.published ? "" : "（非公開）"}`);
  for (const photo of interior) if (same(photo.image_path)) places.push(`店内のようす：${photo.caption || "店内写真"}${photo.published ? "" : "（非公開）"}`);
  return places;
}
