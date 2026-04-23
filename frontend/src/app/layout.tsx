import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | ContextWeaver",
    default: "ContextWeaver | Dynamic In-Context Learning Router",
  },
  description: "High-performance dynamic in-context learning router and annotation pipeline. Optimize LLM accuracy through visual transparency and real-time visualization.",
  keywords: ["ContextWeaver", "LLM", "In-Context Learning", "Annotation", "AI"],
  authors: [{ name: "ContextWeaver Team" }],
  creator: "ContextWeaver",
  metadataBase: new URL("https://contextweaver.app"), // Replace with actual production domain when available
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
