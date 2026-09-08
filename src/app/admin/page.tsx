import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { defaultCopy, defaultSettings } from "@/lib/site-content";
import { defaultEmailSettings } from "@/lib/email-settings";
import { defaultPricingSettings } from "@/lib/pricing";

export const metadata: Metadata = { title: "管理画面｜豚ですもん。", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  const id=user?.id;
  if(!id) redirect("/admin/login");
  const{data:isStaff}=await supabase.rpc("is_staff");
  if(!isStaff) redirect("/admin/login?error=permission");
  const[{data},{data:settingsData},{data:contentData},{data:pigData},{data:faqData},{data:mediaData},interiorResult,emailResult,pricingSettingsResult,pricingItemsResult]=await Promise.all([
    supabase.from("reservations").select("id,reservation_date,start_time,duration_minutes,customer_name,phone,email,note,adults,children,infants,parking,source,status").order("reservation_date").order("start_time"),
    supabase.from("site_settings").select("*").eq("id",true).maybeSingle(),
    supabase.from("site_content").select("section_key,heading,body"),
    supabase.from("pigs").select("id,name,breed,bio,image_path,sort_order,published").order("sort_order"),
    supabase.from("faqs").select("id,question,answer,sort_order,published").order("sort_order"),
    supabase.from("media_assets").select("*").order("created_at",{ascending:false}),
    supabase.from("interior_photos").select("*").order("sort_order").order("created_at").order("id"),
    supabase.from("email_settings").select("customer_email_enabled,customer_subject,customer_body,store_email_enabled,store_notification_email,store_subject,store_body").eq("id",true).maybeSingle(),
    supabase.from("pricing_settings").select("heading,description,note,published").eq("id",true).maybeSingle(),
    supabase.from("pricing_items").select("id,label,price,description,sort_order,published").order("sort_order").order("created_at")
  ]);
  const reservations=(data??[]).map(r=>({id:r.id,date:r.reservation_date,time:r.start_time.slice(0,5),minutes:r.duration_minutes,
    name:r.customer_name,phone:r.phone,email:r.email??"",note:r.note??"",adults:r.adults,children:r.children,
    infants:r.infants,guests:r.adults+r.children+r.infants,parking:r.parking,source:r.source,status:r.status}));
  const settings={...defaultSettings,...settingsData,phone:settingsData?.phone??"",instagram_url:settingsData?.instagram_url??"",hero_image_path:settingsData?.hero_image_path??"",hero_mobile_image_path:settingsData?.hero_mobile_image_path??"",about_image_path:settingsData?.about_image_path??"",exterior_image_path:settingsData?.exterior_image_path??"",map_url:settingsData?.map_url??"",seo_canonical_url:settingsData?.seo_canonical_url??"",seo_image_path:settingsData?.seo_image_path??""};
  const copy={...defaultCopy};
  for(const row of contentData??[])copy[row.section_key]={heading:(row.heading??"").replace(/\\n/g,"\n"),body:(row.body??"").replace(/\\n/g,"\n")};
  return <AdminDashboard pricingSettings={{...defaultPricingSettings,...(pricingSettingsResult.data??{})}} pricingItems={pricingItemsResult.data??[]} emailSettings={{...defaultEmailSettings,...(emailResult.data??{})}} interior={interiorResult.data??[]} interiorError={Boolean(interiorResult.error)} reservations={reservations} settings={settings} copy={copy} pigs={pigData??[]} faqs={faqData??[]} media={(mediaData??[]).filter(item=>!item.deleted_at)}/>;
}
