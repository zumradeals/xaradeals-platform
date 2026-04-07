import { ShieldCheck, Truck, Headphones, Award } from "lucide-react";

const badges = [
  { icon: ShieldCheck, label: "Paiement sécurisé", desc: "Wave & Orange Money" },
  { icon: Truck, label: "Livraison garantie", desc: "Instantanée ou sous 48h" },
  { icon: Headphones, label: "Support 24/7", desc: "WhatsApp & Email" },
  { icon: Award, label: "100% Officiel", desc: "Licences authentiques" },
];

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {badges.map((b) => (
        <div key={b.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-muted/30 p-3 text-center">
          <b.icon className="h-5 w-5 text-success" />
          <span className="text-xs font-semibold">{b.label}</span>
          <span className="text-[10px] text-muted-foreground">{b.desc}</span>
        </div>
      ))}
    </div>
  );
}
