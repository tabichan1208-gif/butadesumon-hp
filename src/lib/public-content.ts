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
    supabase.from("site_settings").select("*").eq("id",true).maybeSingle(),
    supabase.from("site_content").select("section_key,heading,body").eq("published",true),
    supabase.from("pigs").select("id,name,breed,bio,image_path").eq("published",true).order("sort_order"),
    supabase.from("faqs").select("id,question,answer").eq("published",true).order("sort_order"),
    supabase.from("interior_photos").select("*").eq("published",true).order("sort_order").order("created_at").order("id"),
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
