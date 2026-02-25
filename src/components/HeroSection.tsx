import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden hero-gradient px-4 py-16 sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(28,90%,70%,0.3),_transparent_50%)]" />
      <div className="container relative z-10 mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-5xl text-balance">
          Logiciels premium,{" "}
          <span className="opacity-90">prix africain.</span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-base text-primary-foreground/80 sm:text-lg">
          Autodesk, Adobe, Microsoft, LinkedIn Premium &amp; plus — licences officielles livrées en FCFA.
        </p>
        <form onSubmit={handleSearch} className="mx-auto flex max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background pl-10 border-0 shadow-lg"
            />
          </div>
          <Button type="submit" variant="secondary" className="gap-1 font-semibold">
            Chercher <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}
