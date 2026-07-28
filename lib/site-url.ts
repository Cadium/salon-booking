/**
 * The site's canonical origin, used for metadata and absolute URLs.
 *
 * Resolved rather than hardcoded, so moving domains never means editing source:
 *
 *  1. NEXT_PUBLIC_SITE_URL — set this in Vercel to the canonical domain. It is
 *     the only value that survives a domain change, so it wins.
 *  2. VERCEL_PROJECT_PRODUCTION_URL — Vercel injects the project's production
 *     domain automatically. A sensible fallback if step 1 was never set, and it
 *     keeps preview deployments pointing somewhere real rather than localhost.
 *  3. localhost, for local development.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) return `https://${stripTrailingSlash(vercelProduction)}`;

  return "http://localhost:3000";
}

/** `new URL()` and canonical tags both dislike a trailing slash here. */
function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();
