import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Add manifest, icons, and theme color
export const metadata = {
  title: "StockWell App",
  description: "Order management system",
  manifest: "/manifest.json",
  themeColor: "#008000",
};

export const viewport = {
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Fallbacks in case metadata is skipped */}
        <link rel="manifest" href="/manifest.json" />                
        <link rel="apple-touch-icon" href="/public/faviconv1.ico" />
        <link rel="icon" href="/faviconv1.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
