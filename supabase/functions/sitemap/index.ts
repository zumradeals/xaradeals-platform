import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://xaradeals.com";

const staticPages = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/boutique", changefreq: "daily", priority: "0.9" },
  { loc: "/about", changefreq: "monthly", priority: "0.6" },
  { loc: "/faq", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact", changefreq: "monthly", priority: "0.5" },
  { loc: "/terms", changefreq: "yearly", priority: "0.3" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all data in parallel
    const [productsRes, categoriesRes, pagesRes] = await Promise.all([
      supabase
        .from("products")
        .select("slug, updated_at")
        .eq("status", "PUBLISHED")
        .order("updated_at", { ascending: false }),
      supabase
        .from("categories")
        .select("slug, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("site_pages")
        .select("slug, updated_at")
        .order("updated_at", { ascending: false }),
    ]);

    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    const sitePages = pagesRes.data || [];

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // CMS site_pages (avoid duplicates with static pages)
    const staticSlugs = new Set(["about", "faq", "contact", "terms", "privacy"]);
    for (const sp of sitePages) {
      if (!staticSlugs.has(sp.slug)) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/${sp.slug}</loc>\n`;
        xml += `    <lastmod>${new Date(sp.updated_at).toISOString().split("T")[0]}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.5</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // Categories
    for (const cat of categories) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/c/${cat.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(cat.created_at).toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Products
    for (const prod of products) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/p/${prod.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(prod.updated_at).toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(`Error: ${err.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
