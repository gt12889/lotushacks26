import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import AbyssFooter from "@/components/AbyssFooter";

export const metadata: Metadata = {
  title: "MediScrape — The Abyss",
  description: "AI-powered pharmaceutical price intelligence across Vietnamese pharmacy chains",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-abyss text-t1 min-h-screen flex flex-col" suppressHydrationWarning>
        <NavBar />
        <main className="flex-1">{children}</main>
        <AbyssFooter />
      </body>
    </html>
  );
}
