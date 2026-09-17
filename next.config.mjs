/** @type {import('next').NextConfig} */

// Hosts that vendor hero images (og:image + WordPress mShots screenshots) are
// served from. Listing them lets Next/Vercel optimize + edge-cache each image
// (AVIF/WebP, right-sized) instead of hotlinking slow third-party origins.
const heroHosts = [
  "s.wordpress.com",
  "cdn.prod.website-files.com",
  "static1.squarespace.com",
  "framerusercontent.com",
  "www.captivate.com",
  "oohmc.com",
  "www.viooh.com",
  "www.vistarmedia.com",
  "www.yodeck.com",
  "fossilgraphics.com",
  "www.meadowoutdoor.com",
  "scottyoutdoor.com",
  "admobilize.com",
  "static.wixstatic.com",
  "screencloud.com",
  "www.norton-outdoor.com",
  "kegerreis.com",
  "grocerytv.com",
  "images.prismic.io",
  "www.blipbillboards.com",
  "patientpoint.com",
  "www.comscore.com",
  "www.adamsoutdoor.com",
  "graphichouseinc.com",
  "www.signvalue.com",
  "broadsign.com",
  "trueimpactmedia.com",
  "chilemedia.com",
  "vealeoutdooradvertising.com",
  "www.adomni.com",
  "navori.com",
  "www.fencescreen.com",
  "dashtwo.com",
  "www.scoutservices.com",
  "www.momentara.com",
  "signsny.com",
  "absolutesigngroup.com",
  "gorillaprinting.com",
];

// Content-Security-Policy, scoped to what the site actually loads:
//  - scripts: our own + inline (Next hydration/flight, GA init) + Google Tag Manager
//  - images: any https host (vendor logos/heroes come from arbitrary domains) + data/blob
//  - connect: GA endpoints (Vercel Analytics beacons to same-origin /_vercel)
//  - frames/forms: Stripe checkout
// Kept permissive enough not to break third parties; object-src/base-uri/
// frame-ancestors/form-action still close the common attack vectors.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "script-src 'self' 'unsafe-inline' https://*.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Renamed to the generic "wheat pasting" (avoid genericizing the Wild
      // Posting® trademark). 301 so the indexed old URL passes its SEO across.
      {
        source: "/formats/wild-posting",
        destination: "/formats/wheat-pasting",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      ...heroHosts.map((hostname) => ({ protocol: "https", hostname })),
      // CDN families (hashed/rotating subdomains) — cover future images too.
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.website-files.com" },
      { protocol: "https", hostname: "**.squarespace.com" },
      { protocol: "https", hostname: "**.wixstatic.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.prismic.io" },
    ],
  },
};

export default nextConfig;
