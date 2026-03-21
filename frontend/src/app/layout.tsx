import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "MediScrape - Pharmaceutical Price Intelligence",
  description: "AI-powered drug price comparison across Vietnamese pharmacy chains",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
