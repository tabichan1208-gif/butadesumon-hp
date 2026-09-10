import { ImageResponse } from "next/og";

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: value } = await params;
  if (!["180", "192", "512"].includes(value)) return new Response("Not found", { status: 404 });
  const size = Number(value);
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#533b35", alignItems: "center", justifyContent: "center" }}>
      <svg width={size * .72} height={size * .72} viewBox="0 0 100 100">
        <path d="M19 39 L13 15 Q30 12 37 29 M63 29 Q70 12 87 15 L81 39" fill="#e8b6b0"/>
        <ellipse cx="50" cy="54" rx="37" ry="32" fill="#f4dfd9"/>
        <circle cx="35" cy="46" r="3" fill="#533b35"/><circle cx="65" cy="46" r="3" fill="#533b35"/>
        <ellipse cx="50" cy="65" rx="17" ry="12" fill="#b75d64"/>
        <ellipse cx="44" cy="65" rx="2.5" ry="4" fill="#533b35"/><ellipse cx="56" cy="65" rx="2.5" ry="4" fill="#533b35"/>
      </svg>
    </div>, { width: size, height: size });
}
