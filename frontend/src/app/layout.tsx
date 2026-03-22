import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import AbyssFooter from "@/components/AbyssFooter";
import { LocaleProvider } from "@/components/LocaleProvider";
import { DemoModeProvider } from "@/components/DemoModeProvider";
import { Geist, Fira_Code } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const firaCode = Fira_Code({subsets:['latin'],variable:'--font-data'});

export const metadata: Metadata = {
  title: "Megladon MD — The Abyss",
  description:
    "AI-powered pharmaceutical price intelligence across Vietnamese pharmacy chains. Landing, dashboard, trends, and Supermemory-backed recall.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, firaCode.variable)}>
      <body className="antialiased bg-abyss text-t1 min-h-screen flex flex-col" suppressHydrationWarning>
        <LocaleProvider>
          <DemoModeProvider>
            <NavBar />
            <main className="flex-1">{children}</main>
            <AbyssFooter />
          </DemoModeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
