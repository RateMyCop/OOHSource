# OOHsource

The neutral, vetted directory of the world's out-of-home (OOH) advertising industry —
media owners, agencies, printers, installers, and the technology behind them.

Built with **Next.js (App Router) + TypeScript**. Deployed on **Vercel**.

## Stack
- Next.js 14 (App Router, React Server Components)
- TypeScript
- Plain CSS design system (`app/globals.css`) with light/dark tokens
- Fonts via `next/font` — Archivo (display), Newsreader (body), IBM Plex Mono (labels)

## Project structure
```
app/
  layout.tsx                 root layout, fonts, header/footer, theme
  page.tsx                   landing page
  globals.css                design system + tokens
  directory/
    page.tsx                 searchable directory (server shell)
    DirectoryClient.tsx      client-side filtering (category × format × search × verified)
    [slug]/page.tsx          individual vendor profile
  category/[category]/page.tsx   category listing (SEO long-tail pages)
  list-your-company/page.tsx     vendor submission form
  not-found.tsx
components/
  Header.tsx  Footer.tsx  ThemeToggle.tsx  VendorCard.tsx
lib/
  types.ts   data.ts        seed data + taxonomy (edit here to add listings)
```

## Local development
Requires Node.js 18+.
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Editing the directory data
All listings and categories live in `lib/data.ts`. Add a `Vendor` object to the
`VENDORS` array to add a company. `verified` should stay `false` until the details
are confirmed from a primary source. `tier` (`Free` / `Premium` / `Featured`)
controls ranking — paid tiers surface first.

## Roadmap
- **Phase 1 (done):** landing page, directory + filters, vendor profiles, category
  pages, submission form (front-end).
- **Phase 2:** move data to Airtable/database, wire the submission form to an API
  route, vendor accounts, Stripe for premium placements, admin review.
