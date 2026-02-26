import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SitePage = {
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  content: string;
};

export function useSitePage(slug: string) {
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_pages")
      .select("title, seo_title, seo_description, content")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (data) setPage(data as SitePage);
        setLoading(false);
      });
  }, [slug]);

  return { page, loading };
}
