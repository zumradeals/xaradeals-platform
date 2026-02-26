import { Link } from "react-router-dom";
import logoXaradeals from "@/assets/logo-xaradeals.png";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50 py-12">
      <div className="container grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3">
            <img src={logoXaradeals} alt="XaraDeals" className="h-8 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground">
            Licences logicielles au meilleur prix en Afrique de l'Ouest.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Catégories</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/c/abonnements-digitaux" className="hover:text-foreground transition-colors">Abonnements digitaux</Link></li>
            <li><Link to="/c/outils-ia" className="hover:text-foreground transition-colors">Outils IA</Link></li>
            <li><Link to="/c/licences-numeriques" className="hover:text-foreground transition-colors">Licences numériques</Link></li>
            <li><Link to="/c/microsoft-office" className="hover:text-foreground transition-colors">Microsoft Office</Link></li>
            <li><Link to="/c/adobe-creative-cloud" className="hover:text-foreground transition-colors">Adobe Creative Cloud</Link></li>
            <li><Link to="/c/autodesk" className="hover:text-foreground transition-colors">AutoDesk</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Informations</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground transition-colors">À propos</Link></li>
            <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            <li><Link to="/terms" className="hover:text-foreground transition-colors">Conditions générales</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>support@xaradeals.com</li>
            <li>WhatsApp: +225 0718713781</li>
            <li>Lomé, Togo</li>
          </ul>
        </div>
      </div>
      <div className="container mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} XaraDeals. Tous droits réservés.
      </div>
    </footer>
  );
}
