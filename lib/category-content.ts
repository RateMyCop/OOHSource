import { CategorySlug } from "./types";

// SEO/content for the category hub pages. These pages pull large impression
// volume for high-intent head terms ("outdoor advertising companies", "media
// buying agency", "billboard companies", "DOOH advertising companies") but
// historically ranked deep because the pages were thin. This gives each hub a
// keyword-targeted title/H1, real intro copy, and an FAQ block (also emitted as
// FAQPage structured data) so the pages have substance to rank and earn clicks.
export type CategoryContent = {
  seoTitle: string; // built <title> part; " | OOHsource" (12 chars) is appended
  seoDescription: string;
  heading: string; // keyword-rich H1
  intro: string[]; // substantive paragraphs
  faqs: { q: string; a: string }[];
};

export const CATEGORY_CONTENT: Record<CategorySlug, CategoryContent> = {
  "media-owners-operators": {
    seoTitle: "Billboard & Outdoor Advertising Companies",
    seoDescription:
      "Browse outdoor advertising companies and billboard operators — media owners running billboards, transit, street furniture, place-based and DOOH screen networks worldwide.",
    heading: "Outdoor advertising companies & billboard operators",
    intro: [
      "Media owners and operators are the out-of-home advertising companies that actually own the inventory — the billboards, transit frames, street furniture, place-based screens and digital out-of-home (DOOH) networks your campaign runs on. This is where buyers start when they need roadside bulletins, posters, transit wraps, or digital screens in a specific market.",
      "The directory lists everything from the large national billboard companies to independent regional operators and specialist place-based and DOOH networks. Every listing shows the formats a company runs, the markets it covers and how to reach it directly — no broker in the middle — so you can shortlist the right out-of-home advertising companies for a brief in minutes.",
    ],
    faqs: [
      {
        q: "What is an out-of-home media owner?",
        a: "A media owner (or operator) is a company that owns and sells out-of-home advertising inventory — billboards, transit, street furniture, place-based or digital screens. They control the physical locations, unlike an agency that plans and buys across many owners on a brand's behalf.",
      },
      {
        q: "How do I find billboard companies in a specific city?",
        a: "Use the directory filters to narrow by market and format, or browse a company's profile to see the coverage and formats it offers. Many operators are regional, so a market-specific search usually surfaces the independent billboard companies that national lists miss.",
      },
      {
        q: "What's the difference between a billboard company and a DOOH network?",
        a: "A traditional billboard company sells static or digital roadside bulletins and posters. A DOOH (digital out-of-home) network operates connected digital screens — in transit, retail, offices or on the street — often sold programmatically by audience and daypart rather than by fixed location.",
      },
    ],
  },
  "agencies-buyers": {
    seoTitle: "OOH Media Buying & Planning Agencies",
    seoDescription:
      "Find out-of-home advertising agencies and media buyers — OOH specialist agencies, media planning & buying, and programmatic DOOH partners who run campaigns for brands.",
    heading: "Out-of-home advertising agencies & media buyers",
    intro: [
      "An out-of-home advertising agency plans and buys OOH on behalf of brands — handling strategy, market and format selection, negotiation with media owners, and campaign execution. Where a media owner sells its own inventory, a media buying agency works across every owner to assemble the best plan for a brief and budget.",
      "This category covers OOH specialist agencies, full-service media planning and buying agencies, and programmatic DOOH partners. Use it to shortlist a media buying agency by coverage and specialism, then contact them directly to brief your out-of-home or digital out-of-home campaign.",
    ],
    faqs: [
      {
        q: "What does an out-of-home media buying agency do?",
        a: "A media buying agency plans and purchases out-of-home advertising for brands: it sets strategy, selects markets and formats, negotiates rates with media owners, books and traffics the campaign, and reports on delivery. It represents the advertiser's interests across many media owners.",
      },
      {
        q: "What's the difference between media planning and media buying?",
        a: "Media planning decides what to run — the audience, markets, formats and budget split that will meet the objective. Media buying executes that plan — negotiating, booking and managing the inventory with media owners. Most OOH agencies offer both as media planning and buying.",
      },
      {
        q: "Do I need an agency to buy out-of-home advertising?",
        a: "No — you can buy directly from media owners listed in the directory. But an OOH agency adds value on multi-market campaigns, programmatic DOOH, and when you want one partner to plan, negotiate and manage everything end to end.",
      },
    ],
  },
  "technology-data": {
    seoTitle: "DOOH Ad-Tech & Digital Out-of-Home Companies",
    seoDescription:
      "Digital out-of-home advertising technology and data companies — DOOH SSPs and DSPs, measurement and attribution, audience data, and screen content-management platforms.",
    heading: "DOOH advertising technology & data companies",
    intro: [
      "The technology and data layer is what makes modern digital out-of-home (DOOH) advertising programmatic and measurable. These are the DOOH advertising companies behind the screens: supply- and demand-side platforms (SSPs and DSPs), measurement and attribution providers, audience-data and planning tools, and the content-management systems that run the displays.",
      "Brands and agencies use these partners to buy DOOH by audience and daypart, verify delivery, and connect out-of-home to the rest of the media plan. Browse the category to compare digital out-of-home advertising companies by what they do — buying, measurement, data or screen software — and reach them directly.",
    ],
    faqs: [
      {
        q: "What is programmatic DOOH?",
        a: "Programmatic digital out-of-home is the automated buying and selling of DOOH screen time through a DSP and SSP, triggered by audience, location and daypart rather than fixed long-term contracts. It lets advertisers buy digital out-of-home much like online display.",
      },
      {
        q: "How is out-of-home advertising measured?",
        a: "OOH and DOOH measurement companies estimate impressions and audiences using a mix of traffic and mobility data, panel data and location signals, and increasingly tie exposure to outcomes such as store visits or conversions through attribution studies.",
      },
      {
        q: "What's the difference between a DOOH SSP and DSP?",
        a: "An SSP (supply-side platform) represents the media owner, making their screen inventory available programmatically. A DSP (demand-side platform) represents the buyer, used by agencies and brands to bid on and buy that inventory across many networks.",
      },
    ],
  },
  "printing-production": {
    seoTitle: "Large-Format & Billboard Printing Companies",
    seoDescription:
      "Large-format and billboard printers for out-of-home advertising — wide-format, vinyl and banner, and fabric & mesh production companies that make the physical media.",
    heading: "Large-format & billboard printing companies",
    intro: [
      "Printing and production companies make the physical out-of-home media — the billboard vinyls, posters, banners, wraps and fabric graphics that go up on structures and screens. If you have artwork and need it produced at scale and on time, this is the category.",
      "It covers large- and wide-format printers, vinyl and banner specialists, and fabric and mesh producers. Many also handle finishing and ship direct to installers. Compare printers by capability and location and contact them directly to quote a production run.",
    ],
    faqs: [
      {
        q: "What is large-format printing for out-of-home?",
        a: "Large-format printing produces the oversized graphics used in out-of-home advertising — billboard vinyls, bulletins, posters, building wraps and banners — on wide-format presses using durable, weather-resistant inks and substrates.",
      },
      {
        q: "What materials are billboards printed on?",
        a: "Common substrates include PVC/vinyl for bulletins and wraps, paper for posters, and polyester fabric or mesh for tension-frame and wind-permeable applications. The right material depends on the structure, display duration and weather exposure.",
      },
      {
        q: "Do printers also install the media?",
        a: "Some do, but printing and installation are often separate. Many printers partner with — or ship directly to — the installation and fabrication companies also listed in the directory.",
      },
    ],
  },
  "installation-fabrication": {
    seoTitle: "Billboard Installation & Sign Fabrication",
    seoDescription:
      "Billboard installation and sign fabrication companies for out-of-home — installers and hangers, sign fabricators and structure builders, and permitting & site services.",
    heading: "Billboard installation & sign fabrication companies",
    intro: [
      "Installation and fabrication companies build, install and service out-of-home media. They hang billboard vinyls and posters, fabricate signs and display structures, and handle the permitting and site work that gets a display legally in the ground and lit.",
      "The category spans installers and hangers, sign and structure fabricators, and permitting and site-services firms. Browse by capability and market to find a crew that can build or service your out-of-home sites, and contact them directly.",
    ],
    faqs: [
      {
        q: "What does an out-of-home installation company do?",
        a: "An installation company physically mounts out-of-home media — hanging billboard vinyls and posters, applying wraps, and installing or servicing signs and digital displays, often working at height with specialist equipment.",
      },
      {
        q: "What is sign fabrication?",
        a: "Sign fabrication is the manufacture of the physical sign or display — from structural steel and cabinets to faces and LED hardware — built to engineering and permit specifications before installation on site.",
      },
      {
        q: "Who handles permitting for a new billboard?",
        a: "Permitting is usually handled by the media owner or a specialist site-services firm, which manages zoning, structural permits and inspections. Several permitting and site-services companies are listed in this category.",
      },
    ],
  },
  "creative-design": {
    seoTitle: "Out-of-Home Creative & Design Studios",
    seoDescription:
      "Out-of-home creative and design agencies — OOH creative studios and campaign & production-art partners that concept and design billboard and DOOH campaigns.",
    heading: "Out-of-home creative & design agencies",
    intro: [
      "Creative and design companies concept and design out-of-home campaigns — turning a brief into billboard, transit and digital out-of-home executions that work at a glance and at scale. Good OOH creative is built for a few seconds of attention, big formats and bold type.",
      "This category covers OOH creative studios and campaign and production-art partners who prepare artwork for production and placement. Compare studios by specialism and reach out directly to brief a campaign.",
    ],
    faqs: [
      {
        q: "What makes good out-of-home creative?",
        a: "Effective OOH creative is simple and legible at a distance and a glance — a single clear idea, minimal copy, strong contrast and large type — designed for the format and the few seconds a viewer actually sees it.",
      },
      {
        q: "Do OOH creative studios also produce the artwork?",
        a: "Many do. Beyond concept and design, production-art partners prepare press-ready files to each media owner's and printer's specifications so the creative reproduces correctly across formats.",
      },
      {
        q: "Can one studio handle billboards and digital out-of-home?",
        a: "Yes — most OOH creative studios design across static and digital out-of-home, adapting a single campaign idea into billboards, transit, posters and animated DOOH executions.",
      },
    ],
  },
};
