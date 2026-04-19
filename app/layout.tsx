import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Atar — עתר",
  description: "אפליקציית ניהול פרויקטים לקבלני שיפוצים",
  manifest: "/manifest.json",
  applicationName: "Atar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Atar",
  },
};

export const viewport: Viewport = {
  themeColor: "#2463eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
