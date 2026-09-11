import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { defaultEmailSettings, type EmailSettings } from "@/lib/email-settings";

type ReservationEmailData = {
  id: string;
  date: string;
  time: string;
  duration: number;
  adults: number;
  children: number;
  infants: number;
  parking: boolean;
  name: string;
  phone: string;
  email: string;
  note: string;
};

const htmlEscape = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character] ?? character));

function replacements(reservation: ReservationEmailData) {
  const [year,month,day]=reservation.date.split("-");
  return {
    "{{予約番号}}": reservation.id.split("-")[0].toUpperCase(),
    "{{お名前}}": reservation.name,
    "{{来店日}}": `${year}年${Number(month)}月${Number(day)}日`,
    "{{開始時間}}": reservation.time.slice(0,5),
    "{{利用時間}}": `${reservation.duration}分`,
    "{{人数}}": `合計${reservation.adults+reservation.children+reservation.infants}名（13歳以上 ${reservation.adults}名／3〜12歳 ${reservation.children}名／2歳以下 ${reservation.infants}名）`,
    "{{駐車場}}": reservation.parking ? "利用する（1台）" : "利用しない",
    "{{電話番号}}": reservation.phone,
    "{{メール}}": reservation.email || "未入力",
    "{{備考}}": reservation.note || "なし",
  };
}

function render(template: string, reservation: ReservationEmailData) {
  return Object.entries(replacements(reservation)).reduce((text,[tag,value])=>text.replaceAll(tag,value),template);
}

async function send(to:string,subject:string,body:string) {
  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.EMAIL_FROM;
  if(!apiKey||!from)return {ok:false,reason:"EMAIL_NOT_CONFIGURED"};
  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({from,to:[to],subject,html:`<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.8;white-space:pre-wrap;color:#3f302b">${htmlEscape(body)}</div>`}),
  });
  return {ok:response.ok,reason:response.ok?"":await response.text()};
}

export async function sendReservationEmails(reservation:ReservationEmailData) {
  const admin=createAdminClient();
  if(!admin)return;
  const {data}=await admin.from("email_settings").select("customer_email_enabled,customer_subject,customer_body,store_email_enabled,store_notification_email,store_subject,store_body").eq("id",true).maybeSingle();
  const settings:EmailSettings={...defaultEmailSettings,...(data??{})};
  const messages:Promise<{ok:boolean;reason:string}>[]=[];
  if(settings.customer_email_enabled&&reservation.email)messages.push(send(reservation.email,render(settings.customer_subject,reservation),render(settings.customer_body,reservation)));
  if(settings.store_email_enabled&&settings.store_notification_email)messages.push(send(settings.store_notification_email,render(settings.store_subject,reservation),render(settings.store_body,reservation)));
  const results=await Promise.allSettled(messages);
  for(const result of results){
    if(result.status==="rejected"||!result.value.ok)console.error("Reservation email delivery failed",result.status==="rejected"?result.reason:result.value.reason);
  }
}
