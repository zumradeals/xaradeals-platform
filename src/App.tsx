import { lazy, Suspense } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

// Eager: homepage (critical path)
import Index from "./pages/Index";

// Lazy: all other routes
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const Account = lazy(() => import("./pages/Account"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const CartPage = lazy(() => import("./pages/CartPage"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminAddProduct = lazy(() => import("./pages/admin/AdminAddProduct"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminSeo = lazy(() => import("./pages/admin/AdminSeo"));
const AdminFeatured = lazy(() => import("./components/admin/AdminFeatured"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Skeleton className="h-8 w-48 rounded-lg" />
    </div>
  );
}

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
              <Suspense fallback={<PageFallback />}>
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
                      <Route path="featured" element={<AdminFeatured />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;