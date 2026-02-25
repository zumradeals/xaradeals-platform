import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2, Package } from "lucide-react";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  price_fcfa: number;
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, title, slug, brand, price_fcfa")
        .eq("status", "PUBLISHED")
        .or(`title.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(6);
      setResults((data || []) as SearchResult[]);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (slug: string) => {
    setOpen(false);
    setQuery("");
    navigate(`/p/${slug}`);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Compact toggle button on mobile, inline input on desktop */}
      <div className="hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Rechercher un produit..."
            className="h-9 w-56 pl-9 pr-8 text-sm"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile search icon */}
      <button className="md:hidden" onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 100); }}>
        <Search className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Mobile search input */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 md:left-0 md:right-auto md:mt-1 md:w-full">
          <div className="md:hidden mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher..."
                className="pl-9 pr-8"
                autoFocus
              />
              {query && (
                <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Results dropdown */}
          {query.trim() && (
            <div className="rounded-lg border bg-popover shadow-lg">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucun résultat pour "{query}"
                </div>
              ) : (
                <div className="divide-y">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r.slug)}
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent"
                    >
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.brand}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-primary">
                        {r.price_fcfa.toLocaleString("fr-FR")} F
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
