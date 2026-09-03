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
  const{data}=await supabase.from("reservations")
    .select("id,reservation_date,start_time,duration_minutes,customer_name,phone,email,note,adults,children,infants,parking,source,status")
    .neq("status","CANCELLED").order("reservation_date").order("start_time");
  const reservations=(data??[]).map(r=>({id:r.id,date:r.reservation_date,time:r.start_time.slice(0,5),minutes:r.duration_minutes,
    name:r.customer_name,phone:r.phone,email:r.email??"",note:r.note??"",adults:r.adults,children:r.children,
    infants:r.infants,guests:r.adults+r.children+r.infants,parking:r.parking,source:r.source,status:r.status}));
  return <AdminDashboard reservations={reservations}/>;
}
