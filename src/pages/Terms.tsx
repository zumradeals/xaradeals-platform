import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold">Conditions Générales de Vente</h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            <p>Bienvenue sur XaraDeals. En utilisant notre plateforme, vous acceptez les présentes conditions.</p>
            <h2 className="text-lg font-semibold text-foreground">1. Objet</h2>
            <p>XaraDeals est une plateforme de vente de licences logicielles numériques. Tous les produits sont livrés sous forme digitale.</p>
            <h2 className="text-lg font-semibold text-foreground">2. Commandes</h2>
            <p>Toute commande validée est ferme et définitive. Le prix affiché en FCFA est le prix TTC.</p>
            <h2 className="text-lg font-semibold text-foreground">3. Livraison</h2>
            <p>Les produits marqués "Livraison instantanée" sont livrés automatiquement. Les autres sont traités manuellement sous 24-48h.</p>
            <h2 className="text-lg font-semibold text-foreground">4. Remboursements</h2>
            <p>Aucun remboursement n'est possible après activation d'une licence ou d'un compte.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
