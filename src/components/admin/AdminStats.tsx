import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Stats = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  revenueByMonth: { month: string; revenue: number }[];
  topProducts: { name: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  WAITING_PAYMENT_PROOF: "Preuve attendue",
  UNDER_REVIEW: "En vérification",
  PAID: "Payé",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
};

const PIE_COLORS = [
  "hsl(28, 90%, 52%)",
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(270, 60%, 55%)",
];

export default function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, itemsRes, productsRes] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("order_items").select("product_id, line_total_fcfa, order_id"),
        supabase.from("products").select("id, title, status"),
      ]);

      const orders = ordersRes.data || [];
      const items = itemsRes.data || [];
      const products = productsRes.data || [];

      // Total revenue (PAID + DELIVERED)
      const paidOrders = orders.filter((o) => o.status === "PAID" || o.status === "DELIVERED");
      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_fcfa, 0);

      // Pending orders
      const pendingOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length;

      // Revenue by month
      const monthMap = new Map<string, number>();
      paidOrders.forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) || 0) + o.total_fcfa);
      });
      const revenueByMonth = Array.from(monthMap.entries())
        .sort()
        .slice(-6)
        .map(([month, revenue]) => ({ month, revenue }));

      // Top products by order count
      const productCount = new Map<string, number>();
      items.forEach((item) => {
        productCount.set(item.product_id, (productCount.get(item.product_id) || 0) + 1);
      });
      const productMap = new Map(products.map((p) => [p.id, p.title]));
      const topProducts = Array.from(productCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ name: productMap.get(id) || "Inconnu", count }));

      // Orders by status
      const statusCount = new Map<string, number>();
      orders.forEach((o) => {
        statusCount.set(o.status, (statusCount.get(o.status) || 0) + 1);
      });
      const ordersByStatus = Array.from(statusCount.entries()).map(([status, count]) => ({
        status: STATUS_LABELS[status] || status,
        count,
      }));

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        pendingOrders,
        revenueByMonth,
        topProducts,
        ordersByStatus,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Chargement des statistiques...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenus</p>
              <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString("fr-FR")} <span className="text-sm font-normal">FCFA</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
              <ShoppingCart className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commandes</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <Package className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produits</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <TrendingUp className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-base">Revenus par mois</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString("fr-FR")} FCFA`, "Revenus"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Bar dataKey="revenue" fill="hsl(28, 90%, 52%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status Pie */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-base">Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.ordersByStatus.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="status"
                    >
                      {stats.ordersByStatus.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {stats.ordersByStatus.map((s, i) => (
                    <div key={s.status} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{s.status}</span>
                      <Badge variant="secondary" className="ml-auto">{s.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune commande</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {stats.topProducts.length > 0 && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-base">Produits les plus commandés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <Badge variant="secondary">{p.count} commande{p.count > 1 ? "s" : ""}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
