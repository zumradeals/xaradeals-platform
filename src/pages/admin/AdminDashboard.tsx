import { useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import AdminStats from "@/components/admin/AdminStats";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, FolderOpen, ShoppingCart, BarChart3 } from "lucide-react";

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin]);

  if (loading || !isAdmin) return null;

  const isStatsPage = location.pathname === "/admin" || location.pathname === "/admin/";
  const currentTab = location.pathname.includes("/admin/categories")
    ? "categories"
    : location.pathname.includes("/admin/orders")
    ? "orders"
    : location.pathname.includes("/admin/products")
    ? "products"
    : "stats";

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1 py-6">
        <div className="container">
          <h1 className="mb-6 text-3xl font-bold">Administration</h1>
          <Tabs value={currentTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="stats" asChild>
                <Link to="/admin" className="gap-2">
                  <BarChart3 className="h-4 w-4" /> Tableau de bord
                </Link>
              </TabsTrigger>
              <TabsTrigger value="products" asChild>
                <Link to="/admin/products" className="gap-2">
                  <Package className="h-4 w-4" /> Produits
                </Link>
              </TabsTrigger>
              <TabsTrigger value="categories" asChild>
                <Link to="/admin/categories" className="gap-2">
                  <FolderOpen className="h-4 w-4" /> Catégories
                </Link>
              </TabsTrigger>
              <TabsTrigger value="orders" asChild>
                <Link to="/admin/orders" className="gap-2">
                  <ShoppingCart className="h-4 w-4" /> Commandes
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {isStatsPage ? <AdminStats /> : <Outlet />}
        </div>
      </main>
    </div>
  );
}
