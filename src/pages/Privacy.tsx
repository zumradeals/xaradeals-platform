import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold">Politique de Confidentialité</h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            <p>XaraDeals s'engage à protéger vos données personnelles.</p>
            <h2 className="text-lg font-semibold text-foreground">Données collectées</h2>
            <p>Nous collectons votre nom, email et numéro de téléphone pour le traitement de vos commandes.</p>
            <h2 className="text-lg font-semibold text-foreground">Utilisation</h2>
            <p>Vos données sont utilisées uniquement pour la gestion de vos commandes et la communication relative à vos achats.</p>
            <h2 className="text-lg font-semibold text-foreground">Sécurité</h2>
            <p>Vos données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
