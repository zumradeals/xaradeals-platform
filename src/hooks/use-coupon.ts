import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type CouponResult = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_fcfa: number;
};

export function useCoupon() {
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const applyCoupon = async (code: string, orderTotal: number) => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    const { data, error: dbErr } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (dbErr || !data) {
      setError("Code promo invalide");
      setCoupon(null);
      setLoading(false);
      return;
    }

    const c = data as any;

    // Check expiry
    if (c.expires_at && new Date(c.expires_at) < new Date()) {
      setError("Ce code promo a expiré");
      setCoupon(null);
      setLoading(false);
      return;
    }

    // Check max uses
    if (c.max_uses !== null && c.used_count >= c.max_uses) {
      setError("Ce code promo a atteint sa limite d'utilisation");
      setCoupon(null);
      setLoading(false);
      return;
    }

    // Check min order
    if (orderTotal < c.min_order_fcfa) {
      setError(`Commande minimum : ${c.min_order_fcfa.toLocaleString("fr-FR")} FCFA`);
      setCoupon(null);
      setLoading(false);
      return;
    }

    setCoupon({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_fcfa: c.min_order_fcfa,
    });
    setLoading(false);
  };

  const removeCoupon = () => {
    setCoupon(null);
    setError("");
  };

  const getDiscount = (total: number): number => {
    if (!coupon) return 0;
    if (coupon.discount_type === "PERCENT") {
      return Math.round((total * coupon.discount_value) / 100);
    }
    return Math.min(coupon.discount_value, total);
  };

  return { coupon, error, loading, applyCoupon, removeCoupon, getDiscount };
}
