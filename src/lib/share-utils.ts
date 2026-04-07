/**
 * Returns the OG-friendly share URL for a resource.
 * Social media crawlers will hit the edge function which serves proper meta tags,
 * then redirects human visitors to the real SPA page.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function getShareUrl(type: "product" | "blog" | "category", slug: string): string {
  return `${SUPABASE_URL}/functions/v1/og-meta?type=${type}&slug=${encodeURIComponent(slug)}`;
}

/**
 * Returns the canonical URL for a resource (for SEO canonical tags).
 */
export function getCanonicalUrl(path: string): string {
  return `https://xaradeals.com${path}`;
}
