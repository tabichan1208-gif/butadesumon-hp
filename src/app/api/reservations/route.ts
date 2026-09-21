import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return NextResponse.json({ ok: true, demo: true });

  const date=String(body.p_reservation_date??""),start=String(body.p_start_time??"");
  const headers={apikey:key,Authorization:`Bearer ${key}`};
  const [scheduleResponse,exceptionResponse]=await Promise.all([
    fetch(`${url}/rest/v1/business_schedule?id=eq.true&select=closed_weekdays,open_time,close_time`,{headers,cache:"no-store"}),
    fetch(`${url}/rest/v1/business_exceptions?exception_date=eq.${encodeURIComponent(date)}&select=kind,open_time,close_time`,{headers,cache:"no-store"})
  ]);
  if(scheduleResponse.ok&&exceptionResponse.ok){const schedule=(await scheduleResponse.json())[0],exception=(await exceptionResponse.json())[0];if(schedule){const day=new Date(`${date}T12:00:00Z`).getUTCDay()||7;if(exception?.kind==="CLOSED"||(!exception&&schedule.closed_weekdays.includes(day)))return NextResponse.json({ok:false,code:"CLOSED_DAY"},{status:400});const open=(exception?.kind==="OPEN"?exception.open_time:schedule.open_time).slice(0,5),close=(exception?.kind==="OPEN"?exception.close_time:schedule.close_time).slice(0,5);const minutes=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3,5));if(minutes(start)<minutes(open)||minutes(start)+Number(body.p_duration_minutes)>minutes(close))return NextResponse.json({ok:false,code:"BUSINESS_HOURS"},{status:400});}}

  const response = await fetch(`${url}/rest/v1/rpc/create_public_reservation`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const code = String(error?.message ?? "RESERVATION_FAILED");
    return NextResponse.json({ ok: false, code }, { status: code.includes("CAPACITY") || code.includes("PARKING") ? 409 : 400 });
  }
  return NextResponse.json({ ok: true, id: await response.json() });
}
