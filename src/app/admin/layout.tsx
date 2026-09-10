import type { Metadata, Viewport } from "next";
import { AdminAppShell } from "@/components/admin-app-shell";

export const metadata: Metadata = {
  applicationName: "豚ですもん。管理",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "豚ですもん。管理", statusBarStyle: "default" },
  icons: { apple: "/app-icon/180", icon: "/app-icon/192" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#533b35",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAppShell>{children}</AdminAppShell>;
}
