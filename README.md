# Kindred Braid Studio

A single-page marketing and booking site for Kindred Braid Studio, a home-based braiding studio in Garland, TX. Built with Next.js App Router, TypeScript, and Tailwind CSS v4.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4** — design tokens declared as CSS custom properties in `app/globals.css` (`@theme inline`), authored in OKLCH
- Self-hosted **Inter** and **Fraunces** (variable, italic + normal)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Project structure

```
app/
  layout.tsx        Root layout, metadata, font loading
  globals.css        Design tokens (colors, type, spacing) — single source of truth
  page.tsx           Composes the page from section components
components/
  site-header.tsx     Sticky nav
  site-footer.tsx
  hero-section.tsx
  ticker.tsx           CSS-marquee style-tag strip
  philosophy-section.tsx
  service-menu-section.tsx / service-card.tsx
  book-section.tsx     Visit info + reservation form
  reservation-form.tsx
  ui/button.tsx        Shared button primitive
lib/
  services.ts          Service menu data
public/
  fonts/                Self-hosted Inter + Fraunces (woff2)
  images/                Studio and service photography
```

Repeated content (service cards) is driven by a typed data array in `lib/`, not copy-pasted markup.

## Design tokens

All brand colors, type, spacing, and radius values live in `app/globals.css` as CSS custom properties and are mapped into Tailwind's `@theme`. Change a token there and it propagates everywhere — components should never hardcode a color, font size, or radius.

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`, `style:`, `refactor:`, `docs:`, `test:`)
- One feature branch per logical unit of work, PR against `main`
