import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "豚ですもん。｜マイクロブタカフェ",
  description: "マイクロブタさんと、のんびりやさしい時間を。愛知県のふれあいカフェ『豚ですもん。』",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
