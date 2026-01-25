import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CalendarRange,
  Users,
  BedDouble,
  Receipt,
  ClipboardList,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Hotel,
  UserCircle,
  ShieldCheck,
  UtensilsCrossed,
  LayoutDashboard,
  Moon,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { cn } from '@/lib/utils';

import { type AppRole } from '@/types/database';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Reservations', url: '/reservations', icon: Calendar },
  { title: 'Calendar', url: '/calendar', icon: CalendarRange },
  { title: 'Rooms', url: '/rooms', icon: BedDouble },
  { title: 'Guests', url: '/guests', icon: Users },
];

const operationsItems = [
  { title: 'Check-In/Out', url: '/front-desk', icon: Hotel },
  { title: 'Housekeeping', url: '/housekeeping', icon: ClipboardList },
  { title: 'Maintenance', url: '/maintenance', icon: Wrench },
];

const billingItems = [
  { title: 'Folios', url: '/folios', icon: Receipt },
  { title: 'Night Audit', url: '/night-audit', icon: Moon },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
];

const posItems = [
  { title: 'POS Terminal', url: '/pos', icon: UtensilsCrossed },
  { title: 'Kitchen Display', url: '/kitchen', icon: UtensilsCrossed },
];

const adminItems = [
  { title: 'Staff', url: '/staff', icon: UserCircle },
  { title: 'Properties', url: '/properties', icon: Building2 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const superAdminItems = [
  { title: 'Tenants', url: '/admin/tenants', icon: Building2 },
  { title: 'System Settings', url: '/admin/settings', icon: ShieldCheck },
];

// Define which routes each role can access
const ROLE_ROUTES: Record<AppRole, string[]> = {
  superadmin: ['*'],
  owner: ['*'],
  manager: ['*'],
  front_desk: ['/dashboard', '/reservations', '/calendar', '/rooms', '/guests', '/front-desk', '/housekeeping', '/maintenance', '/folios'],
  accountant: ['/dashboard', '/folios', '/reports', '/night-audit'],
  housekeeping: ['/housekeeping'],
  maintenance: ['/maintenance'],
  kitchen: ['/pos', '/kitchen'],
  waiter: ['/pos'],
  night_auditor: ['/dashboard', '/night-audit', '/folios', '/reports'],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { profile, roles, signOut, isSuperAdmin, hasAnyRole } = useAuth();
  const { tenant, currentProperty, properties, setCurrentProperty, hasFeature } = useTenant();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Helper function to check if user can access a route
  const canAccessRoute = (route: string) => {
    if (isSuperAdmin) return true;
    if (hasAnyRole(['owner', 'manager'])) return true;
    
    return roles.some(role => {
      const allowedRoutes = ROLE_ROUTES[role] || [];
      return allowedRoutes.includes('*') || allowedRoutes.includes(route);
    });
  };

  // Filter navigation items based on role
  const filteredMainNavItems = mainNavItems.filter(item => canAccessRoute(item.url));
  const filteredOperationsItems = operationsItems.filter(item => canAccessRoute(item.url));
  const filteredBillingItems = billingItems.filter(item => canAccessRoute(item.url));

  const canAccessAdmin = hasAnyRole(['owner', 'manager']);
  const canAccessPOS = hasFeature('pos') && hasAnyRole(['owner', 'manager', 'kitchen', 'waiter']);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Hotel className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                {tenant?.name || 'Hotel PMS'}
              </span>
              <span className="text-2xs text-sidebar-muted">
                {currentProperty?.name || 'Select Property'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {/* Property Selector */}
        {!collapsed && properties.length > 1 && (
          <div className="px-2 py-2">
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className="flex w-full items-center justify-between rounded-md bg-sidebar-accent px-2 py-1.5 text-xs text-sidebar-accent-foreground hover:bg-sidebar-accent/80">
                <span className="truncate">{currentProperty?.name}</span>
                <ChevronDown className="h-3 w-3" />
                 </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {properties.map((property) => (
                  <DropdownMenuItem
                    key={property.id}
                    onClick={() => setCurrentProperty(property)}
                    className={cn(
                      property.id === currentProperty?.id && 'bg-accent'
                    )}
                  >
                    {property.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Main Navigation - Only show if user has access to any items */}
        {filteredMainNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-muted">Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Operations - Only show if user has access to any items */}
        {filteredOperationsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-muted">Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredOperationsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Billing - Only show if user has access to any items */}
        {filteredBillingItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-muted">Billing</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredBillingItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* POS (conditional) */}
        {canAccessPOS && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-muted">Restaurant</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {posItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin (conditional) */}
        {canAccessAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-muted">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Super Admin */}
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-muted">Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                <UserCircle className="h-4 w-4" />
              </div>
              {!collapsed && (
                <div className="flex flex-1 flex-col items-start text-left">
                  <span className="text-xs font-medium">{profile?.full_name || profile?.username}</span>
                  <span className="text-2xs text-sidebar-muted capitalize">
                    {roles[0]?.replace('_', ' ') || 'User'}
                  </span>
                </div>
              )}
              {!collapsed && <ChevronDown className="h-3 w-3 text-sidebar-muted" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem asChild>
              <NavLink to="/profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Profile
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}