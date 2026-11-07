import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export const PUBLIC_CONTENT_TAG = "public-content-v1";

// Never share a cookie/session client or service-role client with this cache.
function createPublicClient(projectUrl: string) {
  return createClient(projectUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const readPublicContent = unstable_cache(async (projectUrl: string) => {
  const supabase=createPublicClient(projectUrl);
  const results=await Promise.all([
    supabase.from("site_settings").select("animal_registrations,animal_registration_published,animal_registrant,animal_business_name,animal_business_address,animal_business_type,animal_registration_number,animal_registration_date,animal_registration_expiry,animal_responsible_person,store_name,tagline,business_hours,closed_days,address,phone,instagram_url,parking_capacity,primary_color,background_color,font_family,base_font_size,heading_font_family,heading_font_size,eyebrow_font_size,hero_image_path,hero_mobile_image_path,about_image_path,exterior_image_path,map_url,seo_title,seo_description,seo_keywords,seo_canonical_url,seo_image_path,seo_indexing_enabled").eq("id",true).maybeSingle(),
    supabase.from("site_content").select("section_key,heading,body").eq("published",true),
    supabase.from("pigs").select("id,name,breed,bio,image_path").eq("published",true).order("sort_order"),
    supabase.from("faqs").select("id,question,answer").eq("published",true).order("sort_order"),
    supabase.from("interior_photos").select("id,image_path,caption,published,sort_order").eq("published",true).order("sort_order").order("created_at").order("id"),
    supabase.from("pricing_settings").select("heading,description,note,published").eq("id",true).maybeSingle(),
    supabase.from("pricing_items").select("id,label,price,description").eq("published",true).order("sort_order").order("created_at"),
    supabase.from("business_schedule").select("closed_weekdays,open_time,close_time").eq("id",true).maybeSingle(),
    supabase.from("business_exceptions").select("exception_date,kind,open_time,close_time,note").order("exception_date")
  ]);
  for (const result of results) {
    if (result.error) throw new Error("Public content temporarily unavailable");
  }
  return results;
}, ["public-content-v1"], { revalidate: 3600, tags: [PUBLIC_CONTENT_TAG] });

// Metadata and page share the same result, including on a cold cache.
export const getPublicContent = cache(() => readPublicContent(process.env.NEXT_PUBLIC_SUPABASE_URL!));
