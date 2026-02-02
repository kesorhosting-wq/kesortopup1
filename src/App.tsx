import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SiteProvider } from "@/contexts/SiteContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomFontLoader from "./components/CustomFontLoader";
import Index from "./pages/Index";
import TopupPage from "./pages/TopupPage";
import CheckoutPage from "./pages/CheckoutPage";
import { Navigate } from "react-router-dom";
import InvoicePage from "./pages/InvoicePage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import WalletPage from "./pages/WalletPage";
import UserProfilePage from "./pages/UserProfilePage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <SiteProvider>
              <CartProvider>
                <TooltipProvider>
                  <CustomFontLoader />
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/topup/:gameSlug" element={<TopupPage />} />
                    <Route path="/cart" element={<Navigate to="/checkout" replace />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/invoice/:orderId" element={<InvoicePage />} />
                    <Route path="/orders" element={<OrderHistoryPage />} />
                    <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/profile" element={<UserProfilePage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </CartProvider>
            </SiteProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
