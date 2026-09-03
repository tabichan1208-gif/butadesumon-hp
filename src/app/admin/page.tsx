import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "管理画面｜豚ですもん。", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  const id=user?.id;
  if(!id) redirect("/admin/login");
  const{data:isStaff}=await supabase.rpc("is_staff");
  if(!isStaff) redirect("/admin/login?error=permission");
  const{data}=await supabase.from("reservations").select("start_time,duration_minutes,customer_name,adults,children,infants,parking,source").neq("status","CANCELLED").order("start_time");
  const reservations=(data??[]).map(r=>({time:r.start_time.slice(0,5),minutes:r.duration_minutes,name:r.customer_name,guests:r.adults+r.children+r.infants,parking:r.parking,source:r.source}));
  return <AdminDashboard reservations={reservations}/>;
}
