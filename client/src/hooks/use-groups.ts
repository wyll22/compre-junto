import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useGroups(params?: { productId?: number; status?: string }) {
  return useQuery({
    queryKey: ["/api/groups", params],
    queryFn: async () => {
      const url = new URL("/api/groups", window.location.origin);
      if (params?.productId) {
        url.searchParams.append("productId", String(params.productId));
      }
      if (params?.status) {
        url.searchParams.append("status", params.status);
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch groups");
      return await res.json();
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, name, phone }: { groupId: number; name: string; phone: string }) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/join`, { name, phone });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Sucesso!", description: "Voce entrou no grupo!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao entrar no grupo",
        variant: "destructive",
      });
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productId: number; name?: string; phone?: string }) => {
      const res = await apiRequest("POST", "/api/groups", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });
}

export function useUpdateGroupStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/groups/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Sucesso", description: "Status do grupo atualizado!" });
    },
  });
}
