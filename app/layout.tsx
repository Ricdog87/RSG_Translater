import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSG Translate",
  description: "Push-to-talk Simultan-Übersetzung für Recruiting-Interviews",
  applicationName: "RSG Translate",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RSG Translate"
  },
  icons: {
    icon: "/icon.svg"
  },
  openGraph: {
    title: "RSG Translate",
    description: "Push-to-talk Simultan-Übersetzung für Recruiting-Interviews",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f5f5f7"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
