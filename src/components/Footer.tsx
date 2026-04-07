import { Link } from "react-router-dom";
import { MessageCircle, Users, Facebook, Instagram, Twitter } from "lucide-react";
import logoXaradeals from "@/assets/logo-xaradeals.png";
import { useSiteSettings } from "@/hooks/use-site-settings";

const productLinks = [
  { to: "/c/autodesk", label: "Autodesk" },
  { to: "/c/adobe-creative-cloud", label: "Adobe Creative Cloud" },
  { to: "/c/microsoft-office", label: "Microsoft 365" },
  { to: "/c/outils-ia", label: "Outils IA" },
];

const infoLinks = [
  { to: "/about", label: "À propos" },
  { to: "/blog", label: "Blog" },
  { to: "/faq", label: "FAQ" },
  { to: "/terms", label: "Conditions générales" },
  { to: "/privacy", label: "Politique de confidentialité" },
  { to: "/contact", label: "Contact" },
];

export default function Footer() {
  const { data: s } = useSiteSettings();
  const groupUrl = s?.whatsapp_group_url || "";
  const number = s?.whatsapp_direct_number || "2250718713781";
  const email = s?.contact_email || "support@xaradeals.com";
  const phone = s?.contact_phone || "+225 0718713781";
  const address = s?.address || "Abidjan, Côte d'Ivoire";
  const facebook = s?.facebook_url || "";
  const instagram = s?.instagram_url || "";
  const tiktok = s?.tiktok_url || "";
  const twitter = s?.twitter_url || "";

  const hasSocials = facebook || instagram || tiktok || twitter;

  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3">
            <img src={logoXaradeals} alt="XaraDeals — Logiciels numériques à prix local" className="h-8 w-auto" loading="lazy" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Licences logicielles au meilleur prix en Afrique de l'Ouest.
          </p>
          {hasSocials && (
            <div className="mt-4 flex items-center gap-3">
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {tiktok && (
                <a href={tiktok} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.76a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.17z"/></svg>
                </a>
              )}
              {twitter && (
                <a href={twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
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
            <li>{email}</li>
            <li>
              <a
                href={`https://wa.me/${number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp: {phone}
              </a>
            </li>
            {groupUrl && (
              <li>
                <a
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Users className="h-3.5 w-3.5" /> Rejoindre notre groupe WhatsApp
                </a>
              </li>
            )}
            <li>{address}</li>
          </ul>
        </div>
      </div>
      <div className="container mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} XaraDeals. Tous droits réservés.
      </div>
    </footer>
  );
}
