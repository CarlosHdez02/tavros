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

export const metadata: Metadata = {
  title: "Tavros",
  description: "Tavros fuerza y acondicionamiento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#0f1419]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f1419] min-h-screen`}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
