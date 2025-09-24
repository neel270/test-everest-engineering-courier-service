import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserProfile } from "@/components/auth/UserProfile";
import { Navigation } from "@/components/auth/Navigation";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { VehicleManagement } from "./pages/VehicleManagement";
import DeliveryList from "./pages/DeliveryList";
import DeliveryView from "./pages/DeliveryView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <div className="container mx-auto py-8">
                      <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                          Dashboard
                        </h1>
                        <p className="text-gray-600">
                          Welcome to your courier service dashboard
                        </p>
                      </div>
                      <Index />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <UserProfile />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <VehicleManagement />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deliveries"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <div className="container mx-auto py-8">
                      <DeliveryList />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deliveries/:id"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <div className="container mx-auto py-8">
                      <DeliveryView />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Admin only routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <div className="container mx-auto py-8">
                      <h1 className="text-3xl font-bold text-gray-900 mb-8">
                        Admin Panel
                      </h1>
                      <p className="text-gray-600">
                        Admin functionality coming soon...
                      </p>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard if authenticated, otherwise to login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
