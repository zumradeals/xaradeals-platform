import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Order = {
  id: string; status: string; total_fcfa: number; created_at: string;
};

type Delivery = {
  id: string; order_id: string; delivery_status: string; delivery_note: string | null; created_at: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  PAID: "bg-info/10 text-info",
  PROCESSING: "bg-info/10 text-info",
  DELIVERED: "bg-success/10 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
};

export default function Account() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setOrders(data as Order[]);
    };
    const fetchDeliveries = async () => {
      const { data } = await supabase
        .from("digital_deliveries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setDeliveries(data as Delivery[]);
    };
    fetchOrders();
    fetchDeliveries();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profil mis à jour !" });
      await refreshProfile();
    }
    setSaving(false);
  };

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold">Mon compte</h1>

          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="orders">Commandes ({orders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email || ""} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+228 XX XX XX XX" />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              {orders.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">Aucune commande pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const delivery = deliveries.find((d) => d.order_id === order.id);
                    return (
                      <Card key={order.id} className="card-shadow">
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium">
                              Commande du {new Date(order.created_at).toLocaleDateString("fr-FR")}
                            </p>
                            <p className="price-tag text-lg">{order.total_fcfa.toLocaleString("fr-FR")} FCFA</p>
                            {delivery?.delivery_note && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                📦 {delivery.delivery_note}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <Badge className={statusColors[order.status] || "bg-muted"}>{order.status}</Badge>
                            {delivery && (
                              <Badge variant="outline" className="block text-xs">
                                Livraison: {delivery.delivery_status}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
