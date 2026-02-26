import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-workspace.jpg";
import ScrollReveal from "@/components/ScrollReveal";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-card">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/60 via-transparent to-transparent" />
      <div className="container relative z-10 grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <ScrollReveal>
          <div className="max-w-xl">
            <h1 className="mb-6 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
              Les logiciels professionnels,{" "}
              <span className="text-primary">accessibles en FCFA.</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
              Autodesk, Adobe, Microsoft, LinkedIn Premium.
              <br />
              Paiement Wave &amp; Orange. Activation rapide.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 font-semibold">
                <Link to="/c/licences-numeriques">
                  Explorer les licences <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 font-semibold border-primary text-primary hover:bg-accent">
                <a href="https://wa.me/2250718713781" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Commander via WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2} className="hidden lg:block">
          <img
            src={heroImage}
            alt="Espace de travail moderne avec logiciels professionnels"
            className="rounded-2xl shadow-2xl"
            width={640}
            height={400}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
