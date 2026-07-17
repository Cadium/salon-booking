# Handoff: Kindred Braid Studio

Read this whole file before doing anything. It's the complete context for this project — what it is, how it got built, what's real vs. placeholder, and what's still open. Written 2026-07-13.

---

## 1. What this is

A marketing + booking site for **Kindred Braid Studio**, a home-based braiding studio. Started as a pixel-for-pixel clone of `tress-time-now.lovable.app` (built with the `clone-app-pat-pro` skill), then diverged intentionally into its own product — the business details, section structure, and design have all moved past the original source.

- **Live URL:** https://salon-booking-six-xi.vercel.app (auto-deploys from `main` via Vercel's GitHub integration — every merge to `main` goes live within seconds, verified)
- **Repo:** https://github.com/Cadium/salon-booking
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · GSAP (ScrollTrigger) · self-hosted Inter + Fraunces
- **No backend.** The reservation form is UI-only — it sets local state on submit ("Request received") and does not send email, hit an API, or persist anywhere. That's the biggest functional gap if "done" means a working product rather than a polished front end.

---

## 2. Current business facts — what's real vs. placeholder

This matters a lot: some content is the client's real business, some is placeholder invented during the clone/build and **still needs client confirmation or replacement**. Don't assume anything below is final without checking against what the client actually sends back.

| Fact | Current value in the site | Status |
|---|---|---|
| Studio name | Kindred Braid Studio | Placeholder — confirm this is the real name |
| Braider | Dominique "Dae" Ellis, solo (single-braider business model) | Confirmed by user in-session — this is real: "this business has one braider not several" |
| Location | Garland, TX | Confirmed by user — moved off the original clone's "Dallas" |
| Address | "Full address sent after booking" (no real street address anywhere) | Placeholder |
| Hours | Tue–Sat · 8am–8pm | Placeholder, invented for the clone |
| Email | hello@kindredbraids.co | **Fake domain — does not exist.** Needs a real one |
| Phone | +1 (214) 555 0142 | **Fake — 555 number.** Needs a real one |
| Instagram / TikTok | Link to `instagram.com` / `tiktok.com` root (not a real handle) | **Placeholder, not linked to real accounts** |
| Gift cards link | `href="#"` (does nothing) | Placeholder, needs a real destination or removal |
| Services + prices | Knotless Braids ($220+, 5–7 hrs) · Boho & Goddess ($280+, 6–8 hrs) · Stitch Feed-Ins & Fulani ($180+, 3–5 hrs) | Placeholder — from the original clone, never confirmed by the real client |
| In-home service area | Garland, Rowlett, Mesquite, Sachse, Richardson + DFW | Reasonable guess (real Garland-adjacent cities), not client-confirmed |
| Testimonials | Aaliyah T. (Oak Cliff), Bri M. (Plano) | Fabricated for the clone — **should be replaced with real reviews or removed** before this is a real launch |
| Images | Stock photography (`hero-model.jpg`, `salon-interior.jpg`, `service-boho.jpg`, `service-stitch.jpg`) downloaded during the original clone extraction | **Not real photos of the client, her studio, or her actual work** — needs real photography before launch |
| Copyright year | Dynamic (`new Date().getFullYear()`) | Fine as-is, always current |

**The user was drafting a message to the client** to gather all of the above (real colors feedback, real images, real services/prices, real name/address/links) — asked for in the prior session but I don't have confirmation it was ever sent or that a reply came back. **Check with the user whether client feedback has arrived before making further content changes** — if it has, that supersedes everything in the table above.

---

## 3. Design system

All tokens live in `app/globals.css` as CSS custom properties, mapped into Tailwind's `@theme inline`. **Never hardcode a color/size/radius in a component — reference the token.**

- **Colors** — authored in OKLCH (not hex), reused verbatim from the original source's computed styles:
  - `--cream` (bg) `oklch(96.5% 0.018 82)`, `--bone` (secondary bg), `--espresso` (text/primary) `oklch(24% 0.028 45)`, `--copper` (accent) `oklch(58% 0.13 45)`, `--ink`
  - Semantic aliases follow shadcn/ui naming: `--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--border`, etc. — all derived from the five base tokens above
- **Theme:** light-only, no dark mode (the original source doesn't have one either)
- **Fonts:** self-hosted, no Google Fonts CDN
  - `Inter` (400/500/600/700, `@font-face` in globals.css) for body text
  - `Fraunces` (variable, normal 300–600 + italic) for display/headings — the italic accent (`handled with care.`) is a defining brand element
- **Radius/shadow:** minimal by design in the original clone (`--radius: 0.5rem`), but the "premium" round of work added `shadow-[...]` lift-on-hover treatments to buttons — see `components/ui/button.tsx`

---

## 4. Architecture

```
app/
  layout.tsx        Root layout — metadata, OpenGraph/Twitter cards, font loading
  globals.css        Design tokens (single source of truth) + smooth-scroll setup
  icon.svg            Favicon — a simple "K" monogram (espresso bg, cream italic serif K)
  page.tsx            Composes the page from section components, in order

components/
  site-header.tsx        Sticky nav — desktop inline links + a real mobile hamburger menu
                          (full-screen overlay, staggered link reveal, Escape/click-outside close)
  hero-section.tsx        Hero with GSAP entrance timeline (staggered eyebrow→headline→body→CTAs)
  ticker.tsx               Style-tag marquee — GSAP-driven (not CSS @keyframes anymore, see §5)
  philosophy-section.tsx   "One guest. One braider. One unhurried afternoon." + stat callouts
  service-menu-section.tsx  Renders ServiceCard[] from lib/services.ts
  service-card.tsx           Data-array-driven card: photo (hover-zoom) + name/price/duration/description/Reserve
  founder-spotlight.tsx     Replaces the old 3-person "braiders" roster — single-braider positioning,
                             uses salon-interior.jpg, has a pull-quote + credential stats + "Book with Dae"
  testimonials-section.tsx  Dark section (espresso bg), 2 quotes — kept separate from founder-spotlight
  book-section.tsx           Wraps VisitSection + ReservationForm
  visit-section.tsx           Studio/Contact/In-home-service info columns
  reservation-form.tsx        Name/email/phone/service(radio)/location(radio)/date(custom picker)/notes/submit
                               NOTE: no "braider" field anymore — removed when the roster was removed,
                               since there's only one braider, nothing to pick
  site-footer.tsx             Studio name, location, copyright, social links
  ui/
    button.tsx        Shared LinkButton/SubmitButton/ButtonArrow — lift-on-hover shadow,
                       nudge-on-hover arrow, visible focus ring. Used everywhere, never
                       duplicate button markup.
    date-picker.tsx    Hand-rolled calendar popover (no dependency) — replaced the native
                        <input type=date> because it's unstyleable and looked cheap.
                        Disables past dates, Escape/click-outside close.
  motion/
    reveal.tsx          Fade+rise on scroll into view, once. Wraps a single element.
    reveal-group.tsx     Same, but staggers an element's direct children (for card grids etc.)
    parallax-image.tsx   Wraps an image; scrubs a slower vertical drift as you scroll past it
    stat-counter.tsx      Counts up the leading number in a string ("800+", "12 yrs") on scroll-in

lib/
  gsap.ts             Registers ScrollTrigger once; re-exports `gsap` — always import gsap
                      from here, never from the `gsap` package directly (keeps plugin
                      registration centralized and SSR-safe)
  services.ts          Typed Service[] data array — the service menu is driven by this,
                        not copy-pasted JSX

public/
  fonts/    Inter (4 weights) + Fraunces (2 variable files) — real woff2 bytes, self-hosted
  images/    hero-model.jpg, salon-interior.jpg, service-boho.jpg, service-stitch.jpg
             — all 4 are actively used (none orphaned); all 4 are stock, not real client photos
```

All motion respects `prefers-reduced-motion: reduce` (checked at the top of every motion component — if set, the effect just doesn't run, content is visible at rest state).

---

## 5. How this was built — chronological history

### Phase 1 — Pixel clone (via `clone-app-pat-pro` skill)
Full recon → extraction → design-spec → architecture → build → QA↔fix → polish pipeline against `tress-time-now.lovable.app`. Built section-by-section on feature branches (`chore/design-tokens`, `feat/hero-and-nav`, `feat/service-menu`, `feat/braiders-section`, `feat/reservation-form`), each with its own PR (#1–#4), merged after user approval. At this stage the site had a 3-person braider roster and was set in Dallas, matching the source exactly — copy, colors, spacing all measured off the live source page's computed styles, not eyeballed.

Found and fixed real bugs during this phase, including a bad Lab→sRGB color-conversion in the internal QA tooling (double Bradford adaptation) and a Tailwind `has-[:checked]` variant that silently compiled to no CSS at all (service/location pill selection had zero visual effect until fixed with explicit React state).

### Phase 2 — Divergence / customization round (PRs #5–#9)
User asked for a punch list of changes that moved the site away from being a strict clone:
1. **`chore/repo-hygiene-and-readme` (#5)** — stopped tracking `.claude/`, `AGENTS.md`, `CLAUDE.md` (AI tooling scaffolding, not project source); wrote a real README; removed the Lovable-sourced `favicon.ico`, replaced with the `app/icon.svg` "K" monogram
2. **`content/relocate-to-garland` (#6)** — every Dallas/South Dallas reference → Garland, TX (nav, hero, philosophy, visit section, form, footer, metadata); in-home service area now names real Garland-adjacent cities
3. **`refactor/single-braider-spotlight` (#7)** — removed the 3-person braiders roster entirely (client said: "this business has one braider not several... redundant"); replaced with `founder-spotlight.tsx`; removed the now-pointless "Braider" picker from the reservation form
4. **`feat/premium-nav-menu` (#8)** — added a real mobile nav menu (there wasn't one before — nav links just vanished below 768px by design in the original); animated desktop nav underline; elevated the shared Button component (shadow, arrow nudge, focus ring) sitewide; site-wide smooth scroll
5. **`feat/premium-booking-ui` (#9)** — hand-rolled `DatePicker` replacing the native date input; wired the 3 service photos (downloaded during extraction but never actually used anywhere) into `ServiceCard`

All 5 stacked on each other and merged into `main` in order, with explicit user confirmation each time (see §6 on the merge-without-review permission quirk).

### Phase 3 — Social metadata + motion (PRs #11–#12)
- **`feat/social-share-metadata` (#12)** — user reported a stale Lovable-branded icon in a Messenger link preview. Investigation confirmed: zero literal "lovable" references anywhere in the repo, and the live deployment was already fully current (own favicon, correct Garland copy) — it was a **cached scrape** from before the favicon fix deployed, not a live-site bug. Root cause of *why* a scraper could grab the wrong icon in the first place: no explicit `og:image` existed. Fixed by adding full OpenGraph + Twitter card metadata (`metadataBase`, `og:title/description/image/url/siteName`, `twitter:card`). **This does not retroactively fix an already-cached preview** — that needs a human to run the URL through Facebook's Sharing Debugger (developers.facebook.com/tools/debug → "Scrape Again").
- **`feat/gsap-motion` (#11)** — added the `components/motion/*` primitives and wired them through the page: hero entrance timeline, scroll-triggered reveals on section headings/cards, founder-spotlight photo parallax, credential stat counters, ticker converted from CSS to GSAP-driven.

**⚠️ Important caveat carried over from last session: the GSAP animations were never visually verified.** The automated browser tooling available in that session had `requestAnimationFrame` never firing at all — confirmed via a direct test — which silently blocks any JS-driven animation (GSAP included) from ever progressing, even though CSS animations worked fine and the code passed careful review. One real bug *was* caught this way (a React ref object passed where GSAP expected a raw DOM node). **Before doing anything else GSAP-related, load the live site in a real browser and confirm the hero entrance, scroll reveals, parallax, and stat counters actually play correctly.** Don't trust that they work just because the code looks right and the build passes.

---

## 6. Workflow & conventions established this project

Follow these exactly — they were set by explicit user instruction and repeated correction, not just convention:

- **Feature branches, one logical unit each.** Conventional commit prefixes (`feat:`, `fix:`, `chore:`, `content:`, `refactor:`, `style:`, `docs:`, `test:`). Commit as each unit completes, not batched.
- **Zero AI/Claude attribution anywhere** — no `Co-Authored-By: Claude`, no "Generated with" trailers, in commits or PR descriptions.
- **PR per branch**, clean professional description (Summary + Test plan), opened against `main`.
- **Check in before merging to `main`.** This project's permission system requires a **fresh, explicit, per-batch confirmation** to merge without human GitHub review — a general "go ahead" is *not* sufficient once the classifier has seen it used for a different batch of PRs before. The working pattern: ask via AskUserQuestion, explicitly naming that this means "merging without anyone reviewing the code changes on GitHub first," scoped to the specific PR numbers being merged right now. Don't assume a prior "yes" carries forward to new PRs.
- **Stack repeatedly-dependent branches on each other** (not all off `main` independently) when they touch the same files in sequence — avoids redoing the same text edits across parallel branches. Merge in order, base-branch-first.
- User prefers being told about real bugs found along the way, not just "done" — several responses in this project called out specific bugs fixed (the Tailwind variant that compiled to nothing, the color-conversion bug, the mobile-menu containing-block bug) rather than glossing over them.
- When something can't be verified (a tooling limitation, no access to a service like Vercel/Facebook), **say so plainly** rather than claiming success. This was explicitly valued — see the GSAP caveat above.

---

## 7. Open / pending items for the next session

Roughly in likely priority order — confirm with the user before assuming any of this:

1. **Get client feedback on the rough draft.** A message was being drafted (in a prior turn) asking the client to confirm: color scheme reaction, whether current stock images are acceptable or she'll provide real photos, real services + prices, real studio name/address, real contact info, real social links. Check whether this was sent and whether a reply has come back — it should supersede the placeholder table in §2.
2. **Verify the GSAP motion actually works** in a real browser (see the caveat in §5 — this was never confirmed).
3. **Vercel domain** — user asked how to get off the auto-generated `salon-booking-six-xi.vercel.app` suffix. Two paths were explained (rename the Vercel project for a cleaner `.vercel.app` name, or add a real custom domain) but no decision was made or action taken — this needs the user's Vercel dashboard access either way, not something doable from the repo.
4. **Real content swap-in** once client feedback lands: services/prices, contact info, social handles, real photography (replacing all 4 stock images), real or removed testimonials, real business hours/address.
5. **Functional booking backend** is explicitly not built — the form is UI-only. Flag this as a scope decision to make with the user before assuming it's wanted (email notification? a booking API? a third-party scheduler embed?) — don't build it unprompted.
6. Minor: `next-env.d.ts` shows spurious diffs on branch switches (it's an auto-generated file that probably shouldn't be tracked at all) — harmless but mildly annoying, could add to `.gitignore` as a small cleanup if touching that area anyway.

---

## 8. Quick reference

```bash
npm install
npm run dev     # localhost:3000
npm run build   # production build — run this before every commit that touches app code
npm run lint    # eslint
```

To pick this up in a new session: read this file first, then check `git log --oneline -15` and `gh pr list --state all` to confirm nothing has changed since 2026-07-13, then ask the user what's next rather than assuming §7's priority order still holds.
