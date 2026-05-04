import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RSG Translate",
    template: "%s · RSG Translate"
  },
  description:
    "Live-Sprachübersetzung für Recruiting-Interviews. Echtzeit-Spracherkennung und Vorlesen in acht Sprachen.",
  applicationName: "RSG Translate",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg"
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    title: "RSG Translate",
    description: "Live-Sprachübersetzung für Recruiting-Interviews.",
    type: "website",
    siteName: "RSG Translate",
    locale: "de_DE"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F766E",
  viewportFit: "cover"
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
