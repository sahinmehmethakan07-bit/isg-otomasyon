import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "İSG Otomasyon",
  description: "İş Sağlığı ve Güvenliği Yönetim Sistemi",
  manifest: "/manifest.json",
};

/* ── Viewport meta — mobil uyumluluk için zorunlu ── */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f3460",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
