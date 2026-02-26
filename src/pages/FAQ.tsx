import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Comment fonctionne la livraison ?",
    a: "Après validation de votre paiement, vous recevez vos clés de licence ou accès par email et via votre espace client sous quelques minutes.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Nous acceptons Wave, Orange Money et les virements Mobile Money. Le paiement se fait via WhatsApp avec envoi d'une preuve de paiement.",
  },
  {
    q: "Les licences sont-elles officielles ?",
    a: "Oui, toutes nos licences proviennent directement des éditeurs ou de revendeurs agréés. Vous bénéficiez des mêmes droits et mises à jour qu'un achat direct.",
  },
  {
    q: "Puis-je obtenir un remboursement ?",
    a: "Si la licence n'a pas encore été activée, nous pouvons procéder à un remboursement sous 48h. Contactez notre support pour toute demande.",
  },
  {
    q: "Combien de temps dure une licence ?",
    a: "La durée dépend du produit choisi : certaines licences sont annuelles (1 an, 2 ans, 3 ans) et d'autres sont perpétuelles. La durée est indiquée sur chaque fiche produit.",
  },
  {
    q: "Comment contacter le support ?",
    a: "Vous pouvez nous joindre par WhatsApp au +225 0718713781 ou par email à support@xaradeals.com. Notre équipe est disponible 7j/7.",
  },
  {
    q: "Puis-je utiliser la licence sur plusieurs appareils ?",
    a: "Cela dépend du type de licence. La plupart des licences individuelles couvrent 1 à 2 appareils. Les détails sont précisés sur la fiche produit.",
  },
  {
    q: "Proposez-vous des réductions pour les étudiants ?",
    a: "Oui, certains produits disposent de tarifs étudiants. Consultez notre catalogue ou contactez le support pour en savoir plus.",
  },
];

export default function FAQ() {
  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Helmet>
        <title>FAQ — XaraDeals, questions fréquentes</title>
        <meta name="description" content="Retrouvez les réponses aux questions fréquentes sur XaraDeals : livraison, paiement, licences, remboursement et support." />
        <link rel="canonical" href="https://xaradeals-platform.lovable.app/faq" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          })}
        </script>
      </Helmet>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="mb-2 text-3xl font-bold">Questions fréquentes</h1>
          <p className="mb-8 text-muted-foreground">
            Retrouvez les réponses aux questions les plus posées par nos clients.
          </p>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}
