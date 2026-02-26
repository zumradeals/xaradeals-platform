import { Presentation, Users, Package, AlertCircle, Clock, Truck, HeadphonesIcon, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Block = {
  pitch: string | null;
  use_case: string | null;
  what_you_get: string | null;
  requirements: string | null;
  duration_and_renewal: string | null;
  delivery_steps: string | null;
  support_policy: string | null;
  faq: string | null;
};

const blockConfig: Record<string, { label: string; icon: React.ElementType; accent: string }> = {
  pitch: { label: "Présentation", icon: Presentation, accent: "bg-primary/10 text-primary" },
  use_case: { label: "À qui s'adresse ce produit", icon: Users, accent: "bg-accent text-primary" },
  what_you_get: { label: "Ce que vous recevez", icon: Package, accent: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" },
  requirements: { label: "Prérequis", icon: AlertCircle, accent: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  duration_and_renewal: { label: "Durée & Renouvellement", icon: Clock, accent: "bg-accent text-primary" },
  delivery_steps: { label: "Étapes de livraison", icon: Truck, accent: "bg-primary/10 text-primary" },
  support_policy: { label: "Support", icon: HeadphonesIcon, accent: "bg-accent text-primary" },
  faq: { label: "Questions fréquentes", icon: HelpCircle, accent: "bg-muted text-foreground" },
};

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;

    // Checkmarks
    if (trimmed.startsWith("✅")) {
      return (
        <div key={i} className="flex items-start gap-2 py-0.5">
          <span className="mt-0.5 shrink-0 text-green-600">✅</span>
          <span>{trimmed.slice(1).trim()}</span>
        </div>
      );
    }

    // Warning items
    if (trimmed.startsWith("⚠️")) {
      return (
        <div key={i} className="mt-3 mb-1 flex items-start gap-2 font-semibold text-amber-700 dark:text-amber-400">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{trimmed.slice(2).trim()}</span>
        </div>
      );
    }

    // Bullet points
    if (trimmed.startsWith("•")) {
      return (
        <div key={i} className="flex items-start gap-2 py-0.5 pl-1">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{trimmed.slice(1).trim()}</span>
        </div>
      );
    }

    // Numbered steps
    const numMatch = trimmed.match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
      return (
        <div key={i} className="flex items-start gap-3 py-1">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {numMatch[1]}
          </span>
          <span className="pt-0.5">{numMatch[2]}</span>
        </div>
      );
    }

    // Bold-looking lines (short lines that look like headers)
    if (trimmed.length < 60 && !trimmed.includes(".") && i > 0) {
      return <p key={i} className="mt-2 font-semibold text-foreground">{trimmed}</p>;
    }

    return <p key={i}>{trimmed}</p>;
  });
}

export default function ProductDescriptionBlocks({ block }: { block: Block }) {
  return (
    <div className="space-y-6">
      {(Object.keys(blockConfig) as Array<keyof Block>).map((key) => {
        const value = block[key];
        if (!value) return null;
        const config = blockConfig[key];
        const Icon = config.icon;

        return (
          <Card key={key} className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-0">
              {/* Header */}
              <div className={`flex items-center gap-3 px-5 py-3.5 ${config.accent}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 shadow-sm">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-base font-semibold">{config.label}</h2>
              </div>
              {/* Content */}
              <div className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                {renderContent(value)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
