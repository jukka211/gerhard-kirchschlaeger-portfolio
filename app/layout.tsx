import type { Metadata } from "next";
import { SanityLive } from "@/sanity/lib/live";
import SanityLiveGate from "./SanityLiveGate";
import TypeTester from "@/components/TypeTester";
import { PageModesProvider } from "@/components/PageModesContext";
import { SlideshowProvider } from "@/components/SlideshowContext";
import "./globals.css";
import "@/components/type-tester.css";

export const metadata: Metadata = {
  title: "Gerhard Kirchschlaeger",
  description: "Portfolio, about, play, fonts and legal pages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PageModesProvider>
          <SlideshowProvider>
            {children}
            <TypeTester />
          </SlideshowProvider>
        </PageModesProvider>
        <SanityLiveGate>
          <SanityLive />
        </SanityLiveGate>
      </body>
    </html>
  );
}
