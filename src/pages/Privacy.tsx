import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { useSitePage } from "@/hooks/use-site-page";

export default function Privacy() {
  const { page } = useSitePage("privacy");
  const title = page?.seo_title || page?.title || "Politique de Confidentialité — XaraDeals";
  const description = page?.seo_description || "Politique de confidentialité de XaraDeals. Protection de vos données personnelles et sécurité.";

  const defaultContent = `XaraDeals s'engage à protéger vos données personnelles.

## Données collectées
Nous collectons votre nom, email et numéro de téléphone pour le traitement de vos commandes.

## Utilisation
Vos données sont utilisées uniquement pour la gestion de vos commandes et la communication relative à vos achats.

## Sécurité
Vos données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers.`;

  const content = page?.content || defaultContent;

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
        <link rel="canonical" href="https://xaradeals.com/privacy" />
      </Helmet>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold">{page?.title || "Politique de Confidentialité"}</h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            {renderContent(content)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
