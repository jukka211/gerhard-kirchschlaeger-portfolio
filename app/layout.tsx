import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gerhard Kirchschläger",
  description: "Portfolio website for Gerhard Kirchschläger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}