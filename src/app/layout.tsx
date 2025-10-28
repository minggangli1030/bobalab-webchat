import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rating Platform - BOBALAB",
  description:
    "A Berkeley Operations and Behavioral Analytics Lab (BOBALAB) platform for sharing ideas and connecting with others",
  openGraph: {
    title: "Rating Platform - BOBALAB",
    description: "A Berkeley Operations and Behavioral Analytics Lab (BOBALAB) platform for sharing ideas and connecting with others",
    type: "website",
    siteName: "BOBALAB Rating Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rating Platform - BOBALAB",
    description: "A Berkeley Operations and Behavioral Analytics Lab (BOBALAB) platform for sharing ideas and connecting with others",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
