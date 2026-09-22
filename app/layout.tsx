import type { Metadata, Viewport } from "next";
import { Archivo, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// display: "optional" (not "swap") to kill font-swap layout shift (CLS). Each
// font ships a size-adjusted fallback via next/font, so the page renders in that
// close-matching fallback immediately and only upgrades to the brand font if it
// arrives within the ~100ms block window (typical on a warm connection) — no
// mid-view reflow. Cold first visits may briefly show the fallback.
const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "optional",
});
const body = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "optional",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oohsource.com"),
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
    url: "https://oohsource.com",
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#101113" },
  ],
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
