import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Home } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

const BASE_URL = "https://xaradeals-platform.lovable.app";

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems = [{ label: "Accueil", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
          {allItems.map((item, i) => {
            const isLast = i === allItems.length - 1;
            return (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
                {isLast || !item.href ? (
                  <span className={`${isLast ? "text-foreground font-medium" : ""} flex items-center gap-1`}>
                    {i === 0 && <Home className="h-3 w-3" />}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.href}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {i === 0 && <Home className="h-3 w-3" />}
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
