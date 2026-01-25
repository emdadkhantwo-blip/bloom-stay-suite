import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type FolioItemType = Enums<"folio_item_type">;
export type PaymentMethod = Enums<"payment_method">;

export type FolioItem = Tables<"folio_items">;
export type Payment = Tables<"payments">;

export type Folio = Tables<"folios"> & {
  guest: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  } | null;
  reservation: {
    id: string;
    confirmation_number: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
  } | null;
  folio_items: FolioItem[];
  payments: Payment[];
};

export type FolioStats = {
  total_open: number;
  total_closed: number;
  total_balance: number;
  today_revenue: number;
};

export function useFolios(status?: "open" | "closed") {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["folios", currentPropertyId, status],
    queryFn: async (): Promise<Folio[]> => {
      if (!currentPropertyId) return [];

      let query = supabase
        .from("folios")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone),
          reservation:reservations(id, confirmation_number, check_in_date, check_out_date, status),
          folio_items(*),
          payments(*)
        `)
        .eq("property_id", currentPropertyId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((folio) => ({
        ...folio,
        guest: folio.guest as Folio["guest"],
        reservation: folio.reservation as Folio["reservation"],
        folio_items: (folio.folio_items || []) as FolioItem[],
        payments: (folio.payments || []) as Payment[],
      }));
    },
    enabled: !!currentPropertyId,
  });
}

export function useFolioById(folioId: string | null) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["folio", folioId],
    queryFn: async (): Promise<Folio | null> => {
      if (!folioId || !currentPropertyId) return null;

      const { data, error } = await supabase
        .from("folios")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone),
          reservation:reservations(id, confirmation_number, check_in_date, check_out_date, status),
          folio_items(*),
          payments(*)
        `)
        .eq("id", folioId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        guest: data.guest as Folio["guest"],
        reservation: data.reservation as Folio["reservation"],
        folio_items: (data.folio_items || []) as FolioItem[],
        payments: (data.payments || []) as Payment[],
      };
    },
    enabled: !!folioId && !!currentPropertyId,
  });
}

export function useFolioStats() {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["folio-stats", currentPropertyId],
    queryFn: async (): Promise<FolioStats> => {
      if (!currentPropertyId) {
        return { total_open: 0, total_closed: 0, total_balance: 0, today_revenue: 0 };
      }

      const today = new Date().toISOString().split("T")[0];

      // Get all folios
      const { data: folios, error: folioError } = await supabase
        .from("folios")
        .select("status, balance")
        .eq("property_id", currentPropertyId);

      if (folioError) throw folioError;

      // Get today's payments
      const { data: payments, error: paymentError } = await supabase
        .from("payments")
        .select("amount, created_at, folio:folios!inner(property_id)")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      if (paymentError) throw paymentError;

      const todayPayments = payments?.filter(
        (p: any) => p.folio?.property_id === currentPropertyId
      ) || [];

      const stats: FolioStats = {
        total_open: folios?.filter((f) => f.status === "open").length || 0,
        total_closed: folios?.filter((f) => f.status === "closed").length || 0,
        total_balance: folios?.filter((f) => f.status === "open")
          .reduce((sum, f) => sum + Number(f.balance || 0), 0) || 0,
        today_revenue: todayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      };

      return stats;
    },
    enabled: !!currentPropertyId,
  });
}

export function useAddFolioCharge() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      folioId,
      itemType,
      description,
      quantity,
      unitPrice,
      serviceDate,
    }: {
      folioId: string;
      itemType: FolioItemType;
      description: string;
      quantity: number;
      unitPrice: number;
      serviceDate?: string;
    }) => {
      const totalPrice = quantity * unitPrice;
      const taxAmount = totalPrice * (currentProperty?.tax_rate || 0) / 100;

      // Insert folio item
      const { error: itemError } = await supabase.from("folio_items").insert({
        folio_id: folioId,
        tenant_id: tenant?.id!,
        item_type: itemType,
        description,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        tax_amount: taxAmount,
        service_date: serviceDate || new Date().toISOString().split("T")[0],
        is_posted: true,
      });

      if (itemError) throw itemError;

      // Update folio totals
      const { data: folio, error: fetchError } = await supabase
        .from("folios")
        .select("subtotal, tax_amount, total_amount, paid_amount")
        .eq("id", folioId)
        .single();

      if (fetchError) throw fetchError;

      const newSubtotal = Number(folio.subtotal) + totalPrice;
      const newTaxAmount = Number(folio.tax_amount) + taxAmount;
      const newTotal = newSubtotal + newTaxAmount + (currentProperty?.service_charge_rate || 0) / 100 * newSubtotal;
      const newBalance = newTotal - Number(folio.paid_amount);

      const { error: updateError } = await supabase
        .from("folios")
        .update({
          subtotal: newSubtotal,
          tax_amount: newTaxAmount,
          total_amount: newTotal,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Charge added successfully");
    },
    onError: (error) => {
      console.error("Add charge error:", error);
      toast.error("Failed to add charge");
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      folioId,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
    }: {
      folioId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      referenceNumber?: string;
      notes?: string;
    }) => {
      // Insert payment
      const { error: paymentError } = await supabase.from("payments").insert({
        folio_id: folioId,
        tenant_id: tenant?.id!,
        amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
      });

      if (paymentError) throw paymentError;

      // Update folio balance
      const { data: folio, error: fetchError } = await supabase
        .from("folios")
        .select("paid_amount, total_amount")
        .eq("id", folioId)
        .single();

      if (fetchError) throw fetchError;

      const newPaidAmount = Number(folio.paid_amount) + amount;
      const newBalance = Number(folio.total_amount) - newPaidAmount;

      const { error: updateError } = await supabase
        .from("folios")
        .update({
          paid_amount: newPaidAmount,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Payment recorded successfully");
    },
    onError: (error) => {
      console.error("Record payment error:", error);
      toast.error("Failed to record payment");
    },
  });
}

export function useCloseFolio() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (folioId: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("folios")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          closed_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (error) throw error;
    },
    onSuccess: (_, folioId) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Folio closed successfully");
    },
    onError: (error) => {
      console.error("Close folio error:", error);
      toast.error("Failed to close folio");
    },
  });
}

export function useVoidFolioItem() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      itemId,
      folioId,
      reason,
    }: {
      itemId: string;
      folioId: string;
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get the item to void
      const { data: item, error: fetchError } = await supabase
        .from("folio_items")
        .select("total_price, tax_amount")
        .eq("id", itemId)
        .single();

      if (fetchError) throw fetchError;

      // Void the item
      const { error: voidError } = await supabase
        .from("folio_items")
        .update({
          voided: true,
          voided_at: new Date().toISOString(),
          voided_by: user?.id || null,
          void_reason: reason,
        })
        .eq("id", itemId);

      if (voidError) throw voidError;

      // Update folio totals
      const { data: folio, error: folioFetchError } = await supabase
        .from("folios")
        .select("subtotal, tax_amount, total_amount, paid_amount")
        .eq("id", folioId)
        .single();

      if (folioFetchError) throw folioFetchError;

      const newSubtotal = Number(folio.subtotal) - Number(item.total_price);
      const newTaxAmount = Number(folio.tax_amount) - Number(item.tax_amount);
      const newTotal = newSubtotal + newTaxAmount;
      const newBalance = newTotal - Number(folio.paid_amount);

      const { error: updateError } = await supabase
        .from("folios")
        .update({
          subtotal: newSubtotal,
          tax_amount: newTaxAmount,
          total_amount: newTotal,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Item voided successfully");
    },
    onError: (error) => {
      console.error("Void item error:", error);
      toast.error("Failed to void item");
    },
  });
}
