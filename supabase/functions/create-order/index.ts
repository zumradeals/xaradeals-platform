import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client for auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabaseUser.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { items, method } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Aucun article" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!method || !["WAVE", "ORANGE"].includes(method)) {
      return new Response(JSON.stringify({ error: "Méthode de paiement invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for server-side operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch product prices server-side
    const productIds = items.map((i: { product_id: string }) => i.product_id);
    const { data: products, error: prodError } = await supabaseAdmin
      .from("products")
      .select("id, title, price_fcfa, status")
      .in("id", productIds);

    if (prodError || !products) {
      return new Response(JSON.stringify({ error: "Erreur produits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const prod = priceMap.get(item.product_id);
      if (!prod || prod.status !== "PUBLISHED") {
        return new Response(
          JSON.stringify({ error: `Produit indisponible: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const orderItems = items.map((item: { product_id: string; qty?: number }) => {
      const prod = priceMap.get(item.product_id)!;
      const qty = Math.max(1, item.qty || 1);
      return {
        product_id: item.product_id,
        qty,
        unit_price_fcfa: prod.price_fcfa,
        line_total_fcfa: qty * prod.price_fcfa,
        title: prod.title,
      };
    });

    const totalFcfa = orderItems.reduce((sum: number, i: { line_total_fcfa: number }) => sum + i.line_total_fcfa, 0);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        status: "WAITING_PAYMENT_PROOF",
        total_fcfa: totalFcfa,
        currency: "XOF",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return new Response(JSON.stringify({ error: "Erreur création commande" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(
        orderItems.map((i: { product_id: string; qty: number; unit_price_fcfa: number; line_total_fcfa: number }) => ({
          order_id: order.id,
          product_id: i.product_id,
          qty: i.qty,
          unit_price_fcfa: i.unit_price_fcfa,
          line_total_fcfa: i.line_total_fcfa,
        }))
      );

    if (itemsError) {
      console.error("Items insertion error:", itemsError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "Erreur articles" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: payError } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      user_id: userId,
      method,
      amount_fcfa: totalFcfa,
      proof_status: "NONE",
    });

    if (payError) {
      console.error("Payment creation error:", payError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "Erreur paiement" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemsSummary = orderItems
      .map((i: { title: string; qty: number }) => `${i.title} x${i.qty}`)
      .join(", ");

    const orderRef = `XD-${order.id.substring(0, 6).toUpperCase()}`;

    return new Response(
      JSON.stringify({
        order_id: order.id,
        order_ref: orderRef,
        total_fcfa: totalFcfa,
        items_summary: itemsSummary,
        method,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
