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

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
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
