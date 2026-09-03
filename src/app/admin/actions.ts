"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message: string };

async function getStaffClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isStaff } = await supabase.rpc("is_staff");
  return isStaff ? supabase : null;
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function messageFor(error: string) {
  if (error.includes("CAPACITY_EXCEEDED")) return "同じ時間帯の店内人数が8名を超えるため保存できません。";
  if (error.includes("PARKING_UNAVAILABLE")) return "同じ時間帯に駐車場を利用する予約があります。";
  if (error.includes("INVALID_RESERVATION")) return "入力内容を確認してください。";
  return "予約を保存できませんでした。もう一度お試しください。";
}

export async function saveReservation(formData: FormData): Promise<ActionResult> {
  const supabase = await getStaffClient();
  if (!supabase) return { ok: false, message: "ログインが切れました。再度ログインしてください。" };
  const { error } = await supabase.rpc("upsert_staff_reservation", {
    p_id: text(formData, "id") || null,
    p_reservation_date: text(formData, "reservation_date"), p_start_time: text(formData, "start_time"),
    p_duration_minutes: Number(formData.get("duration_minutes")), p_adults: Number(formData.get("adults")),
    p_children: Number(formData.get("children")), p_infants: Number(formData.get("infants")),
    p_parking: formData.get("parking") === "on", p_customer_name: text(formData, "customer_name"),
    p_phone: text(formData, "phone"), p_email: text(formData, "email") || null,
    p_note: text(formData, "note") || null, p_source: text(formData, "source"),
  });
  if (error) return { ok: false, message: messageFor(error.message) };
  revalidatePath("/admin");
  return { ok: true, message: "予約を保存しました。" };
}

export async function cancelReservation(id: string): Promise<ActionResult> {
  const supabase = await getStaffClient();
  if (!supabase) return { ok: false, message: "ログインが切れました。再度ログインしてください。" };
  const { error } = await supabase.from("reservations").update({ status: "CANCELLED" }).eq("id", id);
  if (error) return { ok: false, message: "予約をキャンセルできませんでした。" };
  revalidatePath("/admin");
  return { ok: true, message: "予約をキャンセルしました。" };
}
