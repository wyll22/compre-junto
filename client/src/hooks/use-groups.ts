import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertMember } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useGroups(params?: { productId?: number; status?: 'aberto' | 'fechado' }) {
  return useQuery({
    queryKey: [api.groups.list.path, params],
    queryFn: async () => {
      const url = new URL(api.groups.list.path, window.location.origin);
      if (params?.productId) {
        url.searchParams.append("productId", String(params.productId));
      }
      if (params?.status) {
        url.searchParams.append("status", params.status);
      }

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch groups");
      return api.groups.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId: number) => {
      const res = await fetch(api.groups.create.path, {
        method: api.groups.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create group");
      return api.groups.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: number; data: Omit<InsertMember, "groupId"> }) => {
      const url = buildUrl(api.groups.join.path, { id: groupId });
      const res = await fetch(url, {
        method: api.groups.join.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to join group");
      }
      return api.groups.join.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Sucesso!", description: "Você entrou no grupo com sucesso." });
    },
    onError: (error) => {
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao entrar no grupo",
        variant: "destructive" 
      });
    },
  });
}
