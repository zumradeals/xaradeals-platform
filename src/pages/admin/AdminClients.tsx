import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Phone, FileDown } from "lucide-react";
import { downloadCsv } from "@/lib/csv-export";

type Client = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  email?: string;
  orders_count?: number;
  total_spent?: number;
};

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!profiles) { setLoading(false); return; }

      // Fetch order stats per user
      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, total_fcfa, status");

      const orderStats = new Map<string, { count: number; spent: number }>();
      (orders || []).forEach((o) => {
        const s = orderStats.get(o.user_id) || { count: 0, spent: 0 };
        s.count++;
        if (o.status === "PAID" || o.status === "DELIVERED") s.spent += o.total_fcfa;
        orderStats.set(o.user_id, s);
      });

      setClients(
        profiles.map((p) => ({
          ...p,
          orders_count: orderStats.get(p.id)?.count || 0,
          total_spent: orderStats.get(p.id)?.spent || 0,
        }))
      );
      setLoading(false);
    };
    fetchClients();
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      c.id.includes(q)
    );
  });

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Chargement des clients...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" /> Clients ({clients.length})
        </h2>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => {
          downloadCsv(
            `clients-${new Date().toISOString().split("T")[0]}.csv`,
            ["Nom", "Téléphone", "Rôle", "Commandes", "Total dépensé FCFA", "Inscrit le"],
            clients.map((c) => [
              c.full_name || "",
              c.phone || "",
              c.role,
              String(c.orders_count || 0),
              String(c.total_spent || 0),
              new Date(c.created_at).toLocaleDateString("fr-FR"),
            ])
          );
        }}>
          <FileDown className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <Card key={c.id} className="card-shadow">
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="font-medium">{c.full_name || "Sans nom"}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {c.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {c.phone}
                    </span>
                  )}
                  <span>Inscrit le {new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-sm font-medium">{c.orders_count} commande{(c.orders_count || 0) > 1 ? "s" : ""}</p>
                  <p className="text-xs text-muted-foreground">{(c.total_spent || 0).toLocaleString("fr-FR")} FCFA</p>
                </div>
                <Badge variant={c.role === "ADMIN" ? "default" : "secondary"}>
                  {c.role}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucun client trouvé</p>
        )}
      </div>
    </div>
  );
}
