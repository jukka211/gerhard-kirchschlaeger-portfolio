import type { Metadata } from "next";
import { SanityLive } from "@/sanity/lib/live";
import SanityLiveGate from "./SanityLiveGate";
import "./globals.css";

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
        {children}
        <SanityLiveGate>
          <SanityLive />
        </SanityLiveGate>
      </body>
    </html>
  );
}
