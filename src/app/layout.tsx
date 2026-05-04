import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AIBubble } from "@/components/AIBubble";
import { Nav } from "@/components/Nav";
import { Providers } from "@/app/providers";
import { PWAHandler } from "@/components/PWAHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keeper AI - Your Document Assistant",
  description: "Automate paperwork with AI extraction, document review, Drive filing, and reminders.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Keeper AI",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-bg-main antialiased`}>
        <Providers>
          <PWAHandler />
          <Nav />
          {children}
          <AIBubble />
        </Providers>
      </body>
    </html>
  );
}
