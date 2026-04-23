import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { Analytics } from "@/components/analytics";

export const metadata: Metadata = {
  title: "אתר — ניהול אתרי בנייה",
  description: "אפליקציית ניהול פרויקטים לקבלני שיפוצים — יומן, הוצאות ולקוחות במקום אחד",
  manifest: "/manifest.json",
  applicationName: "Atar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "אתר",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
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
        <div className="phone-frame">{children}</div>
        <Toaster />
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
