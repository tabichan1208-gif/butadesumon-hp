import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return NextResponse.json({ ok: true, demo: true });

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
