import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Helmet } from "react-helmet-async";
import { Shield, Zap, Headphones, Users, Award, Globe } from "lucide-react";

const values = [
  { icon: Shield, title: "Licences 100% officielles", desc: "Toutes nos licences proviennent directement des éditeurs ou de revendeurs agréés." },
  { icon: Zap, title: "Livraison instantanée", desc: "Recevez vos clés et accès en quelques minutes après validation du paiement." },
  { icon: Headphones, title: "Support 7j/7", desc: "Notre équipe vous accompagne par WhatsApp et email, y compris le week-end." },
  { icon: Users, title: "+2 000 clients satisfaits", desc: "Des professionnels et étudiants à travers l'Afrique de l'Ouest nous font confiance." },
  { icon: Award, title: "Meilleurs prix garantis", desc: "Nous négocions les tarifs les plus bas pour les rendre accessibles à tous." },
  { icon: Globe, title: "Paiement local", desc: "Payez facilement via Wave, Orange Money ou Mobile Money." },
];

export default function About() {
  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Helmet>
        <title>À propos de XaraDeals — Licences logicielles en Afrique de l'Ouest</title>
        <meta name="description" content="XaraDeals, votre partenaire de confiance pour les licences logicielles professionnelles en Afrique de l'Ouest. Autodesk, Adobe, Microsoft à prix local." />
        <link rel="canonical" href="https://xaradeals-platform.lovable.app/about" />
      </Helmet>
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-16 text-center">
          <div className="container">
            <h1 className="text-3xl font-bold text-primary-foreground md:text-4xl">À propos de XaraDeals</h1>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
              Votre partenaire de confiance pour les licences logicielles professionnelles en Afrique de l'Ouest, depuis 2023.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-3xl space-y-6 text-muted-foreground">
            <ScrollReveal>
              <h2 className="text-2xl font-bold text-foreground">Notre mission</h2>
              <p className="mt-3">
                XaraDeals est né d'un constat simple : les professionnels et étudiants d'Afrique de l'Ouest ont besoin d'accéder à des logiciels de qualité à des prix abordables, avec des moyens de paiement locaux.
              </p>
              <p className="mt-3">
                Nous sélectionnons les meilleures offres auprès des éditeurs — Autodesk, Adobe, Microsoft, LinkedIn et bien d'autres — pour vous les proposer au meilleur tarif, avec une livraison digitale instantanée.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-secondary py-12">
          <div className="container">
            <ScrollReveal>
              <h2 className="mb-8 text-center text-2xl font-bold">Pourquoi nous choisir ?</h2>
            </ScrollReveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v, i) => (
                <ScrollReveal key={v.title} delay={i * 0.08}>
                  <div className="rounded-lg border border-border bg-card p-6 card-shadow">
                    <v.icon className="mb-3 h-8 w-8 text-primary" />
                    <h3 className="mb-2 font-heading text-lg font-bold">{v.title}</h3>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
