import { Link } from "react-router-dom";
import logoXaradeals from "@/assets/logo-xaradeals.png";

const productLinks = [
  { to: "/c/autodesk", label: "Autodesk" },
  { to: "/c/adobe-creative-cloud", label: "Adobe Creative Cloud" },
  { to: "/c/microsoft-office", label: "Microsoft 365" },
  { to: "/c/outils-ia", label: "Outils IA" },
];

const categoryLinks = [
  { to: "/c/abonnements-digitaux", label: "Abonnements digitaux" },
  { to: "/c/licences-numeriques", label: "Licences numériques" },
];

const infoLinks = [
  { to: "/about", label: "À propos" },
  { to: "/faq", label: "FAQ" },
  { to: "/terms", label: "Conditions générales" },
  { to: "/privacy", label: "Politique de confidentialité" },
  { to: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3">
            <img src={logoXaradeals} alt="XaraDeals" className="h-8 w-auto" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Licences logicielles au meilleur prix en Afrique de l'Ouest.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Produits</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {productLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-foreground transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Informations</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {infoLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-foreground transition-colors">{l.label}</Link>
              </li>
            ))}
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
