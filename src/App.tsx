import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Reservations from "./pages/Reservations";
import Calendar from "./pages/Calendar";
import FrontDesk from "./pages/FrontDesk";
import Housekeeping from "./pages/Housekeeping";
import Guests from "./pages/Guests";
import Maintenance from "./pages/Maintenance";
import { DashboardLayout } from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects to dashboard if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route
      path="/"
      element={
        <PublicRoute>
          <Index />
        </PublicRoute>
      }
    />
    <Route
      path="/auth"
      element={
        <PublicRoute>
          <Auth />
        </PublicRoute>
      }
    />

    {/* Protected routes with DashboardLayout */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Dashboard">
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/rooms"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Rooms">
            <Rooms />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reservations"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Reservations">
            <Reservations />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/calendar"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Calendar">
            <Calendar />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/front-desk"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Front Desk">
            <FrontDesk />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/housekeeping"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Housekeeping">
            <Housekeeping />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/guests"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Guests">
            <Guests />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/maintenance"
      element={
        <ProtectedRoute>
          <DashboardLayout title="Maintenance">
            <Maintenance />
          </DashboardLayout>
        </ProtectedRoute>
      }
    />

    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <AppRoutes />
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
