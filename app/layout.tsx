import type { Metadata } from "next";
import { Archivo, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const body = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OOHsource — The Global Out-of-Home Directory",
  description:
    "The neutral, vetted directory of the world's out-of-home advertising industry — media owners, agencies, printers, installers, and the tech behind them.",
};

const themeInit = `(function(){try{var t=localStorage.getItem('oohs-theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
