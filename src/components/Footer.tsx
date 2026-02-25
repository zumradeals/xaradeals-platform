import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50 py-12">
      <div className="container grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg hero-gradient">
              <span className="font-heading text-sm font-bold text-primary-foreground">X</span>
            </div>
            <span className="font-heading text-lg font-bold">XaraDeals</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Licences logicielles au meilleur prix en Afrique de l'Ouest.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Catégories</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/c/autodesk" className="hover:text-foreground transition-colors">Autodesk</Link></li>
            <li><Link to="/c/adobe" className="hover:text-foreground transition-colors">Adobe</Link></li>
            <li><Link to="/c/linkedin-premium" className="hover:text-foreground transition-colors">LinkedIn Premium</Link></li>
            <li><Link to="/c/microsoft-office-365" className="hover:text-foreground transition-colors">Microsoft Office</Link></li>
            <li><Link to="/c/lumion" className="hover:text-foreground transition-colors">Lumion</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Informations</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/terms" className="hover:text-foreground transition-colors">Conditions générales</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>support@xaradeals.com</li>
            <li>WhatsApp: +228 XX XX XX XX</li>
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
