import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { useToast } from "@/hooks/use-toast";
import type { AppRole } from "@/types/database";

export interface StaffMember {
  id: string;
  full_name: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  roles: AppRole[];
  property_access: string[];
}

export function useStaff() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ["staff", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Get all profiles for this tenant
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map((p) => p.id);

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Fetch property access for all users
      const { data: propertyAccess, error: accessError } = await supabase
        .from("property_access")
        .select("user_id, property_id")
        .in("user_id", userIds);

      if (accessError) throw accessError;

      // Combine data
      const staffMembers: StaffMember[] = profiles.map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active,
        last_login_at: profile.last_login_at,
        created_at: profile.created_at,
        roles: roles
          ?.filter((r) => r.user_id === profile.id)
          .map((r) => r.role as AppRole) || [],
        property_access: propertyAccess
          ?.filter((pa) => pa.user_id === profile.id)
          .map((pa) => pa.property_id) || [],
      }));

      return staffMembers;
    },
    enabled: !!tenant?.id,
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: {
        full_name?: string;
        phone?: string;
        is_active?: boolean;
      };
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Staff Updated",
        description: "Staff member has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({
      userId,
      roles,
    }: {
      userId: string;
      roles: AppRole[];
    }) => {
      // Delete existing roles
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Insert new roles
      if (roles.length > 0) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(roles.map((role) => ({ user_id: userId, role })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Roles Updated",
        description: "Staff roles have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePropertyAccessMutation = useMutation({
    mutationFn: async ({
      userId,
      propertyIds,
    }: {
      userId: string;
      propertyIds: string[];
    }) => {
      // Delete existing property access
      const { error: deleteError } = await supabase
        .from("property_access")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Insert new property access
      if (propertyIds.length > 0) {
        const { error: insertError } = await supabase
          .from("property_access")
          .insert(
            propertyIds.map((propertyId) => ({
              user_id: userId,
              property_id: propertyId,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Property Access Updated",
        description: "Staff property access has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: isActive ? "Staff Activated" : "Staff Deactivated",
        description: `Staff member has been ${isActive ? "activated" : "deactivated"}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-staff", {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Staff Deleted",
        description: data?.message || "Staff member has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    staff: staffQuery.data || [],
    isLoading: staffQuery.isLoading,
    error: staffQuery.error,
    refetch: staffQuery.refetch,
    updateStaff: updateStaffMutation.mutate,
    updateRoles: updateRolesMutation.mutate,
    updatePropertyAccess: updatePropertyAccessMutation.mutate,
    toggleActiveStatus: toggleActiveStatusMutation.mutate,
    deleteStaff: deleteStaffMutation.mutate,
    isUpdating:
      updateStaffMutation.isPending ||
      updateRolesMutation.isPending ||
      updatePropertyAccessMutation.isPending ||
      toggleActiveStatusMutation.isPending,
    isDeleting: deleteStaffMutation.isPending,
  };
}

export function useStaffStats() {
  const { staff } = useStaff();

  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.is_active).length;
  const inactiveStaff = staff.filter((s) => !s.is_active).length;

  // Count by role
  const roleBreakdown = staff.reduce((acc, s) => {
    s.roles.forEach((role) => {
      acc[role] = (acc[role] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    totalStaff,
    activeStaff,
    inactiveStaff,
    roleBreakdown,
  };
}
