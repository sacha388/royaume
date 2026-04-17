import type { Metadata } from "next";
import type { Viewport } from "next";
import { ProfileProvider } from "@/components/auth/profile-context";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Royaume",
  title: {
    default: "Royaume",
    template: "%s · Royaume",
  },
  description: "Un espace privé, calme et mobile pour deux.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Royaume",
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f3e8e2",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
