import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://xaradeals.com";
const DEFAULT_OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/11e27337-6126-469c-97e5-698d471461aa/id-preview-7a665c17--f92d7dbb-204a-439e-8bc7-c461a23e4523.lovable.app-1772041316027.png";

const BOT_UA_REGEX = /facebookexternalhit|facebot|twitterbot|x\-twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|googlebot|bingbot|embedly|quora link preview|pinterest|vkshare|skypeuripreview/i;

serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const type = url.searchParams.get("type") || "product"; // product | category | blog
  const userAgent = req.headers.get("user-agent") || "";
  const isBot = BOT_UA_REGEX.test(userAgent);

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let title = "XaraDeals — Logiciels et abonnements numériques";
  let description = "Achetez vos licences logicielles en FCFA. Paiement Wave & Orange Money.";
  let image = DEFAULT_OG_IMAGE;
  let pageUrl = SITE_URL;

  try {
    if (type === "product") {
      const { data: product } = await supabase
        .from("products")
        .select("title, seo_title, seo_description, price_fcfa, brand, slug, og_image_url")
        .eq("slug", slug)
        .eq("status", "PUBLISHED")
        .single();

      if (product) {
        title = product.seo_title || `${product.title} — XaraDeals`;
        description = product.seo_description || 
          `${product.title} - ${product.brand} à ${Number(product.price_fcfa).toLocaleString("fr-FR")} FCFA. Livraison rapide.`;
        pageUrl = `${SITE_URL}/p/${product.slug}`;

        // Get OG image or first product image
        if (product.og_image_url) {
          image = product.og_image_url;
        } else {
          const { data: imgs } = await supabase
            .from("product_images")
            .select("url")
            .eq("product_id", slug)
            .order("position")
            .limit(1);
          
          // Try by product id from a second query
          const { data: prod2 } = await supabase
            .from("products")
            .select("id")
            .eq("slug", slug)
            .single();
          
          if (prod2) {
            const { data: imgs2 } = await supabase
              .from("product_images")
              .select("url")
              .eq("product_id", prod2.id)
              .order("position")
              .limit(1);
            if (imgs2?.[0]?.url) image = imgs2[0].url;
          }
        }
      }
    } else if (type === "blog") {
      const { data: post } = await supabase
        .from("blog_posts")
        .select("title, seo_title, seo_description, cover_image_url, slug")
        .eq("slug", slug)
        .eq("status", "PUBLISHED")
        .single();

      if (post) {
        title = post.seo_title || `${post.title} — Blog XaraDeals`;
        description = post.seo_description || post.title;
        if (post.cover_image_url) image = post.cover_image_url;
        pageUrl = `${SITE_URL}/blog/${post.slug}`;
      }
    } else if (type === "category") {
      const { data: cat } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("slug", slug)
        .single();

      if (cat) {
        title = `${cat.name} — XaraDeals`;
        description = `Découvrez nos offres ${cat.name} en FCFA. Paiement mobile sécurisé.`;
        pageUrl = `${SITE_URL}/c/${cat.slug}`;
      }
    }
  } catch (e) {
    console.error("og-meta error:", e);
  }

  // Escape HTML entities
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(pageUrl)}">
  
  <meta property="og:type" content="${type === "blog" ? "article" : type === "product" ? "product" : "website"}">
  <meta property="og:site_name" content="XaraDeals">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:image:secure_url" content="${esc(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/webp">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:locale" content="fr_FR">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(image)}">
  <meta name="twitter:url" content="${esc(pageUrl)}">
  <meta name="robots" content="noindex, nofollow">
  ${isBot ? "" : `<meta http-equiv=\"refresh\" content=\"0;url=${esc(pageUrl)}\">`}
</head>
<body>
  <p>Redirection vers <a href="${esc(pageUrl)}">${esc(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
});
