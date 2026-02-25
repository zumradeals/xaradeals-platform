import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingCart, User, Grid3X3 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

const tabs = [
  { to: "/", icon: Home, label: "Accueil", match: ["/"] },
  { to: "/search", icon: Search, label: "Recherche", match: ["/search"] },
  { to: "/cart", icon: ShoppingCart, label: "Panier", match: ["/cart"], showBadge: true },
  { to: "/account", icon: User, label: "Compte", match: ["/account", "/auth"] },
];

export default function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  const isActive = (match: string[]) =>
    match.some((m) => m === "/" ? location.pathname === "/" : location.pathname.startsWith(m));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex h-16 items-stretch">
        {tabs.map((tab) => {
          const active = isActive(tab.match);
          const Icon = tab.icon;
          const href = tab.to === "/account" && !user ? "/auth" : tab.to;

          return (
            <Link
              key={tab.to}
              to={href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {tab.showBadge && totalItems > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for phones with gesture bars */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
