import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secret Scanner - Find Leaked API Keys in Your GitHub Repos | APIVault",
  description: "Free tool to scan your GitHub repositories for exposed secrets, API keys, and credentials. Secure your codebase with APIVault.",
  keywords: "secret scanner, API key leak detector, GitHub security, exposed secrets, credential scanner",
  openGraph: {
    title: "Secret Scanner - Find Leaked API Keys",
    description: "Free tool to scan your GitHub repositories for exposed secrets and API keys.",
    type: "website",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
