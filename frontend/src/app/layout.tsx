import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_SC, Orbitron } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import LaunchTransition from "@/components/LaunchTransition";

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

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
          <LaunchTransition />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
