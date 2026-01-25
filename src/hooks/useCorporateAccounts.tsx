import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useToast } from "@/hooks/use-toast";

export interface CorporateAccount {
  id: string;
  tenant_id: string;
  company_name: string;
  account_code: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  billing_address: string | null;
  discount_percentage: number;
  credit_limit: number;
  payment_terms: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  linked_guests_count?: number;
}

export interface CorporateAccountFormData {
  company_name: string;
  account_code: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  billing_address?: string;
  discount_percentage?: number;
  credit_limit?: number;
  payment_terms?: string;
  notes?: string;
  is_active?: boolean;
}

export function useCorporateAccounts() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["corporate-accounts", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];

      const { data, error } = await supabase
        .from("corporate_accounts")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("company_name", { ascending: true });

      if (error) throw error;

      // Get linked guest counts
      const { data: guestCounts } = await supabase
        .from("guests")
        .select("corporate_account_id")
        .eq("tenant_id", tenant.id)
        .not("corporate_account_id", "is", null);

      const countMap = new Map<string, number>();
      guestCounts?.forEach((g) => {
        if (g.corporate_account_id) {
          const count = countMap.get(g.corporate_account_id) || 0;
          countMap.set(g.corporate_account_id, count + 1);
        }
      });

      return data.map((account) => ({
        ...account,
        linked_guests_count: countMap.get(account.id) || 0,
      })) as CorporateAccount[];
    },
    enabled: !!tenant,
  });
}

export function useCorporateAccount(accountId: string | undefined) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["corporate-account", accountId],
    queryFn: async () => {
      if (!accountId || !tenant) return null;

      const { data, error } = await supabase
        .from("corporate_accounts")
        .select("*")
        .eq("id", accountId)
        .eq("tenant_id", tenant.id)
        .single();

      if (error) throw error;
      return data as CorporateAccount;
    },
    enabled: !!accountId && !!tenant,
  });
}

export function useCorporateAccountGuests(accountId: string | undefined) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["corporate-account-guests", accountId],
    queryFn: async () => {
      if (!accountId || !tenant) return [];

      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("corporate_account_id", accountId)
        .eq("tenant_id", tenant.id)
        .order("last_name", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!accountId && !!tenant,
  });
}

export function useCreateCorporateAccount() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CorporateAccountFormData) => {
      if (!tenant) throw new Error("No tenant");

      const { data: account, error } = await supabase
        .from("corporate_accounts")
        .insert({
          tenant_id: tenant.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      toast({
        title: "Account Created",
        description: "Corporate account has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useUpdateCorporateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      accountId,
      data,
    }: {
      accountId: string;
      data: Partial<CorporateAccountFormData>;
    }) => {
      const { error } = await supabase
        .from("corporate_accounts")
        .update(data)
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      toast({
        title: "Account Updated",
        description: "Corporate account has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useDeleteCorporateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accountId: string) => {
      // First unlink any guests
      const { error: unlinkError } = await supabase
        .from("guests")
        .update({ corporate_account_id: null })
        .eq("corporate_account_id", accountId);

      if (unlinkError) throw unlinkError;

      const { error } = await supabase
        .from("corporate_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast({
        title: "Account Deleted",
        description: "Corporate account has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useLinkGuestToCorporateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      guestId,
      accountId,
    }: {
      guestId: string;
      accountId: string | null;
    }) => {
      const { error } = await supabase
        .from("guests")
        .update({ corporate_account_id: accountId })
        .eq("id", guestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast({
        title: "Guest Updated",
        description: "Guest corporate account link has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}
