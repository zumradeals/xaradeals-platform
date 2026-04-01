import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import CartDrawer from "@/components/CartDrawer";
import BottomNav from "@/components/BottomNav";
import WhatsAppButton from "@/components/WhatsAppButton";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import Account from "./pages/Account";
import OrderDetail from "./pages/OrderDetail";
import CartPage from "./pages/CartPage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import SearchPage from "./pages/SearchPage";
import ShopPage from "./pages/ShopPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAddProduct from "./pages/admin/AdminAddProduct";
import AdminClients from "./pages/admin/AdminClients";
import AdminPages from "./pages/admin/AdminPages";
import AdminSeo from "./pages/admin/AdminSeo";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CartDrawer />
              <BottomNav />
              <WhatsAppButton />
              <PageTransition>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/c/:categorySlug" element={<CategoryPage />} />
                  <Route path="/p/:productSlug" element={<ProductPage />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/account/orders/:orderId" element={<OrderDetail />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/boutique" element={<ShopPage />} />
                  <Route path="/admin" element={<AdminDashboard />}>
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminAddProduct />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="clients" element={<AdminClients />} />
                    <Route path="pages" element={<AdminPages />} />
                    <Route path="seo" element={<AdminSeo />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
