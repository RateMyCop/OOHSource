import type { Metadata } from "next";
import { Archivo, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

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
  metadataBase: new URL("https://www.oohsource.com"),
  title: {
    default: "OOHsource — The Global Out-of-Home Directory",
    template: "%s | OOHsource",
  },
  description:
    "The neutral, vetted directory of the world's out-of-home advertising industry — media owners, agencies, printers, installers, and the tech behind them.",
  keywords: [
    "out-of-home advertising",
    "OOH directory",
    "billboard companies",
    "DOOH networks",
    "large-format printers",
    "OOH media owners",
    "outdoor advertising vendors",
    "transit advertising",
  ],
  applicationName: "OOHsource",
  openGraph: {
    type: "website",
    siteName: "OOHsource",
    url: "https://www.oohsource.com",
    title: "OOHsource — The Global Out-of-Home Directory",
    description:
      "The neutral, vetted directory of the world's out-of-home advertising industry.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OOHsource — The Global Out-of-Home Directory",
    description:
      "The neutral, vetted directory of the world's out-of-home advertising industry.",
  },
  robots: { index: true, follow: true },
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
        <Analytics />
      </body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  );
}
