import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { useSitePage } from "@/hooks/use-site-page";

export default function Terms() {
  const { page } = useSitePage("terms");
  const title = page?.seo_title || page?.title || "Conditions Générales de Vente — XaraDeals";
  const description = page?.seo_description || "Conditions générales de vente de XaraDeals. Commandes, livraison, remboursements de licences logicielles numériques.";

  const defaultContent = `Bienvenue sur XaraDeals. En utilisant notre plateforme, vous acceptez les présentes conditions.

## 1. Objet
XaraDeals est une plateforme de vente de licences logicielles numériques. Tous les produits sont livrés sous forme digitale.

## 2. Commandes
Toute commande validée est ferme et définitive. Le prix affiché en FCFA est le prix TTC.

## 3. Livraison
Les produits marqués "Livraison instantanée" sont livrés automatiquement. Les autres sont traités manuellement sous 24-48h.

## 4. Remboursements
Aucun remboursement n'est possible après activation d'une licence ou d'un compte.`;

  const content = page?.content || defaultContent;

  // Simple markdown-like rendering for ## headings and paragraphs
  const renderContent = (text: string) => {
    return text.split("\n\n").map((block, i) => {
      if (block.startsWith("## ")) {
        return <h2 key={i} className="text-lg font-semibold text-foreground mt-4">{block.replace("## ", "")}</h2>;
      }
      return <p key={i}>{block}</p>;
    });
  };

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://xaradeals.com/terms" />
      </Helmet>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold">{page?.title || "Conditions Générales de Vente"}</h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            {renderContent(content)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
