import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, getRoleDashboard } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { type AppRole } from "@/types/database";
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
import Folios from "./pages/Folios";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import Properties from "./pages/Properties";
import Settings from "./pages/Settings";
import POS from "./pages/POS";
import NightAudit from "./pages/NightAudit";
import Kitchen from "./pages/Kitchen";
import Waiter from "./pages/Waiter";
import CorporateAccounts from "./pages/CorporateAccounts";
import AdminTenants from "./pages/admin/Tenants";
import { DashboardLayout } from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

// Define which routes each role can access
const ROLE_ROUTES: Record<AppRole, string[]> = {
  superadmin: ['*'],
  owner: ['*'],
  manager: ['*'],
  front_desk: ['/dashboard', '/reservations', '/calendar', '/rooms', '/guests', '/front-desk', '/housekeeping', '/maintenance', '/folios'],
  accountant: ['/dashboard', '/folios', '/reports', '/night-audit'],
  housekeeping: ['/housekeeping'],
  maintenance: ['/maintenance'],
  kitchen: ['/kitchen'],
  waiter: ['/pos', '/waiter'],
  night_auditor: ['/dashboard', '/night-audit', '/folios', '/reports'],
};

// Role-protected route wrapper
const RoleProtectedRoute = ({ 
  children, 
  allowedRoles,
  route 
}: { 
  children: React.ReactNode; 
  allowedRoles: AppRole[];
  route: string;
}) => {
  const { user, isLoading, roles, hasAnyRole, isSuperAdmin } = useAuth();

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

  // Super admins, owners, and managers can access everything
  if (isSuperAdmin || hasAnyRole(['owner', 'manager'])) {
    return <>{children}</>;
  }

  // Check if user's roles allow access to this route
  const canAccess = roles.some(role => {
    const allowedRoutes = ROLE_ROUTES[role] || [];
    return allowedRoutes.includes('*') || allowedRoutes.includes(route);
  });

  if (!canAccess) {
    // Redirect to their appropriate dashboard
    const targetDashboard = getRoleDashboard(roles);
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
};

// Protected route wrapper (basic auth check)
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

// Public route wrapper (redirects to role-appropriate dashboard if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, roles } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    // Redirect to role-appropriate dashboard
    const targetDashboard = getRoleDashboard(roles);
    return <Navigate to={targetDashboard} replace />;
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
        <RoleProtectedRoute allowedRoles={['front_desk']} route="/front-desk">
          <DashboardLayout title="Front Desk">
            <FrontDesk />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/housekeeping"
      element={
        <RoleProtectedRoute allowedRoles={['housekeeping', 'front_desk']} route="/housekeeping">
          <DashboardLayout title="Housekeeping">
            <Housekeeping />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/guests"
      element={
        <RoleProtectedRoute allowedRoles={['front_desk']} route="/guests">
          <DashboardLayout title="Guests">
            <Guests />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/maintenance"
      element={
        <RoleProtectedRoute allowedRoles={['maintenance', 'front_desk']} route="/maintenance">
          <DashboardLayout title="Maintenance">
            <Maintenance />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/folios"
      element={
        <RoleProtectedRoute allowedRoles={['front_desk', 'accountant', 'night_auditor']} route="/folios">
          <DashboardLayout title="Folios">
            <Folios />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <RoleProtectedRoute allowedRoles={['accountant', 'night_auditor']} route="/reports">
          <DashboardLayout title="Reports">
            <Reports />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/staff"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/staff">
          <DashboardLayout title="Staff">
            <Staff />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/properties"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/properties">
          <DashboardLayout title="Properties">
            <Properties />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/settings">
          <DashboardLayout title="Settings">
            <Settings />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/pos"
      element={
        <RoleProtectedRoute allowedRoles={['kitchen', 'waiter']} route="/pos">
          <POS />
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/kitchen"
      element={
        <RoleProtectedRoute allowedRoles={['kitchen']} route="/kitchen">
          <Kitchen />
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/waiter"
      element={
        <RoleProtectedRoute allowedRoles={['waiter']} route="/waiter">
          <Waiter />
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/night-audit"
      element={
        <RoleProtectedRoute allowedRoles={['night_auditor', 'accountant']} route="/night-audit">
          <NightAudit />
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/corporate"
      element={
        <RoleProtectedRoute allowedRoles={['front_desk']} route="/corporate">
          <DashboardLayout title="Corporate Accounts">
            <CorporateAccounts />
          </DashboardLayout>
        </RoleProtectedRoute>
      }
    />
    <Route
      path="/admin/tenants"
      element={
        <RoleProtectedRoute allowedRoles={[]} route="/admin/tenants">
          <DashboardLayout title="Tenant Management">
            <AdminTenants />
          </DashboardLayout>
        </RoleProtectedRoute>
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
